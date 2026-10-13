import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateCrisisInput } from '../../services/crisis-engine/src/crisisDetector.ts';
import {
  crisisGuardReducer,
  INITIAL_CRISIS_GUARD_STATE,
  isSubmitAllowed,
} from '../../apps/web/src/lib/crisisGuard.ts';

const match = (text) => {
  const result = evaluateCrisisInput(text, '18-24');
  return { isCrisis: result.isCrisis, emergencyContacts: result.emergencyContacts };
};
const typed = (state, text) => crisisGuardReducer(state, { type: 'text_evaluated', match: match(text) });

describe('M6: inline crisis guard', () => {
  it('stays closed for ordinary text', () => {
    const state = typed(INITIAL_CRISIS_GUARD_STATE, 'hari ini capek banget sama tugas');
    assert.equal(state.isCrisis, false);
    assert.equal(state.cardVisible, false);
  });

  it('opens the card with contacts and blocks submit on a crisis match', () => {
    const state = typed(INITIAL_CRISIS_GUARD_STATE, 'aku mau bunuh diri');
    assert.equal(state.isCrisis, true);
    assert.equal(state.cardVisible, true);
    assert.ok(state.contacts.length > 0);
    assert.equal(state.contacts[0].phone, '119 ext 8');
    assert.equal(isSubmitAllowed(match('aku mau bunuh diri')), false);
  });

  it('keeps the card until acknowledged even after the text is edited', () => {
    let state = typed(INITIAL_CRISIS_GUARD_STATE, 'aku mau bunuh diri');
    state = typed(state, 'aku capek');
    assert.equal(state.isCrisis, false, 'save unblocked once text no longer matches');
    assert.equal(state.cardVisible, true, 'card not dismissed by editing');
    assert.ok(state.contacts.length > 0);
    state = crisisGuardReducer(state, { type: 'acknowledged' });
    assert.equal(state.cardVisible, false);
  });

  it('does not re-open an acknowledged card on every further keystroke', () => {
    let state = typed(INITIAL_CRISIS_GUARD_STATE, 'aku mau bunuh diri');
    state = crisisGuardReducer(state, { type: 'acknowledged' });
    state = typed(state, 'aku mau bunuh diri saja');
    assert.equal(state.cardVisible, false);
    assert.equal(state.isCrisis, true, 'save still blocked');
  });

  it('re-opens on a new match and on a blocked submit attempt', () => {
    let state = typed(INITIAL_CRISIS_GUARD_STATE, 'aku mau bunuh diri');
    state = crisisGuardReducer(state, { type: 'acknowledged' });
    state = typed(state, 'aku capek');
    state = typed(state, 'aku mau bunuh diri');
    assert.equal(state.cardVisible, true);

    state = crisisGuardReducer(state, { type: 'acknowledged' });
    state = crisisGuardReducer(state, { type: 'submit_attempted', match: match('aku mau bunuh diri') });
    assert.equal(state.cardVisible, true);
    assert.equal(state.isCrisis, true);
  });

  it('allows a clean submit', () => {
    const state = crisisGuardReducer(INITIAL_CRISIS_GUARD_STATE, { type: 'submit_attempted', match: match('hari yang biasa') });
    assert.equal(state.isCrisis, false);
    assert.equal(state.cardVisible, false);
    assert.equal(isSubmitAllowed(match('hari yang biasa')), true);
  });
});

describe('M6: pages no longer auto-navigate to /crisis while typing', () => {
  const pages = ['journal', 'checkin', 'assessment', 'mission', 'report'];
  for (const page of pages) {
    it(`${page}/page.tsx uses the shared guard and has no router.push('/crisis')`, () => {
      const source = readFileSync(new URL(`../../apps/web/src/app/${page}/page.tsx`, import.meta.url), 'utf8');
      assert.doesNotMatch(source, /router\.push\(['"]\/crisis['"]\)/);
      assert.match(source, /useCrisisGuard\(/);
      assert.match(source, /<InlineCrisisCard/);
    });
  }

  it('the inline crisis card carries no animation classes', () => {
    const source = readFileSync(new URL('../../apps/web/src/components/InlineCrisisCard.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /animate-|transition-|Reveal/);
  });
});

describe('H5/L5: pages never grant consent or mint non-UUID ids', () => {
  for (const page of ['dashboard', 'recovery']) {
    it(`${page}/page.tsx does not call initAnonymousSession(true)`, () => {
      const source = readFileSync(new URL(`../../apps/web/src/app/${page}/page.tsx`, import.meta.url), 'utf8');
      assert.doesNotMatch(source, /initAnonymousSession\(\s*true\s*\)/);
      assert.match(source, /useConsentGuard\(/);
    });
  }

  it('recovery no longer creates restored-<ts> user ids', () => {
    const source = readFileSync(new URL('../../apps/web/src/app/recovery/page.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /restored-\$\{/);
    assert.match(source, /userId: generateUUID\(\)/);
  });
});
