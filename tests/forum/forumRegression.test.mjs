import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPostgresForumRepository } from '../../services/persistence/src/adapters/postgresForumRepository.ts';
import { isReplySchemaUnavailable } from '../../apps/web/src/lib/api/replySchema.ts';

const legacyRow = {
  id: '00000000-0000-0000-0000-000000000001',
  author_pseudonym: 'Sahabat Anonim',
  domain: 'campus',
  title: 'Cerita aman',
  body: 'Isi cerita yang aman.',
  moderation_status: 'approved',
  support_count: 0,
  created_at: new Date('2026-09-29T00:00:00.000Z'),
};

class LegacyForumPool {
  queries = [];

  async query(sql) {
    this.queries.push(sql);
    return { rows: [legacyRow], rowCount: 1 };
  }
}

describe('Forum regression boundaries', () => {
  it('keeps legacy story list and create queries independent of reply schema', async () => {
    const pool = new LegacyForumPool();
    const repo = createPostgresForumRepository(pool);

    const listed = await repo.listApproved(20, 'campus');
    const created = await repo.create({
      authorPseudonym: 'Sahabat Anonim',
      domain: 'campus',
      title: 'Cerita aman',
      body: 'Isi cerita yang aman.',
      initialStatus: 'approved',
    });

    assert.equal(listed[0].replyCount, 0);
    assert.equal(created.replyState, 'open');
    for (const sql of pool.queries) {
      assert.doesNotMatch(sql, /forum_replies|reply_state/i);
    }
  });

  it('has no runtime Google Fonts stylesheet or nondeterministic forum fallback dates', async () => {
    const [layout, css, forumPage] = await Promise.all([
      readFile('apps/web/src/app/layout.tsx', 'utf8'),
      readFile('apps/web/src/app/globals.css', 'utf8'),
      readFile('apps/web/src/app/forum/page.tsx', 'utf8'),
    ]);

    assert.doesNotMatch(`${layout}\n${css}`, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
    assert.doesNotMatch(forumPage, /Date\.now\(\)/);
    assert.match(forumPage, /createdAt: '2026-/);
  });

  it('recognizes only PostgreSQL reply-schema absence for the safe unavailable response', () => {
    assert.equal(isReplySchemaUnavailable({ code: '42P01' }), true);
    assert.equal(isReplySchemaUnavailable({ code: '42703' }), true);
    assert.equal(isReplySchemaUnavailable({ code: 'ENOTFOUND' }), false);
  });
});
