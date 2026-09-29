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

/**
 * Disimpan di globalThis: Next.js bisa membuat instance modul terpisah untuk tiap
 * route (terutama di `next dev` dan saat hot reload). Tanpa ini, repository
 * in-memory (mode tanpa DATABASE_URL) menjadi Map berbeda per route: cerita yang
 * dibuat lewat /api/forum tidak terlihat oleh /api/forum/[postId]/replies dan
 * balasan selalu 404. Adapter PostgreSQL tidak terdampak (state-nya di database).
 */
const globalForRepositories = globalThis as typeof globalThis & {
  __dengarinRepositories?: {
    forumRepository: ReturnType<typeof createForumRepository>;
    syncRepository: ReturnType<typeof createSyncRepository>;
    adminRepository: ReturnType<typeof createAdminRepository>;
  };
};

const repositories = (globalForRepositories.__dengarinRepositories ??= {
  forumRepository: createForumRepository(),
  syncRepository: createSyncRepository(),
  adminRepository: createAdminRepository()
});

export const { forumRepository, syncRepository, adminRepository } = repositories;
