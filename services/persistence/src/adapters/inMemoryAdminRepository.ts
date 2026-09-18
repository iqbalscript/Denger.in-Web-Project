import { randomUUID } from 'node:crypto';
import type { AdminRepository, AdminUserRecord, CreateAdminUserInput } from '../types.ts';

/**
 * Process-local, non-persistent implementation of AdminRepository.
 * Suitable for local development only — an admin created here is lost on
 * restart, and no in-memory admin is seeded by default.
 */
export function createInMemoryAdminRepository(): AdminRepository {
  const usersByUsername = new Map<string, AdminUserRecord>();

  return {
    async findByUsername(username: string): Promise<AdminUserRecord | undefined> {
      return usersByUsername.get(username);
    },

    async create(input: CreateAdminUserInput): Promise<AdminUserRecord> {
      if (usersByUsername.has(input.username)) {
        throw new Error(`Admin dengan username "${input.username}" sudah ada`);
      }
      const record: AdminUserRecord = {
        id: randomUUID(),
        username: input.username,
        passwordHash: input.passwordHash,
        createdAt: new Date().toISOString()
      };
      usersByUsername.set(record.username, record);
      return record;
    }
  };
}
