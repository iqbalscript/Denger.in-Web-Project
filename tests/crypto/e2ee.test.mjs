import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashMnemonic,
  encryptSessionData,
  decryptSessionData,
  normalizeMnemonic
} from '../../apps/web/src/lib/crypto/e2ee.ts';

describe('Client-Side End-to-End Encryption (E2EE)', () => {
  const sampleMnemonic = 'samudra lentera harmoni fajar damai teduh kelana mentari rimba saujana hening aksara';

  it('normalizes mnemonics with irregular whitespaces and casings', () => {
    const raw = '  SAMUDRA   lentera   Harmoni   fajar damai teduh kelana mentari rimba saujana hening aksara  ';
    assert.equal(normalizeMnemonic(raw), sampleMnemonic);
  });

  it('generates consistent SHA-256 hash for identical normalized mnemonics', async () => {
    const hash1 = await hashMnemonic(sampleMnemonic);
    const hash2 = await hashMnemonic('  ' + sampleMnemonic.toUpperCase() + '  ');
    assert.equal(hash1, hash2);
    assert.equal(typeof hash1, 'string');
    assert.equal(hash1.length, 64); // 32 bytes hex
  });

  it('encrypts and successfully decrypts complex session payload', async () => {
    const payload = {
      userId: 'anon-test-123',
      alias: 'Samudra Damai #4012',
      checkins: [
        { mood: 'baik', energyLevel: 8, stressors: ['kampus'], timestamp: '2026-09-19T00:00:00.000Z' }
      ],
      journals: [
        { id: 'j-1', title: 'Refleksi Pagi', content: 'Hari ini merasa lebih tenang setelah beristirahat.' }
      ]
    };

    const encryptedBlob = await encryptSessionData(payload, sampleMnemonic);
    assert.ok(typeof encryptedBlob === 'string');
    assert.ok(!encryptedBlob.includes('Samudra Damai')); // Ciphertext doesn't leak plaintext
    assert.ok(!encryptedBlob.includes('Refleksi Pagi'));

    const decrypted = await decryptSessionData(encryptedBlob, sampleMnemonic);
    assert.deepEqual(decrypted, payload);
  });

  it('fails to decrypt when using a different or wrong recovery mnemonic', async () => {
    const payload = { secret: 'rahasia' };
    const encryptedBlob = await encryptSessionData(payload, sampleMnemonic);

    const wrongMnemonic = 'fajar mentari rimba saujana hening aksara samudra lentera harmoni damai teduh kelana';
    await assert.rejects(
      async () => {
        await decryptSessionData(encryptedBlob, wrongMnemonic);
      },
      /Gagal mendekripsi data|salah/i
    );
  });
});
