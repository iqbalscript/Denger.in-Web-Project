export type {
  AdminRepository,
  AdminUserRecord,
  CreateAdminUserInput,
  CreateForumPostInput,
  ForumModerationStatus,
  ForumPostRecord,
  ForumRepository,
  SyncedSessionRecord,
  SyncRepository
} from './types.ts';

export { createInMemoryForumRepository } from './adapters/inMemoryForumRepository.ts';
export { createInMemorySyncRepository } from './adapters/inMemorySyncRepository.ts';
export { createInMemoryAdminRepository } from './adapters/inMemoryAdminRepository.ts';
export { createPostgresForumRepository } from './adapters/postgresForumRepository.ts';
export { createPostgresSyncRepository } from './adapters/postgresSyncRepository.ts';
export { createPostgresAdminRepository } from './adapters/postgresAdminRepository.ts';

export { createForumRepository, createSyncRepository, createAdminRepository } from './factory.ts';
export { getPool, closePool, isDatabaseConfigured } from './db/pool.ts';
