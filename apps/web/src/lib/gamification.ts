/**
 * Gamification Engine — "Perjalanan Kecil" V1
 *
 * Local-first, idempotent, append-only event ledger.
 * Rewards ACTIONS (check-in, mission, journal), never emotional outcomes.
 * Crisis-safe: all award functions are called ONLY after the crisis gate passes.
 *
 * Storage key: dengarin_gamification_v1 (included in Delete All wipe via dengarin_ prefix).
 */

import type {
  GamificationStateV1,
  GamificationEvent,
  GamificationEventType,
  CelebrationData,
  LevelDefinition,
  BadgeDefinition,
  WeeklyQuestProgress,
} from '@dengarin/types';
import { getLocalDateString, getLocalWeekId } from './calendar.ts';

// ─── Constants ──────────────────────────────────────────────────────

const STORAGE_KEY = 'dengarin_gamification_v1';

/** Levels never decrease. Thresholds are cumulative Langkah. */
export const LEVEL_THRESHOLDS: LevelDefinition[] = [
  { name: 'Mulai Pelan',     threshold: 0 },
  { name: 'Buka Ruang',      threshold: 50 },
  { name: 'Kenal Diri',      threshold: 150 },
  { name: 'Jaga Ritme',      threshold: 350 },
  { name: 'Bertumbuh',       threshold: 600 },
  { name: 'Tetap Berjalan',  threshold: 1000 },
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'langkah-pertama', name: 'Langkah Pertama', description: 'Melakukan aksi pertama di Dengar.in' },
  { id: 'berani-jujur',    name: 'Berani Jujur',    description: 'Menulis jurnal untuk pertama kali' },
  { id: 'kasih-ruang',     name: 'Kasih Ruang',     description: 'Menyelesaikan misi dengan refleksi' },
  { id: 'balik-lagi',      name: 'Balik Lagi',      description: 'Aktif di 3 hari berbeda' },
  { id: 'pelan-pelan',     name: 'Pelan-Pelan',     description: 'Aktif di 7 hari berbeda' },
  { id: 'kenal-ritme',     name: 'Kenal Ritme',     description: 'Menyelesaikan Weekly Quest pertama' },
  { id: 'tetap-tumbuh',    name: 'Tetap Tumbuh',    description: 'Mencapai level Jaga Ritme' },
  { id: 'banyak-cara',     name: 'Banyak Cara',     description: 'Check-in, misi, dan jurnal dalam satu hari' },
];

export const WEEKLY_QUEST_REQUIREMENTS = {
  checkinDays: 2,
  missionsCompleted: 2,
  journalEntries: 1,
} as const;

export const WEEKLY_QUEST_REWARD = 30;

/** Max journal Langkah awards per local calendar day. */
const JOURNAL_DAILY_CAP = 2;
/** Minimum trimmed content length for journal eligibility. */
const JOURNAL_MIN_CONTENT_LENGTH = 20;

// ─── Langkah Amounts ────────────────────────────────────────────────

export const LANGKAH_AMOUNTS: Record<GamificationEventType, number> = {
  daily_checkin: 10,
  mission_complete: 15,
  journal_entry: 15,
  mission_reflection: 5,
  weekly_quest_complete: WEEKLY_QUEST_REWARD,
  weekly_reflection: 20,
};

// ─── State Management ───────────────────────────────────────────────

function createDefaultState(): GamificationStateV1 {
  return {
    version: 1,
    eventLedger: [],
    totalLangkah: 0,
    currentLevel: 0,
    unlockedBadgeIds: [],
    activeQuestWeekId: getLocalWeekId(),
    questProgress: { checkinDays: 0, missionsCompleted: 0, journalEntries: 0 },
    completedQuestWeekIds: [],
  };
}

export function computeLevel(totalLangkah: number): number {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalLangkah >= LEVEL_THRESHOLDS[i].threshold) {
      level = i;
      break;
    }
  }
  return level;
}

function reconcileState(state: GamificationStateV1): GamificationStateV1 {
  // 1. Deduplicate ledger events by ID (preserving original order)
  const seenIds = new Set<string>();
  const dedupedLedger: GamificationEvent[] = [];
  for (const e of state.eventLedger) {
    if (e && typeof e.id === 'string' && !seenIds.has(e.id)) {
      seenIds.add(e.id);
      dedupedLedger.push(e);
    }
  }
  state.eventLedger = dedupedLedger;

  // 2. Recompute totalLangkah directly from ledger
  const computed = state.eventLedger.reduce(
    (sum, e) => sum + (typeof e.langkah === 'number' ? e.langkah : 0),
    0
  );
  state.totalLangkah = computed;

  // 3. Recompute level monotonically
  state.currentLevel = computeLevel(computed);

  // 4. Reconstruct completed quest week IDs from ledger
  const questWeeks = state.eventLedger
    .filter(e => e.type === 'weekly_quest_complete')
    .map(e => e.id.replace('quest:', ''));
  state.completedQuestWeekIds = Array.from(new Set(questWeeks));

  // 5. Reconstruct unlocked badges deterministically from ledger
  state.unlockedBadgeIds = deriveUnlockedBadgesFromLedger(state.eventLedger);

  // 6. Recompute current quest progress for the active week
  const currentWeekId = getLocalWeekId();
  state.activeQuestWeekId = currentWeekId;
  state.questProgress = computeQuestProgress(state.eventLedger, currentWeekId);

  return state;
}

export function loadGamificationState(): GamificationStateV1 {
  if (typeof window === 'undefined') return createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.eventLedger)) {
      return createDefaultState();
    }
    return reconcileState(parsed as GamificationStateV1);
  } catch {
    return createDefaultState();
  }
}

export function saveGamificationState(state: GamificationStateV1): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save gamification state:', err);
  }
}

// ─── Unique Days / Week Helpers ─────────────────────────────────────

function getUniqueDates(ledger: GamificationEvent[]): Set<string> {
  return new Set(ledger.map(e => e.localDate));
}

function computeQuestProgress(
  ledger: GamificationEvent[],
  weekId: string
): WeeklyQuestProgress {
  // Filter events in the given week by their localDate, ignoring future dates
  const weekEvents = ledger.filter(e => {
    const parts = e.localDate.split('-');
    if (parts.length !== 3) return false;
    const d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    return getLocalWeekId(d) === weekId;
  });

  const checkinDates = new Set(
    weekEvents.filter(e => e.type === 'daily_checkin').map(e => e.localDate)
  );

  return {
    checkinDays: checkinDates.size,
    missionsCompleted: weekEvents.filter(e => e.type === 'mission_complete').length,
    journalEntries: weekEvents.filter(e => e.type === 'journal_entry').length,
  };
}

// ─── Badge Checking ─────────────────────────────────────────────────

export function deriveUnlockedBadgesFromLedger(ledger: GamificationEvent[]): string[] {
  const uniqueDates = new Set(ledger.map(e => e.localDate));

  const totalLangkah = ledger.reduce((sum, e) => sum + e.langkah, 0);
  const currentLevel = computeLevel(totalLangkah);

  const completedQuestWeeks = new Set(
    ledger.filter(e => e.type === 'weekly_quest_complete').map(e => e.id.replace('quest:', ''))
  );

  const badges: string[] = [];

  if (ledger.length >= 1) {
    badges.push('langkah-pertama');
  }
  if (ledger.some(e => e.type === 'journal_entry')) {
    badges.push('berani-jujur');
  }
  if (ledger.some(e => e.type === 'mission_reflection')) {
    badges.push('kasih-ruang');
  }
  if (uniqueDates.size >= 3) {
    badges.push('balik-lagi');
  }
  if (uniqueDates.size >= 7) {
    badges.push('pelan-pelan');
  }
  if (completedQuestWeeks.size >= 1) {
    badges.push('kenal-ritme');
  }
  if (currentLevel >= 3) {
    badges.push('tetap-tumbuh');
  }

  // Check banyak-cara (checkin, mission, journal in same single day)
  const dateTypes = new Map<string, Set<string>>();
  for (const e of ledger) {
    if (['daily_checkin', 'mission_complete', 'journal_entry'].includes(e.type)) {
      if (!dateTypes.has(e.localDate)) dateTypes.set(e.localDate, new Set());
      dateTypes.get(e.localDate)!.add(e.type);
    }
  }
  for (const types of dateTypes.values()) {
    if (types.has('daily_checkin') && types.has('mission_complete') && types.has('journal_entry')) {
      badges.push('banyak-cara');
      break;
    }
  }

  return badges;
}

// ─── Journal Eligibility ────────────────────────────────────────────

/**
 * Checks whether a journal entry is eligible for Langkah reward.
 * - Content must be >= JOURNAL_MIN_CONTENT_LENGTH trimmed characters.
 * - Maximum JOURNAL_DAILY_CAP journal rewards per local calendar day.
 */
export function isJournalEligibleForReward(
  content: string,
  state: GamificationStateV1,
  localDate?: string
): boolean {
  const trimmed = content.trim();
  if (trimmed.length < JOURNAL_MIN_CONTENT_LENGTH) return false;

  const today = localDate ?? getLocalDateString();
  const todayJournalEvents = state.eventLedger.filter(
    e => e.type === 'journal_entry' && e.localDate === today
  );
  return todayJournalEvents.length < JOURNAL_DAILY_CAP;
}

// ─── Core Award Function ────────────────────────────────────────────

/**
 * Idempotently awards Langkah for a completed action.
 * Returns null if the event was already recorded (duplicate).
 *
 * IMPORTANT: This function must ONLY be called AFTER the crisis gate
 * has confirmed the action is NOT a crisis flow.
 */
export function awardLangkah(
  type: GamificationEventType,
  idempotencyKey: string,
  localDate?: string
): CelebrationData | null {
  // Crisis safety invariant: NEVER award Langkah if current path is /crisis
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/crisis')) {
    return null;
  }

  // Load fresh state directly from storage
  let state = loadGamificationState();

  // Idempotency check — skip if already awarded
  if (state.eventLedger.some(e => e.id === idempotencyKey)) {
    return null;
  }

  const langkah = LANGKAH_AMOUNTS[type];
  const effectiveDate = localDate ?? getLocalDateString();

  const event: GamificationEvent = {
    id: idempotencyKey,
    type,
    langkah,
    timestamp: new Date().toISOString(),
    localDate: effectiveDate,
  };

  // Re-read storage right before append to merge any concurrent tab writes
  const latestRaw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (latestRaw) {
    try {
      const latestParsed = JSON.parse(latestRaw);
      if (latestParsed && Array.isArray(latestParsed.eventLedger)) {
        const existingIds = new Set(latestParsed.eventLedger.map((e: any) => e.id));
        if (existingIds.has(idempotencyKey)) {
          return null; // Another tab just awarded this exact event
        }
        for (const ev of state.eventLedger) {
          if (!existingIds.has(ev.id)) {
            latestParsed.eventLedger.push(ev);
          }
        }
        state = reconcileState(latestParsed as GamificationStateV1);
      }
    } catch {
      // ignore
    }
  }

  const previousBadges = new Set(state.unlockedBadgeIds);
  const previousLevel = state.currentLevel;

  state.eventLedger.push(event);
  state = reconcileState(state);

  // Check quest completion for current week
  const currentWeekId = getLocalWeekId();
  let questCompleted = false;
  if (
    !state.completedQuestWeekIds.includes(currentWeekId) &&
    state.questProgress.checkinDays >= WEEKLY_QUEST_REQUIREMENTS.checkinDays &&
    state.questProgress.missionsCompleted >= WEEKLY_QUEST_REQUIREMENTS.missionsCompleted &&
    state.questProgress.journalEntries >= WEEKLY_QUEST_REQUIREMENTS.journalEntries
  ) {
    const questKey = `quest:${currentWeekId}`;
    if (!state.eventLedger.some(e => e.id === questKey)) {
      state.eventLedger.push({
        id: questKey,
        type: 'weekly_quest_complete',
        langkah: WEEKLY_QUEST_REWARD,
        timestamp: new Date().toISOString(),
        localDate: effectiveDate,
      });
      state = reconcileState(state);
      questCompleted = true;
    }
  }

  saveGamificationState(state);

  const newBadges = state.unlockedBadgeIds.filter(id => !previousBadges.has(id));

  return {
    langkahAwarded: langkah + (questCompleted ? WEEKLY_QUEST_REWARD : 0),
    totalLangkah: state.totalLangkah,
    levelUp: state.currentLevel > previousLevel ? state.currentLevel : undefined,
    newBadges: newBadges.length > 0 ? newBadges : undefined,
    questCompleted: questCompleted || undefined,
  };
}

// ─── Ritme (Rolling 7-Day Participation) ────────────────────────────

export interface RitmeDay {
  date: string;
  dayLabel: string;
  active: boolean;
}

/**
 * Returns the rolling 7-day participation view from the event ledger.
 * Each day shows whether the user performed any qualifying action.
 * Excludes future-dated events.
 */
export function getRitme(reference?: Date): RitmeDay[] {
  const state = loadGamificationState();
  const now = reference ?? new Date();
  const todayStr = getLocalDateString(now);

  // Exclude future-dated events from active participation days
  const validEvents = state.eventLedger.filter(e => e.localDate <= todayStr);
  const activeDates = getUniqueDates(validEvents);
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const days: RitmeDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = getLocalDateString(d);
    days.push({
      date: dateStr,
      dayLabel: dayNames[d.getDay()],
      active: activeDates.has(dateStr),
    });
  }
  return days;
}

/**
 * Returns count of active days in the last 7 days.
 */
export function getRitmeActiveCount(reference?: Date): number {
  return getRitme(reference).filter(d => d.active).length;
}

// ─── Level Info Helpers ─────────────────────────────────────────────

export function getCurrentLevelInfo(state: GamificationStateV1): {
  level: number;
  name: string;
  currentLangkah: number;
  nextThreshold: number | null;
  progress: number; // 0–100
} {
  const current = LEVEL_THRESHOLDS[state.currentLevel];
  const next = LEVEL_THRESHOLDS[state.currentLevel + 1] ?? null;

  const progress = next
    ? Math.min(100, Math.round(
        ((state.totalLangkah - current.threshold) /
          (next.threshold - current.threshold)) * 100
      ))
    : 100;

  return {
    level: state.currentLevel,
    name: current.name,
    currentLangkah: state.totalLangkah,
    nextThreshold: next?.threshold ?? null,
    progress,
  };
}
