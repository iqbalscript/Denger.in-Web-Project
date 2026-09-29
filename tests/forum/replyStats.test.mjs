import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresForumRepository } from '../../services/persistence/src/adapters/postgresForumRepository.ts';
import { createInMemoryForumRepository } from '../../services/persistence/src/adapters/inMemoryForumRepository.ts';
import { withReplyStats } from '../../apps/web/src/lib/api/forumReplyStats.ts';

const ID_A = '00000000-0000-4000-8000-00000000000a';
const ID_B = '00000000-0000-4000-8000-00000000000b';
const post = (id) => ({ id, authorPseudonym: 'x', domain: 'campus', title: 't', body: 'b', createdAt: '2026-09-29T00:00:00.000Z', moderationStatus: 'approved', supportCount: 0, replyState: 'open', replyCount: 0 });
const row = { id: ID_A, author_pseudonym: 'x', domain: 'campus', title: 't', body: 'b', moderation_status: 'rejected', support_count: 0, created_at: new Date('2026-09-29T00:00:00Z') };

describe('Hitungan balasan feed forum', () => {
  it('menempelkan replyCount dan replyState ke cerita yang punya data', async () => {
    const source = { getReplyStats: async () => ({ [ID_A]: { replyState: 'locked', replyCount: 3 } }) };
    const [a, b] = await withReplyStats([post(ID_A), post(ID_B)], source);
    assert.deepEqual([a.replyCount, a.replyState], [3, 'locked']);
    assert.deepEqual([b.replyCount, b.replyState], [0, 'open']);
  });

  it('feed tetap tampil bila skema balasan belum ada (42P01/42703), tanpa log error', async () => {
    const error = mock.method(console, 'error', () => {});
    for (const code of ['42P01', '42703']) {
      const posts = [post(ID_A)];
      assert.deepEqual(await withReplyStats(posts, { getReplyStats: async () => { throw Object.assign(new Error('x'), { code }); } }), posts);
    }
    assert.equal(error.mock.callCount(), 0);
    error.mock.restore();
  });

  it('feed tetap tampil untuk error lain, tapi errornya dicatat', async () => {
    const error = mock.method(console, 'error', () => {});
    const posts = [post(ID_A)];
    assert.deepEqual(await withReplyStats(posts, { getReplyStats: async () => { throw new Error('koneksi putus'); } }), posts);
    assert.equal(error.mock.callCount(), 1);
    error.mock.restore();
    assert.deepEqual(await withReplyStats([], { getReplyStats: async () => { throw new Error('tidak dipanggil'); } }), []);
  });

  it('PostgreSQL: query hitungan terpisah, hanya UUID valid, hasil dipetakan', async () => {
    const calls = [];
    const pool = { query: async (sql, params) => { calls.push({ sql, params }); return { rows: [{ id: ID_A, reply_state: 'locked', reply_count: '4' }], rowCount: 1 }; } };
    const repo = createPostgresForumRepository(pool);
    assert.deepEqual(await repo.getReplyStats([ID_A, 'bukan-uuid']), { [ID_A]: { replyState: 'locked', replyCount: 4 } });
    assert.deepEqual(calls[0].params, [[ID_A]]);
    assert.match(calls[0].sql, /forum_replies/);
    assert.deepEqual(await repo.getReplyStats(['bukan-uuid']), {});
    assert.equal(calls.length, 1, 'tanpa UUID valid tidak ada query');
  });

  it('PostgreSQL: moderasi tetap jalan tanpa kolom reply_state; error lain tidak ditelan', async () => {
    const queries = [];
    const missing = { query: async (sql) => { queries.push(sql); if (/reply_state/.test(sql)) throw Object.assign(new Error('kolom'), { code: '42703' }); return { rows: [row], rowCount: 1 }; } };
    const moderated = await createPostgresForumRepository(missing).moderate(ID_A, 'rejected');
    assert.equal(moderated.moderationStatus, 'rejected');
    assert.equal(queries.length, 2);
    const broken = { query: async (sql) => { if (/reply_state/.test(sql)) throw Object.assign(new Error('mati'), { code: '57P01' }); return { rows: [row], rowCount: 1 }; } };
    await assert.rejects(createPostgresForumRepository(broken).moderate(ID_A, 'rejected'), /mati/);
    const approvedQueries = [];
    await createPostgresForumRepository({ query: async (sql) => { approvedQueries.push(sql); return { rows: [row], rowCount: 1 }; } }).moderate(ID_A, 'approved');
    assert.equal(approvedQueries.length, 1, 'disetujui: tidak menyentuh reply_state');
  });

  it('in-memory: hitung hanya balasan yang disetujui dan kunci cerita yang tidak disetujui', async () => {
    const repo = createInMemoryForumRepository();
    const story = await repo.create({ authorPseudonym: 'x', domain: 'campus', title: 'Cerita uji', body: 'Isi cerita uji yang cukup panjang.', initialStatus: 'approved' });
    const reply = (body, initialStatus, key) => repo.createReply({ storyId: story.id, participantKeyHash: key, aliasCandidates: [`Sahabat ${key}`], body, initialStatus });
    await reply('balasan disetujui', 'approved', 'k1');
    await reply('balasan menunggu', 'pending_review', 'k2');
    assert.deepEqual((await repo.getReplyStats([story.id]))[story.id], { replyState: 'open', replyCount: 1 });
    await repo.moderate(story.id, 'rejected');
    assert.equal((await repo.getReplyStats([story.id]))[story.id].replyState, 'locked');
    assert.deepEqual(await repo.getReplyStats(['tidak-ada']), {});
  });
});
