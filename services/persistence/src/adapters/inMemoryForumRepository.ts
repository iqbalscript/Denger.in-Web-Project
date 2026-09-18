import { randomUUID } from 'node:crypto';
import type {
  CreateForumPostInput,
  ForumModerationStatus,
  ForumPostRecord,
  ForumRepository
} from '../types.ts';

/**
 * Process-local, non-persistent implementation of ForumRepository.
 * Suitable for local development and the competition demo only — data is
 * lost on restart and is never shared across server instances.
 */
export function createInMemoryForumRepository(): ForumRepository {
  const posts = new Map<string, ForumPostRecord>();

  return {
    async create(input: CreateForumPostInput): Promise<ForumPostRecord> {
      const record: ForumPostRecord = {
        id: randomUUID(),
        authorPseudonym: input.authorPseudonym,
        domain: input.domain,
        title: input.title,
        body: input.body,
        createdAt: new Date().toISOString(),
        moderationStatus: 'pending_review',
        supportCount: 0
      };
      posts.set(record.id, record);
      return record;
    },

    async listApproved(limit = 20): Promise<ForumPostRecord[]> {
      return [...posts.values()]
        .filter((post) => post.moderationStatus === 'approved')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },

    async listPendingReview(limit = 50): Promise<ForumPostRecord[]> {
      return [...posts.values()]
        .filter((post) => post.moderationStatus === 'pending_review')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, limit);
    },

    async moderate(
      postId: string,
      status: ForumModerationStatus
    ): Promise<ForumPostRecord | undefined> {
      const existing = posts.get(postId);
      if (!existing) {
        return undefined;
      }
      const updated: ForumPostRecord = { ...existing, moderationStatus: status };
      posts.set(postId, updated);
      return updated;
    }
  };
}
