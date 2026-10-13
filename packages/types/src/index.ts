/**
 * @dengarin/types
 * Core shared TypeScript contracts for Dengar.in
 */

// ==========================================
// 1. User & Demographics
// ==========================================
export type AgeBracket = 
  | '15-17' 
  | '18-29' 
  | '30-49' 
  | '50+' 
  | '18-24' 
  | '25-34' 
  | '35-54';

export type PRDAgeBracket = '15-17' | '18-29' | '30-49' | '50+';

export type TopicPillarId = 'finance' | 'trauma' | 'sexual_violence';

export interface TopicPillarConfig {
  id: TopicPillarId;
  label: string;
  tagline: string;
  description: string;
  icon: string;
  mappedDomains: InterventionDomain[];
  primaryDomain: InterventionDomain;
  isSensitive: boolean;
}

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
  anonymousAlias?: string; // Generated empathetic alias, e.g. "Bunga Tenang #2481" (Zero PII)
  createdAt: string;       // ISO timestamp
  recoveryMnemonic: string; // 12-word seed phrase
  ageBracket?: AgeBracket;
  occupation?: string;     // Context/role (e.g. Pelajar, Mahasiswa, Pekerja, Wirausaha, etc.)
  topicPillar?: TopicPillarId; // PRD 2.0 Primary Topic Pillar
  primaryDomain?: InterventionDomain; // Life-context domain
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
// 4. Assessment Contracts (Adaptive & Non-Diagnostic)
// ==========================================
export type NonDiagnosticSeverityLevel = 'MILD' | 'MODERATE' | 'SEVERE';

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

// PRD 2.0 Adaptive Assessment Contracts
export interface AdaptiveAssessmentOption {
  id: string;
  label: string;
  score: number; // 0 to 3 points
  nextQuestionId?: string | null; // dynamic branching target; null = finalize
}

export interface AdaptiveAssessmentQuestion {
  id: string;
  topic: TopicPillarId | 'general';
  ageGroups?: AgeBracket[];
  text: string;
  subtext?: string;
  sensitive: boolean;
  skippable: boolean;
  options: AdaptiveAssessmentOption[];
  defaultNextQuestionId?: string | null;
  scoringCategory: 'emotional_load' | 'context_impact' | 'functional_impact' | 'acute_distress' | 'support_readiness';
}

export interface AssessmentDraft {
  currentQuestionId: string;
  topic: TopicPillarId | 'general';
  ageBracket: AgeBracket;
  answers: Record<string, number>;
  skippedQuestionIds: string[];
  lastUpdated: string;
}

export interface AssessmentSubmission {
  userId: string;
  ageBracket: AgeBracket;
  topicPillar?: TopicPillarId;
  domain: InterventionDomain;
  responses: AssessmentResponse[];
  freeTextNote?: string;
  timestamp: string;
}

export interface AssessmentEvaluation {
  distressScore: number;
  normalizedLevel: 'mild' | 'moderate' | 'high'; // backward compatibility
  severityLevel?: NonDiagnosticSeverityLevel;     // PRD 2.0 triage level (MILD | MODERATE | SEVERE)
  recommendedPathId: string;
  summaryFeedback: string;
  recommendedSupportSpaces?: string[];
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

// ==========================================
// 9. Supportive Gamification — "Perjalanan Kecil" V1
// ==========================================

export type GamificationEventType =
  | 'daily_checkin'
  | 'mission_complete'
  | 'journal_entry'
  | 'mission_reflection'
  | 'weekly_quest_complete'
  | 'weekly_reflection';

export interface GamificationEvent {
  /** Idempotency key, e.g. "checkin:2026-09-21" */
  id: string;
  type: GamificationEventType;
  langkah: number;
  timestamp: string;
  /** YYYY-MM-DD in user's local timezone at time of event */
  localDate: string;
}

export interface WeeklyQuestProgress {
  checkinDays: number;
  missionsCompleted: number;
  journalEntries: number;
}

export interface GamificationStateV1 {
  version: 1;
  /** Append-only idempotent event ledger */
  eventLedger: GamificationEvent[];
  /** Cached sum — re-derivable from ledger */
  totalLangkah: number;
  /** 0-indexed into LEVEL_THRESHOLDS */
  currentLevel: number;
  /** Badge IDs that have been unlocked */
  unlockedBadgeIds: string[];
  /** ISO week ID of the active quest, e.g. "2026-W38" */
  activeQuestWeekId: string;
  /** Current quest progress (derived from ledger) */
  questProgress: WeeklyQuestProgress;
  /** Week IDs where the quest was completed */
  completedQuestWeekIds: string[];
}

export interface CelebrationData {
  langkahAwarded: number;
  totalLangkah: number;
  levelUp?: number;
  newBadges?: string[];
  questCompleted?: boolean;
}

export interface LevelDefinition {
  name: string;
  threshold: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
}


// ==========================================
// Care Passport (AMD Track 2) — schema version 1
// See docs/AMD_TRACK2_DEVELOPMENT_PLAN.md §3 and §5B.
// ==========================================

/**
 * Where a Care Passport fact comes from.
 * - `user_input`: quoted verbatim from the sanitized text the user submitted.
 * - `user_confirmed`: the user added or corrected it in the review UI. Only the
 *   client review flow may set this; model output claiming it is downgraded.
 * - `unknown`: not stated; `value` is null.
 */
export type EvidenceSource = 'user_input' | 'user_confirmed' | 'unknown';

/**
 * F-A "Bukti Bertanggal": where a piece of input text came from.
 * - `intake`: the story typed on the Care Passport page.
 * - `journal` / `checkin`: an entry the user explicitly selected from the
 *   device's local storage. Never read or sent without that selection.
 * - `clarification`: an answer to one NEEDS_CLARIFICATION question.
 */
export type CarePassportSegmentKind = 'intake' | 'journal' | 'checkin' | 'clarification';

export interface CarePassportSegment {
  /** Client-generated, stable within one request, e.g. `journal:1727150000000`. */
  id: string;
  kind: CarePassportSegmentKind;
  /** Local calendar date `YYYY-MM-DD` of the entry (journal / check-in). */
  date?: string;
  /** Segment text. Raw on the request; sanitized once the server has redacted it. */
  text: string;
}

/** Points an accepted fact back at the segment its quote was found in. */
export interface EvidenceRef {
  segmentId: string;
  kind: CarePassportSegmentKind;
  date?: string;
}

export interface EvidenceField {
  value: string | null;
  source: EvidenceSource;
  /** Exact phrase from the sanitized input backing `value` (required for `user_input`). */
  sourceQuote?: string;
  needsReview: boolean;
  /** Filled by the server after grounding: the single segment containing `sourceQuote`. */
  sourceRef?: EvidenceRef;
}

/** Measured completeness of the three core facts; never a model "confidence". */
export interface CarePassportCompleteness {
  known: number;
  total: number;
  unknownLabels: string[];
}

export type CarePassportReviewStatus = 'user_pending' | 'user_approved';

export interface CarePassport {
  version: 1;
  subject: 'anonymous_adult';
  concerns: EvidenceField[];
  dailyImpact: EvidenceField[];
  duration: EvidenceField;
  relevantContext: EvidenceField[];
  questionsForProfessional: string[];
  /** Plain-language names of the information that is still missing. */
  unknowns: string[];
  disclaimer: string;
  reviewStatus: CarePassportReviewStatus;
}

export type CarePassportResultState =
  /** Structured and traceable, waiting for the user to review and approve. */
  | 'READY_FOR_USER_REVIEW'
  /** Key facts missing or untraceable; at most one targeted question is asked. */
  | 'NEEDS_CLARIFICATION'
  /** Informational suggestion to talk to a professional. Not a triage or diagnosis. */
  | 'HUMAN_SUPPORT_RECOMMENDED'
  /** Deterministic crisis indicator or explicit urgent-help request; ordinary AI never runs. */
  | 'IMMEDIATE_HELP_SCREEN'
  /** AI inference failed; a labelled rules-based path is returned instead of a summary. */
  | 'PROVIDER_UNAVAILABLE';

export interface CarePassportProvenance {
  /** Provider id that produced the draft, e.g. `amd:<model>`; `none` when no AI ran. */
  providerId: string;
  /** True only when the accepted draft was generated on AMD infrastructure. */
  isAmd: boolean;
  /** True when no AI draft is shown (fallback / crisis path). */
  isFallback: boolean;
  latencyMs?: number;
}

export interface CarePassportResult {
  state: CarePassportResultState;
  passport?: CarePassport;
  /** Present only for NEEDS_CLARIFICATION. */
  clarificationQuestion?: string;
  /** Present only for IMMEDIATE_HELP_SCREEN. */
  emergencyContacts?: EmergencyContact[];
  provenance: CarePassportProvenance;
  /** Claims removed during grounding, for audit/eval; never shown as facts. */
  droppedClaims: number;
  warnings: string[];
  /** Present whenever a passport is; counts facts, not confidence. */
  completeness?: CarePassportCompleteness;
}
