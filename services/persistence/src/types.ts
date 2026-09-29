import type { InterventionDomain } from '@dengarin/types';

/**
 * Every new post starts 'pending_review': there is no automated moderation
 * model yet (README Roadmap — "moderasi otomatis direncanakan untuk sprint
 * lanjutan"), so nothing goes public without an explicit approval step.
 */
export type ForumModerationStatus = 'pending_review' | 'approved' | 'rejected';
export type ForumReplyState = 'open' | 'locked';
export type ForumReportReason =
  | 'harassment_or_bullying'
  | 'self_harm_or_dangerous_advice'
  | 'contact_or_privacy'
  | 'scam_or_spam'
  | 'impersonation'
  | 'other_safety';
export type ForumReportStatus = 'pending_review' | 'resolved' | 'dismissed';

export interface ForumPostRecord {
  id: string;
  authorPseudonym: string;
  domain: InterventionDomain;
  title: string;
  body: string;
  createdAt: string;
  moderationStatus: ForumModerationStatus;
  supportCount: number;
  replyState: ForumReplyState;
  replyCount: number;
}

export interface CreateForumPostInput {
  authorPseudonym: string;
  domain: InterventionDomain;
  title: string;
  body: string;
  initialStatus?: ForumModerationStatus;
}

/** A public reply never contains the private thread capability or its hash. */
export interface ForumReplyRecord {
  id: string;
  storyId: string;
  parentReplyId: string | null;
  authorAlias: string;
  body: string;
  moderationStatus: ForumModerationStatus;
  createdAt: string;
  moderatedAt: string | null;
  /** Present only for an approved, publicly visible parent. */
  replyingToAlias: string | null;
  /** True when a formerly visible parent was moderated away. */
  parentContextUnavailable: boolean;
}

export interface CreateForumReplyInput {
  storyId: string;
  parentReplyId?: string;
  /** HMAC(server secret, story ID + opaque browser capability), never public. */
  participantKeyHash: string;
  /** Server-generated collision-resistant candidates, never supplied by a browser. */
  aliasCandidates: string[];
  body: string;
  initialStatus: ForumModerationStatus;
}

export interface ForumReplyPage {
  replies: ForumReplyRecord[];
  nextCursor: string | null;
  approvedCount: number;
}

export interface CreateForumReplyReportInput {
  storyId: string;
  replyId: string;
  reason: ForumReportReason;
}

/**
 * Storage-agnostic contract for the anonymous forum (`/forum`).
 * Implemented by createInMemoryForumRepository() (dev/demo) and
 * createPostgresForumRepository() (real database, see src/db).
 */
export interface ForumRepository {
  create(input: CreateForumPostInput): Promise<ForumPostRecord>;
  listApproved(limit?: number, domain?: InterventionDomain): Promise<ForumPostRecord[]>;
  listPendingReview(limit?: number): Promise<ForumPostRecord[]>;
  moderate(postId: string, status: ForumModerationStatus): Promise<ForumPostRecord | undefined>;
  incrementSupport(postId: string): Promise<ForumPostRecord | undefined>;
  createReply(input: CreateForumReplyInput): Promise<ForumReplyRecord | undefined>;
  listApprovedReplies(storyId: string, limit: number, cursor?: string): Promise<ForumReplyPage | undefined>;
  createReplyReport(input: CreateForumReplyReportInput): Promise<boolean>;
  moderateReply(replyId: string, status: ForumModerationStatus): Promise<ForumReplyRecord | undefined>;
}

/**
 * Opaque, client-encrypted blob keyed by a hash of the user's 12-word
 * recovery mnemonic. The server never sees the mnemonic itself or plaintext
 * session data — see README Roadmap, "sinkronisasi antarperangkat
 * terenkripsi menggunakan frasa 12-kata".
 */
export interface SyncedSessionRecord {
  mnemonicHash: string;
  encryptedBlob: string;
  updatedAt: string;
}

export interface SecureBackupRecord {
  backupId: string;
  encryptedBlob: string;
  writeKey: string;
  version: number;
  updatedAt: string;
}

/**
 * Storage-agnostic contract for opt-in encrypted cross-device sync.
 * Implemented by createInMemorySyncRepository() (dev/demo) and
 * createPostgresSyncRepository() (real database, see src/db).
 */
export interface SyncRepository {
  get(mnemonicHash: string): Promise<SyncedSessionRecord | undefined>;
  upsert(record: SyncedSessionRecord): Promise<SyncedSessionRecord>;
  getSecure(backupId: string): Promise<SecureBackupRecord | undefined>;
  createSecure(record: SecureBackupRecord): Promise<boolean>;
  updateSecure(record: SecureBackupRecord, expectedVersion: number): Promise<boolean>;
}

/**
 * Operator/moderator account. NOT an end-user account — Dengar.in's
 * anonymous users never authenticate (see docs/SAFETY.md, Zero Unnecessary
 * PII). This exists solely to gate `/api/forum/[postId]/moderate`.
 */
export interface AdminUserRecord {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface CreateAdminUserInput {
  username: string;
  passwordHash: string;
}

/**
 * Storage-agnostic contract for admin/moderator accounts.
 */
export interface AdminRepository {
  findByUsername(username: string): Promise<AdminUserRecord | undefined>;
  create(input: CreateAdminUserInput): Promise<AdminUserRecord>;
}
