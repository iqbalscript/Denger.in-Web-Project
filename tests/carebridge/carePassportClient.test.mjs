import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEvidenceEntries,
  buildSegments,
  canSelectEntry,
  checkinToText,
  excerpt,
  journalToText,
  segmentBudget,
} from '../../apps/web/src/lib/carePassportClient.ts';
import { CARE_PASSPORT_MAX_SEGMENTS, CARE_PASSPORT_MAX_TOTAL_TEXT } from '../../apps/web/src/lib/carePassportLimits.ts';

/** Pure helpers behind the evidence picker. Synthetic entries only. */

const NOW = new Date('2026-10-14T05:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const journals = [
  { id: '1', userId: 'u', createdAt: daysAgo(20), title: 'Refleksi Harian', content: 'Udah hampir tiga minggu aku susah fokus.', tags: [] },
  { id: '2', userId: 'u', createdAt: daysAgo(3), title: 'Soal kuliah', content: 'Deadline numpuk, aku kewalahan. Hubungi 0812-3456-7890.', tags: [] },
  { id: '3', userId: 'u', createdAt: daysAgo(45), title: 'Lama', content: 'Terlalu lama untuk ditampilkan.', tags: [] },
  { id: '4', userId: 'u', createdAt: 'bukan-tanggal', content: 'Rusak.', tags: [] },
];
const checkins = [
  { id: 'c1', userId: 'u', timestamp: daysAgo(12), mood: 'berat', energyLevel: 3, stressorTags: ['kuliah', 'tidur'], briefNote: 'capek banget' },
  { id: 'c2', userId: 'u', timestamp: daysAgo(1), mood: 'netral', energyLevel: 6, stressorTags: [] },
];

describe('Evidence text', () => {
  it('turns a check-in into one plain sentence without the calendar date', () => {
    const text = checkinToText(checkins[0]);
    assert.equal(text, 'Check-in: suasana hati terasa berat, energi 3 dari 10. Beban yang terasa: kuliah, tidur. Catatan singkat: capek banget');
    assert.ok(!text.includes('2026'));
    assert.equal(checkinToText(checkins[1]), 'Check-in: suasana hati biasa saja, energi 6 dari 10.');
  });

  it('keeps a meaningful journal title but drops the default one', () => {
    assert.equal(journalToText(journals[0]), 'Udah hampir tiga minggu aku susah fokus.');
    assert.equal(journalToText(journals[1]), 'Soal kuliah\nDeadline numpuk, aku kewalahan. Hubungi 0812-3456-7890.');
  });

  it('excerpts to 80 characters on a flattened line', () => {
    const long = 'kata '.repeat(40);
    assert.equal(excerpt(long).length, 80);
    assert.ok(excerpt(long).endsWith('…'));
    assert.equal(excerpt('pendek\nsaja'), 'pendek saja');
  });
});

describe('Evidence entries', () => {
  it('keeps the last 30 days, newest first, with a PII count per entry and no text in the badge', () => {
    const entries = buildEvidenceEntries({ journals, checkins }, { now: NOW });
    assert.deepEqual(entries.map((e) => e.id), ['checkin:c2', 'journal:2', 'checkin:c1', 'journal:1']);
    const withPhone = entries.find((e) => e.id === 'journal:2');
    assert.equal(withPhone.piiCount, 1);
    assert.equal(withPhone.kind, 'journal');
    assert.match(withPhone.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(withPhone.label, 'Jurnal');
    assert.equal(entries.find((e) => e.id === 'checkin:c1').label, 'Check-in: terasa berat');
    assert.equal(entries.find((e) => e.id === 'journal:1').piiCount, 0);
  });

  it('tolerates empty or malformed stores', () => {
    assert.deepEqual(buildEvidenceEntries({ journals: [], checkins: [] }, { now: NOW }), []);
    assert.deepEqual(buildEvidenceEntries({ journals: [null, {}], checkins: [undefined] }, { now: NOW }), []);
  });

  it('sanitises ids so they are valid on the wire', () => {
    const [entry] = buildEvidenceEntries({ journals: [{ ...journals[1], id: 'weird id/with:chars' }], checkins: [] }, { now: NOW });
    assert.match(entry.id, /^journal:[A-Za-z0-9_.-]+$/);
  });
});

describe('Segments and budget', () => {
  const entries = buildEvidenceEntries({ journals, checkins }, { now: NOW });

  it('includes only selected entries: story first, evidence oldest-to-newest, then clarification answers', () => {
    const selected = entries.filter((e) => e.id === 'journal:2' || e.id === 'checkin:c1');
    const segments = buildSegments({ story: 'Ceritaku.', selected, clarifications: ['Sejak tiga minggu lalu.'] });
    assert.deepEqual(segments.map((s) => s.id), ['intake', 'checkin:c1', 'journal:2', 'clarification:1']);
    assert.equal(segments[1].kind, 'checkin');
    assert.equal(segments[1].date, entries.find((e) => e.id === 'checkin:c1').date);
    assert.equal(segments[3].kind, 'clarification');
    assert.ok(!segments.some((s) => s.id === 'journal:1'), 'unselected entries never appear');
  });

  it('allows an empty story when entries are selected, and skips blank clarifications', () => {
    const segments = buildSegments({ story: '   ', selected: [entries[0]], clarifications: ['  '] });
    assert.deepEqual(segments.map((s) => s.kind), ['checkin']);
  });

  it('counts selected entries toward the total limit', () => {
    const big = { ...entries[0], text: 'x'.repeat(CARE_PASSPORT_MAX_TOTAL_TEXT - 10) };
    const current = { story: 'y'.repeat(20), selected: [], clarifications: [] };
    assert.equal(canSelectEntry(current, big), false);
    assert.equal(canSelectEntry(current, entries[0]), true);
    const budget = segmentBudget(buildSegments({ ...current, selected: [big] }));
    assert.equal(budget.overflow, true);
    assert.equal(budget.used, CARE_PASSPORT_MAX_TOTAL_TEXT + 10);
    assert.equal(budget.remaining, -10);
  });

  it('caps the number of segments', () => {
    const many = Array.from({ length: CARE_PASSPORT_MAX_SEGMENTS }, (_, i) => ({ ...entries[0], id: `checkin:${i}`, timestamp: daysAgo(i) }));
    const current = { story: 'cerita singkat', selected: many.slice(0, CARE_PASSPORT_MAX_SEGMENTS - 1), clarifications: [] };
    assert.equal(canSelectEntry(current, many[CARE_PASSPORT_MAX_SEGMENTS - 1]), false);
    assert.equal(segmentBudget(buildSegments(current)).count, CARE_PASSPORT_MAX_SEGMENTS);
  });
});
