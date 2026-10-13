# AI POLICY & ORCHESTRATION GUARDRAILS — Dengar.in

**Document Version**: 1.1.0  
**Status**: Active Engineering Directive  
**Last reconciled with code**: 14 Oct 2026 (working tree on `main`, uncommitted; files read: `services/orchestrator/src/orchestrator.ts`, `providers/*`, `debiaser/debiaser.ts`, `carePassportPipeline.ts`, `openingLinesPipeline.ts`, `apps/web/src/app/api/chat/route.ts`, `apps/web/src/lib/api/chatHandler.ts`, `crisisGate.ts`, `aiCache.ts`, `requestLimits.ts`). Closes GAP_AUDIT M8 (AI tiers) and L2 (DeepSeek default model) on the documentation side, and describes the H3 / H6 / M10 chat changes that landed in the working tree on 14 Oct 2026.

Marker used below: **CODE** = behaviour enforced by the current code. At the final reconciliation on 14 Oct 2026, every change described here (including the H3 support pathway, H6 cache opt-in and M10 turn budget) was present in the working tree, so nothing is marked *dalam pengerjaan*.

---

## 1. Role of AI: Orchestrator, Not Unbounded Chatbot

In Dengar.in, the AI functions as an **Orchestrator of Structured Interventions**. It does NOT have free-form conversational authority to invent psychological exercises, give medical advice, or conduct open-ended pseudo-therapy.

There are **two separate AI pipelines** that share the provider contract (`LLMProvider { id, isConfigured, generate }`, `services/orchestrator/src/providers/types.ts`) but nothing else:

| Pipeline | Entry point | Providers (default order) | Output contract |
|---|---|---|---|
| **Companion chat** | `POST /api/chat` → `runOrchestrator` | DeepSeek → Gemini, then OpenRouter as a *debiaser* (not a fallback tier), then deterministic fallback | Whitelisted action (§2), `services/validator#validateAIOutput` |
| **CareBridge / Care Passport (AMD Track 2)** | `POST /api/care-passport`, `POST /api/care-passport/opening` → `runCarePassportPipeline`, `runOpeningLinesPipeline` | **AMD only** (`createAmdProvider`), and only when `AMD_BASE_URL` + `AMD_MODEL` are set. No third-party provider is added implicitly | Care Passport schema v1 / opening lines, grounded against the user's own (sanitized / approved) text. See [CAREBRIDGE_ARCHITECTURE.md](CAREBRIDGE_ARCHITECTURE.md) |

### Companion chat flow (CODE, `apps/web/src/lib/api/chatHandler.ts`)

```
POST /api/chat body
    │  size ≤ 32 KB, message ≤ 2000 chars, history ≤ 12 entries (≤ 2000 chars each, ≤ 12000 total)
    ▼
Crisis screen of EVERY history entry + message (screenChatContext) ─► crisis? respond { crisis: true }, stop
    ▼                                                                  (no quota, no cache, no LLM)
Rate limit 'chat' (30/min per client, 300/min ceiling)
    ▼
Crisis gate on message (runCrisisGate, Step 0) ─────────────────────► crisis? respond { crisis: true }, stop
    ▼
severity 'high' in message or history? → build deterministic supportPathway (rule engine only)
    ▼
AI response cache read: ONLY if AI_RESPONSE_CACHE=true, Redis configured, noStore ≠ true
    and no supportPathway (never before the gate)
    ▼
Shared concurrency slot (12 across instances via Redis, 4 per process)
    ▼
runOrchestrator (turn budget 18 000 ms shared by all tiers and the debiaser)
    ├─ Domain gate (coding / out-of-domain requests → empathetic redirect, no LLM call)
    ├─ Tier "primary":  DeepSeek  ── invalid / error / unconfigured ──┐
    ├─ Tier "tertiary": Gemini    ◄─────────────────────────────────────┘
    │     each valid draft → OpenRouter debiaser pass (optional, budget-aware) → final validateAIOutput
    └─ All failed or budget spent → Tier "fallback": deterministic domain-specific grounding payload
    ▼
Response { tier, providerId, action, debiased, disclaimer, warnings (toPublicWarnings), cached,
           supportPathway? (attached AFTER the orchestrator; the model cannot remove it), roomAudio? }
```

---

## 2. Whitelisted Action Schema

The companion chat's JSON output MUST contain an `action` property restricted to one of six whitelisted types (`packages/config#WHITELISTED_ACTIONS`):

| Action | Purpose | Permitted Payload |
| :--- | :--- | :--- |
| `chat` | Empathetic validation & reflective conversation (max 150 words) | Text with non-diagnostic disclaimer |
| `suggest_mission` | Recommends a curated micro-mission tailored to user's domain | Mission ID from pre-approved mission catalog |
| `open_journal_prompt` | Proposes a focused private journaling prompt | Prompt text & reflection tags |
| `suggest_forum` | Suggests visiting a relevant anonymous topic space | Topic slug & contextual tag |
| `adjust_path` | Recommends pacing adjustment for the 2–4 week path | Path ID & adjustment rationale |
| `show_help_directory` | Presents curated professional or community directories | Resource category (`counseling`, `financial`, `teen`) |

Any action outside this whitelist is rejected by `services/validator`. Every provider draft is validated, and when the debiaser rewrites a draft, the rewritten action is validated **again** before it can be returned (`orchestrator.ts`, "final validation boundary").

The CareBridge pipelines do **not** use this action schema; they have their own validators (`services/validator/src/carePassport.ts`, `openingLines.ts`) that drop any claim not grounded in the user's text.

---

## 3. Strict Negative Boundaries (Forbidden AI Behaviors)

The AI MUST NEVER:
1. Diagnose any mental health condition (e.g. Major Depressive Disorder, Bipolar, GAD, Schizophrenia).
2. Recommend, assess, or critique psychiatric medication or dosages.
3. Pretend to be a human psychologist, psychiatrist, counselor, or financial advisor.
4. Overrule or question a safety decision made by `services/crisis-engine`.
5. Invent unvetted therapeutic exercises (e.g., experimental trauma reprocessing).
6. Recommend specific financial loans, commercial investment products, or debt refinancing agencies.
7. Collect or ask for personally identifiable information (PII) such as full name, email, phone number, address, or school/office name.

---

## 4. Companion Chat: Provider Tiers (CODE)

Source of truth: `services/orchestrator/src/orchestrator.ts`. Default chain: `providers = [createDeepseekProvider(), createGeminiProvider()]`, labelled by position with `TIER_LABELS = ['primary', 'tertiary']`. The label `'secondary'` still exists in the `OrchestratorTier` type but is **not produced** by the default chain.

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 0 (pre-LLM): Domain gate (guardrails/domainGate.ts)     │
│ Pure coding / out-of-domain requests → validated empathetic  │
│ redirect. tier 'primary', providerId 'guardrail:domain-gate' │
└──────────────────────────┬───────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ TIER "primary": DeepSeek Platform, called directly           │
│ Endpoint: https://api.deepseek.com/v1/chat/completions       │
│   (override: DEEPSEEK_BASE_URL, legacy DEEPSEEK_API_URL)     │
│ Model: DEEPSEEK_MODEL, default `deepseek-flash`              │
│ JSON mode on, temperature 0.6, max_tokens 1024               │
│ Timeout: min(15000 ms, turn budget left)                     │
└──────────────────────────┬───────────────────────────────────┘
                           │ unconfigured / HTTP error / timeout / invalid JSON or schema
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ TIER "tertiary": Google Gemini (generateContent)             │
│ Model: GEMINI_MODEL, default `gemini-3.1-flash-lite`         │
│ Key sent in `x-goog-api-key` header (never in the URL)       │
│ responseMimeType application/json, temperature 0.6           │
│ Timeout: min(15000 ms, turn budget left); skipped if < 2 s   │
└──────────────────────────┬───────────────────────────────────┘
                           │ all tiers failed or unconfigured
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ TIER "fallback": deterministic, offline                      │
│ buildDeterministicFallbackAction(domain); zero HTTP calls    │
│ providerId 'deterministic-fallback'; never cached            │
└──────────────────────────────────────────────────────────────┘

Applied to each VALID tier draft (not a fallback tier):
┌──────────────────────────────────────────────────────────────┐
│ DEBIASER ("Second Brain"): OpenRouter                        │
│ Model: OPENROUTER_MODEL, default                             │
│   `meta-llama/llama-3.3-70b-instruct:free` (code comments    │
│   mention "Nemotron"; the code default is the Llama slug)    │
│ Runs only if OPENROUTER_API_KEY is set, enableDebiaser is    │
│ not false and DENGARIN_DEBIASER is not off/false/0.          │
│ Timeout: min(10000 ms, turn budget left); SKIPPED (draft     │
│ kept) when < 3000 ms of the turn budget remain               │
│ Removes toxic positivity, bias, code blocks, diagnoses;      │
│ output must pass validateAIOutput or the draft is kept       │
│ providerId becomes `<tier provider>+openrouter:<model>`      │
└──────────────────────────────────────────────────────────────┘
```

Rules (CODE):
- An unconfigured provider is skipped with a warning; it is never an error to the user.
- A debiaser failure (unconfigured, timeout, non-JSON, invalid schema) **keeps the tier's validated draft**; it never blocks the answer.
- **Turn budget (GAP_AUDIT M10):** one chat turn has an overall wall-clock budget of **18 000 ms** (`CHAT_TURN_BUDGET_MS` in `requestLimits.ts`, `DEFAULT_TURN_BUDGET_MS` in the orchestrator). Every provider call gets `min(15000, remaining)`; a further tier is skipped when < 2000 ms remain; the debiaser gets `min(10000, remaining)` and is skipped when < 3000 ms remain. The browser stops waiting after 30 000 ms (`CHAT_CLIENT_TIMEOUT_MS`). Budget skips are reported as warnings (`… dilewati: anggaran waktu giliran habis`).
- `DENGARIN_DEBIASER=off` (or `false`/`0`) switches the second LLM pass off entirely, e.g. for a demo or to avoid sending text to OpenRouter.
- `warnings` returned to the browser go through `apps/web/src/lib/api/publicWarnings.ts#toPublicWarnings`: provider error bodies, request ids and model detail are reduced to "`<provider> gagal: status <code>`" / "`waktu habis`" / "`kesalahan penyedia`".
- The system never shows a broken screen to a distressed user if AI services are unreachable.

### 4.1 AI response cache (CODE, GAP_AUDIT H6)

- **Off by default.** The chat handler only reads or writes the cache when `AI_RESPONSE_CACHE=true` **and** `REDIS_URL` is configured (`isAiResponseCacheEnabled` in `aiCache.ts`).
- Even when enabled it is skipped for `noStore: true` requests and for any turn with a `supportPathway` (high distress). `tier: 'fallback'` results are never written.
- TTL is **600 s** (`AI_CACHE_TTL_SECONDS`, down from 1 hour). The key is a SHA-256 of message + history + age bracket + domain; raw user text is never a key or value, but the cached value is the validated AI action, which can paraphrase the user's message.
- The cache is read **only after** both crisis gates.

### 4.2 High-severity (non-crisis) messages (CODE, GAP_AUDIT H3)

- The crisis engine returns `severity: 'high'` (with `isCrisis: false`) for distress phrases such as "ga kuat lagi nanggung hidup" or "teror pinjol bikin gila". The AI may still answer, but the chat response **always** carries a deterministic `supportPathway` (`buildSupportPathway` in `crisisGate.ts`): `{ kind: 'human_support', severity: 'high', helpDirectoryAction: 'show_help_directory', title, message, contacts (first 3 from the crisis engine), links: /resources, /crisis }`.
- It is built from the rule engine only (message first, then history) and attached **after** the orchestrator returns, so model output can neither remove nor downgrade it. High-distress turns are never cached.
- CareBridge handles `high` deterministically too: the Care Passport pipeline locks the state to `HUMAN_SUPPORT_RECOMMENDED` with warning `deterministic_high_distress` (`carePassportPipeline.ts`).

---

## 5. CareBridge (AMD Track 2): AMD Provider Policy (CODE)

Source: `services/orchestrator/src/providers/amdProvider.ts`, `carePassportPipeline.ts`, `openingLinesPipeline.ts`.

| Item | Behaviour |
|---|---|
| Who uses it | Only `runCarePassportPipeline` (Care Passport extraction, `POST /api/care-passport`) and `runOpeningLinesPipeline` (F-B opening lines, `POST /api/care-passport/opening`). The companion chat **never** calls AMD, and CareBridge **never** calls DeepSeek, Gemini or OpenRouter unless a caller passes them explicitly (tests only; reported with `isAmd: false`). |
| Protocol | OpenAI-compatible: `GET {AMD_BASE_URL}/models`, `POST {AMD_BASE_URL}/chat/completions`, optional `Authorization: Bearer AMD_API_KEY`. `AMD_BASE_URL` is normalised to end in `/v1` (a trailing `/`, `/chat/completions` or `/models` is accepted). |
| Configured when | `AMD_BASE_URL` **and** `AMD_MODEL` are non-empty. `AMD_API_KEY` may be empty only for a loopback-only endpoint. |
| Request | `temperature: 0.2`, `max_tokens: 1024`; `response_format: { type: 'json_object' }` only when `AMD_JSON_MODE=true` (off by default; turn on only if `probeAmdEndpoint()` reports `jsonModeOk: true`). |
| Timeout | `AMD_TIMEOUT_MS`, default 12000 ms, for both pipelines. |
| Not configured | Care Passport → `PROVIDER_UNAVAILABLE` with `no_provider_configured` (no fabricated passport). Opening lines → `FALLBACK_TEMPLATE` (deterministic, labelled "tanpa AI"). |
| What the model sees | Care Passport: **only the server-redacted (sanitized) segments**, never raw text. Opening lines: only values from a passport the user marked `user_approved`. |
| Order | Crisis gate (and explicit urgent-help request) on the raw / approved text → AI consent (`aiConsent: true`) → AMD inference → grounding validator. A crisis or a declined consent means **zero** provider calls. |
| Provenance | `provenance.isAmd` is `true` only when the accepted draft came from `createAmdProvider` (`isAmd: true` marker). The UI shows "Diproses di AMD" only in that case. |
| Secrets | Error messages redact `Bearer …` and the key value and are cut to 300 chars; route responses pass warnings through `toPublicWarnings` (Care Passport) or a colon-truncating sanitizer (opening lines). Telemetry logs carry metadata and bare warning codes only. |
| Caching / storage | None. The CareBridge routes do not use `aiCache`, Redis or PostgreSQL. |

Which AMD endpoint to point this at (own vLLM on AMD Developer Cloud, or AMD Token Factory) is documented in [AMD_SETUP.md](AMD_SETUP.md).

---

## 6. Third-party data processing (disclosure note)

For the companion chat, the user's message and screened history are sent to DeepSeek and, on fallback, Google Gemini; when `OPENROUTER_API_KEY` is set and `DENGARIN_DEBIASER` is not off, the user's raw message is also sent to OpenRouter (default a `:free` model) inside the debiaser prompt. The consent screen does not yet disclose this (GAP_AUDIT H4, product/legal decision pending). CareBridge sends only redacted / user-approved text, and only to the team's configured AMD endpoint.
