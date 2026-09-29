import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import { buildWellbeingTimeline, loadWellbeingTimeline, MOOD_LEVEL } from '../../apps/web/src/lib/wellbeingTimeline.ts';
import { saveDailyCheckin, completeTodayMission } from '../../apps/web/src/lib/storage.ts';

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
globalThis.window = { location: { pathname: '/perjalanan' } };
globalThis.localStorage = storage;

const checkin = (timestamp, mood) => ({ id: timestamp, userId: 'u', timestamp, mood, energyLevel: 5, stressorTags: [] });
const originalTz = process.env.TZ;

describe('Personal Well-being Timeline', () => {
  beforeEach(() => { storage.clear(); process.env.TZ = 'Asia/Jakarta'; });
  afterEach(() => { mock.timers.reset(); if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz; });

  it('builds a 14-day local window ending today, oldest first', () => {
    const t = buildWellbeingTimeline({ checkins: [], missionDates: [], journalTimestamps: [], reference: new Date(2026, 8, 21) });
    assert.equal(t.days.length, 14);
    assert.equal(t.days[0].date, '2026-09-08');
    assert.equal(t.days[13].date, '2026-09-21');
    assert.deepEqual(t.totals, { checkins: 0, missions: 0, journals: 0, activeDays: 0 });
    assert.ok(t.days.every((d) => d.mood === null && !d.active));
  });

  it('counts check-ins, missions, journals, and unique active days', () => {
    const t = buildWellbeingTimeline({
      checkins: [checkin('2026-09-20T03:00:00.000Z', 'baik'), checkin('2026-09-20T09:00:00.000Z', 'netral'), checkin('2026-09-18T03:00:00.000Z', 'kewalahan')],
      missionDates: ['2026-09-20', '2026-09-19'],
      journalTimestamps: ['2026-09-19T05:00:00.000Z', '2026-09-19T06:00:00.000Z', '2026-09-10T05:00:00.000Z'],
      reference: new Date(2026, 8, 21),
    });
    assert.deepEqual(t.totals, { checkins: 3, missions: 2, journals: 3, activeDays: 4 });
    const d20 = t.days.find((d) => d.date === '2026-09-20');
    assert.equal(d20.checkins, 2);
    assert.equal(d20.mood, (MOOD_LEVEL.baik + MOOD_LEVEL.netral) / 2);
    assert.equal(t.days.find((d) => d.date === '2026-09-19').journals, 2);
    assert.equal(t.days.find((d) => d.date === '2026-09-17').mood, null);
  });

  it('ignores anything outside the window, including future dates and garbage timestamps', () => {
    const t = buildWellbeingTimeline({
      checkins: [checkin('2026-08-01T00:00:00.000Z', 'baik'), checkin('2026-12-01T00:00:00.000Z', 'baik'), checkin('nope', 'baik')],
      missionDates: ['2026-08-01', '2027-01-01'],
      journalTimestamps: ['garbage', '2026-01-01T00:00:00.000Z'],
      reference: new Date(2026, 8, 21),
    });
    assert.deepEqual(t.totals, { checkins: 0, missions: 0, journals: 0, activeDays: 0 });
  });

  it('uses the LOCAL day: a 03:00 WIB check-in belongs to that WIB date, not the UTC date', () => {
    const t = buildWellbeingTimeline({
      checkins: [checkin('2026-09-20T20:00:00.000Z', 'berat')], // 03:00 WIB, 21 Sep
      missionDates: [], journalTimestamps: [], reference: new Date(2026, 8, 21),
    });
    assert.equal(t.days.find((d) => d.date === '2026-09-21').checkins, 1);
    assert.equal(t.days.find((d) => d.date === '2026-09-20').checkins, 0);
  });

  it('loads from this device: check-ins, mission keys, and journal entries', () => {
    mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-09-21T05:00:00Z') });
    saveDailyCheckin(checkin('2026-09-21T01:00:00.000Z', 'sangat_baik'));
    completeTodayMission();
    storage.setItem('dengarin_journal_entries', JSON.stringify([{ createdAt: '2026-09-20T05:00:00.000Z' }, { createdAt: 5 }]));
    storage.setItem('dengarin_mission_2026-09-10_completed', 'false');
    const t = loadWellbeingTimeline();
    assert.deepEqual(t.totals, { checkins: 1, missions: 1, journals: 1, activeDays: 2 });
  });

  it('survives corrupted storage', () => {
    storage.setItem('dengarin_journal_entries', '{not json');
    storage.setItem('dengarin_checkins', '###');
    assert.deepEqual(loadWellbeingTimeline().totals, { checkins: 0, missions: 0, journals: 0, activeDays: 0 });
  });
});
