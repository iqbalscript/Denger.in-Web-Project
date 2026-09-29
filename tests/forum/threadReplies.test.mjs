import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInMemoryForumRepository } from '../../services/persistence/src/adapters/inMemoryForumRepository.ts';
import { moderateForumReply } from '../../services/validator/src/contentModerator.ts';

const clean = 'Aku pernah merasakan hal serupa. Pelan-pelan dan cari dukungan yang aman ya.';
async function approvedStory(repo, title = 'Cerita yang aman untuk dibalas') {
  return repo.create({ authorPseudonym: 'Legacy Alias', domain: 'general', title, body: 'Cerita ini cukup panjang dan aman untuk menjadi konteks sebuah balasan.', initialStatus: 'approved' });
}
const input = (storyId, overrides = {}) => ({ storyId, participantKeyHash: 'hash-' + Math.random(), aliasCandidates: ['Sahabat Awan Teduh Pagi', 'Sahabat Senja Hangat Sore', 'Sahabat Hujan Lembut Malam', 'Sahabat Embun Damai Pagi'], body: clean, initialStatus: 'approved', ...overrides });

describe('Forum thread replies', () => {
  it('keeps a participant alias stable within one story and never returns its hash', async () => {
    const repo = createInMemoryForumRepository(); const story = await approvedStory(repo);
    const first = await repo.createReply(input(story.id, { participantKeyHash: 'same-capability' }));
    const second = await repo.createReply(input(story.id, { participantKeyHash: 'same-capability' }));
    assert.equal(first.authorAlias, second.authorAlias); assert.equal('participantKeyHash' in first, false);
  });
  it('rejects a forged cross-story parent', async () => {
    const repo = createInMemoryForumRepository(); const firstStory = await approvedStory(repo); const secondStory = await approvedStory(repo, 'Cerita lain yang aman untuk dibalas');
    const parent = await repo.createReply(input(firstStory.id));
    assert.equal(await repo.createReply(input(secondStory.id, { parentReplyId: parent.id })), undefined);
  });
  it('hides rejected replies while retaining neutral context for an approved child', async () => {
    const repo = createInMemoryForumRepository(); const story = await approvedStory(repo);
    const parent = await repo.createReply(input(story.id)); const child = await repo.createReply(input(story.id, { parentReplyId: parent.id }));
    await repo.moderateReply(parent.id, 'rejected'); const page = await repo.listApprovedReplies(story.id, 20);
    assert.equal(page.replies.length, 1); assert.equal(page.replies[0].id, child.id); assert.equal(page.replies[0].parentContextUnavailable, true); assert.equal(page.replies[0].replyingToAlias, null);
  });
  it('uses bounded chronological pages and exact approved counts', async () => {
    const repo = createInMemoryForumRepository(); const story = await approvedStory(repo);
    for (let index = 0; index < 3; index++) await repo.createReply(input(story.id));
    const page = await repo.listApprovedReplies(story.id, 2); assert.equal(page.replies.length, 2); assert.equal(page.approvedCount, 3); assert.ok(page.nextCursor);
    const next = await repo.listApprovedReplies(story.id, 2, page.nextCursor); assert.equal(next.replies.length, 1);
  });
  it('strictly moderates targeted abuse, contacts, markup and medication instructions', () => {
    for (const body of ['dasar kamu goblok', 'hubungi aku di telegram', '<img src=x onerror=alert(1)>', 'berhenti minum obat sekarang', 'bunuh diri aja']) assert.equal(moderateForumReply({ body }).status, 'rejected', body);
    assert.equal(moderateForumReply({ body: clean }).status, 'approved');
    assert.equal(moderateForumReply({ body: 'Aku juga pernah mengalami trauma dan KDRT di rumah.' }).status, 'pending_review');
  });
});
