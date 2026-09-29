import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { createClient } from 'redis';

const root = fileURLToPath(new URL('../../', import.meta.url));
const production = process.argv.includes('--production');
const temporary = await mkdtemp(path.join(tmpdir(), 'dengarin-redis-test-'));
const children = new Set();
let client;
let passed = 0;

async function port() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const value = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return value;
}
function launch(command, args, options = {}) {
  const child = spawn(command, args, { cwd: temporary, ...options, stdio: ['ignore', 'pipe', 'pipe'] });
  child.log = '';
  child.on('error', error => { child.failure = error; });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', chunk => { child.log = (child.log + chunk).slice(-30000); });
  }
  children.add(child);
  return child;
}
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try { await exited; } finally { clearTimeout(timer); children.delete(child); }
}
async function waitFor(check, child, milliseconds = 60000) {
  const until = Date.now() + milliseconds;
  while (Date.now() < until) {
    if (child?.failure) throw child.failure;
    if (child && (child.exitCode !== null || child.signalCode !== null)) throw new Error(child.log);
    try { if (await check()) return; } catch { /* Retry until deadline. */ }
    await delay(200);
  }
  throw new Error(`Timeout menunggu service.\n${child?.log ?? ''}`);
}
function pass(name) { passed++; console.log(`PASS ${passed}: ${name}`); }
async function request(base, route, body, extraHeaders = {}) {
  return fetch(`${base}${route}`, {
    method: body ? 'POST' : 'GET',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(25000)
  });
}
// Tests delete keys only inside the Redis process they own.
async function clearQuota() {
  const keys = await client.keys('dengarin:ratelimit:*');
  if (keys.length) await client.del(keys);
  // Jendela dimulai dari permintaan pertama (TTL), bukan jam dinding, jadi
  // tidak perlu menunggu pergantian menit setelah kunci dihapus.
}
const message = 'redis integration pesan sintetis untuk pengujian';
async function burst(base, count, headers = {}) {
  const statuses = [];
  for (let i = 0; i < count; i++) statuses.push((await request(base, '/api/chat', { message }, headers)).status);
  return statuses;
}
async function cleanup() {
  try { if (client?.isOpen) client.destroy(); } catch { /* Already closed. */ }
  try { globalThis.__dengarinRedisClient?.destroy(); } catch { /* Already closed. */ }
  await Promise.all([...children].map(stop));
  await rm(temporary, { recursive: true, force: true });
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => { cleanup().finally(() => process.exit(1)); });
}

try {
  // Copy source without developer secrets/build output; use installed dependencies.
  for (const name of ['apps', 'packages', 'services', 'package.json', 'package-lock.json', 'tsconfig.base.json']) {
    await cp(path.join(root, name), path.join(temporary, name), {
      recursive: true,
      filter: source => !['node_modules', '.next'].includes(path.basename(source))
        && !path.basename(source).startsWith('.env') && !source.endsWith('.tsbuildinfo')
    });
  }
  await symlink(path.join(root, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');
  const redisPort = await port();
  const redisUrl = `redis://127.0.0.1:${redisPort}`;
  const startRedis = () => launch('redis-server', ['--bind', '127.0.0.1', '--port', String(redisPort), '--save', '', '--appendonly', 'no', '--dir', temporary]);
  let redis = startRedis();
  client = createClient({ url: redisUrl, socket: { reconnectStrategy: () => 100, connectTimeout: 1000 } });
  client.on('error', () => {});
  await waitFor(() => redis.log.includes('Ready to accept connections'), redis);
  await client.connect();
  assert.equal(await client.ping(), 'PONG');
  pass('Redis terisolasi: PONG');
  process.env.REDIS_URL = redisUrl;
  const { aiCacheKey, readAiCache, writeAiCache } = await import('../../apps/web/src/lib/api/aiCache.ts');
  const env = { ...process.env, REDIS_URL: redisUrl, DEEPSEEK_API_KEY: '', OPENROUTER_API_KEY: '', GEMINI_API_KEY: '', DATABASE_URL: '', NEXT_TELEMETRY_DISABLED: '1', FORUM_THREAD_ALIAS_SECRET: 'redis-integration-thread-secret-0123456789', TRUSTED_PROXY_HOPS: '1', RATE_LIMIT_HASH_SECRET: 'redis-integration-secret-0123456789', NODE_ENV: production ? 'production' : 'development' };
  const next = path.join(root, 'node_modules/next/dist/bin/next');
  const cwd = path.join(temporary, 'apps/web');
  if (production) {
    console.log('Build produksi bersih di direktori sementara...');
    const build = launch(process.execPath, [next, 'build'], { cwd, env });
    await waitFor(() => build.exitCode === 0, undefined, 180000).catch(error => { throw new Error(`${error.message}\n${build.log}`); });
    pass('Build produksi bersih');
  }
  async function startApp(redisEnabled = true) {
    const appPort = await port();
    const base = `http://127.0.0.1:${appPort}`;
    const child = launch(process.execPath, [next, production ? 'start' : 'dev', '-p', String(appPort), '-H', '127.0.0.1'], { cwd, env: { ...env, REDIS_URL: redisEnabled ? redisUrl : '' } });
    await waitFor(async () => (await request(base, '/api/health')).status === 200, child);
    return { child, base };
  }
  let a = await startApp();
  pass(`${production ? 'Produksi' : 'Dev'}: health 200`);
  if (production) {
    assert.match(a.child.log, /CacheHandler.*Redis tersambung/);
    assert.match(a.child.log, /cache awal terdaftar ke Redis/);
    const keys = await client.keys('dengarin:next:*');
    assert.ok(keys.length > 0);
    assert.ok(keys.every(key => !key.includes('dengarin:next:dengarin:next:')));
    pass(`Warm-up ${keys.length} key halaman sebelum request halaman, prefiks bersih`);
    const page = await request(a.base, '/resources');
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('x-nextjs-cache'), 'HIT');
    pass('/resources: 200 dan x-nextjs-cache HIT');
  }
  const connection = await request(a.base, '/api/redis-test');
  assert.equal(connection.status, 200);
  assert.equal((await connection.json()).data.connected, true);
  const ttl = await client.ttl('dengarin:healthcheck');
  assert.ok(ttl > 0 && ttl <= 60);
  pass('Diagnostik connected=true, healthcheck TTL 1–60 detik');
  await clearQuota();
  const statuses = await burst(a.base, 33);
  assert.deepEqual(statuses, [...Array(30).fill(200), ...Array(3).fill(429)]);
  // Next mengisi X-Forwarded-For dari socket bila kosong, jadi tes ini satu klien (loopback).
  const [clientKey, ...extraKeys] = await client.keys('dengarin:ratelimit:client:chat:*');
  assert.equal(extraKeys.length, 0);
  assert.equal(await client.get(clientKey), '33');
  assert.ok(await client.ttl(clientKey) > 0);
  // Tiga permintaan yang ditolak lapis klien tidak boleh menguras pagar global.
  assert.equal(await client.get('dengarin:ratelimit:global:chat'), '30');
  assert.ok(await client.pTTL('dengarin:ratelimit:global:chat') > 0);
  pass('33 chat: 30×200, 3×429; counter klien 33, global 30, keduanya ber-TTL');
  await clearQuota();
  const heavy = { 'X-Forwarded-For': '203.0.113.10' };
  const other = { 'X-Forwarded-For': '203.0.113.20' };
  assert.deepEqual(await burst(a.base, 33, heavy), [...Array(30).fill(200), ...Array(3).fill(429)]);
  assert.deepEqual(await burst(a.base, 5, other), Array(5).fill(200));
  assert.deepEqual(await burst(a.base, 2), Array(2).fill(200));
  const clientKeys = await client.keys('dengarin:ratelimit:client:chat:*');
  assert.equal(clientKeys.length, 3);
  assert.ok(clientKeys.every(key => !key.includes('203.0.113')), 'IP mentah tidak masuk Redis');
  pass('Klien A diblokir setelah 30, klien B dan loopback tetap dilayani; IP mentah tidak tersimpan');
  await clearQuota();
  // Forum: feed publik dibaca lewat Redis dan tidak pernah basi setelah tulis.
  const story = (title) => ({ authorPseudonym: 'Sahabat Uji', domain: 'campus', title, body: 'Aku mulai menulis satu tugas kecil setiap pagi dan merasa lebih tenang setelah beberapa hari.' });
  const listTitles = async () => (await (await request(a.base, '/api/forum?domain=campus')).json()).data.posts.map(post => post.title);
  const created = await request(a.base, '/api/forum', story('Cerita uji pertama tentang jadwal belajar'));
  assert.equal(created.status, 201);
  assert.equal((await created.json()).data.moderation.status, 'approved', 'fixture harus lolos moderasi otomatis');
  assert.ok((await listTitles()).includes('Cerita uji pertama tentang jadwal belajar'));
  assert.ok((await listTitles()).includes('Cerita uji pertama tentang jadwal belajar'));
  const feedKeys = await client.keys('dengarin:forum:posts:*');
  assert.equal(feedKeys.length, 1);
  assert.ok(await client.ttl(feedKeys[0]) > 0 && await client.ttl(feedKeys[0]) <= 30);
  const versionBefore = await client.get('dengarin:forum:version:posts');
  assert.equal((await request(a.base, '/api/forum', story('Cerita uji kedua langsung muncul'))).status, 201);
  assert.notEqual(await client.get('dengarin:forum:version:posts'), versionBefore);
  assert.ok((await listTitles()).includes('Cerita uji kedua langsung muncul'), 'invalidasi: tulis baru langsung terlihat');
  pass('Forum: feed di-cache (TTL ≤30 dtk), tulis baru menaikkan versi sehingga feed tidak basi');

  // Komentar (balasan) forum: cache dan versi PER CERITA.
  const postIds = (await (await request(a.base, '/api/forum?domain=campus')).json()).data.posts.map(post => post.id);
  assert.ok(postIds.length >= 2);
  const [storyA, storyB] = postIds;
  const threadKey = (seed) => Buffer.from(seed.padEnd(32, 'x')).toString('base64url');
  const listReplies = async (id) => {
    const response = await request(a.base, `/api/forum/${id}/replies`);
    const json = await response.json();
    assert.equal(response.status, 200, `GET replies ${response.status}: ${JSON.stringify(json)}`);
    return json.data.replies.map(reply => reply.body);
  };
  const sendReply = (id, body, key = threadKey('uji-a')) => request(a.base, `/api/forum/${id}/replies`, { body, threadKey: key });
  assert.deepEqual(await listReplies(storyA), []);
  assert.deepEqual(await listReplies(storyB), []);
  assert.equal((await client.keys('dengarin:forum:replies:*:*')).filter(key => !key.includes(':version:')).length, 2, 'satu entri cache per cerita');
  const versionA = await client.keys('dengarin:forum:version:replies:*');
  assert.deepEqual(versionA, [], 'belum ada tulis, belum ada key versi');
  const postsVersionBefore = await client.get('dengarin:forum:version:posts');
  const sent = await sendReply(storyA, 'Semangat ya, aku juga pernah merasa begitu.');
  assert.equal(sent.status, 201);
  assert.equal((await sent.json()).data.moderation.status, 'approved', 'fixture balasan lolos moderasi');
  const versionKeys = await client.keys('dengarin:forum:version:replies:*');
  assert.equal(versionKeys.length, 1, 'hanya cerita A yang naik versi');
  assert.ok(await client.ttl(versionKeys[0]) > 0 && await client.ttl(versionKeys[0]) <= 3600, 'key versi ber-TTL');
  assert.notEqual(await client.get('dengarin:forum:version:posts'), postsVersionBefore, 'balasan tampil mengubah hitungan di feed');
  assert.deepEqual(await listReplies(storyA), ['Semangat ya, aku juga pernah merasa begitu.'], 'balasan baru langsung terlihat');
  const cachedB = (await client.keys('dengarin:forum:replies:*:*')).filter(key => !key.includes(':version:'));
  assert.ok(cachedB.length >= 2, 'cache balasan cerita B tidak ikut terbuang');
  const cacheValues = await Promise.all(cachedB.map(key => client.get(key)));
  assert.ok(cacheValues.every(value => !/threadKey|participantKey|uji-a/i.test(value ?? '')), 'kunci thread tidak masuk Redis');
  assert.equal((await sendReply(storyA, 'Balasan dengan kunci pendek', 'pendek')).status, 400);
  pass('Komentar forum: cache dan versi per cerita, balasan baru langsung tampil, cerita lain tidak terbuang, kunci thread tidak masuk Redis');

  // Lease konkurensi lintas instance (dijalankan dari proses tes, Redis yang sama).
  const { acquireSharedSlot } = await import('../../apps/web/src/lib/api/rateLimit.ts');
  const local = () => () => {};
  const held = [];
  for (let i = 0; i < 12; i++) held.push(await acquireSharedSlot('chat', local));
  assert.ok(held.every(Boolean));
  assert.equal(await acquireSharedSlot('chat', local), null, 'lease ke-13 ditolak');
  assert.equal(await client.zCard('dengarin:slots:chat'), 12);
  assert.ok(await client.pTTL('dengarin:slots:chat') > 0);
  held[0]();
  await waitFor(async () => (await client.zCard('dengarin:slots:chat')) === 11, undefined, 5000);
  const again = await acquireSharedSlot('chat', local);
  assert.ok(again, 'slot yang dilepas bisa dipakai lagi');
  for (const release of [...held.slice(1), again]) release();
  await waitFor(async () => (await client.zCard('dengarin:slots:chat')) === 0, undefined, 5000);
  const localFull = await acquireSharedSlot('chat', () => null);
  assert.equal(localFull, null, 'batas lokal penuh tidak mengambil lease');
  assert.equal(await client.zCard('dengarin:slots:chat'), 0);
  pass('Lease bersama: maks 12, ditolak di ke-13, dilepas bisa dipakai lagi, batas lokal didahulukan');

  const health = await (await request(a.base, '/api/health')).json();
  assert.equal(health.redis, 'up');
  pass('/api/health melaporkan redis: up');
  const input = { message, ageBracket: '18-24' };
  const key = aiCacheKey(input);
  assert.match(key, /^dengarin:ai:[a-f0-9]{64}$/);
  assert.equal(await readAiCache(key), null);
  const payload = { tier: 'primary', providerId: 'test', action: { action: 'breathing', duration: 60, instruction: 'Tarik napas perlahan.' }, warnings: [] };
  await writeAiCache(key, { ...payload, userInput: message });
  assert.deepEqual(await readAiCache(key), payload);
  assert.ok(await client.ttl(key) > 0 && await client.ttl(key) <= 3600);
  assert.notEqual(aiCacheKey({ ...input, history: [{ sender: 'user', text: 'riwayat berbeda' }] }), key);
  const fallbackKey = aiCacheKey({ message: 'uji fallback' });
  await writeAiCache(fallbackKey, { ...payload, tier: 'fallback' });
  assert.equal(await readAiCache(fallbackKey), null);
  pass('Cache AI: miss/hit, payload allowlist, TTL, SHA-256, history berbeda, fallback tidak disimpan');
  await clearQuota();
  const hit = await request(a.base, '/api/chat', input);
  assert.equal(hit.status, 200);
  assert.equal((await hit.json()).data.cached, true);
  const crisis = await request(a.base, '/api/chat', { message: 'aku mau bunuh diri' });
  assert.equal((await crisis.json()).data.crisis, true);
  for (const entry of await client.keys('dengarin:*')) {
    if (await client.type(entry) === 'string') assert.ok(!(await client.get(entry)).includes(message));
  }
  pass('API memakai cache; crisis gate aktif; input sintetis tidak ada di nilai Redis');
  if (production) {
    const b = await startApp();
    await clearQuota();
    assert.deepEqual(await burst(a.base, 20), Array(20).fill(200));
    assert.deepEqual(await burst(b.base, 15), [...Array(10).fill(200), ...Array(5).fill(429)]);
    pass('Dua instance berbagi kuota: A 20 lolos, B 10 lolos + 5 diblokir');
    // An altered cache value proves B actually reads Redis, not its build files.
    const pageKey = 'dengarin:next:/resources';
    const original = await client.get(pageKey);
    assert.ok(original, 'Key /resources tersedia');
    assert.ok(original.includes('Bantuan'), 'Marker teks halaman tersedia');
    await client.set(pageKey, original.replaceAll('Bantuan', 'RedisSharedProof'));
    const shared = await request(b.base, '/resources');
    assert.ok((await shared.text()).includes('RedisSharedProof'));
    await client.set(pageKey, original);
    pass('Instance B membaca isi halaman dari Redis bersama');
    await stop(a.child);
    a = await startApp();
    assert.equal((await burst(a.base, 1))[0], 429);
    pass('Kuota tetap berlaku setelah restart aplikasi dalam window yang sama');
    await stop(b.child);
  }
  await stop(redis);
  assert.equal((await request(a.base, '/api/health')).status, 200);
  assert.equal((await (await request(a.base, '/api/health')).json()).redis, 'down');
  assert.equal((await request(a.base, '/api/redis-test')).status, 503);
  assert.equal((await request(a.base, '/api/forum?domain=campus')).status, 200, 'forum tetap terbaca tanpa Redis');
  assert.equal((await request(a.base, '/api/forum', story('Cerita uji saat Redis mati'))).status, 201, 'tulis forum tetap jalan tanpa Redis');
  assert.equal((await request(a.base, '/api/chat', { message })).status, 200);
  pass('Redis mati: health 200, diagnostik 503, chat fallback 200');
  redis = startRedis();
  await waitFor(() => redis.log.includes('Ready to accept connections'), redis);
  await waitFor(async () => (await request(a.base, '/api/redis-test')).status === 200, a.child);
  pass('Redis hidup lagi: aplikasi pulih tanpa restart');
  await stop(a.child);
  const disabled = await startApp(false);
  assert.equal((await (await request(disabled.base, '/api/health')).json()).redis, 'disabled');
  assert.equal((await request(disabled.base, '/api/redis-test')).status, 503);
  assert.equal((await request(disabled.base, '/api/chat', { message })).status, 200);
  assert.equal((await request(disabled.base, '/resources')).status, 200);
  pass('REDIS_URL kosong: health, chat, dan resources tetap 200');
  console.log(`\nLolos: ${passed}; Gagal: 0 (${production ? 'produksi' : 'dev'}).`);
} catch (error) {
  console.error('FAIL:', error);
  process.exitCode = 1;
} finally {
  await cleanup();
}
