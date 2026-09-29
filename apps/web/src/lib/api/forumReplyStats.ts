import type { ForumPostRecord } from '@dengarin/persistence';
import { forumRepository } from './repositories.ts';
import { isReplySchemaUnavailable } from './replySchema.ts';

type StatsSource = Pick<typeof forumRepository, 'getReplyStats'>;

/**
 * Menempelkan hitungan balasan dan status kunci ke feed cerita.
 *
 * Feed cerita sengaja tidak bergantung pada skema balasan (database produksi bisa
 * saja belum menerapkan migrasi balasan), jadi hitungan diambil lewat query
 * terpisah. Bila skema itu belum ada, atau query gagal karena sebab lain, feed tetap
 * disajikan apa adanya (replyCount 0): hitungan itu pelengkap, bukan alasan
 * feed cerita gagal dimuat.
 */
export async function withReplyStats(posts: ForumPostRecord[], source: StatsSource = forumRepository): Promise<ForumPostRecord[]> {
  if (!posts.length) return posts;
  try {
    const stats = await source.getReplyStats(posts.map((post) => post.id));
    return posts.map((post) => (stats[post.id] ? { ...post, ...stats[post.id] } : post));
  } catch (error) {
    if (!isReplySchemaUnavailable(error)) console.error('[Forum] gagal memuat hitungan balasan:', error instanceof Error ? error.message : error);
    return posts;
  }
}
