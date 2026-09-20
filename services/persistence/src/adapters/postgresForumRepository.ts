import type { Pool } from 'pg';
import type { InterventionDomain } from '@dengarin/types';
import type {
  CreateForumPostInput,
  ForumModerationStatus,
  ForumPostRecord,
  ForumRepository
} from '../types.ts';
import { getPool } from '../db/pool.ts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ForumPostRow {
  id: string;
  author_pseudonym: string;
  domain: string;
  title: string;
  body: string;
  moderation_status: ForumModerationStatus;
  support_count: number;
  created_at: Date;
}

function rowToRecord(row: ForumPostRow): ForumPostRecord {
  return {
    id: row.id,
    authorPseudonym: row.author_pseudonym,
    domain: row.domain as InterventionDomain,
    title: row.title,
    body: row.body,
    moderationStatus: row.moderation_status,
    supportCount: row.support_count,
    createdAt: row.created_at.toISOString()
  };
}

/**
 * PostgreSQL-backed ForumRepository (services/persistence/migrations/001_init.sql).
 * Pass an explicit Pool in tests; defaults to the shared singleton from
 * src/db/pool.ts (DATABASE_URL) otherwise.
 */
export function createPostgresForumRepository(pool: Pool = getPool()): ForumRepository {
  return {
    async create(input: CreateForumPostInput): Promise<ForumPostRecord> {
      const status = input.initialStatus ?? 'pending_review';
      const result = await pool.query<ForumPostRow>(
        `INSERT INTO forum_posts (author_pseudonym, domain, title, body, moderation_status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, author_pseudonym, domain, title, body, moderation_status, support_count, created_at`,
        [input.authorPseudonym, input.domain, input.title, input.body, status]
      );
      return rowToRecord(result.rows[0]);
    },

    async listApproved(limit = 20, domain?: InterventionDomain): Promise<ForumPostRecord[]> {
      const query = domain
        ? `SELECT id, author_pseudonym, domain, title, body, moderation_status, support_count, created_at
           FROM forum_posts
           WHERE moderation_status = 'approved' AND domain = $2
           ORDER BY created_at DESC
           LIMIT $1`
        : `SELECT id, author_pseudonym, domain, title, body, moderation_status, support_count, created_at
           FROM forum_posts
           WHERE moderation_status = 'approved'
           ORDER BY created_at DESC
           LIMIT $1`;
      const params = domain ? [limit, domain] : [limit];
      const result = await pool.query<ForumPostRow>(query, params);
      return result.rows.map(rowToRecord);
    },

    async listPendingReview(limit = 50): Promise<ForumPostRecord[]> {
      const result = await pool.query<ForumPostRow>(
        `SELECT id, author_pseudonym, domain, title, body, moderation_status, support_count, created_at
         FROM forum_posts
         WHERE moderation_status = 'pending_review'
         ORDER BY created_at ASC
         LIMIT $1`,
        [limit]
      );
      return result.rows.map(rowToRecord);
    },

    async moderate(
      postId: string,
      status: ForumModerationStatus
    ): Promise<ForumPostRecord | undefined> {
      if (!UUID_PATTERN.test(postId)) {
        return undefined;
      }
      const result = await pool.query<ForumPostRow>(
        `UPDATE forum_posts
         SET moderation_status = $2
         WHERE id = $1
         RETURNING id, author_pseudonym, domain, title, body, moderation_status, support_count, created_at`,
        [postId, status]
      );
      return result.rows[0] ? rowToRecord(result.rows[0]) : undefined;
    },

    async incrementSupport(postId: string): Promise<ForumPostRecord | undefined> {
      if (!UUID_PATTERN.test(postId)) {
        return undefined;
      }
      const result = await pool.query<ForumPostRow>(
        `UPDATE forum_posts
         SET support_count = support_count + 1
         WHERE id = $1
         RETURNING id, author_pseudonym, domain, title, body, moderation_status, support_count, created_at`,
        [postId]
      );
      return result.rows[0] ? rowToRecord(result.rows[0]) : undefined;
    }
  };
}
