import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInMemoryForumRepository } from '../../services/persistence/src/adapters/inMemoryForumRepository.ts';
import { createInMemorySyncRepository } from '../../services/persistence/src/adapters/inMemorySyncRepository.ts';

describe('In-Memory Forum Repository', () => {
  it('creates posts as pending_review by default (no auto-moderation)', async () => {
    const repo = createInMemoryForumRepository();
    const post = await repo.create({
      authorPseudonym: 'Bunga Tenang #1234',
      domain: 'campus',
      title: 'Skripsi terasa berat',
      body: 'Aku butuh cerita ke seseorang.'
    });

    assert.equal(post.moderationStatus, 'pending_review');
    assert.equal(post.supportCount, 0);
    assert.ok(post.id.length > 0);
  });

  it('excludes pending/rejected posts from the public approved listing', async () => {
    const repo = createInMemoryForumRepository();
    const post = await repo.create({
      authorPseudonym: 'Anonim',
      domain: 'finance',
      title: 'Tekanan pinjol',
      body: 'Teror penagihan bikin cemas.'
    });

    assert.deepEqual(await repo.listApproved(), []);

    await repo.moderate(post.id, 'approved');
    const approved = await repo.listApproved();
    assert.equal(approved.length, 1);
    assert.equal(approved[0].id, post.id);

    await repo.moderate(post.id, 'rejected');
    assert.deepEqual(await repo.listApproved(), []);
  });

  it('lists only posts awaiting moderation in listPendingReview', async () => {
    const repo = createInMemoryForumRepository();
    const first = await repo.create({
      authorPseudonym: 'A',
      domain: 'general',
      title: 'Judul 1',
      body: 'Isi 1'
    });
    const second = await repo.create({
      authorPseudonym: 'B',
      domain: 'general',
      title: 'Judul 2',
      body: 'Isi 2'
    });
    await repo.moderate(first.id, 'approved');

    const pending = await repo.listPendingReview();
    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, second.id);
  });

  it('returns undefined when moderating a non-existent post', async () => {
    const repo = createInMemoryForumRepository();
    const result = await repo.moderate('does-not-exist', 'approved');
    assert.equal(result, undefined);
  });
});

describe('In-Memory Sync Repository', () => {
  it('stores and retrieves an encrypted blob by mnemonic hash', async () => {
    const repo = createInMemorySyncRepository();
    assert.equal(await repo.get('hash-abc'), undefined);

    await repo.upsert({
      mnemonicHash: 'hash-abc',
      encryptedBlob: 'opaque-ciphertext',
      updatedAt: new Date().toISOString()
    });

    const record = await repo.get('hash-abc');
    assert.equal(record.encryptedBlob, 'opaque-ciphertext');
  });

  it('overwrites the previous blob on repeated upsert for the same hash', async () => {
    const repo = createInMemorySyncRepository();
    await repo.upsert({ mnemonicHash: 'hash-xyz', encryptedBlob: 'v1', updatedAt: new Date().toISOString() });
    await repo.upsert({ mnemonicHash: 'hash-xyz', encryptedBlob: 'v2', updatedAt: new Date().toISOString() });

    const record = await repo.get('hash-xyz');
    assert.equal(record.encryptedBlob, 'v2');
  });
});
