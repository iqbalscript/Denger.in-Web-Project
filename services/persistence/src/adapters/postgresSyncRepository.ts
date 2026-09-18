import type { Pool } from 'pg';
import type { SyncedSessionRecord, SyncRepository } from '../types.ts';
import { getPool } from '../db/pool.ts';

interface SyncedSessionRow {
  mnemonic_hash: string;
  encrypted_blob: string;
  updated_at: Date;
}

function rowToRecord(row: SyncedSessionRow): SyncedSessionRecord {
  return {
    mnemonicHash: row.mnemonic_hash,
    encryptedBlob: row.encrypted_blob,
    updatedAt: row.updated_at.toISOString()
  };
}

/**
 * PostgreSQL-backed SyncRepository (services/persistence/migrations/001_init.sql).
 * Pass an explicit Pool in tests; defaults to the shared singleton from
 * src/db/pool.ts (DATABASE_URL) otherwise.
 */
export function createPostgresSyncRepository(pool: Pool = getPool()): SyncRepository {
  return {
    async get(mnemonicHash: string): Promise<SyncedSessionRecord | undefined> {
      const result = await pool.query<SyncedSessionRow>(
        'SELECT mnemonic_hash, encrypted_blob, updated_at FROM synced_sessions WHERE mnemonic_hash = $1',
        [mnemonicHash]
      );
      return result.rows[0] ? rowToRecord(result.rows[0]) : undefined;
    },

    async upsert(record: SyncedSessionRecord): Promise<SyncedSessionRecord> {
      const result = await pool.query<SyncedSessionRow>(
        `INSERT INTO synced_sessions (mnemonic_hash, encrypted_blob, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (mnemonic_hash)
         DO UPDATE SET encrypted_blob = EXCLUDED.encrypted_blob, updated_at = now()
         RETURNING mnemonic_hash, encrypted_blob, updated_at`,
        [record.mnemonicHash, record.encryptedBlob]
      );
      return rowToRecord(result.rows[0]);
    }
  };
}
