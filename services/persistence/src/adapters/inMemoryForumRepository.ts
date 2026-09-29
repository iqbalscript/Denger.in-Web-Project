import { randomUUID } from 'node:crypto';
import type {
  CreateForumReplyInput,
  CreateForumReplyReportInput,
  CreateForumPostInput,
  ForumModerationStatus,
  ForumReplyPage,
  ForumReplyRecord,
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
  const replies = new Map<string, ForumReplyRecord>();
  const participantAliases = new Map<string, string>();

  return {
    async create(input: CreateForumPostInput): Promise<ForumPostRecord> {
      const record: ForumPostRecord = {
        id: randomUUID(),
        authorPseudonym: input.authorPseudonym,
        domain: input.domain,
        title: input.title,
        body: input.body,
        createdAt: new Date().toISOString(),
        moderationStatus: input.initialStatus ?? 'pending_review',
        supportCount: 0,
        replyState: 'open',
        replyCount: 0
      };
      posts.set(record.id, record);
      return record;
    },

    async listApproved(limit = 20, domain?: import('@dengarin/types').InterventionDomain): Promise<ForumPostRecord[]> {
      return [...posts.values()]
        .filter((post) => post.moderationStatus === 'approved' && (!domain || post.domain === domain))
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
    },

    async incrementSupport(postId: string): Promise<ForumPostRecord | undefined> {
      const existing = posts.get(postId);
      if (!existing) {
        return undefined;
      }
      const updated: ForumPostRecord = {
        ...existing,
        supportCount: (existing.supportCount || 0) + 1
      };
      posts.set(postId, updated);
      return updated;
    },

    async createReply(input: CreateForumReplyInput): Promise<ForumReplyRecord | undefined> {
      const story = posts.get(input.storyId);
      if (!story || story.moderationStatus !== 'approved' || story.replyState !== 'open') return undefined;
      const parent = input.parentReplyId ? replies.get(input.parentReplyId) : undefined;
      if (input.parentReplyId && (!parent || parent.storyId !== input.storyId || parent.moderationStatus !== 'approved')) return undefined;

      const participantKey = `${input.storyId}:${input.participantKeyHash}`;
      let authorAlias = participantAliases.get(participantKey);
      if (!authorAlias) {
        const used = new Set([...participantAliases.entries()]
          .filter(([key]) => key.startsWith(`${input.storyId}:`)).map(([, alias]) => alias));
        authorAlias = input.aliasCandidates.find((alias) => !used.has(alias));
        if (!authorAlias) throw new Error('Tidak dapat menetapkan nama samaran unik.');
        participantAliases.set(participantKey, authorAlias);
      }

      const record: ForumReplyRecord = {
        id: randomUUID(), storyId: input.storyId, parentReplyId: input.parentReplyId ?? null,
        authorAlias, body: input.body, moderationStatus: input.initialStatus,
        createdAt: new Date().toISOString(), moderatedAt: null,
        replyingToAlias: parent?.authorAlias ?? null, parentContextUnavailable: false
      };
      replies.set(record.id, record);
      return record;
    },

    async listApprovedReplies(storyId: string, limit: number, cursor?: string): Promise<ForumReplyPage | undefined> {
      const story = posts.get(storyId);
      if (!story || story.moderationStatus !== 'approved') return undefined;
      const approved = [...replies.values()].filter((reply) => reply.storyId === storyId && reply.moderationStatus === 'approved')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
      const start = cursor ? approved.findIndex((reply) => `${reply.createdAt}.${reply.id}` === cursor) + 1 : 0;
      if (cursor && start === 0) return undefined;
      const newestFirst = approved.slice(start, start + limit).map((reply) => {
        const parent = reply.parentReplyId ? replies.get(reply.parentReplyId) : undefined;
        return { ...reply, replyingToAlias: parent?.moderationStatus === 'approved' ? parent.authorAlias : null,
          parentContextUnavailable: Boolean(reply.parentReplyId && parent?.moderationStatus !== 'approved') };
      });
      const last = newestFirst.at(-1);
      return { replies: newestFirst.reverse(), nextCursor: last && start + limit < approved.length ? `${last.createdAt}.${last.id}` : null, approvedCount: approved.length };
    },

    async createReplyReport(input: CreateForumReplyReportInput): Promise<boolean> {
      const reply = replies.get(input.replyId);
      const story = posts.get(input.storyId);
      return Boolean(reply && story && reply.storyId === input.storyId && reply.moderationStatus === 'approved' && story.moderationStatus === 'approved');
    },

    async moderateReply(replyId: string, status: ForumModerationStatus): Promise<ForumReplyRecord | undefined> {
      const existing = replies.get(replyId);
      if (!existing) return undefined;
      const updated = { ...existing, moderationStatus: status, moderatedAt: new Date().toISOString() };
      replies.set(replyId, updated);
      return updated;
    }
  };
}
