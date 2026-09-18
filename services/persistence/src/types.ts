import type { InterventionDomain } from '@dengarin/types';

/**
 * Every new post starts 'pending_review': there is no automated moderation
 * model yet (README Roadmap — "moderasi otomatis direncanakan untuk sprint
 * lanjutan"), so nothing goes public without an explicit approval step.
 */
export type ForumModerationStatus = 'pending_review' | 'approved' | 'rejected';

export interface ForumPostRecord {
  id: string;
  authorPseudonym: string;
  domain: InterventionDomain;
  title: string;
  body: string;
  createdAt: string;
  moderationStatus: ForumModerationStatus;
  supportCount: number;
}

export interface CreateForumPostInput {
  authorPseudonym: string;
  domain: InterventionDomain;
  title: string;
  body: string;
}

/**
 * Storage-agnostic contract for the anonymous forum (`/forum`).
 * Implemented by createInMemoryForumRepository() (dev/demo) and
 * createPostgresForumRepository() (real database, see src/db).
 */
export interface ForumRepository {
  create(input: CreateForumPostInput): Promise<ForumPostRecord>;
  listApproved(limit?: number): Promise<ForumPostRecord[]>;
  listPendingReview(limit?: number): Promise<ForumPostRecord[]>;
  moderate(postId: string, status: ForumModerationStatus): Promise<ForumPostRecord | undefined>;
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

/**
 * Storage-agnostic contract for opt-in encrypted cross-device sync.
 * Implemented by createInMemorySyncRepository() (dev/demo) and
 * createPostgresSyncRepository() (real database, see src/db).
 */
export interface SyncRepository {
  get(mnemonicHash: string): Promise<SyncedSessionRecord | undefined>;
  upsert(record: SyncedSessionRecord): Promise<SyncedSessionRecord>;
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
