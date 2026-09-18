import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Integration tests against a REAL PostgreSQL instance (services/persistence
 * adapters). Requires DATABASE_URL to point at a database that already has
 * services/persistence/migrations/001_init.sql applied (`npm run db:migrate`).
 *
 * Skipped entirely (0 tests registered, exits 0) when DATABASE_URL is unset
 * so `npm test` stays green in any environment without a database attached
 * — see services/persistence/src/factory.ts for the same fallback logic
 * used at runtime by the API routes.
 */

if (!process.env.DATABASE_URL) {
  console.log(
    'tests/persistence-pg: DATABASE_URL tidak diset — melewati pengujian integrasi PostgreSQL.'
  );
} else {
  const { Pool } = await import('pg');
  const { createPostgresForumRepository } = await import(
    '../../services/persistence/src/adapters/postgresForumRepository.ts'
  );
  const { createPostgresSyncRepository } = await import(
    '../../services/persistence/src/adapters/postgresSyncRepository.ts'
  );
  const { createPostgresAdminRepository } = await import(
    '../../services/persistence/src/adapters/postgresAdminRepository.ts'
  );
  const { hashPassword } = await import('../../services/auth/src/password.ts');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  describe('PostgreSQL Forum Repository (real database)', () => {
    it('creates a post as pending_review, then approves it into the public listing', async () => {
      const repo = createPostgresForumRepository(pool);
      const post = await repo.create({
        authorPseudonym: 'Integration Test',
        domain: 'general',
        title: `pg-test-${Date.now()}`,
        body: 'Isi cerita uji integrasi PostgreSQL.'
      });

      try {
        assert.equal(post.moderationStatus, 'pending_review');
        assert.ok(post.id.length > 0);

        const pendingBefore = await repo.listPendingReview();
        assert.ok(pendingBefore.some((p) => p.id === post.id));

        const approved = await repo.moderate(post.id, 'approved');
        assert.equal(approved.moderationStatus, 'approved');

        const approvedList = await repo.listApproved();
        assert.ok(approvedList.some((p) => p.id === post.id));
      } finally {
        await pool.query('DELETE FROM forum_posts WHERE id = $1', [post.id]);
      }
    });

    it('returns undefined when moderating a non-existent post id', async () => {
      const repo = createPostgresForumRepository(pool);
      const result = await repo.moderate('00000000-0000-0000-0000-000000000000', 'approved');
      assert.equal(result, undefined);
    });

    it('returns undefined (not a thrown error) for a malformed post id', async () => {
      const repo = createPostgresForumRepository(pool);
      const result = await repo.moderate('not-a-uuid', 'approved');
      assert.equal(result, undefined);
    });
  });

  describe('PostgreSQL Sync Repository (real database)', () => {
    it('stores and retrieves an encrypted blob, then overwrites it on upsert', async () => {
      const repo = createPostgresSyncRepository(pool);
      const mnemonicHash = `pg-test-hash-${Date.now()}`;

      try {
        assert.equal(await repo.get(mnemonicHash), undefined);

        await repo.upsert({ mnemonicHash, encryptedBlob: 'v1', updatedAt: new Date().toISOString() });
        assert.equal((await repo.get(mnemonicHash)).encryptedBlob, 'v1');

        await repo.upsert({ mnemonicHash, encryptedBlob: 'v2', updatedAt: new Date().toISOString() });
        assert.equal((await repo.get(mnemonicHash)).encryptedBlob, 'v2');
      } finally {
        await pool.query('DELETE FROM synced_sessions WHERE mnemonic_hash = $1', [mnemonicHash]);
      }
    });
  });

  describe('PostgreSQL Admin Repository (real database)', () => {
    it('creates an admin and finds it back by username with a verifiable password hash', async () => {
      const repo = createPostgresAdminRepository(pool);
      const username = `pg-test-admin-${Date.now()}`;
      const passwordHash = await hashPassword('super-secret-password-123');

      try {
        const created = await repo.create({ username, passwordHash });
        assert.equal(created.username, username);

        const found = await repo.findByUsername(username);
        assert.ok(found);
        assert.equal(found.id, created.id);
        assert.equal(found.passwordHash, passwordHash);
      } finally {
        await pool.query('DELETE FROM admin_users WHERE username = $1', [username]);
      }
    });

    it('returns undefined for a username that does not exist', async () => {
      const repo = createPostgresAdminRepository(pool);
      const found = await repo.findByUsername('does-not-exist-at-all');
      assert.equal(found, undefined);
    });
  });

  after(async () => {
    await pool.end();
  });
}
