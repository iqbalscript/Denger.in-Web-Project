import { createHash } from 'node:crypto';
import { getRedis, REDIS_PREFIX, withTimeout } from '../redis.ts';

/**
 * Read-through cache untuk feed forum: daftar cerita dan daftar balasan (komentar).
 *
 * YANG BOLEH MASUK: hanya keluaran repository yang SUDAH disetujui moderasi dan
 * memang publik (`listApproved`, `listApprovedReplies`). Cerita/balasan pending
 * atau rejected, thread key, hash peserta, chat, jurnal, check-in tidak pernah
 * lewat sini.
 *
 * Konsistensi memakai counter versi per cakupan, dan versi ikut di nama key:
 *  - `posts`            : satu versi untuk feed cerita.
 *  - `replies:<cerita>` : satu versi PER CERITA. Balasan baru di cerita A tidak
 *                         membuang cache balasan cerita B.
 * Menaikkan versi membuat semua entri lama langsung tak terbaca di SEMUA instance,
 * tanpa menghapus key satu per satu. TTL 30 dtk jadi jaring pengaman dan satu-satunya
 * batas kebasian untuk perubahan yang tidak menaikkan versi (mis. hitungan dukungan).
 *
 * Key versi punya TTL 1 jam sejak kenaikan terakhir supaya jumlahnya tidak menumpuk
 * seiring bertambahnya cerita. Aman: entri cache hidup maksimal 30 dtk, jadi begitu
 * key versi kedaluwarsa (kembali ke 0), tidak ada entri lama versi 0 yang tersisa.
 */

const TTL_SECONDS = 30;
const VERSION_TTL_SECONDS = 3_600;
const REDIS_TIMEOUT_MS = 500;

const hash = (value: string, length = 32) => createHash('sha256').update(value).digest('hex').slice(0, length);

/** `scope` sudah berupa string aman (hash), bukan input mentah dari URL. */
const versionKey = (scope: string) => `${REDIS_PREFIX}forum:version:${scope}`;
const POSTS_SCOPE = 'posts';
const repliesScope = (storyId: string) => `replies:${hash(storyId, 16)}`;

async function readThrough<T>(scope: string, params: string, load: () => Promise<T | null>): Promise<T | null> {
  let key: string | null = null;
  try {
    const cached = await withTimeout((async () => {
      const redis = await getRedis();
      if (!redis) return null;
      const version = (await redis.get(versionKey(scope))) ?? '0';
      key = `${REDIS_PREFIX}forum:${scope}:${version}:${hash(params)}`;
      const raw = await redis.get(key);
      return typeof raw === 'string' ? (JSON.parse(raw) as T) : null;
    })(), REDIS_TIMEOUT_MS);
    if (cached !== null) return cached;
  } catch (error) {
    key = null;
    console.error('[ForumCache] gagal membaca:', error instanceof Error ? error.message : error);
  }

  // `null` (mis. 404 cerita tidak ada) tidak di-cache; error dari `load` dilempar ke pemanggil.
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

async function bump(scope: string): Promise<void> {
  try {
    await withTimeout((async () => {
      await (await getRedis())?.multi().incr(versionKey(scope)).expire(versionKey(scope), VERSION_TTL_SECONDS).exec();
    })(), REDIS_TIMEOUT_MS);
  } catch (error) {
    console.error('[ForumCache] gagal invalidasi (TTL 30 dtk tetap membatasi kebasian):', error instanceof Error ? error.message : error);
  }
}

/** Feed cerita (`listApproved`). */
export const readThroughForumPosts = <T>(params: string, load: () => Promise<T | null>) => readThrough(POSTS_SCOPE, params, load);
/** Balasan/komentar satu cerita (`listApprovedReplies`). */
export const readThroughForumReplies = <T>(storyId: string, params: string, load: () => Promise<T | null>) => readThrough(repliesScope(storyId), params, load);

/** Panggil setelah cerita dibuat atau dimoderasi, atau balasan yang tampil mengubah hitungan di feed. Tidak pernah melempar. */
export const invalidateForumPosts = () => bump(POSTS_SCOPE);
/** Panggil setelah balasan cerita ini dibuat, dimoderasi, atau dilaporkan. Tidak pernah melempar. */
export const invalidateForumReplies = (storyId: string) => bump(repliesScope(storyId));
