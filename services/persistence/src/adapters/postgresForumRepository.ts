import type { Pool, PoolClient } from 'pg';
import type { InterventionDomain } from '@dengarin/types';
import type { CreateForumReplyInput, CreateForumReplyReportInput, CreateForumPostInput, ForumModerationStatus, ForumPostRecord, ForumReplyPage, ForumReplyRecord, ForumReplyStats, ForumRepository } from '../types.ts';
import { getPool } from '../db/pool.ts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Keep the story-feed projection compatible with the deployed pre-reply
 * schema. Reply-specific columns and tables are intentionally only queried
 * by reply operations after the dedicated reply migration has been applied.
 */
interface ForumPostRow { id: string; author_pseudonym: string; domain: string; title: string; body: string; moderation_status: ForumModerationStatus; support_count: number; created_at: Date; }
interface ForumReplyRow { id: string; story_id: string; parent_reply_id: string | null; author_alias: string; body: string; moderation_status: ForumModerationStatus; created_at: Date; moderated_at: Date | null; replying_to_alias: string | null; parent_context_unavailable: boolean; }

function rowToRecord(row: ForumPostRow): ForumPostRecord {
  return { id: row.id, authorPseudonym: row.author_pseudonym, domain: row.domain as InterventionDomain, title: row.title, body: row.body, moderationStatus: row.moderation_status, supportCount: row.support_count, createdAt: row.created_at.toISOString(), replyState: 'open', replyCount: 0 };
}
function rowToReply(row: ForumReplyRow): ForumReplyRecord {
  return { id: row.id, storyId: row.story_id, parentReplyId: row.parent_reply_id, authorAlias: row.author_alias, body: row.body, moderationStatus: row.moderation_status, createdAt: row.created_at.toISOString(), moderatedAt: row.moderated_at?.toISOString() ?? null, replyingToAlias: row.replying_to_alias, parentContextUnavailable: row.parent_context_unavailable };
}
function parseCursor(cursor: string): { createdAt: string; id: string } | undefined {
  const separator = cursor.lastIndexOf('.'); const createdAt = cursor.slice(0, separator); const id = cursor.slice(separator + 1);
  return separator > 0 && UUID_PATTERN.test(id) && !Number.isNaN(Date.parse(createdAt)) ? { createdAt, id } : undefined;
}

/** 42P01 = tabel tidak ada, 42703 = kolom tidak ada: migrasi balasan belum diterapkan. */
function isReplySchemaMissing(error: unknown): boolean {
  const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: unknown }).code : undefined;
  return code === '42P01' || code === '42703';
}

const postFields = `id, author_pseudonym, domain, title, body, moderation_status, support_count, created_at`;
const replyFields = `r.id, r.story_id, r.parent_reply_id, r.author_alias, r.body, r.moderation_status, r.created_at, r.moderated_at, CASE WHEN parent.moderation_status = 'approved' THEN parent.author_alias ELSE NULL END AS replying_to_alias, (r.parent_reply_id IS NOT NULL AND (parent.id IS NULL OR parent.moderation_status <> 'approved')) AS parent_context_unavailable`;

/** Browser clients never access forum tables directly; all access is through this repository. */
export function createPostgresForumRepository(pool: Pool = getPool()): ForumRepository {
  return {
    async create(input: CreateForumPostInput): Promise<ForumPostRecord> {
      const result = await pool.query<ForumPostRow>(`INSERT INTO forum_posts (author_pseudonym, domain, title, body, moderation_status) VALUES ($1, $2, $3, $4, $5) RETURNING ${postFields}`, [input.authorPseudonym, input.domain, input.title, input.body, input.initialStatus ?? 'pending_review']);
      return rowToRecord(result.rows[0]);
    },
    async listApproved(limit = 20, domain?: InterventionDomain): Promise<ForumPostRecord[]> {
      const query = domain ? `SELECT ${postFields} FROM forum_posts WHERE moderation_status = 'approved' AND domain = $2 ORDER BY created_at DESC LIMIT $1` : `SELECT ${postFields} FROM forum_posts WHERE moderation_status = 'approved' ORDER BY created_at DESC LIMIT $1`;
      const result = await pool.query<ForumPostRow>(query, domain ? [limit, domain] : [limit]); return result.rows.map(rowToRecord);
    },
    async listPendingReview(limit = 50): Promise<ForumPostRecord[]> {
      const result = await pool.query<ForumPostRow>(`SELECT ${postFields} FROM forum_posts WHERE moderation_status = 'pending_review' ORDER BY created_at ASC LIMIT $1`, [limit]); return result.rows.map(rowToRecord);
    },
    async moderate(postId: string, status: ForumModerationStatus): Promise<ForumPostRecord | undefined> {
      if (!UUID_PATTERN.test(postId)) return undefined;
      const result = await pool.query<ForumPostRow>(`UPDATE forum_posts SET moderation_status = $2 WHERE id = $1 RETURNING ${postFields}`, [postId, status]);
      if (result.rows[0] && status !== 'approved') {
        // Cerita yang tidak disetujui tidak boleh menerima balasan. Terpisah dari
        // UPDATE di atas supaya moderasi tetap jalan di database yang belum punya
        // kolom reply_state (migrasi balasan belum diterapkan).
        try { await pool.query("UPDATE forum_posts SET reply_state = 'locked' WHERE id = $1", [postId]); }
        catch (error) { if (!isReplySchemaMissing(error)) throw error; }
      }
      return result.rows[0] ? rowToRecord(result.rows[0]) : undefined;
    },
    async getReplyStats(storyIds: string[]): Promise<Record<string, ForumReplyStats>> {
      const ids = storyIds.filter((id) => UUID_PATTERN.test(id));
      if (!ids.length) return {};
      const result = await pool.query<{ id: string; reply_state: 'open' | 'locked'; reply_count: string | number }>(
        `SELECT p.id, p.reply_state, (SELECT count(*) FROM forum_replies r WHERE r.story_id = p.id AND r.moderation_status = 'approved') AS reply_count FROM forum_posts p WHERE p.id = ANY($1::uuid[])`, [ids]);
      return Object.fromEntries(result.rows.map((row) => [row.id, { replyState: row.reply_state, replyCount: Number(row.reply_count) }]));
    },
    async incrementSupport(postId: string): Promise<ForumPostRecord | undefined> {
      if (!UUID_PATTERN.test(postId)) return undefined;
      const result = await pool.query<ForumPostRow>(`UPDATE forum_posts SET support_count = support_count + 1 WHERE id = $1 AND moderation_status = 'approved' RETURNING ${postFields}`, [postId]);
      return result.rows[0] ? rowToRecord(result.rows[0]) : undefined;
    },
    async createReply(input: CreateForumReplyInput): Promise<ForumReplyRecord | undefined> {
      if (!UUID_PATTERN.test(input.storyId) || (input.parentReplyId && !UUID_PATTERN.test(input.parentReplyId))) return undefined;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const story = await client.query<{ moderation_status: ForumModerationStatus; reply_state: string }>('SELECT moderation_status, reply_state FROM forum_posts WHERE id = $1 FOR UPDATE', [input.storyId]);
        if (!story.rows[0] || story.rows[0].moderation_status !== 'approved' || story.rows[0].reply_state !== 'open') { await client.query('ROLLBACK'); return undefined; }
        let parentAlias: string | null = null;
        if (input.parentReplyId) {
          const parent = await client.query<{ author_alias: string; moderation_status: ForumModerationStatus }>('SELECT author_alias, moderation_status FROM forum_replies WHERE id = $1 AND story_id = $2 FOR KEY SHARE', [input.parentReplyId, input.storyId]);
          if (!parent.rows[0] || parent.rows[0].moderation_status !== 'approved') { await client.query('ROLLBACK'); return undefined; }
          parentAlias = parent.rows[0].author_alias;
        }
        const alias = await getOrAssignAlias(client, input.storyId, input.participantKeyHash, input.aliasCandidates);
        const inserted = await client.query<ForumReplyRow>(`INSERT INTO forum_replies (story_id, parent_reply_id, author_alias, body, moderation_status) VALUES ($1, $2, $3, $4, $5) RETURNING id, story_id, parent_reply_id, author_alias, body, moderation_status, created_at, moderated_at, $6::text AS replying_to_alias, false AS parent_context_unavailable`, [input.storyId, input.parentReplyId ?? null, alias, input.body, input.initialStatus, parentAlias]);
        await client.query('COMMIT'); return rowToReply(inserted.rows[0]);
      } catch (error) { await client.query('ROLLBACK').catch(() => undefined); throw error; } finally { client.release(); }
    },
    async listApprovedReplies(storyId: string, limit: number, cursor?: string): Promise<ForumReplyPage | undefined> {
      if (!UUID_PATTERN.test(storyId)) return undefined;
      const parsed = cursor ? parseCursor(cursor) : undefined; if (cursor && !parsed) return undefined;
      const root = await pool.query("SELECT 1 FROM forum_posts WHERE id = $1 AND moderation_status = 'approved'", [storyId]); if (!root.rowCount) return undefined;
      const params: unknown[] = [storyId]; let predicate = '';
      if (parsed) { params.push(parsed.createdAt, parsed.id); predicate = 'AND (r.created_at, r.id) < ($2::timestamptz, $3::uuid)'; }
      params.push(limit + 1);
      const result = await pool.query<ForumReplyRow>(`SELECT ${replyFields} FROM forum_replies r LEFT JOIN forum_replies parent ON parent.id = r.parent_reply_id WHERE r.story_id = $1 AND r.moderation_status = 'approved' ${predicate} ORDER BY r.created_at DESC, r.id DESC LIMIT $${params.length}`, params);
      const hasNext = result.rows.length > limit; const newestFirst = result.rows.slice(0, limit).map(rowToReply); const last = newestFirst.at(-1);
      const count = await pool.query<{ count: string }>("SELECT count(*) FROM forum_replies WHERE story_id = $1 AND moderation_status = 'approved'", [storyId]);
      return { replies: newestFirst.reverse(), nextCursor: hasNext && last ? `${last.createdAt}.${last.id}` : null, approvedCount: Number(count.rows[0].count) };
    },
    async createReplyReport(input: CreateForumReplyReportInput): Promise<boolean> {
      if (!UUID_PATTERN.test(input.storyId) || !UUID_PATTERN.test(input.replyId)) return false;
      const result = await pool.query(`INSERT INTO forum_reply_reports (reply_id, reason) SELECT r.id, $3 FROM forum_replies r JOIN forum_posts p ON p.id = r.story_id WHERE r.id = $1 AND r.story_id = $2 AND r.moderation_status = 'approved' AND p.moderation_status = 'approved'`, [input.replyId, input.storyId, input.reason]); return result.rowCount === 1;
    },
    async moderateReply(replyId: string, status: ForumModerationStatus): Promise<ForumReplyRecord | undefined> {
      if (!UUID_PATTERN.test(replyId)) return undefined;
      const result = await pool.query<ForumReplyRow>(`UPDATE forum_replies r SET moderation_status = $2, moderated_at = now() WHERE r.id = $1 RETURNING r.id, r.story_id, r.parent_reply_id, r.author_alias, r.body, r.moderation_status, r.created_at, r.moderated_at, NULL::text AS replying_to_alias, false AS parent_context_unavailable`, [replyId, status]); return result.rows[0] ? rowToReply(result.rows[0]) : undefined;
    }
  };
}

async function getOrAssignAlias(client: PoolClient, storyId: string, participantKeyHash: string, candidates: string[]): Promise<string> {
  const existing = await client.query<{ alias: string }>('SELECT alias FROM forum_thread_participants WHERE story_id = $1 AND participant_key_hash = $2 FOR UPDATE', [storyId, participantKeyHash]);
  if (existing.rows[0]) return existing.rows[0].alias;
  for (const candidate of candidates) {
    const inserted = await client.query<{ alias: string }>('INSERT INTO forum_thread_participants (story_id, participant_key_hash, alias) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING alias', [storyId, participantKeyHash, candidate]);
    if (inserted.rows[0]) return inserted.rows[0].alias;
    const concurrent = await client.query<{ alias: string }>('SELECT alias FROM forum_thread_participants WHERE story_id = $1 AND participant_key_hash = $2', [storyId, participantKeyHash]);
    if (concurrent.rows[0]) return concurrent.rows[0].alias;
  }
  throw new Error('Ruang cerita sedang terlalu ramai. Coba lagi sebentar.');
}
