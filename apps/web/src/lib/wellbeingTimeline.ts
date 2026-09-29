/**
 * Personal Well-being Timeline — a rolling window (default 14 days) built ONLY
 * from data already on this device: check-ins, completed missions, journal
 * entries. Nothing here is sent anywhere.
 *
 * "Days" are LOCAL calendar days (see calendar.ts), never UTC days.
 */
import type { DailyCheckin, JournalEntry, MoodScore } from '@dengarin/types';
import { getLocalDateOfTimestamp, getLocalDateString } from './calendar.ts';
import { getCompletedMissionDates, getDailyCheckins } from './storage.ts';

/** Higher = lighter day. Same order as the check-in mood picker. */
export const MOOD_LEVEL: Record<MoodScore, number> = {
  sangat_baik: 5,
  baik: 4,
  netral: 3,
  berat: 2,
  kewalahan: 1,
};

export interface TimelineDay {
  /** Local date, YYYY-MM-DD. */
  date: string;
  dayOfMonth: number;
  /** Average mood level (1–5) of that day's check-ins, or null when none. */
  mood: number | null;
  checkins: number;
  mission: boolean;
  journals: number;
  active: boolean;
}

export interface WellbeingTimeline {
  days: TimelineDay[];
  totals: { checkins: number; missions: number; journals: number; activeDays: number };
}

export interface TimelineInput {
  checkins: Pick<DailyCheckin, 'timestamp' | 'mood'>[];
  /** Local dates (YYYY-MM-DD) with a completed mission. */
  missionDates: Iterable<string>;
  /** ISO timestamps of journal entries. */
  journalTimestamps: string[];
  reference?: Date;
  days?: number;
}

export function buildWellbeingTimeline(input: TimelineInput): WellbeingTimeline {
  const now = input.reference ?? new Date();
  const span = input.days ?? 14;

  const window: string[] = [];
  for (let offset = span - 1; offset >= 0; offset -= 1) {
    window.push(getLocalDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)));
  }
  const inWindow = new Set(window);

  const moodByDate = new Map<string, number[]>();
  for (const checkin of input.checkins) {
    const date = getLocalDateOfTimestamp(checkin.timestamp);
    const level = MOOD_LEVEL[checkin.mood];
    if (!date || !inWindow.has(date) || level === undefined) continue;
    moodByDate.set(date, [...(moodByDate.get(date) ?? []), level]);
  }

  const journalsByDate = new Map<string, number>();
  for (const timestamp of input.journalTimestamps) {
    const date = getLocalDateOfTimestamp(timestamp);
    if (date && inWindow.has(date)) journalsByDate.set(date, (journalsByDate.get(date) ?? 0) + 1);
  }

  const missionDates = new Set(input.missionDates);

  const days: TimelineDay[] = window.map((date) => {
    const moods = moodByDate.get(date) ?? [];
    const journals = journalsByDate.get(date) ?? 0;
    const mission = missionDates.has(date);
    return {
      date,
      dayOfMonth: Number(date.slice(8, 10)),
      mood: moods.length ? moods.reduce((sum, level) => sum + level, 0) / moods.length : null,
      checkins: moods.length,
      mission,
      journals,
      active: moods.length > 0 || mission || journals > 0,
    };
  });

  return {
    days,
    totals: {
      checkins: days.reduce((sum, day) => sum + day.checkins, 0),
      missions: days.filter((day) => day.mission).length,
      journals: days.reduce((sum, day) => sum + day.journals, 0),
      activeDays: days.filter((day) => day.active).length,
    },
  };
}

function readJournalTimestamps(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('dengarin_journal_entries');
    const entries = raw ? (JSON.parse(raw) as Pick<JournalEntry, 'createdAt'>[]) : [];
    return Array.isArray(entries) ? entries.map((entry) => entry?.createdAt).filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

/** Reads this device's local data. Call from an effect/handler (browser only). */
export function loadWellbeingTimeline(reference?: Date, days = 14): WellbeingTimeline {
  return buildWellbeingTimeline({
    checkins: getDailyCheckins(),
    missionDates: getCompletedMissionDates(),
    journalTimestamps: readJournalTimestamps(),
    reference,
    days,
  });
}
