import type { SyncedSessionRecord, SyncRepository } from '../types.ts';

/**
 * Process-local, non-persistent implementation of SyncRepository.
 * Suitable for local development and the competition demo only.
 */
export function createInMemorySyncRepository(): SyncRepository {
  const store = new Map<string, SyncedSessionRecord>();

  return {
    async get(mnemonicHash: string): Promise<SyncedSessionRecord | undefined> {
      return store.get(mnemonicHash);
    },

    async upsert(record: SyncedSessionRecord): Promise<SyncedSessionRecord> {
      store.set(record.mnemonicHash, record);
      return record;
    }
  };
}
