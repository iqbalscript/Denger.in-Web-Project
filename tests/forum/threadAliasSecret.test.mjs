import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { deriveThreadParticipantHash } from '../../apps/web/src/lib/api/threadAlias.ts';

const KEY = 'a'.repeat(43);
const ORIGINAL = { alias: process.env.FORUM_THREAD_ALIAS_SECRET, admin: process.env.ADMIN_SESSION_SECRET };
const setEnv = (alias, admin) => {
  for (const [name, value] of [['FORUM_THREAD_ALIAS_SECRET', alias], ['ADMIN_SESSION_SECRET', admin]]) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
};

describe('Secret identitas anonim forum', () => {
  afterEach(() => { setEnv(ORIGINAL.alias, ORIGINAL.admin); mock.restoreAll(); });

  it('memakai FORUM_THREAD_ALIAS_SECRET bila ada', () => {
    setEnv('secret-alias-yang-panjang-sekali-0123456789', 'admin-secret-yang-panjang-0123456789');
    const withAlias = deriveThreadParticipantHash('story-1', KEY);
    setEnv('secret-alias-yang-panjang-sekali-0123456789', undefined);
    assert.equal(deriveThreadParticipantHash('story-1', KEY), withAlias, 'admin secret tidak memengaruhi bila alias secret ada');
  });

  it('tanpa alias secret, diturunkan dari ADMIN_SESSION_SECRET: stabil, berbeda per cerita, dan bukan secret admin', () => {
    mock.method(console, 'warn', () => {});
    setEnv(undefined, 'admin-secret-yang-panjang-0123456789');
    const first = deriveThreadParticipantHash('story-1', KEY);
    assert.ok(first);
    assert.equal(deriveThreadParticipantHash('story-1', KEY), first);
    assert.notEqual(deriveThreadParticipantHash('story-2', KEY), first);
    setEnv('admin-secret-yang-panjang-0123456789', 'admin-secret-yang-panjang-0123456789');
    assert.notEqual(deriveThreadParticipantHash('story-1', KEY), first, 'turunan tidak sama dengan memakai admin secret langsung');
    setEnv(undefined, 'admin-secret-lain-yang-panjang-9876543210');
    assert.notEqual(deriveThreadParticipantHash('story-1', KEY), first, 'ganti admin secret = hash berbeda');
  });

  it('tanpa keduanya atau dengan kunci thread tidak valid: undefined', () => {
    setEnv(undefined, undefined);
    assert.equal(deriveThreadParticipantHash('story-1', KEY), undefined);
    setEnv('secret-alias-yang-panjang-sekali-0123456789', undefined);
    assert.equal(deriveThreadParticipantHash('story-1', 'pendek'), undefined);
  });
});
