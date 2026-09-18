import { createInMemoryForumRepository, createInMemorySyncRepository } from '@dengarin/persistence';

/**
 * Process-local singleton repositories backing the backend skeleton.
 * TODO(Sprint 2+): swap for PostgreSQL/Supabase-backed adapters implementing
 * the same ForumRepository/SyncRepository interfaces from @dengarin/persistence
 * (see README Technology Stack — "Database (Sprint 2+)").
 */
export const forumRepository = createInMemoryForumRepository();
export const syncRepository = createInMemorySyncRepository();
