import type { CarePassportSegment, CarePassportSegmentKind, DailyCheckin, JournalEntry, MoodScore } from '@dengarin/types';
import { detectPii } from '@dengarin/validator';
import { getLocalDateOfTimestamp } from './calendar.ts';
import { DENGARIN_STORAGE_PREFIX, getDailyCheckins } from './storage.ts';
import {
  CARE_PASSPORT_EVIDENCE_WINDOW_DAYS,
  CARE_PASSPORT_MAX_SEGMENTS,
  CARE_PASSPORT_MAX_TOTAL_TEXT,
} from './carePassportLimits.ts';
import type { Language } from '../i18n/language.ts';
import { carePassportText } from '../i18n/pages/carePassport.ts';

/**
 * F-A "BUKTI BERTANGGAL": CLIENT-SIDE EVIDENCE
 *
 * Journal entries and daily check-ins live only in this browser's
 * localStorage. This module turns them into dated candidates the user can
 * tick one by one. Nothing is read from anywhere else, nothing is written
 * back, and an entry only ever leaves the device inside a request the user
 * explicitly submitted with that entry selected.
 *
 * The pure helpers (text building, windowing, segment assembly, budget) have
 * no browser dependency so they can be unit-tested with node:test.
 */

const JOURNAL_KEY = `${DENGARIN_STORAGE_PREFIX}journal_entries`;
const METRICS_KEY = `${DENGARIN_STORAGE_PREFIX}care_passport_metrics`;
const METRICS_MAX_ENTRIES = 50;
const PREVIEW_LENGTH = 80;

export type LocalEvidenceKind = Extract<CarePassportSegmentKind, 'journal' | 'checkin'>;

export interface LocalEvidenceEntry {
  /** Segment id used on the wire, e.g. `journal:1727150000000`. */
  id: string;
  kind: LocalEvidenceKind;
  /** Local calendar date `YYYY-MM-DD`. */
  date: string;
  /** Original ISO timestamp, for sorting. */
  timestamp: string;
  /** Short, human label: "Jurnal" / "Check-in: terasa berat". */
  label: string;
  /** First ~80 characters of the text, for the picker row. */
  preview: string;
  /** Full text that would be sent (raw; the server redacts it again). */
  text: string;
  /** How many PII spans the local detector found; shown as a badge, never as content. */
  piiCount: number;
}

export const MOOD_LABELS: Record<MoodScore, string> = {
  sangat_baik: 'sangat baik',
  baik: 'cukup baik',
  netral: 'biasa saja',
  berat: 'terasa berat',
  kewalahan: 'kewalahan',
};

/** Mood words for the picker label in the interface language (the wire text stays Indonesian). */
function moodLabel(mood: MoodScore, lang: Language): string {
  const moods = carePassportText[lang].evidence.moods as Record<string, string | undefined>;
  return moods[mood] ?? MOOD_LABELS[mood] ?? String(mood).replace(/_/g, ' ');
}

function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * A check-in becomes one plain sentence in the user's own register. The
 * calendar date is deliberately NOT written into the text: it travels as the
 * segment's `date` (and the prompt header), so the model cannot turn a
 * timestamp into a "duration" fact. The sentence is always Indonesian: it is
 * sent to the Indonesian-only passport pipeline, whatever the UI language.
 */
export function checkinToText(checkin: DailyCheckin): string {
  const mood = MOOD_LABELS[checkin.mood] ?? String(checkin.mood).replace(/_/g, ' ');
  const parts = [`Check-in: suasana hati ${mood}, energi ${checkin.energyLevel} dari 10.`];
  const tags = (checkin.stressorTags ?? []).map(tidy).filter(Boolean);
  if (tags.length > 0) parts.push(`Beban yang terasa: ${tags.join(', ')}.`);
  const note = checkin.briefNote ? checkin.briefNote.trim() : '';
  if (note) parts.push(`Catatan singkat: ${note}`);
  return parts.join(' ');
}

export function journalToText(entry: JournalEntry): string {
  const title = entry.title ? entry.title.trim() : '';
  const content = (entry.content ?? '').trim();
  if (!content) return title;
  return title && title !== 'Refleksi Harian' ? `${title}\n${content}` : content;
}

export function excerpt(text: string, length = PREVIEW_LENGTH): string {
  const flat = tidy(text);
  if (flat.length <= length) return flat;
  return `${flat.slice(0, length - 1).trimEnd()}\u2026`;
}

export interface EvidenceSources {
  journals: JournalEntry[];
  checkins: DailyCheckin[];
}

export interface EvidenceWindowOptions {
  now?: Date;
  windowDays?: number;
  /** Interface language for the picker labels only; defaults to Indonesian. */
  lang?: Language;
}

function withinWindow(timestamp: string, now: Date, windowDays: number): boolean {
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return false;
  const oldest = now.getTime() - windowDays * 86_400_000;
  return time >= oldest && time <= now.getTime() + 60_000;
}

/**
 * Builds the dated candidates for the picker: last `windowDays` days, newest
 * first, with a local PII count per entry. Pure; the caller supplies sources.
 */
export function buildEvidenceEntries(sources: EvidenceSources, options: EvidenceWindowOptions = {}): LocalEvidenceEntry[] {
  const now = options.now ?? new Date();
  const windowDays = options.windowDays ?? CARE_PASSPORT_EVIDENCE_WINDOW_DAYS;
  const lang = options.lang ?? 'id';
  const labels = carePassportText[lang].evidence;
  const entries: LocalEvidenceEntry[] = [];

  for (const journal of sources.journals ?? []) {
    if (!journal || typeof journal.createdAt !== 'string' || !withinWindow(journal.createdAt, now, windowDays)) continue;
    const text = journalToText(journal);
    const date = getLocalDateOfTimestamp(journal.createdAt);
    if (!text || !date) continue;
    entries.push({
      id: `journal:${String(journal.id).replace(/[^A-Za-z0-9_.-]/g, '')}`,
      kind: 'journal',
      date,
      timestamp: journal.createdAt,
      label: labels.journalLabel,
      preview: excerpt(text),
      text,
      piiCount: detectPii(text).length,
    });
  }

  for (const checkin of sources.checkins ?? []) {
    if (!checkin || typeof checkin.timestamp !== 'string' || !withinWindow(checkin.timestamp, now, windowDays)) continue;
    const text = checkinToText(checkin);
    const date = getLocalDateOfTimestamp(checkin.timestamp);
    if (!date) continue;
    const mood = checkin.mood in MOOD_LABELS ? moodLabel(checkin.mood, lang) : labels.moods.recorded;
    entries.push({
      id: `checkin:${String(checkin.id).replace(/[^A-Za-z0-9_.-]/g, '')}`,
      kind: 'checkin',
      date,
      timestamp: checkin.timestamp,
      label: labels.checkinLabel(mood),
      preview: excerpt(text),
      text,
      piiCount: detectPii(text).length,
    });
  }

  // Newest first for the picker; ids must be unique on the wire.
  const seen = new Set<string>();
  return entries
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .filter((entry) => (seen.has(entry.id) ? false : (seen.add(entry.id), true)));
}

/** Browser-only: reads the two local stores. Returns [] during SSR or when storage is unreadable. */
export function loadLocalEvidence(options: EvidenceWindowOptions = {}): LocalEvidenceEntry[] {
  if (typeof window === 'undefined') return [];
  let journals: JournalEntry[] = [];
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) journals = parsed as JournalEntry[];
  } catch {
    journals = [];
  }
  return buildEvidenceEntries({ journals, checkins: getDailyCheckins() }, options);
}

export const INTAKE_SEGMENT_ID = 'intake';

export interface SegmentInputs {
  /** The story typed on the page; may be empty when only entries are selected. */
  story: string;
  /** Entries the user explicitly ticked. */
  selected: LocalEvidenceEntry[];
  /** Answers given in NEEDS_CLARIFICATION rounds, oldest first. */
  clarifications?: string[];
}

/**
 * Assembles the request segments. Order is meaningful: attribution on the
 * server picks the FIRST segment containing a quote, so the story comes
 * first, then evidence oldest-to-newest, then clarification answers. Only
 * `selected` entries are ever included.
 */
export function buildSegments({ story, selected, clarifications = [] }: SegmentInputs): CarePassportSegment[] {
  const segments: CarePassportSegment[] = [];
  if (story.trim()) segments.push({ id: INTAKE_SEGMENT_ID, kind: 'intake', text: story });
  const evidence = [...selected].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const entry of evidence) segments.push({ id: entry.id, kind: entry.kind, date: entry.date, text: entry.text });
  clarifications.forEach((answer, index) => {
    if (answer.trim()) segments.push({ id: `clarification:${index + 1}`, kind: 'clarification', text: answer });
  });
  return segments;
}

export interface SegmentBudget {
  used: number;
  remaining: number;
  max: number;
  count: number;
  maxCount: number;
  overflow: boolean;
}

/** Selected entries count toward the same limit as the story. */
export function segmentBudget(segments: ReadonlyArray<Pick<CarePassportSegment, 'text'>>): SegmentBudget {
  const used = segments.reduce((sum, s) => sum + s.text.length, 0);
  return {
    used,
    remaining: CARE_PASSPORT_MAX_TOTAL_TEXT - used,
    max: CARE_PASSPORT_MAX_TOTAL_TEXT,
    count: segments.length,
    maxCount: CARE_PASSPORT_MAX_SEGMENTS,
    overflow: used > CARE_PASSPORT_MAX_TOTAL_TEXT || segments.length > CARE_PASSPORT_MAX_SEGMENTS,
  };
}

/** Would adding `entry` to the current selection still fit? */
export function canSelectEntry(current: SegmentInputs, entry: LocalEvidenceEntry): boolean {
  const next = buildSegments({ ...current, selected: [...current.selected, entry] });
  return !segmentBudget(next).overflow;
}

// ─── Demo metrics (numbers only, never text) ─────────────────────────────

export interface CarePassportMetric {
  stage: 'generated' | 'approved';
  startedAt: number;
  approvedAt?: number;
  rounds: number;
  providerId: string;
  isAmd: boolean;
  latencyMs?: number;
  segmentsCount: number;
  evidenceCount: number;
  droppedClaims: number;
  completenessKnown?: number;
  completenessTotal?: number;
}

/** Appends one metric row; capped, prefixed with `dengarin_` so /recovery wipes it. */
export function recordCarePassportMetric(metric: CarePassportMetric): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? (parsed as CarePassportMetric[]) : [];
    list.push(metric);
    localStorage.setItem(METRICS_KEY, JSON.stringify(list.slice(-METRICS_MAX_ENTRIES)));
  } catch {
    // Metrics are optional; storage problems never block the flow.
  }
}
