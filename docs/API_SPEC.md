# INTERNAL API & CONTRACT SPECIFICATION — Dengar.in

**Document Version**: 1.0.0 (Foundation)  

---

## 1. Safety & Crisis Engine Contract (`services/crisis-engine`)

```typescript
export type CrisisSeverity = 'none' | 'low' | 'moderate' | 'high' | 'crisis';

export interface EmergencyContact {
  id: string;
  name: string;
  category: 'national_emergency' | 'crisis_hotline' | 'teen_protection' | 'financial_advocacy';
  phone?: string;
  whatsapp?: string;
  website?: string;
  availableHours: string;
  cost: 'gratis' | 'tarif_standar';
  description: string;
  targetAgeBrackets: Array<'15-17' | '18-24' | '25-34' | '35-54'>;
}

export interface CrisisEvaluationResult {
  isCrisis: boolean;
  severity: CrisisSeverity;
  triggeredPatterns: string[];
  matchedDomain?: 'suicide' | 'self_harm' | 'acute_violence' | 'extreme_hopelessness';
  emergencyContacts: EmergencyContact[];
  immediateInterventionCopy: string;
}

/**
 * Pure deterministic crisis evaluation.
 * ZERO AI/LLM dependency. Operates purely in memory.
 */
export function evaluateCrisisInput(
  text: string, 
  userAgeBracket?: '15-17' | '18-24' | '25-34' | '35-54'
): CrisisEvaluationResult;
```

---

## 2. AI Action Schema & Validator Contract (`services/validator`)

```typescript
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

/**
 * Validates AI JSON output against strict whitelist.
 */
export function validateAIOutput(rawOutput: unknown): ValidationResult;
```

---

## 3. Generic Assessment Interfaces (`packages/types`)

Per user directive, we do not lock in a single clinical instrument in Sprint 0, but provide generic, extensible interfaces adaptable for DASS-21 ringkas, PHQ-9, or contextual well-being instruments:

```typescript
export interface AssessmentQuestion {
  id: string;
  text: string;
  category: 'emotional' | 'context_impact' | 'daily_functioning' | 'resilience';
  scaleType: 'likert_4' | 'likert_5' | 'binary' | 'text';
  options?: { value: number; label: string }[];
}

export interface AssessmentResponse {
  questionId: string;
  value: number | string;
}

export interface AssessmentSubmission {
  userId: string;
  ageBracket: '15-17' | '18-24' | '25-34' | '35-54';
  domain: string;
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
```

---

## 4. Local Anonymous Storage Contract (`apps/web/src/lib/storage.ts`)

```typescript
export interface AnonymousUserSession {
  userId: string;          // UUID v4
  createdAt: string;       // ISO timestamp
  recoveryMnemonic: string; // 12-word seed phrase
  ageBracket?: '15-17' | '18-24' | '25-34' | '35-54';
  primaryDomain?: string;
  consentGiven: boolean;
  consentTimestamp?: string;
}
```
Stored exclusively in client browser storage (`localStorage`), strictly guarding user privacy.
