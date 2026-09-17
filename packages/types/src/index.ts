/**
 * @dengarin/types
 * Core shared TypeScript contracts for Dengar.in
 */

// ==========================================
// 1. User & Demographics
// ==========================================
export type AgeBracket = '15-17' | '18-24' | '25-34' | '35-54';

export type InterventionDomain = 
  | 'school'       // SMA / SMK (exams, peers, expectations)
  | 'campus'       // University (thesis, adapt, majors)
  | 'work'         // Burnout, layoffs, career
  | 'finance'      // Debt, pinjol ilegal, sandwich generation
  | 'relationship' // Breakup, friends, social
  | 'family'       // Family friction, parent-child
  | 'loneliness'   // Social isolation
  | 'general';     // Unspecified distress

export interface AnonymousUserSession {
  userId: string;          // Cryptographic UUID v4
  createdAt: string;       // ISO timestamp
  recoveryMnemonic: string; // 12-word seed phrase
  ageBracket?: AgeBracket;
  occupation?: string;     // Context/role (e.g. Pelajar, Mahasiswa, Pekerja, Wirausaha, etc.)
  primaryDomain?: InterventionDomain;
  consentGiven: boolean;
  consentTimestamp?: string;
  assessmentResult?: AssessmentEvaluation;
  activePathId?: string;
  currentDay?: number;
}

// ==========================================
// 2. Safety & Crisis Engine Contracts
// ==========================================
export type CrisisSeverity = 'none' | 'low' | 'moderate' | 'high' | 'crisis';

export type HotlineCategory = 
  | 'national_emergency' 
  | 'crisis_hotline' 
  | 'teen_protection' 
  | 'financial_advocacy';

export interface EmergencyContact {
  id: string;
  name: string;
  category: HotlineCategory;
  phone?: string;
  whatsapp?: string;
  website?: string;
  availableHours: string;
  cost: 'gratis' | 'tarif_standar';
  description: string;
  targetAgeBrackets: AgeBracket[];
  verificationStatus: 'verified_official' | 'todo_human_verification';
}

export interface CrisisEvaluationResult {
  isCrisis: boolean;
  severity: CrisisSeverity;
  triggeredPatterns: string[];
  matchedDomain?: 'suicide' | 'self_harm' | 'acute_violence' | 'extreme_hopelessness';
  emergencyContacts: EmergencyContact[];
  immediateInterventionCopy: string;
}

// ==========================================
// 3. AI Orchestrator Action Contracts
// ==========================================
export type WhitelistedAIAction = 
  | 'chat'
  | 'suggest_mission'
  | 'open_journal_prompt'
  | 'suggest_forum'
  | 'adjust_path'
  | 'show_help_directory';

export interface BaseAIActionPayload {
  action: WhitelistedAIAction;
  disclaimer: string;
}

export interface ChatActionPayload extends BaseAIActionPayload {
  action: 'chat';
  message: string;
}

export interface SuggestMissionPayload extends BaseAIActionPayload {
  action: 'suggest_mission';
  missionId: string;
  reason: string;
}

export interface OpenJournalPromptPayload extends BaseAIActionPayload {
  action: 'open_journal_prompt';
  prompt: string;
  suggestedTags: string[];
}

export interface SuggestForumPayload extends BaseAIActionPayload {
  action: 'suggest_forum';
  topicSlug: string;
}

export interface AdjustPathPayload extends BaseAIActionPayload {
  action: 'adjust_path';
  recommendedPace: 'slower' | 'standard' | 'accelerated';
  reason: string;
}

export interface ShowHelpDirectoryPayload extends BaseAIActionPayload {
  action: 'show_help_directory';
  category: 'counseling' | 'financial' | 'teen';
}

export type ValidatedAIAction = 
  | ChatActionPayload
  | SuggestMissionPayload
  | OpenJournalPromptPayload
  | SuggestForumPayload
  | AdjustPathPayload
  | ShowHelpDirectoryPayload;

export interface ValidationResult {
  isValid: boolean;
  action?: ValidatedAIAction;
  sanitized: boolean;
  errors: string[];
}

// ==========================================
// 4. Generic Assessment Contracts (Extensible)
// ==========================================
export interface AssessmentOption {
  value: number;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  category: 'emotional' | 'context_impact' | 'daily_functioning' | 'resilience';
  scaleType: 'likert_4' | 'likert_5' | 'binary' | 'text';
  options?: AssessmentOption[];
}

export interface AssessmentResponse {
  questionId: string;
  value: number | string;
}

export interface AssessmentSubmission {
  userId: string;
  ageBracket: AgeBracket;
  domain: InterventionDomain;
  responses: AssessmentResponse[];
  freeTextNote?: string;
  timestamp: string;
}

export interface AssessmentEvaluation {
  distressScore: number;
  normalizedLevel: 'mild' | 'moderate' | 'high';
  recommendedPathId: string;
  summaryFeedback: string;
}

// ==========================================
// 5. Missions & Intervention Paths
// ==========================================
export interface DailyMission {
  id: string;
  domain: InterventionDomain;
  title: string;
  summary: string;
  durationMinutes: number;
  steps: string[];
  reflectionQuestion: string;
  completed: boolean;
  completedAt?: string;
}

export interface MissionPath {
  id: string;
  domain: InterventionDomain;
  title: string;
  description: string;
  totalDays: number;
  currentDay: number;
  missions: DailyMission[];
}

// ==========================================
// 6. Check-in & Mood Tracking
// ==========================================
export type MoodScore = 'sangat_baik' | 'baik' | 'netral' | 'berat' | 'kewalahan';

export interface DailyCheckin {
  id: string;
  userId: string;
  timestamp: string;
  mood: MoodScore;
  energyLevel: number; // 1 to 10
  stressorTags: string[];
  briefNote?: string;
}

// ==========================================
// 7. Local Private Journal
// ==========================================
export interface JournalEntry {
  id: string;
  userId: string;
  createdAt: string;
  title?: string;
  content: string;
  promptUsed?: string;
  tags: string[];
}

// ==========================================
// 8. Skeletons for Sprint 0 (Report & Forum)
// ==========================================
export interface WeeklyReportSummary {
  weekStarting: string;
  totalCheckins: number;
  completedMissionsCount: number;
  dominantMood: MoodScore;
  keyObservation: string;
  encouragementNote: string;
}

export interface AnonymousForumPostSkeleton {
  id: string;
  authorPseudonym: string;
  domain: InterventionDomain;
  previewTitle: string;
  bodySnippet: string;
  createdAt: string;
  supportCount: number;
}
