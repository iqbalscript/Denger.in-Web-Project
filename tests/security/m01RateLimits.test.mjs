import assert from 'node:assert/strict';
import {
  createRateLimiter, acquireChatSlot, isRateLimited, clientFingerprint,
  readClientIdentityConfig, trustedClientIp, RATE_QUOTAS
} from '../../apps/web/src/lib/api/rateLimit.ts';
import {
  CHAT_MAX_BYTES, CHAT_MAX_MESSAGE, CHAT_MAX_HISTORY_COUNT,
  CHAT_MAX_HISTORY_ENTRY, CHAT_MAX_HISTORY_TOTAL,
  chatInputWithinLimits, readJsonLimited
} from '../../apps/web/src/lib/api/requestLimits.ts';

let clock = 0;
const limiter = createRateLimiter(1000, 2, () => clock);
assert.equal(limiter.check('chat', 2), false);
assert.equal(limiter.check('chat', 2), false);
assert.equal(limiter.check('chat', 2), true);
// Request-controlled session and forwarding values have no part in the route key.
for (const variation of ['new-session', 'another-session', 'spoofed-x-forwarded-for']) {
  assert.equal(limiter.check('chat', 2), true, variation);
}
assert.equal(limiter.check('admin-login', 1), false);
assert.equal(limiter.check('new-key', 1), true);
assert.equal(limiter.size, 2);
for (let index = 0; index < 1000; index++) {
  assert.equal(limiter.check(`attacker-${index}`, 1), true);
  assert.equal(limiter.size, 2);
}
clock = 1000;
assert.equal(limiter.check('new-key', 1), false);
assert.equal(limiter.size, 1);
assert.equal(limiter.check('new-key', 1), true);

const slots = Array.from({ length: 4 }, () => acquireChatSlot());
assert.ok(slots.every(Boolean));
assert.equal(acquireChatSlot(), null);
slots[0]();
slots[0]();
assert.ok(acquireChatSlot());
for (const release of slots.slice(1)) release();

assert.equal(chatInputWithinLimits({ message: 'a'.repeat(CHAT_MAX_MESSAGE) }), true);
assert.equal(chatInputWithinLimits({ message: 'a'.repeat(CHAT_MAX_MESSAGE + 1) }), false);
assert.equal(chatInputWithinLimits({ message: 'hi', history: Array.from({ length: CHAT_MAX_HISTORY_COUNT }, () => ({ sender: 'user', text: 'a'.repeat(CHAT_MAX_HISTORY_ENTRY) })) }), false);
assert.equal(chatInputWithinLimits({ message: 'hi', history: Array.from({ length: CHAT_MAX_HISTORY_COUNT + 1 }, () => ({ sender: 'user', text: 'a' })) }), false);
assert.equal(chatInputWithinLimits({ message: 'hi', history: [{ sender: 'user', text: 'a'.repeat(CHAT_MAX_HISTORY_ENTRY + 1) }] }), false);
assert.equal(chatInputWithinLimits({ message: 'hi', history: Array.from({ length: 6 }, () => ({ sender: 'user', text: 'a'.repeat(CHAT_MAX_HISTORY_ENTRY) })) }), true);
assert.equal(CHAT_MAX_HISTORY_TOTAL, 6 * CHAT_MAX_HISTORY_ENTRY);
assert.equal(chatInputWithinLimits({ message: 'Halo', history: [{ sender: 'user', text: 'Apa kabar?' }] }), true);

const request = (body, headers) => new Request('http://local/api/chat', { method: 'POST', body, headers });
assert.equal((await readJsonLimited(request(JSON.stringify({ message: 'x' })), CHAT_MAX_BYTES)).ok, true);
assert.deepEqual(await readJsonLimited(request('x'.repeat(CHAT_MAX_BYTES + 1)), CHAT_MAX_BYTES), { ok: false, status: 413 });
assert.deepEqual(await readJsonLimited(request('{'), CHAT_MAX_BYTES), { ok: false, status: 400 });
assert.deepEqual(await readJsonLimited(request('{}', { 'content-length': String(CHAT_MAX_BYTES + 1) }), CHAT_MAX_BYTES), { ok: false, status: 413 });


// ── Kuota per-klien + pagar global (jalur memori; Redis diuji di tests/redis) ──
const config = { trustedProxyHops: 1, secret: 'test-secret-at-least-16-chars' };
const headersOf = (forwardedFor) => new Headers(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {});

// Header hanya dipercaya bila operator menyatakan jumlah proxy tepercaya.
assert.equal(readClientIdentityConfig({}), null);
assert.equal(readClientIdentityConfig({ TRUSTED_PROXY_HOPS: '1' }), null, 'tanpa secret: mati');
assert.equal(readClientIdentityConfig({ TRUSTED_PROXY_HOPS: '0', RATE_LIMIT_HASH_SECRET: config.secret }), null);
assert.equal(readClientIdentityConfig({ TRUSTED_PROXY_HOPS: 'abc', RATE_LIMIT_HASH_SECRET: config.secret }), null);
assert.deepEqual(readClientIdentityConfig({ TRUSTED_PROXY_HOPS: '1', RATE_LIMIT_HASH_SECRET: config.secret }), config);
assert.equal(clientFingerprint(headersOf('203.0.113.7'), null), 'anon');
assert.equal(clientFingerprint(undefined, config), 'anon');
assert.equal(clientFingerprint(headersOf(null), config), 'anon');

// Entri ke-N dari KANAN yang dipercaya; entri kiri hanya bisa diisi pemanggil.
assert.equal(trustedClientIp('203.0.113.7', 1), '203.0.113.7');
assert.equal(trustedClientIp('6.6.6.6, 203.0.113.7', 1), '203.0.113.7');
assert.equal(trustedClientIp('6.6.6.6, 203.0.113.7, 10.0.0.1', 2), '203.0.113.7');
assert.equal(trustedClientIp('203.0.113.7', 2), null, 'rantai lebih pendek dari hops');
assert.equal(trustedClientIp('203.0.113.7:51234', 1), '203.0.113.7');
assert.equal(trustedClientIp('not-an-ip', 1), null);
assert.equal(trustedClientIp(null, 1), null);
assert.equal(trustedClientIp('::ffff:203.0.113.7', 1), '203.0.113.7');
const spoofA = clientFingerprint(headersOf('1.1.1.1, 203.0.113.7'), config);
const spoofB = clientFingerprint(headersOf('2.2.2.2, 203.0.113.7'), config);
assert.equal(spoofA, spoofB, 'memalsukan entri kiri tidak mengganti identitas');
assert.notEqual(spoofA, clientFingerprint(headersOf('203.0.113.8'), config));
assert.match(spoofA, /^[a-f0-9]{32}$/);
assert.ok(!spoofA.includes('203'), 'IP mentah tidak boleh muncul di sidik jari');
assert.notEqual(spoofA, clientFingerprint(headersOf('203.0.113.7'), { ...config, secret: 'another-secret-16-chars' }));
// IPv6: satu /64 = satu klien.
assert.equal(
  clientFingerprint(headersOf('2001:db8:1:2:aaaa::1'), config),
  clientFingerprint(headersOf('2001:db8:1:2:bbbb::9'), config)
);
assert.notEqual(
  clientFingerprint(headersOf('2001:db8:1:2::1'), config),
  clientFingerprint(headersOf('2001:db8:1:3::1'), config)
);

// isRateLimited tanpa REDIS_URL = jalur memori. Satu klien tidak boleh mengunci orang lain.
process.env.TRUSTED_PROXY_HOPS = '1';
process.env.RATE_LIMIT_HASH_SECRET = config.secret;
const asClient = (ip) => ({ headers: headersOf(ip) });
const { limit, ceiling } = RATE_QUOTAS['room-tts'];
for (let index = 0; index < limit; index++) assert.equal(await isRateLimited('room-tts', asClient('198.51.100.1')), false);
for (let index = 0; index < 100; index++) assert.equal(await isRateLimited('room-tts', asClient('198.51.100.1')), true);
// Klien A sudah diblokir dan terus menghantam: klien B tetap dilayani penuh.
for (let index = 0; index < limit; index++) assert.equal(await isRateLimited('room-tts', asClient('198.51.100.2')), false);
// Permintaan yang diblokir lapis klien tidak menguras ceiling: 100 hantaman A tidak dihitung.
const otherClients = Math.floor(ceiling / limit) - 2;
for (let client = 0; client < otherClients; client++) {
  for (let index = 0; index < limit; index++) assert.equal(await isRateLimited('room-tts', asClient(`203.0.113.${10 + client}`)), false, `klien ${client}`);
}
// Ceiling global habis (5 klien x 8 = 40): klien baru pun kena, sebagai pagar biaya.
assert.equal(await isRateLimited('room-tts', asClient('203.0.113.200')), true);

// Tanpa identitas tepercaya perilakunya persis M01: satu jatah per rute untuk semua.
delete process.env.TRUSTED_PROXY_HOPS;
const anonymousLimit = RATE_QUOTAS['sync-write'].limit;
for (let index = 0; index < anonymousLimit; index++) assert.equal(await isRateLimited('sync-write', asClient(`192.0.2.${index}`)), false);
assert.equal(await isRateLimited('sync-write', asClient('192.0.2.250')), true, 'X-Forwarded-For tidak dipercaya tanpa opt-in');
assert.equal(await isRateLimited('sync-write'), true);

console.log('M-01 rate, concurrency, input boundary, and byte limit tests passed.');
