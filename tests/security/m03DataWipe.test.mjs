import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DENGARIN_STORAGE_PREFIX,
  clearAnonymousSession,
  getAnonymousSession,
  getAssessmentDraft,
  getDailyCheckins,
  getTodayMissionReflection,
  isTodayMissionCompleted
} from '../../apps/web/src/lib/storage.ts';

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}

const storage = new MemoryStorage();
globalThis.window = globalThis;
globalThis.localStorage = storage;

afterEach(() => storage.clear());

describe('M-03 anonymous local data wipe', () => {
  it('removes all owned records across dates while retaining unrelated origin storage', () => {
    const owned = [
      'dengarin_anonymous_session', 'dengarin_checkins', 'dengarin_assessment_draft',
      'dengarin_journal_entries', 'dengarin_last_backup', 'dengarin_supported_posts',
      'dengarin_mission_2026-09-21_completed', 'dengarin_mission_2026-09-21_reflection',
      'dengarin_mission_2026-09-20_completed', 'dengarin_mission_2026-08-01_reflection',
      'dengarin_sync_metadata', 'dengarin_temporary_draft'
    ];
    for (const key of owned) storage.setItem(key, 'sensitive');
    storage.setItem('other_app_preference', 'keep');

    clearAnonymousSession();

    for (const key of owned) assert.equal(storage.getItem(key), null, key);
    assert.equal(storage.getItem('other_app_preference'), 'keep');
  });

  it('leaves no application-owned state after a reload', () => {
    storage.setItem('dengarin_anonymous_session', JSON.stringify({ userId: 'id', anonymousAlias: 'Anonim' }));
    storage.setItem('dengarin_checkins', JSON.stringify([{ mood: 'berat' }]));
    storage.setItem('dengarin_assessment_draft', JSON.stringify({ currentStep: 2 }));
    storage.setItem('dengarin_journal_entries', JSON.stringify([{ content: 'private' }]));
    storage.setItem('dengarin_mission_2020-01-01_reflection', 'older private reflection');
    storage.setItem('dengarin_mission_2026-09-21_completed', 'true');
    storage.setItem('dengarin_last_backup', '2026-09-21T00:00:00.000Z');
    storage.setItem('dengarin_supported_posts', JSON.stringify(['post-id']));

    clearAnonymousSession();

    assert.equal(getAnonymousSession(), null);
    assert.equal(getAssessmentDraft(), null);
    assert.deepEqual(getDailyCheckins(), []);
    assert.equal(isTodayMissionCompleted(), false);
    assert.equal(getTodayMissionReflection(), '');
    for (let index = 0; index < storage.length; index += 1) {
      assert.equal(storage.key(index)?.startsWith(DENGARIN_STORAGE_PREFIX), false);
    }
  });

  it('clears recovery-page state before replacing the history entry', () => {
    const source = readFileSync(new URL('../../apps/web/src/app/recovery/page.tsx', import.meta.url), 'utf8');
    assert.match(source, /setSession\(null\)/);
    assert.match(source, /setRestoreInput\(''\)/);
    assert.match(source, /window\.location\.replace\('\/'\)/);
    assert.doesNotMatch(source, /window\.location\.href = '\/'/);
  });
});
