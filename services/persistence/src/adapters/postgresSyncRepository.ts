import type { Pool } from 'pg';
import type { SecureBackupRecord, SyncedSessionRecord, SyncRepository } from '../types.ts';
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
    },

    async getSecure(backupId: string): Promise<SecureBackupRecord | undefined> {
      const result = await pool.query<{
        backup_id: string; encrypted_blob: string; write_key: string; version: number; updated_at: Date
      }>('SELECT backup_id, encrypted_blob, write_key, version, updated_at FROM synced_sessions_v2 WHERE backup_id = $1', [backupId]);
      const row = result.rows[0];
      return row ? { backupId: row.backup_id, encryptedBlob: row.encrypted_blob,
        writeKey: row.write_key, version: row.version, updatedAt: row.updated_at.toISOString() } : undefined;
    },

    async createSecure(record: SecureBackupRecord): Promise<boolean> {
      const result = await pool.query(
        `INSERT INTO synced_sessions_v2 (backup_id, encrypted_blob, write_key, version)
         VALUES ($1, $2, $3, 1) ON CONFLICT (backup_id) DO NOTHING`,
        [record.backupId, record.encryptedBlob, record.writeKey]
      );
      return result.rowCount === 1;
    },

    async updateSecure(record: SecureBackupRecord, expectedVersion: number): Promise<boolean> {
      const result = await pool.query(
        `UPDATE synced_sessions_v2 SET encrypted_blob = $2, version = version + 1, updated_at = now()
         WHERE backup_id = $1 AND version = $3`,
        [record.backupId, record.encryptedBlob, expectedVersion]
      );
      return result.rowCount === 1;
    }
  };
}
