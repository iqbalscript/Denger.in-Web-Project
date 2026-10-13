// M12 + L10: forum-replies migration lives in BOTH migration trees, stays
// idempotent, and the trees only differ by the documented Supabase hardening.
// The real-database section runs only when DATABASE_URL is set explicitly
// (after `npm run db:migrate`), mirroring tests/persistence-pg.
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const pgDir = new URL('services/persistence/migrations/', root);
const sbDir = new URL('supabase/migrations/', root);
const read = (dir, file) => readFile(new URL(file, dir), 'utf8');
const sqlFiles = async (dir) => (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

/** Strip comments and the tree-specific hardening so the shared schema can be compared. */
function schemaCore(sql) {
  return sql
    .replace(/--.*$/gm, '')
    .split(';')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s && !/^(REVOKE|ALTER TABLE \S+ ENABLE ROW LEVEL SECURITY)/i.test(s));
}

const FORUM_TABLES = ['forum_posts', 'forum_replies', 'forum_thread_participants', 'forum_reply_reports'];

describe('migration trees (M12/L10)', () => {
  it('pairs every persistence migration with a Supabase migration, in the same order', async () => {
    const pg = await sqlFiles(pgDir);
    const sb = await sqlFiles(sbDir);
    assert.deepEqual(pg.slice(0, 3), ['001_init.sql', '002_secure_sync.sql', '003_forum_replies.sql']);
    assert.equal(sb.length, pg.length);
    for (let i = 0; i < pg.length; i++) {
      assert.equal(sb[i].replace(/^\d{14}_/, ''), pg[i].replace(/^\d{3}_/, ''), `pair ${i}`);
    }
    for (let i = 0; i < pg.length; i++) {
      assert.deepEqual(schemaCore(await read(sbDir, sb[i])), schemaCore(await read(pgDir, pg[i])), `${pg[i]} vs ${sb[i]}`);
    }
  });

  it('keeps 003 idempotent (migrate.ts re-runs every file on each invocation)', async () => {
    for (const sql of [await read(pgDir, '003_forum_replies.sql'), await read(sbDir, (await sqlFiles(sbDir))[2])]) {
      const statements = schemaCore(sql);
      for (const s of statements) {
        if (/^CREATE TABLE/i.test(s)) assert.match(s, /^CREATE TABLE IF NOT EXISTS/i, s.slice(0, 60));
        if (/^CREATE (UNIQUE )?INDEX/i.test(s)) assert.match(s, /INDEX IF NOT EXISTS/i, s.slice(0, 60));
        if (/^ALTER TABLE .* ADD COLUMN/i.test(s)) assert.match(s, /ADD COLUMN IF NOT EXISTS/i, s.slice(0, 60));
        assert.doesNotMatch(s, /^(DROP|TRUNCATE|DELETE)\b/i);
      }
      for (const t of ['forum_replies', 'forum_thread_participants', 'forum_reply_reports']) {
        assert.ok(statements.some((s) => s.startsWith(`CREATE TABLE IF NOT EXISTS ${t} `)), t);
      }
    }
  });

  it('matches the manual docs/forum-replies-migration.sql schema', async () => {
    const docs = schemaCore(await readFile(new URL('docs/forum-replies-migration.sql', root), 'utf8'))
      .filter((s) => !/^DO \$\$/.test(s) && !/^(BEGIN|IF|END)/.test(s));
    const pg = schemaCore(await read(pgDir, '003_forum_replies.sql'));
    assert.deepEqual(pg, docs);
  });

  it('applies Supabase-only RLS + anon/authenticated REVOKE to every forum table', async () => {
    const sb = await read(sbDir, (await sqlFiles(sbDir))[2]);
    for (const t of FORUM_TABLES) assert.match(sb, new RegExp(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`));
    assert.match(sb, /REVOKE ALL ON forum_posts, forum_replies, forum_thread_participants, forum_reply_reports FROM anon, authenticated;/);
    const pg = await read(pgDir, '003_forum_replies.sql');
    assert.doesNotMatch(pg.replace(/--.*$/gm, ''), /\banon\b|\bauthenticated\b|ROW LEVEL SECURITY/, 'plain-Postgres tree has no Supabase roles');
    assert.match(pg, /REVOKE ALL ON forum_replies, forum_thread_participants, forum_reply_reports FROM PUBLIC;/);
  });

  it('documents the canonical tree in a README next to each tree', async () => {
    const pgReadme = await read(pgDir, 'README.md');
    const sbReadme = await read(sbDir, 'README.md');
    assert.match(pgReadme, /canonical/i);
    assert.match(sbReadme, /canonical/i);
  });
});

if (process.env.DATABASE_URL) {
  const { Pool } = await import('pg');
  const { buildPoolConfig } = await import('../../services/persistence/src/db/pool.ts');
  const { createPostgresForumRepository } = await import('../../services/persistence/src/adapters/postgresForumRepository.ts');
  const pool = new Pool(buildPoolConfig(process.env.DATABASE_URL));
  const created = [];
  after(async () => {
    if (created.length) await pool.query('DELETE FROM forum_posts WHERE id = ANY($1::uuid[])', [created]);
    await pool.end();
  });

  describe('003_forum_replies applied to a real database', () => {
    it('supports reply create/list/report/stats end to end', async () => {
      const repo = createPostgresForumRepository(pool);
      const post = await repo.create({ authorPseudonym: 'Migration Test', domain: 'general', title: 'Uji migrasi', body: 'Isi cerita uji migrasi.', initialStatus: 'approved' });
      created.push(post.id);
      const reply = await repo.createReply({ storyId: post.id, participantKeyHash: `hash-${post.id}`, aliasCandidates: ['Teman Uji #0001'], body: 'Balasan uji yang aman.', initialStatus: 'approved' });
      assert.ok(reply, 'reply inserted');
      assert.equal(reply.authorAlias, 'Teman Uji #0001');
      const page = await repo.listApprovedReplies(post.id, 10);
      assert.equal(page.approvedCount, 1);
      assert.equal(page.replies[0].id, reply.id);
      assert.equal(await repo.createReplyReport({ storyId: post.id, replyId: reply.id, reason: 'other_safety' }), true);
      const stats = await repo.getReplyStats([post.id]);
      assert.deepEqual(stats[post.id], { replyState: 'open', replyCount: 1 });
    });

    it('enforces the reply_state CHECK constraint', async () => {
      await assert.rejects(pool.query("UPDATE forum_posts SET reply_state = 'bogus' WHERE id = $1", [created[0]]), /check constraint/i);
    });
  });
}
