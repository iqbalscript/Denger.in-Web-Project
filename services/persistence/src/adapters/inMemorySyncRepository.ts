import type { SecureBackupRecord, SyncedSessionRecord, SyncRepository } from '../types.ts';

/**
 * Process-local, non-persistent implementation of SyncRepository.
 * Suitable for local development and the competition demo only.
 */
export function createInMemorySyncRepository(): SyncRepository {
  const store = new Map<string, SyncedSessionRecord>();
  const secureStore = new Map<string, SecureBackupRecord>();

  return {
    async get(mnemonicHash: string): Promise<SyncedSessionRecord | undefined> {
      return store.get(mnemonicHash);
    },

    async upsert(record: SyncedSessionRecord): Promise<SyncedSessionRecord> {
      store.set(record.mnemonicHash, record);
      return record;
    },
    async getSecure(backupId: string) { return secureStore.get(backupId); },
    async createSecure(record: SecureBackupRecord) {
      if (secureStore.has(record.backupId)) return false;
      secureStore.set(record.backupId, record);
      return true;
    },
    async updateSecure(record: SecureBackupRecord, expectedVersion: number) {
      const current = secureStore.get(record.backupId);
      if (!current || current.version !== expectedVersion) return false;
      secureStore.set(record.backupId, record);
      return true;
    }
  };
}
