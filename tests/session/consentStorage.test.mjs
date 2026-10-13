import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAnonymousSession,
  initAnonymousSession,
  grantConsent,
  updateUserContext,
  saveAssessmentResult,
} from '../../apps/web/src/lib/storage.ts';
import { hasConsent, sanitizeNextPath, buildConsentRedirect } from '../../apps/web/src/lib/consent.ts';

class MemoryStorage {
  values = new Map();
  writes = 0;
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) { this.writes += 1; this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); this.writes = 0; }
}

const storage = new MemoryStorage();
globalThis.window = globalThis;
globalThis.localStorage = storage;
afterEach(() => storage.clear());

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_KEY = 'dengarin_anonymous_session';

describe('H5: storage helpers never grant consent silently', () => {
  it('initAnonymousSession creates a session without consent', () => {
    const session = initAnonymousSession();
    assert.equal(session.consentGiven, false);
    assert.equal(session.consentTimestamp, undefined);
    assert.match(session.userId, UUID_V4);
    assert.equal(hasConsent(getAnonymousSession()), false);
  });

  it('updateUserContext without a session does not record consent', () => {
    const session = updateUserContext('18-24', undefined, 'general', undefined);
    assert.equal(session?.consentGiven, false);
    assert.equal(hasConsent(getAnonymousSession()), false);
  });

  it('saveAssessmentResult without a session does not record consent', () => {
    saveAssessmentResult({
      distressScore: 3, severityLevel: 'MILD', normalizedLevel: 'mild',
      recommendedPathId: 'path-general-14d', summaryFeedback: 'x', recommendedSupportSpaces: [],
    });
    const stored = getAnonymousSession();
    assert.ok(stored?.assessmentResult);
    assert.equal(stored?.consentGiven, false);
  });

  it('initAnonymousSession keeps an existing consent record untouched', () => {
    grantConsent();
    const before = getAnonymousSession();
    const again = initAnonymousSession();
    assert.equal(again.consentGiven, true);
    assert.equal(again.consentTimestamp, before?.consentTimestamp);
  });

  it('grantConsent is the explicit path and records a timestamp', () => {
    const created = initAnonymousSession();
    const granted = grantConsent();
    assert.equal(granted.userId, created.userId);
    assert.equal(granted.consentGiven, true);
    assert.ok(!Number.isNaN(Date.parse(granted.consentTimestamp)));
    assert.equal(hasConsent(getAnonymousSession()), true);
  });
});

describe('L9: getAnonymousSession is a pure read', () => {
  it('does not write storage even when the alias is missing', () => {
    storage.setItem(SESSION_KEY, JSON.stringify({ userId: 'u', createdAt: 'x', consentGiven: true }));
    const writesBefore = storage.writes;
    const session = getAnonymousSession();
    assert.equal(session?.userId, 'u');
    assert.equal(storage.writes, writesBefore);
  });

  it('returns null without writing when nothing is stored or JSON is corrupt', () => {
    assert.equal(getAnonymousSession(), null);
    storage.setItem(SESSION_KEY, '{not json');
    const writesBefore = storage.writes;
    assert.equal(getAnonymousSession(), null);
    assert.equal(storage.writes, writesBefore);
  });

  it('initAnonymousSession backfills a missing alias (explicit write path)', () => {
    storage.setItem(SESSION_KEY, JSON.stringify({ userId: 'u', createdAt: 'x', consentGiven: false }));
    const session = initAnonymousSession();
    assert.ok(session.anonymousAlias);
    assert.equal(JSON.parse(storage.getItem(SESSION_KEY)).anonymousAlias, session.anonymousAlias);
  });
});

describe('H5: consent redirect target validation', () => {
  it('accepts internal paths with query and hash', () => {
    assert.equal(sanitizeNextPath('/dashboard'), '/dashboard');
    assert.equal(sanitizeNextPath('/journal?x=1#a'), '/journal?x=1#a');
  });

  it('rejects external, protocol-relative, backslash and scheme targets', () => {
    for (const bad of [
      'https://evil.example', '//evil.example', '/\\evil.example', '\\\\evil', 'javascript:alert(1)',
      'dashboard', '', null, undefined, '/%0d%0aSet-Cookie', '/a\nb',
    ]) {
      const result = sanitizeNextPath(bad);
      assert.ok(result === '/onboarding' || result.startsWith('/'), `unsafe result for ${bad}`);
      assert.ok(!result.startsWith('//'), `protocol-relative for ${bad}`);
    }
    assert.equal(sanitizeNextPath('https://evil.example'), '/onboarding');
    assert.equal(sanitizeNextPath('//evil.example'), '/onboarding');
    assert.equal(sanitizeNextPath('/\\evil.example'), '/onboarding');
    assert.equal(sanitizeNextPath('javascript:alert(1)'), '/onboarding');
    assert.equal(sanitizeNextPath('/a\nb'), '/onboarding');
  });

  it('never loops back to /consent', () => {
    assert.equal(sanitizeNextPath('/consent'), '/onboarding');
    assert.equal(sanitizeNextPath('/consent?next=/dashboard'), '/onboarding');
  });

  it('builds an encoded /consent?next= redirect', () => {
    assert.equal(buildConsentRedirect('/dashboard'), '/consent?next=%2Fdashboard');
    assert.equal(buildConsentRedirect('//evil.example'), '/consent');
  });
});
