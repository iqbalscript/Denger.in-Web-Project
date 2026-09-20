import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateRecoveryMnemonic } from '../../apps/web/src/lib/storage.ts';
import { deriveSyncCredentials, encryptSessionData, decryptSessionData, hashMnemonic,
  isModernRecoveryPhrase, signBackupUpdate } from '../../apps/web/src/lib/crypto/e2ee.ts';
import { createInMemorySyncRepository } from '../../services/persistence/src/adapters/inMemorySyncRepository.ts';
import { validBackupProof } from '../../apps/web/src/lib/api/syncAuth.ts';

describe('recovery and sync v2 security', () => {
  it('uses Web Crypto randomness and creates 288-bit recovery material', () => {
    const source = readFileSync(new URL('../../apps/web/src/lib/storage.ts', import.meta.url), 'utf8');
    const body = source.match(/export function generateRecoveryMnemonic\(\): string \{([\s\S]*?)\n\}/)?.[1];
    assert.match(body, /crypto\.getRandomValues/);
    assert.doesNotMatch(body, /Math\.random/);
    const phrase = generateRecoveryMnemonic();
    assert.match(phrase, /^(?:[0-9a-f]{6} ){11}[0-9a-f]{6}$/);
    assert.equal(phrase.replaceAll(' ', '').length * 4, 288);
    assert.notEqual(generateRecoveryMnemonic(), phrase);
  });

  it('separates deterministic lookup and write secrets from the encryption key', async () => {
    const phrase = generateRecoveryMnemonic();
    const a = await deriveSyncCredentials(phrase);
    const b = await deriveSyncCredentials(phrase.toUpperCase());
    assert.deepEqual(a, b);
    assert.notEqual(a.backupId, a.writeKey);
    const blob = await encryptSessionData({ journal: 'private' }, phrase);
    assert.deepEqual(await decryptSessionData(blob, phrase), { journal: 'private' });
    await assert.rejects(decryptSessionData(blob, generateRecoveryMnemonic()));
    assert.equal((await signBackupUpdate(a.writeKey, a.backupId, 0, blob)).length, 64);
  });

  it('continues to read legacy encrypted backups without granting legacy overwrite', async () => {
    const legacy = 'samudra lentera harmoni fajar damai teduh kelana mentari rimba saujana hening aksara';
    assert.equal(isModernRecoveryPhrase(legacy), false);
    const repo = createInMemorySyncRepository();
    const mnemonicHash = await hashMnemonic(legacy);
    const encryptedBlob = await encryptSessionData({ journal: 'legacy' }, legacy);
    await repo.upsert({ mnemonicHash, encryptedBlob, updatedAt: new Date().toISOString() });
    assert.deepEqual(await decryptSessionData((await repo.get(mnemonicHash)).encryptedBlob, legacy),
      { journal: 'legacy' });
  });

  it('uses conditional versions so stale writes cannot replace a newer backup', async () => {
    const repo = createInMemorySyncRepository();
    const record = { backupId: 'id', writeKey: 'secret', encryptedBlob: 'v1', version: 1,
      updatedAt: new Date().toISOString() };
    assert.equal(await repo.createSecure(record), true);
    assert.equal(await repo.createSecure(record), false);
    assert.equal(await repo.updateSecure({ ...record, encryptedBlob: 'v2', version: 2 }, 1), true);
    assert.equal(await repo.updateSecure({ ...record, encryptedBlob: 'stale', version: 2 }, 1), false);
    assert.equal((await repo.getSecure('id')).encryptedBlob, 'v2');
  });
  it('does not accept a read identifier as write authority', async () => {
    const { backupId, writeKey } = await deriveSyncCredentials(generateRecoveryMnemonic());
    const blob = 'opaque-ciphertext';
    const proof = await signBackupUpdate(writeKey, backupId, 1, blob);
    assert.equal(validBackupProof(writeKey, backupId, 1, blob, proof), true);
    assert.equal(validBackupProof(backupId, backupId, 1, blob, proof), false);
    assert.equal(validBackupProof(writeKey, backupId, 2, blob, proof), false);
    assert.equal(validBackupProof(writeKey, backupId, 1, 'changed', proof), false);
  });
});
