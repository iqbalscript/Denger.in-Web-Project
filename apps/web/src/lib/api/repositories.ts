import {
  createForumRepository,
  createSyncRepository,
  createAdminRepository
} from '@dengarin/persistence';

/**
 * Process-local singleton repositories backing the backend.
 * createForumRepository()/createSyncRepository()/createAdminRepository()
 * (from @dengarin/persistence) transparently pick the PostgreSQL adapter
 * when DATABASE_URL is configured, and fall back to the in-memory adapter
 * otherwise — see services/persistence/src/factory.ts.
 */
export const forumRepository = createForumRepository();
export const syncRepository = createSyncRepository();
export const adminRepository = createAdminRepository();
