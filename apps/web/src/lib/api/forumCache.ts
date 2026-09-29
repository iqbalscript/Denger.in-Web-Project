import { createHash } from 'node:crypto';
import { getRedis, REDIS_PREFIX, withTimeout } from '../redis.ts';

/**
 * Read-through cache untuk feed forum (daftar cerita dan daftar balasan).
 *
 * YANG BOLEH MASUK: hanya keluaran repository yang SUDAH disetujui moderasi dan
 * memang publik (`listApproved`, `listApprovedReplies`). Cerita pending/rejected,
 * thread key, hash peserta, chat, jurnal, check-in tidak pernah lewat sini.
 *
 * Konsistensi: setiap tulis/moderasi menaikkan satu counter versi
 * (`invalidateForumCache`). Versi ikut di nama key, jadi semua entri lama
 * langsung tak terbaca di SEMUA instance tanpa perlu menghapus key satu per satu.
 * TTL pendek (30 dtk) menjadi jaring pengaman, dan menjadi satu-satunya batas
 * kebasian untuk perubahan yang tidak menaikkan versi (mis. hitungan dukungan).
 */

const TTL_SECONDS = 30;
const REDIS_TIMEOUT_MS = 500;
const VERSION_KEY = `${REDIS_PREFIX}forum:version`;

const fingerprint = (params: string) => createHash('sha256').update(params).digest('hex').slice(0, 32);

/** `load` dipanggil bila Redis mati/lambat atau entri belum ada. `null` (404) tidak di-cache. */
export async function readThroughForum<T>(kind: 'posts' | 'replies', params: string, load: () => Promise<T | null>): Promise<T | null> {
  let key: string | null = null;
  try {
    const cached = await withTimeout((async () => {
      const redis = await getRedis();
      if (!redis) return null;
      const version = (await redis.get(VERSION_KEY)) ?? '0';
      key = `${REDIS_PREFIX}forum:${version}:${kind}:${fingerprint(params)}`;
      const raw = await redis.get(key);
      return typeof raw === 'string' ? (JSON.parse(raw) as T) : null;
    })(), REDIS_TIMEOUT_MS);
    if (cached !== null) return cached;
  } catch (error) {
    key = null;
    console.error('[ForumCache] gagal membaca:', error instanceof Error ? error.message : error);
  }

  const fresh = await load();
  if (fresh !== null && key) {
    const cacheKey = key;
    try {
      await withTimeout((async () => {
        await (await getRedis())?.set(cacheKey, JSON.stringify(fresh), { expiration: { type: 'EX', value: TTL_SECONDS } });
      })(), REDIS_TIMEOUT_MS);
    } catch (error) {
      console.error('[ForumCache] gagal menulis:', error instanceof Error ? error.message : error);
    }
  }
  return fresh;
}

/** Panggil setelah tulis/moderasi yang mengubah apa yang boleh dilihat publik. Tidak pernah melempar. */
export async function invalidateForumCache(): Promise<void> {
  try {
    await withTimeout((async () => { await (await getRedis())?.incr(VERSION_KEY); })(), REDIS_TIMEOUT_MS);
  } catch (error) {
    console.error('[ForumCache] gagal invalidasi (TTL 30 dtk tetap membatasi kebasian):', error instanceof Error ? error.message : error);
  }
}
