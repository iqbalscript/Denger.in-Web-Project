import { getRedis, REDIS_PREFIX } from '../redis.ts';

type Entry = { count: number; expiresAt: number };

const WINDOW_MS = 60_000;

/** Process-local quotas. Keys are server constants, never request fields. */
export function createRateLimiter(windowMs = WINDOW_MS, maxEntries = 32, now = Date.now) {
  const hits = new Map<string, Entry>();
  return {
    check(key: string, limit: number): boolean {
      const time = now();
      for (const [id, entry] of hits) {
        if (entry.expiresAt <= time) hits.delete(id);
      }
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
    get size() { return hits.size; }
  };
}

const limiter = createRateLimiter();
export type PublicRoute = 'chat' | 'room-tts' | 'admin-login' | 'forum-write' | 'forum-support' | 'forum-reply-create' | 'forum-reply-list' | 'forum-reply-report' | 'weekly-report' | 'sync-read' | 'sync-write';
const limits: Record<PublicRoute, number> = {
  chat: 30,
  // Additional quota for expensive, optional Gemini TTS. This is intentionally
  // separate from text chat and remains Redis-backed when Redis is available.
  'room-tts': 8,
  'admin-login': 20,
  'forum-write': 60,
  'forum-support': 120,
  'forum-reply-create': 30,
  'forum-reply-list': 120,
  'forum-reply-report': 30,
  'weekly-report': 120,
  'sync-read': 120,
  'sync-write': 60
};

/**
 * Anonymous route-wide quota; session IDs and forwarding headers have no authority.
 *
 * Kuota disimpan di Redis supaya satu kuota berlaku untuk SEMUA instance server
 * dan tetap hidup setelah restart. Bila Redis mati, fungsi ini jatuh ke
 * penghitung in-memory di atas — lebih longgar, tapi tidak pernah membuka pintu
 * lebar-lebar dan tidak pernah menjatuhkan request yang sah.
 */
export async function isRateLimited(route: PublicRoute): Promise<boolean> {
  const limit = limits[route];
  const redis = await getRedis();
  if (!redis) return limiter.check(route, limit);

  // Fixed window: indeks jendela ikut masuk ke nama key, sehingga jendela lama
  // kedaluwarsa sendiri dan tidak perlu dibersihkan manual.
  const windowIndex = Math.floor(Date.now() / WINDOW_MS);
  const key = `${REDIS_PREFIX}ratelimit:${route}:${windowIndex}`;

  try {
    // MULTI/EXEC menjalankan keduanya sebagai satu unit, jadi mustahil ada key
    // yang ter-INCR tapi gagal dapat TTL lalu menetap selamanya.
    const replies = await redis
      .multi()
      .incr(key)
      .expire(key, Math.ceil(WINDOW_MS / 1_000))
      .exec();

    const count = Number(replies[0]);
    if (!Number.isFinite(count)) return limiter.check(route, limit);
    return count > limit;
  } catch (error) {
    console.error('[RateLimit] Redis gagal, fallback ke memori:', error instanceof Error ? error.message : error);
    return limiter.check(route, limit);
  }
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
