import type { Pool } from 'pg';
import type { AdminRepository, AdminUserRecord, CreateAdminUserInput } from '../types.ts';
import { getPool } from '../db/pool.ts';

interface AdminUserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
}

function rowToRecord(row: AdminUserRow): AdminUserRecord {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString()
  };
}

/**
 * PostgreSQL-backed AdminRepository (services/persistence/migrations/001_init.sql).
 * Pass an explicit Pool in tests; defaults to the shared singleton from
 * src/db/pool.ts (DATABASE_URL) otherwise.
 */
export function createPostgresAdminRepository(pool: Pool = getPool()): AdminRepository {
  return {
    async findByUsername(username: string): Promise<AdminUserRecord | undefined> {
      const result = await pool.query<AdminUserRow>(
        'SELECT id, username, password_hash, created_at FROM admin_users WHERE username = $1',
        [username]
      );
      return result.rows[0] ? rowToRecord(result.rows[0]) : undefined;
    },

    async create(input: CreateAdminUserInput): Promise<AdminUserRecord> {
      const result = await pool.query<AdminUserRow>(
        `INSERT INTO admin_users (username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, password_hash, created_at`,
        [input.username, input.passwordHash]
      );
      return rowToRecord(result.rows[0]);
    }
  };
}
