# INTERNAL API & CONTRACT SPECIFICATION — Dengar.in

**Document Version**: 1.1.0  
**Last reconciled with code**: 14 Oct 2026 (working tree on `main`). Sections 4a–4d were rewritten from the route handlers in `apps/web/src/app/api/**`, `apps/web/src/lib/api/*`, `services/orchestrator` and `services/persistence/src/types.ts` (GAP_AUDIT M8, L2). The chat changes for GAP_AUDIT H3 (support pathway), H6 (cache opt-in) and M10 (turn budget) landed in the working tree on 14 Oct 2026 and are documented as code.  

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
  targetAgeBrackets: AgeBracket[];
  verificationStatus: 'verified_official' | 'todo_human_verification';
}

// packages/types: PRD brackets plus legacy ones, both accepted everywhere.
export type AgeBracket = '15-17' | '18-29' | '30-49' | '50+' | '18-24' | '25-34' | '35-54';

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
  userAgeBracket?: AgeBracket   // default '18-24'; an unknown bracket yields the FULL contact list, never an empty one
): CrisisEvaluationResult;
```

`severity` is `'crisis'` (→ `isCrisis: true`, every route halts AI) or `'high'` (distress without explicit lethal intent; `isCrisis` stays `false`) or `'none'`. See [SAFETY.md](SAFETY.md) for how each route treats `high`.

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

Two pipelines live in this package. Full policy: [AI_POLICY.md](AI_POLICY.md).

### Companion chat (`orchestrator.ts`)

```typescript
// 'secondary' exists in the type but the default chain never produces it.
export type OrchestratorTier = 'primary' | 'secondary' | 'tertiary' | 'fallback';

export interface ChatHistoryEntry { sender: 'user' | 'assistant'; text: string; }

export interface OrchestratorRequest {
  message: string;
  history?: ChatHistoryEntry[];
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
}

export interface OrchestratorResult {
  tier: OrchestratorTier;
  providerId: string;   // e.g. 'deepseek:deepseek-flash', 'deepseek:deepseek-flash+openrouter:<model>',
                        // 'gemini:gemini-3.1-flash-lite', 'guardrail:domain-gate', 'deterministic-fallback'
  action: ValidatedAIAction;
  debiased?: boolean;
  warnings: string[];   // operator-facing; routes must pass them through toPublicWarnings()
}

export interface OrchestratorDependencies {
  providers?: LLMProvider[];        // default [createDeepseekProvider(), createGeminiProvider()]
  debiaserProvider?: LLMProvider;   // default createOpenrouterProvider()
  enableDebiaser?: boolean;         // default true (runs only if configured and DENGARIN_DEBIASER is not off)
  timeoutMs?: number;               // per-provider ceiling, default 15000
  turnBudgetMs?: number;            // whole turn, default 18000; debiaser ≤ 10000 and skipped below 3000 left,
                                    // a further tier skipped below 2000 left
  now?: () => number;               // clock injection for tests
  env?: Record<string, string | undefined>;
}

/**
 * Domain gate (no LLM) -> Tier "primary" DeepSeek (direct, api.deepseek.com) ->
 * Tier "tertiary" Gemini -> deterministic fallback. Each valid tier draft may be
 * rewritten by the OpenRouter debiaser and is validated again before return.
 *
 * CALLER CONTRACT: the request MUST already be cleared by
 * services/crisis-engine#evaluateCrisisInput (Step 0). This function has no
 * crisis-detection authority and can never override that gate.
 */
export function runOrchestrator(request: OrchestratorRequest, deps?: OrchestratorDependencies): Promise<OrchestratorResult>;
```

### CareBridge pipelines (`carePassportPipeline.ts`, `openingLinesPipeline.ts`)

```typescript
export function runCarePassportPipeline(
  input: { rawText: string; sanitizedText: string; aiConsent: boolean; segments?: CarePassportSegment[] },
  options?: { providers?: LLMProvider[]; timeoutMs?: number; now?: () => number }
): Promise<CarePassportResult>;   // packages/types, 5 states

export function runOpeningLinesPipeline(
  input: { passport: CarePassport; destination: HelpDestinationId; aiConsent: boolean },
  options?: { providers?: LLMProvider[]; timeoutMs?: number; now?: () => number }
): Promise<OpeningLinesResult>;   // state 'READY' | 'FALLBACK_TEMPLATE' | 'IMMEDIATE_HELP_SCREEN'

export function isUrgentHelpRequest(text: string): boolean;
```

Default providers for both: `[createAmdProvider()]` when `AMD_BASE_URL` and `AMD_MODEL` are set, otherwise `[]`. Timeout `AMD_TIMEOUT_MS`, default 12000.

### AMD provider (`providers/amdProvider.ts`)

```typescript
export function createAmdProvider(config?: { baseUrl?; apiKey?; model?; jsonMode?; fetchImpl? }):
  LLMProvider & { readonly isAmd: true };          // id 'amd:<AMD_MODEL>'
export function probeAmdEndpoint(config?): Promise<{ ok; models: string[]; chatOk; jsonModeOk: boolean | null; latencyMs: number | null; error? }>;
export function normalizeAmdBaseUrl(raw: string): string;   // always ends in '/v1'
```

---

## 4b. Persistence Contract (`services/persistence`)

Source: `services/persistence/src/types.ts`.

```typescript
export type ForumModerationStatus = 'pending_review' | 'approved' | 'rejected';
export type ForumReplyState = 'open' | 'locked';
export type ForumReportReason =
  | 'harassment_or_bullying' | 'self_harm_or_dangerous_advice' | 'contact_or_privacy'
  | 'scam_or_spam' | 'impersonation' | 'other_safety';

export interface ForumPostRecord {
  id: string;
  authorPseudonym: string;
  domain: InterventionDomain;
  title: string;
  body: string;
  createdAt: string;
  moderationStatus: ForumModerationStatus; // set by automated moderation at creation (see POST /api/forum)
  supportCount: number;
  replyState: ForumReplyState;
  replyCount: number;                       // approved replies only
}

export interface ForumReplyRecord {
  id: string;
  storyId: string;
  parentReplyId: string | null;
  authorAlias: string;                      // server-generated, stable per (story, threadKey)
  body: string;
  moderationStatus: ForumModerationStatus;
  createdAt: string;
  moderatedAt: string | null;
  replyingToAlias: string | null;           // only for an approved, visible parent
  parentContextUnavailable: boolean;
}

export interface ForumReplyPage { replies: ForumReplyRecord[]; nextCursor: string | null; approvedCount: number; }

export interface ForumRepository {
  create(input: CreateForumPostInput): Promise<ForumPostRecord>;
  listApproved(limit?: number, domain?: InterventionDomain): Promise<ForumPostRecord[]>;
  listPendingReview(limit?: number): Promise<ForumPostRecord[]>;
  moderate(postId: string, status: ForumModerationStatus): Promise<ForumPostRecord | undefined>;
  incrementSupport(postId: string): Promise<ForumPostRecord | undefined>;
  createReply(input: CreateForumReplyInput): Promise<ForumReplyRecord | undefined>;
  listApprovedReplies(storyId: string, limit: number, cursor?: string): Promise<ForumReplyPage | undefined>;
  createReplyReport(input: CreateForumReplyReportInput): Promise<boolean>;
  moderateReply(replyId: string, status: ForumModerationStatus): Promise<ForumReplyRecord | undefined>;
  getReplyStats(storyIds: string[]): Promise<Record<string, ForumReplyStats>>;
}

/** Legacy (pre-v2) backup keyed by a hash of the mnemonic. Read-only via the API now. */
export interface SyncedSessionRecord { mnemonicHash: string; encryptedBlob: string; updatedAt: string; }

/** v2 backup: id and write key are both HKDF-derived from the recovery phrase on the client. */
export interface SecureBackupRecord {
  backupId: string;      // 64 hex chars
  encryptedBlob: string; // opaque, client-encrypted (AES-GCM, lib/crypto/e2ee.ts)
  writeKey: string;      // 64 hex chars; stored server-side, NEVER returned by the API
  version: number;       // optimistic concurrency counter
  updatedAt: string;
}

export interface SyncRepository {
  get(mnemonicHash: string): Promise<SyncedSessionRecord | undefined>;
  upsert(record: SyncedSessionRecord): Promise<SyncedSessionRecord>;
  getSecure(backupId: string): Promise<SecureBackupRecord | undefined>;
  createSecure(record: SecureBackupRecord): Promise<boolean>;
  updateSecure(record: SecureBackupRecord, expectedVersion: number): Promise<boolean>;
}

export interface AdminUserRecord { id: string; username: string; passwordHash: string; createdAt: string; }
export interface AdminRepository {
  findByUsername(username: string): Promise<AdminUserRecord | undefined>;
  create(input: { username: string; passwordHash: string }): Promise<AdminUserRecord>;
}
```

Two implementations exist for all three repositories:
- `createInMemory*Repository()` — process-local, non-persistent (local dev/demo).
- `createPostgres*Repository(pool?)` — real PostgreSQL. Schema: `services/persistence/migrations/001_init.sql`, `002_secure_sync.sql` (v2 backups), and `003_forum_replies.sql` (forum replies/reports; mirrored in `supabase/migrations/20261014000000_forum_replies.sql`). Without the reply tables, reply routes answer `503 "Fitur balasan belum tersedia."`.

`createForumRepository()` / `createSyncRepository()` / `createAdminRepository()` (`services/persistence/src/factory.ts`) pick PostgreSQL when `DATABASE_URL` is set and fall back to in-memory otherwise.

---

## 4c. Backend HTTP API (`apps/web/src/app/api`)

All routes are Next.js Route Handlers (Node runtime). JSON responses are `{ ok: true, data }` or `{ ok: false, error, details? }` (`lib/api/response.ts`), always with `Cache-Control: no-store`. The only exception is `GET /api/health` (raw object, see below).

### Common rules

- **Body limits** (`readJsonLimited`): the body is streamed and cut off at the route's byte limit → `413`; invalid JSON/UTF-8 → `400`.
- **Rate limits** (`lib/api/rateLimit.ts`, per minute, two layers): `limit` = quota per client, `ceiling` = quota for all clients together. Per-client identity is **opt-in**: only when `TRUSTED_PROXY_HOPS` (1–5) and `RATE_LIMIT_HASH_SECRET` (≥ 16 chars) are both set is the client IP taken from `X-Forwarded-For` and HMAC-hashed; otherwise every anonymous caller shares the `limit` bucket. Counters live in Redis when `REDIS_URL` is set, in process memory otherwise. Exceeded → `429` with a calm Indonesian message.
- **Concurrency slots**: AI-bearing routes (chat, care-passport generate, care-passport/opening) share the `chat` slot: 12 concurrent across instances (Redis lease) and 4 per process; reply writes have their own slot (12 / 4); Ruang Ngobrol TTS 3 / 1. No slot → `429`.
- **Crisis gate first**: every route that accepts free-form user text runs `services/crisis-engine` before moderation, cache or AI. A crisis match returns `200 { crisis: true, evaluation: CrisisEvaluationResult }` (Care Passport: `state: 'IMMEDIATE_HELP_SCREEN'`) and stops.

| Route quota key | limit / ceiling per min |
|---|---|
| `chat` | 30 / 300 |
| `room-tts` (Ruang Ngobrol audio) | 8 / 40 |
| `admin-login` | 20 / 20 |
| `forum-write` | 60 / 600 |
| `forum-support` | 120 / 1200 |
| `forum-reply-create` | 30 / 300 |
| `forum-reply-list` | 120 / 1200 |
| `forum-reply-report` | 30 / 300 |
| `weekly-report` | 120 / 1200 |
| `sync-read` | 120 / 1200 |
| `sync-write` | 60 / 600 |
| `care-passport` (generate) | 10 / 100 |
| `care-passport-preview` | 60 / 600 |
| `care-passport-opening` | 10 / 100 |

### Route index

| Method & path | Auth | Body limit | Rate limit key |
|---|---|---|---|
| `GET /api/health` | — | — | — |
| `GET /api/redis-test` | admin cookie in production, open in dev | — | — |
| `POST /api/chat` | — | 32 KB | `chat` (+ `room-tts`) |
| `GET /api/forum` | — | — | — (30 s Redis read-through cache) |
| `POST /api/forum` | — | 8 KB | `forum-write` |
| `POST /api/forum/[postId]/support` | — | — | `forum-support` |
| `PATCH /api/forum/[postId]/moderate` | admin cookie | — | — |
| `GET /api/forum/[postId]/replies` | — | — | `forum-reply-list` |
| `POST /api/forum/[postId]/replies` | — | 4 KB | `forum-reply-create` + reply write slot |
| `POST /api/forum/[postId]/replies/[replyId]/report` | — | 1 KB | `forum-reply-report` |
| `PATCH /api/forum/replies/[replyId]/moderate` | admin cookie | — | — |
| `POST /api/report/weekly` | — | 64 KB | `weekly-report` |
| `GET /api/sync` | — | — | `sync-read` |
| `PUT /api/sync` | write proof | 4 MB | `sync-write` |
| `POST /api/care-passport` | — | 32 KB | `care-passport` (or `care-passport-preview` when `mode: 'preview'`) + chat slot |
| `POST /api/care-passport/preview` | — | 32 KB | `care-passport-preview` |
| `POST /api/care-passport/opening` | — | 32 KB | `care-passport-opening` + chat slot |
| `POST /api/admin/login` | — | 4 KB | `admin-login` |
| `POST /api/admin/logout` | — | — | — |
| `GET /api/admin/me` | admin cookie | — | — |

### `GET /api/health`
Liveness, always `200` while the process runs. Response (not wrapped in `{ ok, data }`): `{ ok: true, service: 'dengarin-api', status: 'healthy', redis: 'disabled' | 'up' | 'down' }`. Redis is optional; `down` does not make the instance unhealthy.

### `GET /api/redis-test`
Diagnostic Redis write/read round trip. In `NODE_ENV=production` it requires a valid admin session cookie, otherwise `404`. Returns `{ connected: true, key, value, latencyMs }`; `503` when Redis is not configured or refuses the command.

### `POST /api/chat`
Request:
```typescript
{
  sessionId?: string;                     // accepted but not used for rate limiting
  message: string;                        // 1..2000 chars
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>; // ≤ 12 entries, ≤ 2000 chars each, ≤ 12000 total
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
  noStore?: boolean;                      // true = no AI cache read/write for this request
  voiceMode?: 'ruang-ngobrol';            // with noStore: true, also asks for optional Gemini TTS audio
}
```
Pipeline (CODE, `lib/api/chatHandler.ts`; the route is a thin wrapper): size/shape limits (`413`) → crisis screen of every history entry and the message (assistant history is re-labelled as an *unverified earlier reply* and sent as user-role text) → rate limit `chat` → Step 0 crisis gate on the message → `supportPathway` if any entry hit a `high` rule → AI cache read only if `AI_RESPONSE_CACHE=true`, `noStore` is not true and there is no `supportPathway` → shared chat slot → `runOrchestrator` with an 18 000 ms turn budget → cache write (same conditions; never `tier: 'fallback'`; TTL 600 s) → optional TTS.

Responses:
- Crisis: `{ crisis: true, evaluation: CrisisEvaluationResult }` — no quota used, no cache, no AI call.
- Normal:
```typescript
{
  crisis: false;
  tier: 'primary' | 'secondary' | 'tertiary' | 'fallback';
  providerId: string;
  action: ValidatedAIAction;
  debiased: boolean;
  disclaimer: string;
  warnings: string[];          // toPublicWarnings(): provider detail reduced to tier + status
  cached: boolean;
  supportPathway?: {           // only for deterministic severity 'high'; never model-controlled
    kind: 'human_support'; severity: 'high'; helpDirectoryAction: 'show_help_directory';
    title: string; message: string;
    contacts: Array<Pick<EmergencyContact, 'id' | 'name' | 'phone' | 'whatsapp' | 'website' | 'availableHours' | 'cost'>>; // ≤ 3
    links: Array<{ href: '/resources' | '/crisis'; label: string }>;
  };
  roomAudio?: { data: string /* base64 */; mimeType: 'audio/wav' };
}
```
- Errors: `400` invalid/missing message or history, `413` too large, `429` busy.

The browser gives up after 30 000 ms (`CHAT_CLIENT_TIMEOUT_MS`); the chat page sends at most 6 history entries (`CHAT_CLIENT_HISTORY_ENTRIES`).

### `GET /api/forum?domain=<InterventionDomain>`
Returns `{ posts: ForumPostRecord[] }`: approved posts only, max 50, each with `replyState`/`replyCount`. An unknown `domain` → `400 "Topik cerita tidak dikenali."`. Cached in Redis for 30 s (versioned invalidation on writes).

### `POST /api/forum`
Request: `{ authorPseudonym?: string; domain: InterventionDomain; title: string; body: string }` (≤ 8 KB). `domain` must be a known `InterventionDomain` (`400` otherwise); empty pseudonym → `"Sahabat Anonim"`.
Order: rate limit → crisis gate on pseudonym, then on `title + body` → automated moderation (`moderateForumPost`). Responses: crisis → `200 { crisis: true, evaluation }` (nothing saved); rejected → `422 { error: reason }`; otherwise `201 { crisis: false, post: ForumPostRecord, moderation }` where `post.moderationStatus` is `approved` (published immediately) or `pending_review` (held for a moderator).

### `POST /api/forum/[postId]/support`
No body. Increments the "Rasakan Hal Serupa" counter. Returns `{ success: true, supportCount }`, `404` if the post does not exist.

### `PATCH /api/forum/[postId]/moderate`
Admin session cookie required (`401` without). Request `{ status: 'approved' | 'rejected' }`. Returns `{ post: ForumPostRecord }`, `404` if not found. Invalidates the feed and the post's reply cache.

### `GET /api/forum/[postId]/replies?limit=<1..50>&cursor=<opaque>`
Approved replies only. Default `limit` 20, max 50 (`400` outside 1–50). Returns `ForumReplyPage` = `{ replies: ForumReplyRecord[], nextCursor: string | null, approvedCount: number }`. `404` story not available, `503` reply tables not migrated.

### `POST /api/forum/[postId]/replies`
Request (≤ 4 KB):
```typescript
{
  body: string;              // trimmed; 3..800 chars after moderation rules
  threadKey: string;         // client-held capability, /^[A-Za-z0-9_-]{43}$/ (32 random bytes, base64url)
  parentReplyId?: string;    // reply to a reply
}
```
Order (CODE): shape check → crisis gate on `body` → `moderateForumReply` (rejects contact details/links/handles, markup, self-harm encouragement, medication instructions, insults, sexual/grooming content, scams, impersonation; trauma/violence keywords → `pending_review`) → rate limit `forum-reply-create` → reply write slot → `HMAC(FORUM_THREAD_ALIAS_SECRET, storyId ‖ threadKey)` as the participant hash (the raw `threadKey` is never stored) → server-chosen alias.
Responses: crisis → `200 { crisis: true, evaluation }`; rejected → `422`; invalid `threadKey` or alias secret not configured → `400`; story/parent unavailable → `404`; `201 { crisis: false, reply: ForumReplyRecord, moderation }`; `503` reply tables missing.

### `POST /api/forum/[postId]/replies/[replyId]/report`
Request (≤ 1 KB): `{ reason: ForumReportReason }`. Returns `{ reported: true }`; `400` unknown reason, `404` reply not available, `503` reply tables missing.

### `PATCH /api/forum/replies/[replyId]/moderate`
Admin session cookie required (`401`). Request `{ status: 'approved' | 'rejected' }`. Returns `{ reply: ForumReplyRecord }`, `404` if not found.

### `POST /api/report/weekly`
Request (≤ 64 KB): `{ weekStarting?: string; checkins: DailyCheckin[]; missions: DailyMission[] }`, each array ≤ 500 items (`413` above). Stateless: computes and returns `{ summary: WeeklyReportSummary }` without persisting anything. No AI call.

### `GET /api/sync` — encrypted backup read
Two read paths (rate limit `sync-read`):
- **v2:** `?backupId=<64 hex>` → `{ record: { backupId, encryptedBlob, version, updatedAt } }` (`writeKey` is never returned). `400` malformed id, `404` not found.
- **Legacy (pre-v2, read-only):** `?mnemonicHash=<≤ 128 chars>` → `{ record: SyncedSessionRecord }`, `404` if nothing is stored. Kept so older backups can still be restored.

### `PUT /api/sync` — encrypted backup write (v2 only)
Request (≤ 4 MB):
```typescript
{
  backupId: string;          // 64 hex, HKDF-SHA256(recovery phrase, salt 'dengarin-sync-v2', info 'lookup')
  encryptedBlob: string;     // non-empty, client-encrypted
  expectedVersion: number;   // 0 to create; the current version to update
  writeProof: string;        // 64 hex = HMAC-SHA256(writeKey, `${backupId}\n${expectedVersion}\n${sha256hex(encryptedBlob)}`)
  writeKey?: string;         // 64 hex, HKDF info 'write'; sent ONLY on creation (expectedVersion 0)
}
```
Rules (CODE, `lib/api/syncAuth.ts`): the server verifies `writeProof` with the stored `writeKey` (or, on creation, the one supplied) using a constant-time compare. Responses: `{ record: { backupId, encryptedBlob, version: expectedVersion + 1, updatedAt } }`; `400` malformed body; `404` no backup and `expectedVersion ≠ 0`; `409` version changed (concurrent write); `403` proof invalid. The legacy `mnemonicHash` write path no longer exists. The server only ever stores the opaque blob; the recovery phrase and plaintext never leave the browser.

### `POST /api/care-passport` and `POST /api/care-passport/preview` (CareBridge, AMD Track 2)
Adults only. Body (≤ 32 KB), two shapes:
```typescript
// F-A "Bukti Bertanggal" (current UI)
{
  segments: Array<{ id: string /* /^[A-Za-z0-9:_.-]{1,64}$/, unique */;
                    kind: 'intake' | 'journal' | 'checkin' | 'clarification';
                    date?: string /* YYYY-MM-DD */; text: string /* raw */ }>;  // 1..12 segments
  keepSoftPii?: string[];      // ≤ 64 ids `segmentId:start-end` of SOFT findings to leave visible
  aiConsent?: boolean;         // missing = declined
  ageBracket?: AgeBracket;     // '15-17' → 403
  mode?: 'preview' | 'generate'; // /preview forces 'preview'; default 'generate'
}
// Legacy single story (still accepted)
{ text: string; redactions?: Array<{ kind: PiiKind; start: number; end: number }> /* ≤ 64 */; aiConsent?; ageBracket?; mode? }
```
Limits: ≤ 4000 chars per segment (legacy `text` too), ≤ 6000 chars total, ≤ 12 segments → `413`; empty segments are dropped, all empty → `400`.

Order (CODE, `lib/api/carePassportHandler.ts`): age check → **crisis gate + urgent-help check on the raw text of all segments joined** (before consent, redaction or AI) → server-side PII detection per segment → `preview` stops here → `generate`: redact (hard kinds `phone`, `email`, `nik`, `card`, `url`, `handle` always; soft kinds `address_hint`, `person_name_hint` unless listed in `keepSoftPii`) → `runCarePassportPipeline` (consent → AMD inference on sanitized segments only → grounding → per-segment attribution). The client can never submit pre-redacted text.

Responses (`200`):
- Preview: `{ kind: 'preview', findings: CarePassportPiiFinding[], redactedText, segments: Array<{ id, kind, date?, findings, redactedText }> }`; each finding carries `segmentId`, `id`, `canKeep` (false for hard kinds).
- Result: `{ kind: 'result', result: CarePassportResult, sanitizedText?, sanitizedSegments? }`. `result.state` ∈ `IMMEDIATE_HELP_SCREEN` (with `emergencyContacts`), `PROVIDER_UNAVAILABLE` (consent declined, no provider, or every provider failed/rejected; never a fabricated passport), `NEEDS_CLARIFICATION` (one `clarificationQuestion`), `HUMAN_SUPPORT_RECOMMENDED`, `READY_FOR_USER_REVIEW`. `result.provenance = { providerId, isAmd, isFallback, latencyMs? }`; `result.completeness = { known, total, unknownLabels }`; accepted facts carry `sourceRef { segmentId, kind, date? }`.
- `result.warnings` are passed through `toPublicWarnings` in `lib/api/carePassportRoute.ts` (and, for the segments shape, first cut by `scrubWarning`), so provider error text never reaches the browser.

Errors: `400` invalid shape, `403` minor, `413` too large, `429` busy. Nothing is cached or stored; logs carry metadata only (`[CarePassport]`).

### `POST /api/care-passport/opening` (F-B opening lines)
Request (≤ 32 KB): `{ passport: CarePassport /* reviewStatus must be 'user_approved' */; destination: 'fktp' | 'psikolog' | 'healing119' | 'kampus'; aiConsent?: boolean }`. The server rebuilds the passport field by field (unknown keys dropped; ≤ 8 evidence items, values ≤ 300 chars, ≤ 5 questions, ≤ 8 unknowns).
Order (CODE): crisis gate on the approved text → consent → AMD inference on approved values only → grounding (every sentence must reuse the user's own approved phrases; no new symptoms, numbers, durations, severity, diagnoses, medication, identifiers) → otherwise a deterministic template.
Response: `OpeningLinesResult` = `{ state: 'READY' | 'FALLBACK_TEMPLATE' | 'IMMEDIATE_HELP_SCREEN', destination, lines, provenance, emergencyContacts?, droppedLines, warnings }` (warnings cut to a colon-free head ≤ 120 chars). Errors: `400` unknown destination / passport not approved / bad shape, `413`, `429`.

### `POST /api/admin/login`
Request (≤ 4 KB): `{ username: string; password: string }`. Rate-limited (`admin-login`, 20/min global). On success sets an httpOnly, `SameSite=Strict` cookie `dengarin_admin_session` (8 h, `Secure` in production) signed with `ADMIN_SESSION_SECRET`, and responds `{ username }`. `401` wrong credentials, `500` if `ADMIN_SESSION_SECRET` is not configured.

### `POST /api/admin/logout`
Clears the session cookie. Always responds `{ loggedOut: true }`.

### `GET /api/admin/me`
Verifies the session cookie. Returns `{ username, expiresAt }` (unix seconds) or `401`.

Admin accounts have no signup route — they are provisioned out-of-band via `npm run db:seed-admin` (`services/persistence/scripts/seedAdmin.ts`).

---

## 4d. Environment Variables (`.env.example`)

| Variable | Consumed by | Purpose |
|---|---|---|
| `DEEPSEEK_API_KEY` | `services/orchestrator` (chat tier "primary") | DeepSeek Platform key (api.deepseek.com, called directly — not via OpenRouter) |
| `DEEPSEEK_MODEL` | same | Optional override; **code default `deepseek-flash`** (`deepseekProvider.ts`). Note: the comment in `.env.example` still says `deepseek-v4.1-flash`; the code wins. Confirm the slug against the DeepSeek platform before the demo |
| `DEEPSEEK_BASE_URL` | same | Optional full chat-completions URL for a compatible proxy (legacy alias `DEEPSEEK_API_URL`) |
| `GEMINI_API_KEY` | `services/orchestrator` (chat tier "tertiary"), `apps/web/src/lib/api/geminiTts.ts` (Ruang Ngobrol TTS) | Google AI Studio key; empty = tier skipped |
| `GEMINI_MODEL` | `services/orchestrator` | Optional override; default `gemini-3.1-flash-lite` |
| `OPENROUTER_API_KEY` | `services/orchestrator` (debiaser) | Enables the OpenRouter "Second Brain" debiaser pass. Not a fallback tier |
| `OPENROUTER_MODEL` | same | Optional override; default `meta-llama/llama-3.3-70b-instruct:free` |
| `OPENROUTER_SITE_URL` / `OPENROUTER_SITE_NAME` | same | Optional `HTTP-Referer`/`X-Title` attribution headers |
| `AMD_BASE_URL` | `services/orchestrator` (CareBridge only) | OpenAI-compatible root; `/v1` is appended if missing. See [AMD_SETUP.md](AMD_SETUP.md) |
| `AMD_API_KEY` | same | Bearer key; may be empty only for a loopback endpoint without auth |
| `AMD_MODEL` | same | Exact model id as listed by `GET /v1/models`; with `AMD_BASE_URL` makes the provider "configured" |
| `AMD_JSON_MODE` | same | `true` adds `response_format: json_object`; only if `probeAmdEndpoint()` reported `jsonModeOk: true` |
| `AMD_TIMEOUT_MS` | same | Per-call timeout for Care Passport and opening lines; default 12000 |
| `REDIS_URL` | `apps/web/src/lib/redis.ts` | Optional. Distributed rate limits/slots, forum read cache, ISR cache, and (only with `AI_RESPONSE_CACHE=true`) the AI response cache. Empty = in-memory |
| `AI_RESPONSE_CACHE` | `apps/web/src/lib/api/aiCache.ts` / `chatHandler.ts` | `true` enables the chat AI response cache (600 s TTL). Anything else, including empty = off (default) |
| `DENGARIN_DEBIASER` | `services/orchestrator` | `off` / `false` / `0` disables the OpenRouter debiaser pass |
| `TRUSTED_PROXY_HOPS` / `RATE_LIMIT_HASH_SECRET` | `apps/web/src/lib/api/rateLimit.ts` | Optional, set both to enable per-client quotas behind a trusted proxy |
| `DATABASE_URL` | `services/persistence` factory | PostgreSQL connection string; unset = in-memory fallback |
| `DATABASE_CA_FILE` / `DATABASE_CA_CERT` | `services/persistence/src/db/pool.ts` | Optional custom CA (pick at most one) |
| `ADMIN_SESSION_SECRET` | `apps/web/src/lib/api/adminSession.ts` | HMAC secret signing the admin session cookie; required for `/api/admin/login` |
| `FORUM_THREAD_ALIAS_SECRET` | `apps/web/src/lib/api/threadAlias.ts` | HMAC secret for per-story anonymous reply capabilities; required for reply creation. If unset, derived one-way from `ADMIN_SESSION_SECRET` |
| `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD` | `services/persistence/scripts/seedAdmin.ts` | One-time values read only when running `npm run db:seed-admin` |

---

## 4e. Auth Contract (`services/auth`)

```typescript
// Password hashing (Node's built-in scrypt, no external bcrypt dependency)
export function hashPassword(password: string): Promise<string>; // "<saltHex>:<hashHex>"
export function verifyPassword(password: string, stored: string): Promise<boolean>;

// Stateless, HMAC-SHA256-signed admin session token ("JWT-lite" — not the
// full JWT spec, no external jsonwebtoken dependency). Format:
// base64url(json payload) + "." + base64url(hmac-sha256 signature)
export interface AdminSessionPayload {
  sub: string; // admin username
  iat: number; // issued-at, unix seconds
  exp: number; // expiry, unix seconds
}

export function createSessionToken(username: string, secret: string, ttlSeconds?: number): string;
export function verifySessionToken(token: string, secret: string): AdminSessionPayload | null;
```

`verifySessionToken` returns `null` (never throws) for a wrong-secret signature, a tampered payload, an expired token, or a malformed string — callers (`apps/web/src/lib/api/adminSession.ts#verifyAdminRequest`) treat `null` as "not authorized".

---

## 5. Local Anonymous Storage Contract (`apps/web/src/lib/storage.ts`)

```typescript
export interface AnonymousUserSession {   // packages/types
  userId: string;            // UUID v4
  anonymousAlias?: string;
  createdAt: string;         // ISO timestamp
  recoveryMnemonic: string;  // 12-word recovery phrase (v2: 12 groups of 6 hex chars)
  ageBracket?: AgeBracket;
  occupation?: string;
  topicPillar?: TopicPillarId;
  primaryDomain?: InterventionDomain;
  consentGiven: boolean;
  consentTimestamp?: string;
  assessmentResult?: AssessmentEvaluation;
  activePathId?: string;
  currentDay?: number;
}
```
Stored exclusively in client browser storage (`localStorage`), strictly guarding user privacy.
