// L8: POST /api/forum and GET /api/forum?domain= must only accept InterventionDomain values.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DOMAIN_CONFIGS } from '../../packages/config/src/index.ts';
import {
  FORUM_DOMAINS, isInterventionDomain, parseForumDomainFilter,
} from '../../apps/web/src/lib/api/forumDomain.ts';

const EXPECTED = ['school', 'campus', 'work', 'finance', 'relationship', 'family', 'loneliness', 'general'];

describe('forum domain validation (L8)', () => {
  it('derives the allowlist from DOMAIN_CONFIGS (InterventionDomain)', () => {
    assert.deepEqual([...FORUM_DOMAINS].sort(), Object.keys(DOMAIN_CONFIGS).sort());
    assert.deepEqual([...FORUM_DOMAINS].sort(), [...EXPECTED].sort());
  });

  it('accepts every InterventionDomain', () => {
    for (const domain of EXPECTED) assert.equal(isInterventionDomain(domain), true, domain);
  });

  it('rejects unknown strings, prototype keys, case variants and non-strings', () => {
    for (const bad of ['', 'Campus', 'campus ', 'politics', '__proto__', 'constructor', 'toString',
      'hasOwnProperty', "campus' OR 1=1--", 'x'.repeat(5000), null, undefined, 1, {}, ['campus']]) {
      assert.equal(isInterventionDomain(bad), false, String(bad).slice(0, 30));
    }
  });

  it('treats an absent or empty ?domain= as "all" and rejects unknown filters', () => {
    assert.deepEqual(parseForumDomainFilter(null), { ok: true, domain: undefined });
    assert.deepEqual(parseForumDomainFilter(''), { ok: true, domain: undefined });
    assert.deepEqual(parseForumDomainFilter('family'), { ok: true, domain: 'family' });
    assert.deepEqual(parseForumDomainFilter('random'), { ok: false });
    assert.deepEqual(parseForumDomainFilter('__proto__'), { ok: false });
  });

  it('wires the validators into both forum route handlers', async () => {
    const source = await readFile(new URL('../../apps/web/src/app/api/forum/route.ts', import.meta.url), 'utf8');
    const getHandler = source.slice(source.indexOf('export async function GET'), source.indexOf('export async function POST'));
    const postHandler = source.slice(source.indexOf('export async function POST'));
    assert.match(getHandler, /parseForumDomainFilter\(/);
    assert.match(getHandler, /if \(!filter\.ok\) return jsonError\([^)]*400\)/);
    assert.doesNotMatch(getHandler, /as InterventionDomain/);
    assert.match(postHandler, /if \(!isInterventionDomain\(body\.domain\)\)/);
    // The validation must precede persistence.
    assert.ok(postHandler.indexOf('isInterventionDomain(') < postHandler.indexOf('forumRepository.create('));
  });
});
