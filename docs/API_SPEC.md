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

## 4a. AI Orchestrator Contract (`services/orchestrator`)

```typescript
export type OrchestratorTier = 'primary' | 'secondary' | 'fallback';

export interface OrchestratorRequest {
  message: string;
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
}

export interface OrchestratorResult {
  tier: OrchestratorTier;
  providerId: string;
  action: ValidatedAIAction;
  warnings: string[];
}

/**
 * Runs the tiered pipeline from docs/AI_POLICY.md:
 * Tier 1 DeepSeek V4 Flash -> Tier 2 OpenRouter -> Tier 3 deterministic
 * fallback. Every tier's raw output is passed through
 * services/validator#validateAIOutput before being returned; an invalid or
 * unconfigured tier is skipped, never surfaced to the caller.
 *
 * CALLER CONTRACT: the request MUST already be cleared by
 * services/crisis-engine#evaluateCrisisInput (Step 0). This function has no
 * crisis-detection authority and can never override that gate.
 */
export function runOrchestrator(
  request: OrchestratorRequest,
  deps?: { providers?: LLMProvider[]; timeoutMs?: number }
): Promise<OrchestratorResult>;
```

---

## 4b. Persistence Contract (`services/persistence`)

```typescript
export type ForumModerationStatus = 'pending_review' | 'approved' | 'rejected';

export interface ForumPostRecord {
  id: string;
  authorPseudonym: string;
  domain: InterventionDomain;
  title: string;
  body: string;
  createdAt: string;
  moderationStatus: ForumModerationStatus; // always created as 'pending_review'
  supportCount: number;
}

export interface ForumRepository {
  create(input: CreateForumPostInput): Promise<ForumPostRecord>;
  listApproved(limit?: number): Promise<ForumPostRecord[]>;
  listPendingReview(limit?: number): Promise<ForumPostRecord[]>;
  moderate(postId: string, status: ForumModerationStatus): Promise<ForumPostRecord | undefined>;
}

export interface SyncedSessionRecord {
  mnemonicHash: string;   // hash of the 12-word recovery mnemonic; server never sees the phrase itself
  encryptedBlob: string;  // opaque, client-encrypted payload
  updatedAt: string;
}

export interface SyncRepository {
  get(mnemonicHash: string): Promise<SyncedSessionRecord | undefined>;
  upsert(record: SyncedSessionRecord): Promise<SyncedSessionRecord>;
}
```

Sprint 0/1 ships `createInMemoryForumRepository()` / `createInMemorySyncRepository()`. Sprint 2+ adds a PostgreSQL/Supabase adapter implementing the same two interfaces — callers (the Next.js API routes) never need to change.

---

## 4c. Backend HTTP API (`apps/web/src/app/api`)

All routes are Next.js Route Handlers. Responses are `{ ok: true, data }` or `{ ok: false, error, details? }`.

### `GET /api/health`
Returns `{ ok: true, service: 'dengarin-api', status: 'healthy' }`.

### `POST /api/chat`
Request:
```typescript
{ sessionId?: string; message: string; ageBracket?: AgeBracket; domain?: InterventionDomain }
```
Pipeline: rate limit (per `sessionId`/IP) → **Step 0** deterministic crisis gate (`services/crisis-engine`) → if crisis, respond immediately with `{ crisis: true, evaluation: CrisisEvaluationResult }` and halt (no AI call is ever made) → otherwise `services/orchestrator#runOrchestrator` → respond `{ crisis: false, tier, providerId, action, disclaimer, warnings }`.

### `GET /api/forum`
Returns `{ posts: ForumPostRecord[] }` — approved posts only.

### `POST /api/forum`
Request: `{ authorPseudonym?: string; domain: InterventionDomain; title: string; body: string }`.
`title` + `body` are scanned by the crisis gate before persisting; on a crisis match, responds `{ crisis: true, evaluation }` without saving the post. Otherwise creates the post (always `moderationStatus: 'pending_review'`) and responds `201 { crisis: false, post }`.

### `PATCH /api/forum/[postId]/moderate`
Request: `{ status: 'approved' | 'rejected' }`. Returns the updated `ForumPostRecord`, or `404` if not found.
**No authentication yet** — must be gated behind a moderator/admin session before any public deployment (see README Roadmap, Sprint 2+).

### `POST /api/report/weekly`
Request: `{ weekStarting?: string; checkins: DailyCheckin[]; missions: DailyMission[] }` — the client's own local history (Dengar.in stores check-ins/missions in the browser, not on the server). Stateless: computes and returns `{ summary: WeeklyReportSummary }` without persisting anything.

### `GET /api/sync?mnemonicHash=<hash>`
Returns `{ record: SyncedSessionRecord }`, or `404` if nothing is stored for that hash.

### `PUT /api/sync`
Request: `{ mnemonicHash: string; encryptedBlob: string }`. Upserts and returns the stored `SyncedSessionRecord`. The server only ever stores/returns the opaque `encryptedBlob` — encryption/decryption happens client-side using the user's 12-word recovery mnemonic (not yet implemented; this route only demonstrates the storage contract).

---

## 4d. Environment Variables (`.env.example`)

| Variable | Consumed by | Purpose |
|---|---|---|
| `DEEPSEEK_API_KEY` | `services/orchestrator` (Tier 1) | DeepSeek V4 Flash API key |
| `OPENROUTER_API_KEY` | `services/orchestrator` (Tier 2) | OpenRouter fallback API key |
| `DATABASE_URL` | *(planned)* future `services/persistence` adapter | PostgreSQL/Supabase connection string |

---

## 5. Local Anonymous Storage Contract (`apps/web/src/lib/storage.ts`)

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
