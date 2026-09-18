import type { AdminRepository, ForumRepository, SyncRepository } from './types.ts';
import { isDatabaseConfigured } from './db/pool.ts';
import { createInMemoryForumRepository } from './adapters/inMemoryForumRepository.ts';
import { createInMemorySyncRepository } from './adapters/inMemorySyncRepository.ts';
import { createInMemoryAdminRepository } from './adapters/inMemoryAdminRepository.ts';
import { createPostgresForumRepository } from './adapters/postgresForumRepository.ts';
import { createPostgresSyncRepository } from './adapters/postgresSyncRepository.ts';
import { createPostgresAdminRepository } from './adapters/postgresAdminRepository.ts';

/**
 * Picks the real PostgreSQL adapter when DATABASE_URL is configured, and
 * falls back to the process-local in-memory adapter otherwise (local
 * development / running the repo without a database attached yet).
 */
export function createForumRepository(): ForumRepository {
  return isDatabaseConfigured() ? createPostgresForumRepository() : createInMemoryForumRepository();
}

export function createSyncRepository(): SyncRepository {
  return isDatabaseConfigured() ? createPostgresSyncRepository() : createInMemorySyncRepository();
}

export function createAdminRepository(): AdminRepository {
  return isDatabaseConfigured() ? createPostgresAdminRepository() : createInMemoryAdminRepository();
}
