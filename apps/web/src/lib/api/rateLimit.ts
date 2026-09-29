import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { getRedis, REDIS_PREFIX, withTimeout } from '../redis.ts';

type Entry = { count: number; expiresAt: number };

const WINDOW_MS = 60_000;

/** Process-local quotas. Keys are server constants or hashed client ids, never raw request fields. */
export function createRateLimiter(windowMs = WINDOW_MS, maxEntries = 32, now = Date.now) {
  const hits = new Map<string, Entry>();
  const sweep = (time: number) => {
    for (const [id, entry] of hits) {
      if (entry.expiresAt <= time) hits.delete(id);
    }
  };
  return {
    check(key: string, limit: number): boolean {
      const time = now();
      sweep(time);
      const entry = hits.get(key);
      if (entry) {
        entry.count += 1;
        return entry.count > limit;
      }
      // Fail closed at capacity: evicting a live bucket would reset its quota.
      if (hits.size >= maxEntries) return true;
      hits.set(key, { count: 1, expiresAt: time + windowMs });
      return false;
    },
    /** True when `key` still has a live bucket. Also drops expired buckets, so `size` is accurate afterwards. */
    has(key: string): boolean {
      sweep(now());
      return hits.has(key);
    },
    get size() { return hits.size; }
  };
}

export type PublicRoute = 'chat' | 'room-tts' | 'admin-login' | 'forum-write' | 'forum-support' | 'forum-reply-create' | 'forum-reply-list' | 'forum-reply-report' | 'weekly-report' | 'sync-read' | 'sync-write';

/**
 * Dua lapis kuota per rute, per menit:
 *  - `limit`   : jatah satu klien. Bila identitas klien tidak diketahui, semua
 *                permintaan berbagi satu jatah ini — persis perilaku M01 lama.
 *  - `ceiling` : pagar biaya untuk SEMUA klien sekaligus (backstop bila header
 *                identitas dipalsukan). Hanya permintaan yang lolos lapis klien
 *                yang menghitung ke sini, jadi satu klien yang sudah diblokir
 *                tidak bisa menghabiskan jatah orang lain.
 */
type Quota = { limit: number; ceiling: number };
export const RATE_QUOTAS: Readonly<Record<PublicRoute, Quota>> = {
  chat: { limit: 30, ceiling: 300 },
  // Additional quota for expensive, optional Gemini TTS. This is intentionally
  // separate from text chat and remains Redis-backed when Redis is available.
  // Ceiling kecil karena tiap panggilan berbayar.
  'room-tts': { limit: 8, ceiling: 40 },
  // Ceiling = limit: brute force terhadap satu ruang kata sandi harus dibatasi
  // secara global, apa pun identitas kliennya.
  'admin-login': { limit: 20, ceiling: 20 },
  'forum-write': { limit: 60, ceiling: 600 },
  'forum-support': { limit: 120, ceiling: 1200 },
  'forum-reply-create': { limit: 30, ceiling: 300 },
  'forum-reply-list': { limit: 120, ceiling: 1200 },
  'forum-reply-report': { limit: 30, ceiling: 300 },
  'weekly-report': { limit: 120, ceiling: 1200 },
  'sync-read': { limit: 120, ceiling: 1200 },
  'sync-write': { limit: 60, ceiling: 600 }
};

// ─── Identitas klien ────────────────────────────────────────────────

const ANONYMOUS_CLIENT = 'anon';

export interface ClientIdentityConfig {
  /** Jumlah proxy tepercaya di depan aplikasi; menentukan entri X-Forwarded-For yang dipercaya. */
  trustedProxyHops: number;
  /** Kunci HMAC. Tanpa ini IPv4 bisa ditebak balik dari hash-nya (ruangnya hanya ~4 miliar). */
  secret: string;
}

let warnedMissingSecret = false;

/**
 * Identitas per-klien bersifat OPT-IN. M01 melarang mempercayai header
 * `X-Forwarded-For` mentah karena pemanggil bisa memalsukannya; header itu baru
 * boleh dipakai bila operator menyatakan berapa proxy tepercaya di depan aplikasi
 * (`TRUSTED_PROXY_HOPS`) dan menyediakan `RATE_LIMIT_HASH_SECRET`.
 * Bila salah satunya tidak ada, hasilnya `null` dan semua klien dianggap anonim.
 */
export function readClientIdentityConfig(env: Record<string, string | undefined> = process.env): ClientIdentityConfig | null {
  const hops = Number.parseInt(env.TRUSTED_PROXY_HOPS ?? '0', 10);
  if (!Number.isInteger(hops) || hops < 1 || hops > 5) return null;
  const secret = env.RATE_LIMIT_HASH_SECRET ?? '';
  if (secret.length < 16) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.error('[RateLimit] TRUSTED_PROXY_HOPS diisi tetapi RATE_LIMIT_HASH_SECRET kosong/pendek (min. 16 karakter); kuota per-klien dimatikan.');
    }
    return null;
  }
  return { trustedProxyHops: hops, secret };
}

/** IPv6 dipotong ke /64: satu pengguna rumahan biasanya menguasai seluruh blok itu. */
function ipv6Prefix64(address: string): string | null {
  const [head, tail, ...extra] = address.split('%')[0].toLowerCase().split('::');
  if (extra.length) return null;
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = tail === undefined
    ? left
    : [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  if (groups.length !== 8) return null;
  return groups.slice(0, 4).map((group) => group.padStart(4, '0')).join(':');
}

/** Memilih IP klien dari `X-Forwarded-For`: entri ke-N dari KANAN, yaitu yang ditulis proxy tepercaya terdekat. */
export function trustedClientIp(forwardedFor: string | null, hops: number): string | null {
  if (!forwardedFor) return null;
  const parts = forwardedFor.split(',').map((part) => part.trim());
  let candidate = parts[parts.length - hops];
  if (!candidate) return null;
  // Sebagian proxy menambahkan port: "[2001:db8::1]:443" atau "203.0.113.7:443".
  candidate = candidate.replace(/^\[([^\]]+)\](?::\d+)?$/, '$1').replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/, '$1');
  candidate = candidate.replace(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i, '$1');
  const version = isIP(candidate.split('%')[0]);
  if (version === 4) return candidate;
  if (version === 6) return ipv6Prefix64(candidate);
  return null;
}

/** Sidik jari klien: HMAC dari IP, dipotong 128 bit. Tidak pernah menyimpan IP mentah. */
export function clientFingerprint(
  headers: Headers | undefined,
  config: ClientIdentityConfig | null = readClientIdentityConfig()
): string {
  if (!headers || !config) return ANONYMOUS_CLIENT;
  const ip = trustedClientIp(headers.get('x-forwarded-for'), config.trustedProxyHops);
  if (!ip) return ANONYMOUS_CLIENT;
  return createHmac('sha256', config.secret).update(ip).digest('hex').slice(0, 32);
}

// ─── Penghitung ─────────────────────────────────────────────────────

/** Fallback bila Redis mati: batas per-rute (ceiling) dan tabel per-klien terpisah. */
const limiter = createRateLimiter();
const MAX_CLIENT_ENTRIES = 2048;
const clientLimiter = createRateLimiter(WINDOW_MS, MAX_CLIENT_ENTRIES);

function checkMemory(route: PublicRoute, fingerprint: string): boolean {
  const { limit, ceiling } = RATE_QUOTAS[route];
  const key = `${route}:${fingerprint}`;
  // Tabel klien penuh: jangan menolak orang asing (fail-closed di sini akan
  // memblokir pengguna sah); ceiling per-rute tetap melindungi biaya.
  if (!clientLimiter.has(key) && clientLimiter.size >= MAX_CLIENT_ENTRIES) return limiter.check(route, ceiling);
  if (clientLimiter.check(key, limit)) return true;
  return limiter.check(route, ceiling);
}

/**
 * Satu skrip Lua = satu operasi atomik di server Redis, jadi tidak ada celah
 * antara "hitung" dan "pasang TTL", dan dua instance tidak bisa saling menyela.
 * Jendela dimulai dari permintaan pertama (TTL), bukan dari jam dinding, sehingga
 * jam antar-instance yang tidak sinkron tidak berpengaruh dan tidak ada lonjakan
 * dua kali lipat di pergantian menit.
 *
 * Balasan: {kode, hitungan-klien, hitungan-global}; kode 0 = lolos,
 * 1 = kuota klien habis (global TIDAK disentuh), 2 = ceiling global habis.
 */
const RATE_LIMIT_SCRIPT = `
local window = tonumber(ARGV[3])
local function hit(key)
  local n = redis.call('INCR', key)
  if n == 1 or redis.call('PTTL', key) < 0 then
    redis.call('PEXPIRE', key, window)
  end
  return n
end
local client = hit(KEYS[1])
if client > tonumber(ARGV[1]) then return {1, client, 0} end
local global = hit(KEYS[2])
if global > tonumber(ARGV[2]) then return {2, client, global} end
return {0, client, global}
`;

/** Redis tidak boleh menambah latensi tanpa batas ke setiap request; lewat batas ini kita pakai memori. */
const REDIS_TIMEOUT_MS = 1_000;

/** `true` = kena batas, `false` = lolos, `null` = Redis tidak tersedia. */
async function checkRedis(route: PublicRoute, fingerprint: string): Promise<boolean | null> {
  const redis = await getRedis();
  if (!redis) return null;

  const { limit, ceiling } = RATE_QUOTAS[route];
  const reply: unknown = await redis.eval(RATE_LIMIT_SCRIPT, {
    keys: [
      `${REDIS_PREFIX}ratelimit:client:${route}:${fingerprint}`,
      `${REDIS_PREFIX}ratelimit:global:${route}`
    ],
    arguments: [String(limit), String(ceiling), String(WINDOW_MS)]
  });
  if (!Array.isArray(reply) || !Number.isFinite(Number(reply[0]))) throw new Error('balasan skrip tidak dikenal');
  return Number(reply[0]) !== 0;
}

/**
 * Kuota per klien + pagar global per rute. Identitas klien hanya dipakai bila
 * operator mengaktifkannya (lihat `readClientIdentityConfig`); selain itu semua
 * klien anonim berbagi satu jatah per rute seperti sebelumnya.
 *
 * Kuota disimpan di Redis supaya berlaku untuk SEMUA instance server dan tetap
 * hidup setelah restart. Bila Redis mati atau lambat, fungsi ini jatuh ke
 * penghitung in-memory — lebih longgar, tapi tidak pernah membuka pintu
 * lebar-lebar dan tidak pernah menjatuhkan request yang sah.
 */
export async function isRateLimited(route: PublicRoute, request?: { headers: Headers }): Promise<boolean> {
  const fingerprint = clientFingerprint(request?.headers);
  try {
    const limited = await withTimeout(checkRedis(route, fingerprint), REDIS_TIMEOUT_MS);
    if (limited !== null) return limited;
  } catch (error) {
    console.error('[RateLimit] Redis gagal, fallback ke memori:', error instanceof Error ? error.message : error);
  }
  return checkMemory(route, fingerprint);
}

let activeChat = 0;
const MAX_ACTIVE_CHAT = 4;
/**
 * Batas KONKURENSI, bukan kuota: berapa panggilan AI yang boleh berjalan
 * bersamaan di proses ini. Sengaja tetap lokal — angkanya melindungi memori dan
 * socket proses ini sendiri, jadi menaruhnya di Redis justru salah.
 */
export function acquireChatSlot(): (() => void) | null {
  if (activeChat >= MAX_ACTIVE_CHAT) return null;
  activeChat += 1;
  let released = false;
  return () => { if (!released) { activeChat -= 1; released = true; } };
}

let activeForumReplyWrites = 0;
const MAX_ACTIVE_FORUM_REPLY_WRITES = 4;
/** Local concurrency guard; distributed rate limiting remains Redis/edge work. */
export function acquireForumReplyWriteSlot(): (() => void) | null {
  if (activeForumReplyWrites >= MAX_ACTIVE_FORUM_REPLY_WRITES) return null;
  activeForumReplyWrites += 1;
  let released = false;
  return () => { if (!released) { activeForumReplyWrites -= 1; released = true; } };
}

let activeTts = 0;
const MAX_ACTIVE_TTS = 1;
/**
 * Process-local concurrent TTS limit. Like the existing chat slot, it protects
 * one server process; Redis rate limiting supplies the cross-instance quota
 * when Redis is available.
 */
export function acquireTtsSlot(): (() => void) | null {
  if (activeTts >= MAX_ACTIVE_TTS) return null;
  activeTts += 1;
  let released = false;
  return () => { if (!released) { activeTts -= 1; released = true; } };
}
