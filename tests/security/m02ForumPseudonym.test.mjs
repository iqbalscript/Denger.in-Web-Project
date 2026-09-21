import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { evaluateCrisisInput } from '../../services/crisis-engine/src/crisisDetector.ts';
import { moderateForumPost, MAX_FORUM_PSEUDONYM_LENGTH } from '../../services/validator/src/contentModerator.ts';
import { createInMemoryForumRepository } from '../../services/persistence/src/adapters/inMemoryForumRepository.ts';

const clean = {
  title: 'Hari ini aku mulai pulih',
  body: 'Aku mengambil langkah kecil untuk beristirahat dan meminta dukungan dari teman.',
  domain: 'general'
};
const moderate = (authorPseudonym) => moderateForumPost({ ...clean, authorPseudonym });

describe('M-02 forum pseudonym boundary', () => {
  it('keeps benign aliases and omitted aliases on the existing approved path', () => {
    assert.equal(moderate('Langkah Tenang #4829').status, 'approved');
    assert.equal(moderateForumPost(clean).status, 'approved');
  });

  it('does not auto-approve scam, abusive, or solicitation aliases', () => {
    for (const alias of ['slot gacor maxwin', 'pinjol langsung cair', 'anjing lu', 'hubungi aku sekarang']) {
      assert.notEqual(moderate(alias).status, 'approved', alias);
    }
    assert.equal(moderate('slot-gacor maxwin').status, 'rejected');
    assert.equal(moderate('slot\u200Bgacor maxwin').status, 'rejected');
  });

  it('rejects direct contact, URLs, bare domains, and Unicode variants', () => {
    for (const alias of [
      'anon@example.com', 'wa 0812-3456-7890', '+62 812 3456 7890',
      'https://t.me/anon', 'www.example.org', 'example.com',
      '＠kontak', 'ｈｔｔｐｓ：／／example.com', 'telegram teman',
      'example dot com', 'IG teman123', 'kontak 021 78945678'
    ]) {
      assert.equal(moderate(alias).status, 'rejected', alias);
    }
  });

  it('routes a crisis alias through the deterministic crisis engine', () => {
    assert.equal(evaluateCrisisInput('Aku mau bunuh diri malam ini').isCrisis, true);
    assert.equal(evaluateCrisisInput('Aku ingin mengakhiri hidupku malam ini').isCrisis, true);
  });

  it('rejects oversized aliases without truncating them', () => {
    assert.equal(moderate('a'.repeat(MAX_FORUM_PSEUDONYM_LENGTH)).status, 'approved');
    assert.equal(moderate('a'.repeat(MAX_FORUM_PSEUDONYM_LENGTH + 1)).status, 'rejected');
  });

  it('keeps markup inert in React rendering and rejects it at intake', () => {
    const payload = '<img src=x onerror=alert(1)>';
    assert.equal(moderate(payload).status, 'rejected');
    const markup = renderToStaticMarkup(React.createElement('span', null, payload));
    assert.ok(markup.includes('&lt;img'));
    assert.ok(!markup.includes('<img'));
    const page = readFileSync(new URL('../../apps/web/src/app/forum/page.tsx', import.meta.url), 'utf8');
    assert.match(page, /\{post\.authorPseudonym\}/);
    assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  });

  it('continues to list existing approved records with their pseudonyms', async () => {
    const repository = createInMemoryForumRepository();
    const oldPost = await repository.create({ ...clean, authorPseudonym: 'Sahabat Anonim #3912', initialStatus: 'approved' });
    assert.equal((await repository.listApproved())[0].authorPseudonym, oldPost.authorPseudonym);
  });
});
