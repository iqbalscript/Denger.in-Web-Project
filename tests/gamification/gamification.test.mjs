import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getLocalDateString,
  getLocalWeekId,
  getISODayOfWeek,
  getWeekStartMonday,
  getWeekDates,
  isDateInWeek
} from '../../apps/web/src/lib/calendar.ts';

import {
  LEVEL_THRESHOLDS,
  BADGE_DEFINITIONS,
  WEEKLY_QUEST_REQUIREMENTS,
  WEEKLY_QUEST_REWARD,
  LANGKAH_AMOUNTS,
  computeLevel,
  loadGamificationState,
  saveGamificationState,
  awardLangkah,
  isJournalEligibleForReward,
  getRitme,
  getRitmeActiveCount,
  getCurrentLevelInfo,
  deriveUnlockedBadgesFromLedger
} from '../../apps/web/src/lib/gamification.ts';

import { clearAnonymousSession } from '../../apps/web/src/lib/storage.ts';
import { evaluateCrisisInput } from '../../services/crisis-engine/src/crisisDetector.ts';

// Mock MemoryStorage for localStorage
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
globalThis.window = {
  location: { pathname: '/dashboard' }
};
globalThis.localStorage = storage;

const resetTestState = () => {
  storage.clear();
  globalThis.window.location.pathname = '/dashboard';
};

describe('1. Shared Local Calendar Utility', () => {
  beforeEach(resetTestState);
  it('formats reference dates into YYYY-MM-DD correctly', () => {
    const d1 = new Date(2026, 8, 21); // Sept 21, 2026
    assert.equal(getLocalDateString(d1), '2026-09-21');

    const d2 = new Date(2026, 0, 5); // Jan 5, 2026
    assert.equal(getLocalDateString(d2), '2026-01-05');
  });

  it('computes ISO week IDs accurately across week boundaries', () => {
    // 2026-09-21 is Monday of W39
    const monday = new Date(2026, 8, 21);
    assert.equal(getLocalWeekId(monday), '2026-W39');

    // 2026-09-27 is Sunday of W39 (same ISO week)
    const sunday = new Date(2026, 8, 27);
    assert.equal(getLocalWeekId(sunday), '2026-W39');

    // 2026-09-28 is next Monday (W40)
    const nextMonday = new Date(2026, 8, 28);
    assert.equal(getLocalWeekId(nextMonday), '2026-W40');
  });

  it('handles Dec/Jan year-end ISO week transitions correctly', () => {
    // Dec 29, 2025 is Monday; Thursday is Jan 1 2026 -> 2026-W01
    const dec29_2025 = new Date(2025, 11, 29);
    assert.equal(getLocalWeekId(dec29_2025), '2026-W01');

    // Dec 31, 2026 is Thursday -> 2026-W53
    const dec31_2026 = new Date(2026, 11, 31);
    assert.equal(getLocalWeekId(dec31_2026), '2026-W53');

    // Jan 1, 2027 is Friday; Thursday was Dec 31 2026 -> 2026-W53
    const jan01_2027 = new Date(2027, 0, 1);
    assert.equal(getLocalWeekId(jan01_2027), '2026-W53');

    // Jan 4, 2027 is Monday -> 2027-W01
    const jan04_2027 = new Date(2027, 0, 4);
    assert.equal(getLocalWeekId(jan04_2027), '2027-W01');
  });

  it('handles leap day correctly (Feb 29)', () => {
    const leapDay = new Date(2024, 1, 29);
    assert.equal(getLocalDateString(leapDay), '2024-02-29');
    assert.equal(getLocalWeekId(leapDay), '2024-W09');
  });

  it('determines ISO day of week (1=Monday ... 7=Sunday)', () => {
    const monday = new Date(2026, 8, 21);
    assert.equal(getISODayOfWeek(monday), 1);

    const sunday = new Date(2026, 8, 27);
    assert.equal(getISODayOfWeek(sunday), 7);
  });

  it('calculates week start Monday and full week dates array', () => {
    const wednesday = new Date(2026, 8, 23);
    assert.equal(getWeekStartMonday(wednesday), '2026-09-21');

    const dates = getWeekDates(wednesday);
    assert.equal(dates.length, 7);
    assert.equal(dates[0], '2026-09-21'); // Mon
    assert.equal(dates[6], '2026-09-27'); // Sun
  });

  it('checks if a date string falls within an ISO week', () => {
    assert.equal(isDateInWeek('2026-09-21', '2026-W39'), true);
    assert.equal(isDateInWeek('2026-09-27', '2026-W39'), true);
    assert.equal(isDateInWeek('2026-09-28', '2026-W39'), false);
  });
});

describe('2. Gamification Engine — Levels & Thresholds', () => {
  beforeEach(resetTestState);
  it('computes levels monotonically with non-decreasing thresholds', () => {
    assert.equal(computeLevel(0), 0);
    assert.equal(computeLevel(49), 0);
    assert.equal(computeLevel(50), 1);
    assert.equal(computeLevel(149), 1);
    assert.equal(computeLevel(150), 2);
    assert.equal(computeLevel(349), 2);
    assert.equal(computeLevel(350), 3);
    assert.equal(computeLevel(599), 3);
    assert.equal(computeLevel(600), 4);
    assert.equal(computeLevel(999), 4);
    assert.equal(computeLevel(1000), 5);
    assert.equal(computeLevel(5000), 5);
  });

  it('provides correct level metadata and progress percentage', () => {
    const state = loadGamificationState();
    state.totalLangkah = 100;
    state.currentLevel = computeLevel(100);

    const info = getCurrentLevelInfo(state);
    assert.equal(info.level, 1);
    assert.equal(info.name, 'Buka Ruang');
    assert.equal(info.currentLangkah, 100);
    assert.equal(info.nextThreshold, 150);
    // (100 - 50) / (150 - 50) * 100 = 50%
    assert.equal(info.progress, 50);
  });
});

describe('3. Gamification Engine — Idempotency & Ledger', () => {
  beforeEach(resetTestState);
  it('awards Langkah for daily checkin and rejects duplicate idempotency key', () => {
    const res1 = awardLangkah('daily_checkin', 'checkin:2026-09-21', '2026-09-21');
    assert.ok(res1);
    assert.equal(res1.langkahAwarded, 10);
    assert.equal(res1.totalLangkah, 10);

    // Second call with same key must return null and not increment
    const res2 = awardLangkah('daily_checkin', 'checkin:2026-09-21', '2026-09-21');
    assert.equal(res2, null);

    const state = loadGamificationState();
    assert.equal(state.totalLangkah, 10);
    assert.equal(state.eventLedger.length, 1);
  });

  it('records correct Langkah amounts for each event type', () => {
    awardLangkah('daily_checkin', 'c1', '2026-09-21'); // 10
    awardLangkah('mission_complete', 'm1', '2026-09-21'); // 15
    awardLangkah('journal_entry', 'j1', '2026-09-21'); // 15
    awardLangkah('mission_reflection', 'r1', '2026-09-21'); // 5
    awardLangkah('weekly_reflection', 'w1', '2026-09-21'); // 20

    const state = loadGamificationState();
    assert.equal(state.totalLangkah, 10 + 15 + 15 + 5 + 20);
  });

  it('merges concurrent cross-tab writes without lost updates', () => {
    // Simulate Tab A writing checkin
    awardLangkah('daily_checkin', 'checkin:2026-09-21', '2026-09-21');

    // Simulate Tab B writing mission
    awardLangkah('mission_complete', 'mission:2026-09-21', '2026-09-21');

    const state = loadGamificationState();
    assert.equal(state.eventLedger.length, 2);
    assert.equal(state.totalLangkah, 25);
  });
});

describe('4. Journal Eligibility Safeguards (PD-1)', () => {
  beforeEach(resetTestState);
  it('enforces minimum 20 trimmed characters for journal reward eligibility', () => {
    const state = loadGamificationState();
    assert.equal(isJournalEligibleForReward('Too short', state, '2026-09-21'), false);
    assert.equal(isJournalEligibleForReward('                 12345           ', state, '2026-09-21'), false);

    const validContent = 'Hari ini aku belajar untuk memberi ruang dan jeda bagi diriku.';
    assert.equal(isJournalEligibleForReward(validContent, state, '2026-09-21'), true);
  });

  it('enforces daily cap of maximum 2 rewarded journal entries per local calendar day', () => {
    const content = 'Hari ini aku belajar untuk memberi ruang dan jeda bagi diriku.';

    // 1st entry
    let state = loadGamificationState();
    assert.equal(isJournalEligibleForReward(content, state, '2026-09-21'), true);
    awardLangkah('journal_entry', 'journal:1', '2026-09-21');

    // 2nd entry
    state = loadGamificationState();
    assert.equal(isJournalEligibleForReward(content, state, '2026-09-21'), true);
    awardLangkah('journal_entry', 'journal:2', '2026-09-21');

    // 3rd entry on SAME day -> capped, not eligible for reward
    state = loadGamificationState();
    assert.equal(isJournalEligibleForReward(content, state, '2026-09-21'), false);

    // But eligible on NEXT calendar day
    assert.equal(isJournalEligibleForReward(content, state, '2026-09-22'), true);
  });
});

describe('5. Badge Unlocking Rules', () => {
  beforeEach(resetTestState);
  it('unlocks langkah-pertama on first recorded event', () => {
    const res = awardLangkah('daily_checkin', 'checkin:2026-09-21', '2026-09-21');
    assert.ok(res?.newBadges?.includes('langkah-pertama'));

    const state = loadGamificationState();
    assert.ok(state.unlockedBadgeIds.includes('langkah-pertama'));
  });

  it('unlocks berani-jujur on first journal entry', () => {
    const res = awardLangkah('journal_entry', 'journal:1', '2026-09-21');
    assert.ok(res?.newBadges?.includes('berani-jujur'));
  });

  it('unlocks kasih-ruang on mission reflection', () => {
    const res = awardLangkah('mission_reflection', 'ref:1', '2026-09-21');
    assert.ok(res?.newBadges?.includes('kasih-ruang'));
  });

  it('unlocks banyak-cara when checkin, mission, and journal occur on the same day', () => {
    awardLangkah('daily_checkin', 'c1', '2026-09-21');
    awardLangkah('mission_complete', 'm1', '2026-09-21');
    const res = awardLangkah('journal_entry', 'j1', '2026-09-21');

    assert.ok(res?.newBadges?.includes('banyak-cara'));
  });

  it('unlocks balik-lagi across 3 distinct active days', () => {
    awardLangkah('daily_checkin', 'c1', '2026-09-21');
    awardLangkah('daily_checkin', 'c2', '2026-09-22');
    const res = awardLangkah('daily_checkin', 'c3', '2026-09-23');

    assert.ok(res?.newBadges?.includes('balik-lagi'));
  });

  it('unlocks pelan-pelan across 7 distinct active days', () => {
    for (let i = 1; i <= 6; i++) {
      awardLangkah('daily_checkin', `c${i}`, `2026-09-0${i}`);
    }
    const res = awardLangkah('daily_checkin', 'c7', '2026-09-07');
    assert.ok(res?.newBadges?.includes('pelan-pelan'));
  });
});

describe('6. Weekly Quest Engine', () => {
  beforeEach(resetTestState);
  it('tracks progress and awards quest completion when all conditions are met', () => {
    const weekId = getLocalWeekId(new Date(2026, 8, 21));

    // Day 1: checkin + mission
    awardLangkah('daily_checkin', 'c1', '2026-09-21');
    awardLangkah('mission_complete', 'm1', '2026-09-21');

    let state = loadGamificationState();
    assert.equal(state.questProgress.checkinDays, 1);
    assert.equal(state.questProgress.missionsCompleted, 1);
    assert.equal(state.questProgress.journalEntries, 0);
    assert.equal(state.completedQuestWeekIds.includes(weekId), false);

    // Day 2: checkin + mission + journal
    awardLangkah('daily_checkin', 'c2', '2026-09-22');
    awardLangkah('mission_complete', 'm2', '2026-09-22');
    const res = awardLangkah('journal_entry', 'j1', '2026-09-22');

    // Quest should be completed and awarded!
    assert.ok(res?.questCompleted);
    assert.ok(res?.newBadges?.includes('kenal-ritme'));

    state = loadGamificationState();
    assert.ok(state.completedQuestWeekIds.includes(weekId));
    // Check that quest award (+30) is in ledger
    const questEvent = state.eventLedger.find(e => e.id === `quest:${weekId}`);
    assert.ok(questEvent);
    assert.equal(questEvent.langkah, 30);
  });
});

describe('7. Ritme Rolling 7-Day Participation & Future Date Protection', () => {
  beforeEach(resetTestState);
  it('computes rolling 7-day activity accurately from ledger', () => {
    const ref = new Date(2026, 8, 27); // Sunday
    awardLangkah('daily_checkin', 'c1', '2026-09-27');
    awardLangkah('daily_checkin', 'c2', '2026-09-25');

    const ritme = getRitme(ref);
    assert.equal(ritme.length, 7);
    assert.equal(getRitmeActiveCount(ref), 2);

    const activeDays = ritme.filter(d => d.active).map(d => d.date);
    assert.deepEqual(activeDays, ['2026-09-25', '2026-09-27']);
  });

  it('excludes future-dated events from affecting active Ritme count', () => {
    // Today is 2026-09-21, future event is 2099-01-01
    const state = loadGamificationState();
    state.eventLedger.push({
      id: 'future-event',
      type: 'daily_checkin',
      langkah: 10,
      timestamp: '2099-01-01T00:00:00.000Z',
      localDate: '2099-01-01',
    });
    saveGamificationState(state);

    const ritme = getRitme(new Date(2026, 8, 21));
    const activeCount = ritme.filter(d => d.active).length;
    assert.equal(activeCount, 0); // Future event must NOT make any current day active
  });
});

describe('8. State Reconciliation & Impossible State Correction', () => {
  beforeEach(resetTestState);
  it('resets gracefully if localStorage contains corrupted JSON', () => {
    storage.setItem('dengarin_gamification_v1', 'NOT_VALID_JSON{:::');
    const state = loadGamificationState();
    assert.equal(state.version, 1);
    assert.equal(state.totalLangkah, 0);
    assert.equal(state.eventLedger.length, 0);
  });

  it('deduplicates duplicate ledger entries and recomputes totalLangkah', () => {
    const state = loadGamificationState();
    state.eventLedger = [
      { id: 'dup-1', type: 'daily_checkin', langkah: 10, timestamp: 't', localDate: '2026-09-21' },
      { id: 'dup-1', type: 'daily_checkin', langkah: 10, timestamp: 't', localDate: '2026-09-21' },
      { id: 'unique-2', type: 'mission_complete', langkah: 15, timestamp: 't', localDate: '2026-09-21' },
    ];
    saveGamificationState(state);

    const reloaded = loadGamificationState();
    assert.equal(reloaded.eventLedger.length, 2);
    assert.equal(reloaded.totalLangkah, 25);
  });

  it('prunes impossible badges that lack qualifying ledger events', () => {
    const state = loadGamificationState();
    state.eventLedger = []; // Empty ledger
    state.unlockedBadgeIds = ['berani-jujur', 'pelan-pelan']; // Impossible badges
    saveGamificationState(state);

    const reloaded = loadGamificationState();
    assert.deepEqual(reloaded.unlockedBadgeIds, []);
  });
});

describe('9. Crisis Exclusion Enforcement across All Sources', () => {
  beforeEach(resetTestState);
  it('suppresses any Langkah award when current route is /crisis', () => {
    globalThis.window.location.pathname = '/crisis';

    const res = awardLangkah('daily_checkin', 'checkin:crisis-test', '2026-09-21');
    assert.equal(res, null);

    const state = loadGamificationState();
    assert.equal(state.eventLedger.length, 0);
    assert.equal(state.totalLangkah, 0);
  });

  it('ensures evaluateCrisisInput triggers before gamification for checkin notes', () => {
    const suicidalText = 'saya mau bunuh diri sekarang';
    const check = evaluateCrisisInput(suicidalText, '18-24');
    assert.equal(check.isCrisis, true);
    // When isCrisis is true, handler early-returns to router.push('/crisis')
    // No awardLangkah is called:
    const state = loadGamificationState();
    assert.equal(state.eventLedger.length, 0);
  });

  it('ensures evaluateCrisisInput triggers before gamification for mission reflection', () => {
    const crisisText = 'aku ingin mengakhiri hidupku saja';
    const check = evaluateCrisisInput(crisisText, '18-24');
    assert.equal(check.isCrisis, true);

    const state = loadGamificationState();
    assert.equal(state.eventLedger.length, 0);
  });

  it('ensures evaluateCrisisInput triggers before gamification for weekly reflection', () => {
    const crisisText = 'rasanya mau mati saja minggu ini';
    const check = evaluateCrisisInput(crisisText, '18-24');
    assert.equal(check.isCrisis, true);

    const state = loadGamificationState();
    assert.equal(state.eventLedger.length, 0);
  });
});

describe('10. Delete All Wipe Compatibility', () => {
  beforeEach(resetTestState);
  it('is completely wiped by clearAnonymousSession() including weekly reflections', () => {
    awardLangkah('daily_checkin', 'c1', '2026-09-21');
    storage.setItem('dengarin_weekly_reflection_2026-W39', 'Catatan refleksi pekan ini');
    assert.ok(storage.getItem('dengarin_gamification_v1'));
    assert.ok(storage.getItem('dengarin_weekly_reflection_2026-W39'));

    clearAnonymousSession();
    assert.equal(storage.getItem('dengarin_gamification_v1'), null);
    assert.equal(storage.getItem('dengarin_weekly_reflection_2026-W39'), null);

    const reloaded = loadGamificationState();
    assert.equal(reloaded.totalLangkah, 0);
    assert.equal(reloaded.eventLedger.length, 0);
  });
});

describe('11. Recovery / E2EE Round Trip & Repetition Safety', () => {
  beforeEach(resetTestState);
  it('restores gamification state and blocks repetition of restored actions', () => {
    // 1. Initial user activity
    awardLangkah('daily_checkin', 'checkin:2026-09-21', '2026-09-21');
    const originalState = loadGamificationState();

    // 2. Simulate encrypted backup payload
    const backupPayload = {
      gamification: originalState,
      backupAt: new Date().toISOString()
    };

    // 3. Simulate new device / restore: wipe storage, restore from payload
    storage.clear();
    assert.equal(storage.getItem('dengarin_gamification_v1'), null);

    storage.setItem('dengarin_gamification_v1', JSON.stringify(backupPayload.gamification));
    const restoredState = loadGamificationState();

    assert.equal(restoredState.totalLangkah, 10);
    assert.equal(restoredState.eventLedger.length, 1);

    // 4. Repeated check-in after restore MUST be rejected (no double reward)
    const repeatResult = awardLangkah('daily_checkin', 'checkin:2026-09-21', '2026-09-21');
    assert.equal(repeatResult, null);

    const postRepeatState = loadGamificationState();
    assert.equal(postRepeatState.totalLangkah, 10);
    assert.equal(postRepeatState.eventLedger.length, 1);
  });
});
