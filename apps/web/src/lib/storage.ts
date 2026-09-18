import type { 
  AnonymousUserSession, 
  AgeBracket, 
  InterventionDomain,
  TopicPillarId,
  AssessmentEvaluation,
  AssessmentDraft,
  DailyCheckin,
  DailyMission
} from '@dengarin/types';
import { DOMAIN_MISSION_TEMPLATES } from '@dengarin/config';

const STORAGE_KEY = 'dengarin_anonymous_session';
const CHECKINS_KEY = 'dengarin_checkins';
const DRAFT_STORAGE_KEY = 'dengarin_assessment_draft';
const MISSION_KEY_PREFIX = 'dengarin_mission_';

// Curated calm wordlist for 12-word recovery mnemonics
const MNEMONIC_WORDS = [
  'samudra', 'lentera', 'harmoni', 'fajar', 'damai', 'teduh',
  'kelana', 'mentari', 'rimba', 'saujana', 'hening', 'aksara',
  'melati', 'swara', 'embun', 'cakrawala', 'sejuk', 'cahaya',
  'senja', 'kidung', 'nirmala', 'pelita', 'bumi', 'lestari'
];

// Curated non-PII words for anonymous identity generation (e.g. "Bunga Tenang #2481")
const ALIAS_NOUNS = [
  'Bunga', 'Embun', 'Lentera', 'Samudra', 'Fajar', 'Senja',
  'Cakrawala', 'Rimba', 'Awan', 'Kidung', 'Pelita', 'Bintang',
  'Pohon', 'Hujan', 'Mentari', 'Sungai', 'Angin', 'Daun'
];

const ALIAS_ADJECTIVES = [
  'Tenang', 'Damai', 'Teduh', 'Hening', 'Sejuk', 'Hangat',
  'Sabar', 'Jernih', 'Lembut', 'Bijak', 'Sentosa', 'Tabah',
  'Tegar', 'Ikhlas', 'Lega'
];

/**
 * Generate a random empathetic Indonesian alias without any PII (e.g. "Bunga Tenang #2481")
 */
export function generateAnonymousAlias(): string {
  const noun = ALIAS_NOUNS[Math.floor(Math.random() * ALIAS_NOUNS.length)];
  const adj = ALIAS_ADJECTIVES[Math.floor(Math.random() * ALIAS_ADJECTIVES.length)];
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit code
  return `${noun} ${adj} #${num}`;
}

/**
 * Generate a random 12-word recovery mnemonic
 */
export function generateRecoveryMnemonic(): string {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * MNEMONIC_WORDS.length);
    words.push(MNEMONIC_WORDS[randomIndex]);
  }
  return words.join(' ');
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieve current anonymous session from browser localStorage
 */
export function getAnonymousSession(): AnonymousUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as AnonymousUserSession;
    if (!parsed.anonymousAlias) {
      parsed.anonymousAlias = generateAnonymousAlias();
      saveAnonymousSession(parsed);
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Initialize or get active anonymous session
 */
export function initAnonymousSession(consentGiven: boolean = false): AnonymousUserSession {
  const existing = getAnonymousSession();
  if (existing) {
    if (!existing.anonymousAlias) {
      existing.anonymousAlias = generateAnonymousAlias();
      saveAnonymousSession(existing);
    }
    if (consentGiven && !existing.consentGiven) {
      existing.consentGiven = true;
      existing.consentTimestamp = new Date().toISOString();
      saveAnonymousSession(existing);
    }
    return existing;
  }

  const newSession: AnonymousUserSession = {
    userId: generateUUID(),
    anonymousAlias: generateAnonymousAlias(),
    createdAt: new Date().toISOString(),
    recoveryMnemonic: generateRecoveryMnemonic(),
    consentGiven,
    consentTimestamp: consentGiven ? new Date().toISOString() : undefined,
    currentDay: 1
  };

  saveAnonymousSession(newSession);
  return newSession;
}

/**
 * Save updated anonymous session
 */
export function saveAnonymousSession(session: AnonymousUserSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save anonymous session:', err);
  }
}

/**
 * Update user demographics / context
 */
export function updateUserContext(
  ageBracket?: AgeBracket,
  occupation?: string,
  primaryDomain?: InterventionDomain,
  topicPillar?: TopicPillarId
): AnonymousUserSession | null {
  const session = getAnonymousSession() || initAnonymousSession(true);

  if (ageBracket) session.ageBracket = ageBracket;
  if (occupation) session.occupation = occupation;
  if (primaryDomain) session.primaryDomain = primaryDomain;
  if (topicPillar) session.topicPillar = topicPillar;

  saveAnonymousSession(session);
  return session;
}

/**
 * Save & Resume: Save in-progress assessment draft
 */
export function saveAssessmentDraft(draft: AssessmentDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error('Failed to save assessment draft:', err);
  }
}

/**
 * Save & Resume: Get in-progress assessment draft
 */
export function getAssessmentDraft(): AssessmentDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AssessmentDraft;
  } catch {
    return null;
  }
}

/**
 * Save & Resume: Clear in-progress assessment draft
 */
export function clearAssessmentDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear assessment draft:', err);
  }
}

/**
 * Save Assessment Evaluation Result (Triage)
 */
export function saveAssessmentResult(evaluation: AssessmentEvaluation): void {
  const session = getAnonymousSession() || initAnonymousSession(true);
  session.assessmentResult = evaluation;
  session.activePathId = evaluation.recommendedPathId;
  saveAnonymousSession(session);
  clearAssessmentDraft(); // Clear any draft upon finalizing
}

/**
 * Get Assessment Evaluation Result
 */
export function getAssessmentResult(): AssessmentEvaluation | null {
  const session = getAnonymousSession();
  return session?.assessmentResult || null;
}

/**
 * Get all check-in entries
 */
export function getDailyCheckins(): DailyCheckin[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DailyCheckin[];
  } catch {
    return [];
  }
}

/**
 * Save a new daily check-in
 */
export function saveDailyCheckin(checkin: DailyCheckin): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getDailyCheckins();
    list.unshift(checkin);
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save checkin:', err);
  }
}

/**
 * Get today's checkin if already completed
 */
export function getTodayCheckin(): DailyCheckin | null {
  const list = getDailyCheckins();
  if (list.length === 0) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const found = list.find(c => c.timestamp.slice(0, 10) === todayStr);
  return found || null;
}

/**
 * Get today's mission tailored to user's domain
 */
export function getTodayMission(domain?: InterventionDomain): DailyMission {
  const effectiveDomain = domain || getAnonymousSession()?.primaryDomain || 'general';
  const template = DOMAIN_MISSION_TEMPLATES[effectiveDomain] || DOMAIN_MISSION_TEMPLATES.general;
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const completionKey = `${MISSION_KEY_PREFIX}${todayStr}_completed`;
  const isDone = typeof window !== 'undefined' && localStorage.getItem(completionKey) === 'true';

  return {
    ...template,
    completed: isDone
  };
}

/**
 * Mark today's mission as completed
 */
export function completeTodayMission(reflection?: string): void {
  if (typeof window === 'undefined') return;
  const todayStr = new Date().toISOString().slice(0, 10);
  localStorage.setItem(`${MISSION_KEY_PREFIX}${todayStr}_completed`, 'true');
  if (reflection) {
    localStorage.setItem(`${MISSION_KEY_PREFIX}${todayStr}_reflection`, reflection);
  }

  // Increment current day in session if not yet incremented
  const session = getAnonymousSession();
  if (session && (!session.currentDay || session.currentDay < 14)) {
    session.currentDay = (session.currentDay || 1) + 1;
    saveAnonymousSession(session);
  }
}

/**
 * Check if today's mission is completed
 */
export function isTodayMissionCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return localStorage.getItem(`${MISSION_KEY_PREFIX}${todayStr}_completed`) === 'true';
}

/**
 * Get stored mission reflection
 */
export function getTodayMissionReflection(): string {
  if (typeof window === 'undefined') return '';
  const todayStr = new Date().toISOString().slice(0, 10);
  return localStorage.getItem(`${MISSION_KEY_PREFIX}${todayStr}_reflection`) || '';
}

/**
 * Wipe anonymous data completely
 */
export function clearAnonymousSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHECKINS_KEY);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    localStorage.removeItem('dengarin_journal_entries');
    // Clear mission keys
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.removeItem(`${MISSION_KEY_PREFIX}${todayStr}_completed`);
    localStorage.removeItem(`${MISSION_KEY_PREFIX}${todayStr}_reflection`);
  } catch (err) {
    console.error('Failed to wipe anonymous data:', err);
  }
}
