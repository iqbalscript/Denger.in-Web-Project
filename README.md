# Dengar.in

> **Anonymous, local-first mental wellbeing companion for Indonesia, with CareBridge: grounded consultation prep built for inference on AMD.**
> Submission for **AMD Developer Hackathon ACT III, Track 2: Health and Wellbeing** (lablab.ai, October 2026).

[![AMD Developer Hackathon ACT III](https://img.shields.io/badge/AMD%20Developer%20Hackathon-ACT%20III%20%C2%B7%20Track%202-ED1C24.svg)](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Live app:** https://dengar-in.vercel.app · **Repository:** https://github.com/iqbalscript/Denger.in-Web-Project

---

## Contents

- [The problem](#the-problem)
- [AMD Developer Hackathon ACT III: what we built](#amd-developer-hackathon-act-iii-what-we-built)
- [How Track 2 requirements are handled](#how-track-2-requirements-are-handled)
- [AMD integration status](#amd-integration-status)
- [Pre-existing project and hackathon scope](#pre-existing-project-and-hackathon-scope)
- [Product features](#product-features)
- [Safety architecture](#safety-architecture)
- [Monorepo layout](#monorepo-layout)
- [Quickstart](#quickstart)
- [Running CareBridge on AMD](#running-carebridge-on-amd)
- [Commands and tests](#commands-and-tests)
- [API reference](#api-reference)
- [Security and privacy controls](#security-and-privacy-controls)
- [Documentation](#documentation)
- [Team](#team)
- [Disclaimer and license](#disclaimer-and-license)

---

## The problem

Many Indonesian adults finally book a first session with a psychologist or counselor, then sit there unable to explain what has been happening, for how long, and what it affects. Stigma makes registration and real names a barrier, and hotlines are hard to find in the moment.

Dengar.in is a privacy-first, zero-registration companion: chat (text or voice), daily check-ins, a private journal, an anonymous story forum, verified crisis contacts, and short micro-missions. For the hackathon we added **CareBridge**, which turns a hard-to-explain story into a user-owned **Care Passport** for that first consultation.

## AMD Developer Hackathon ACT III: what we built

**Track 2: Health and Wellbeing.** The goal is to help one part of the patient journey: preparing for a first mental health consultation.

**CareBridge / Care Passport** (`/care-passport`):

1. **Tell it in your own words.** Text intake, adults (18+) only for this module.
2. **Safety first, in code.** A deterministic crisis gate runs on the raw text before consent and before any model call. A crisis or an explicit request for urgent help shows verified support contacts and calls no AI at all.
3. **Redaction preview the user controls.** Emails, Indonesian phone numbers, NIK, URLs, handles, card numbers, address hints, and self-introduced names are detected and redacted. The user sees and corrects the preview before anything is sent.
4. **Separate AI consent.** Opting in to AI processing is its own step, separate from any sharing.
5. **Model drafts, validator decides.** The model (served on AMD) proposes a structured draft: main concerns, daily impact, duration, context, and questions to ask a professional. A deterministic validator keeps a fact only if it quotes the user's sanitized text. Invented durations, diagnostic labels, medication advice, and confidence percentages are removed. Missing information is shown as **unknown**, never guessed.
6. **Dated evidence.** Facts can link to dated journal or check-in entries the user picks.
7. **Opening lines.** Grounded first sentences for starting the consultation, plus a sourced checklist.
8. **Review, approve, export locally.** Every note stays `user_pending` until the user approves it. Export (`.md` / `.txt`) needs a separate action. Nothing is sent to a third party automatically.
9. **Honest outages.** If the AMD endpoint is unreachable, the app says so and offers a manual path instead of a silently generated summary from another provider.

The result model has five states, and AI can only **escalate** toward human support, never downgrade a rule-based flag.

## How Track 2 requirements are handled

| Requirement (from the event page) | How Dengar.in handles it | Where |
|---|---|---|
| No autonomous diagnosis or treatment | Validator strips diagnostic labels, medication advice, and confidence percentages. Chat validator blocks psychiatric diagnosis. | `services/validator/src/carePassport.ts`, `npm run test:security-m04` |
| Incorrect or ungrounded responses | Every field must quote the sanitized input. Ungrounded fields are dropped and counted, never shown as fact. | `services/validator/src/carePassport.ts` |
| Sensitive information | PII detection and redaction before inference, user-controlled preview, no AI response cache for this flow, metadata-only logs. | `services/validator/src/piiRedactor.ts`, `apps/web/src/lib/api/carePassportHandler.ts` |
| Uncertain results | Explicit `unknowns`, `needsReview` on paraphrases, at most one clarification question, no confidence scores. | `packages/types`, `services/validator/src/carePassport.ts` |
| High-risk decisions | Rule-based crisis gate before consent and before AI. Immediate-help screen with zero model calls. Model may only escalate. | `services/crisis-engine`, `services/orchestrator/src/carePassportPipeline.ts`, [`docs/CAREBRIDGE_SAFETY_POLICY.md`](docs/CAREBRIDGE_SAFETY_POLICY.md) |
| Human review and handoff | User approval required on every note. Crisis and high-distress paths always show human contacts (Healing119 Kemenkes, 119 ext 8). | `apps/web/src/components/carePassport/**`, `/crisis`, `/resources` |
| Realistic demo, input to output | Synthetic cases A to E plus 20 attribution scenarios. No real patient data. | `tests/carebridge/fixtures.mjs`, [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) |

## AMD integration status

We report this honestly; the submission copy follows the same rule.

| Piece | Status |
|---|---|
| OpenAI-compatible AMD adapter (`createAmdProvider`) with timeout, malformed-JSON, and outage handling | Done, tested against mock servers |
| Capability probe (`probeAmdEndpoint`: models, chat latency, JSON mode) | Done, tested against mock servers |
| Care Passport pipeline uses AMD as the default provider, with accurate provenance (`providerId: amd:<model>`, `isAmd`, `latencyMs`) | Done |
| Care Passport API, page, redaction preview, review, local export | Done and deployed |
| **Live AMD endpoint** (AMD Token Factory or vLLM on AMD Developer Cloud / Instinct MI300X) | **Pending (AMD-02).** No AMD endpoint is configured in this repository yet. Until a live trace exists, "runs on AMD" is the design target, not a measured fact. |
| Measured impact and latency on AMD | Pending (AMD-14) |

Setup paths and the probe procedure: [`docs/AMD_SETUP.md`](docs/AMD_SETUP.md). Task tracking: [`docs/AMD_TRACK2_TASKS.md`](docs/AMD_TRACK2_TASKS.md).

## Pre-existing project and hackathon scope

Dengar.in existed before the hackathon (anonymous chat, check-in, journal, forum, crisis resources). Work for AMD Developer Hackathon ACT III started on **13 October 2026**, beginning with commit `ff707c7` (CareBridge / Care Passport). Everything from that commit onward is hackathon work, including:

- CareBridge: Care Passport pipeline, AMD adapter and probe, grounding validator, PII redactor, `/api/care-passport/*`, `/care-passport` UI, dated evidence, opening lines, local export.
- Safety: high-distress support pathway, English crisis detection, expanded crisis phrase coverage with regression tests.
- Accessibility and inclusion: WCAG AA contrast, 44 px touch targets, the "Akses cepat" quick-access panel (text size, contrast, link underline, reading spacing, stop animations), layouts that adapt to larger text.
- Language: Indonesian / English UI, English chat replies, English voice.
- Copy: plain everyday Indonesian ("Bahasa Lazim").

Scope decisions for the hackathon (adults 18+ for CareBridge, synthetic demo data only) are recorded with sources in [`docs/AMD_01_SCOPE_DAN_SYARAT.md`](docs/AMD_01_SCOPE_DAN_SYARAT.md). The wider product keeps its existing age scope and policies.

## Product features

- **Ngobrol (chat):** write or talk. Text chat with AI, and a voice room (speech in, natural expressive speech out).
- **Check-in and journal:** stored on the device (`localStorage`), with optional end-to-end encrypted backup.
- **Cerita (forum):** anonymous stories with automatic moderation and admin review.
- **Micro-missions and weekly reflection:** 3 to 7 minute steps tied to real stressors (study, work burnout, debt and illegal loans, family).
- **Crisis and help directory:** verified Indonesian contacts (Healing119 Kemenkes 119 ext 8, LISA Helpline, TePSA, OJK).
- **Quick Exit:** one button or the Esc key leaves to a neutral page.
- **Akses cepat:** top-right panel for text size (100 to 140 percent), high contrast, link underline, reading spacing, stopping animations, and language.
- **Bahasa Indonesia / English:** switch in the Akses cepat panel, the mobile menu, or the footer. AI replies, voice, and crisis detection follow the selected language.

## Safety architecture

```
[ User input: chat / voice / check-in / journal / forum / Care Passport ]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 0: DETERMINISTIC CRISIS ENGINE (services/crisis-engine)│
│ • Indonesian + English phrase rules, leetspeak/elongation    │
│   normalization, sub-millisecond, ZERO LLM                    │
│ • Runs on message AND history, before cache and before AI    │
└───────────────┬───────────────────────────┬─────────────────┘
        [CRISIS]                     [HIGH DISTRESS / NONE]
            │                               │
            ▼                               ▼
   AI halts. /crisis with          Human-support card shown
   verified contacts               (high), then continue
   (Healing119, 119 ext 8)                  │
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: DOMAIN GATE (services/orchestrator)                 │
│ • Off-topic and coding requests get an instant, kind redirect│
└───────────────────────────────┬─────────────────────────────┘
                                │
              ┌─────────────────┴──────────────────┐
              ▼                                    ▼
┌───────────────────────────────┐  ┌───────────────────────────────────┐
│ LAYER 2a: CHAT PIPELINE        │  │ LAYER 2b: CAREBRIDGE PIPELINE      │
│ 1. DeepSeek (primary)          │  │ consent → PII redaction preview    │
│ 2. Gemini (fallback)           │  │ → AMD model (createAmdProvider)    │
│ 3. Optional OpenRouter debiaser│  │ → honest outage state, no silent   │
│ 4. Deterministic safe fallback │  │   non-AMD summary                  │
└───────────────┬───────────────┘  └─────────────────┬─────────────────┘
                ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: VALIDATORS (services/validator)                     │
│ • Chat: whitelist of 6 JSON actions, PII redaction, blocks    │
│   diagnosis and toxic positivity                              │
│ • Care Passport: grounding by quotation, unknowns, no         │
│   diagnosis/medication/percentages, max one clarification     │
└───────────────────────────────┬─────────────────────────────┘
                                ▼
                     [ Safe output for the user ]
```

## Monorepo layout

Managed with **npm workspaces**:

```
Denger.in-Web-Project/
├── apps/
│   └── web/                     # Next.js 15 App Router: pages + API route handlers
│       ├── src/app/             # /chat, /ruang-ngobrol, /care-passport, /forum, /crisis, ...
│       ├── src/app/api/         # chat, care-passport, forum, sync, report, admin, health
│       ├── src/i18n/            # Indonesian / English dictionaries (no extra dependency)
│       └── src/lib/             # storage, crypto, speech, rate limits, handlers
├── packages/
│   ├── types/                   # Shared types, including Care Passport schema v1
│   ├── config/                  # Emergency contacts, help destinations, missions
│   └── prompts/                 # System prompts, JSON action schemas, guardrails
├── services/
│   ├── crisis-engine/           # Deterministic crisis detector (ID + EN)
│   ├── orchestrator/            # Chat pipeline, CareBridge pipeline, providers (AMD, DeepSeek, Gemini, OpenRouter)
│   ├── validator/               # Action validator, Care Passport validator, PII redactor, forum moderation
│   ├── persistence/             # PostgreSQL repository + in-memory fallback
│   └── auth/                    # scrypt hashing + HMAC-SHA256 admin sessions
├── tests/                       # node:test suites (crisis, carebridge, voice, security, ...)
├── docs/                        # Specs, AMD setup, safety policy, demo script
└── scripts/                     # Operational scripts
```

## Quickstart

### Prerequisites
- **Node.js** v22.6 or newer (tests use `--experimental-strip-types`)
- **npm** v10 or newer

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env.local
```

Key variables (see `.env.example` for all of them):
```env
# Chat AI (at least one for live /chat)
DEEPSEEK_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=        # optional debiaser

# CareBridge on AMD (OpenAI-compatible endpoint)
AMD_BASE_URL=              # e.g. AMD Token Factory URL, or http://127.0.0.1:8000/v1 via SSH tunnel to vLLM
AMD_API_KEY=
AMD_MODEL=                 # exact id from GET /v1/models
AMD_JSON_MODE=             # "true" only if the probe reports jsonModeOk
AMD_TIMEOUT_MS=12000

# Optional (in-memory fallbacks are used when unset)
DATABASE_URL=
ADMIN_SESSION_SECRET=
REDIS_URL=
```

### 3. Run
```bash
npm run dev
```
Open http://localhost:3000. Without a database or Redis, the app runs with in-memory persistence. Without `AMD_*` values, `/care-passport` shows the honest "AI not available" state and the manual path.

### 4. Database (optional)
```bash
npm run db:migrate
ADMIN_SEED_USERNAME=admin ADMIN_SEED_PASSWORD=strongpassword npm run db:seed-admin
```

### Docker
A production image is defined in [`apps/web/Dockerfile`](apps/web/Dockerfile).

## Running CareBridge on AMD

Two paths satisfy the "meaningful part of the workload on AMD" rule. Both work through the same adapter without code changes:

| Path | What it is |
|---|---|
| **A. AMD Token Factory** (recommended for the event) | Managed AMD inference gateway used by the event (`notebooks.amd.com/tokenfactory`). Put its OpenAI-compatible base URL, key, and model in `AMD_*`. |
| **B. vLLM on AMD Developer Cloud** | Instinct MI300X VM running vLLM ROCm on loopback, reached through an SSH tunnel. |

Then run `probeAmdEndpoint()` (see [`docs/AMD_SETUP.md`](docs/AMD_SETUP.md) §6) and confirm `ok: true` before recording the demo. The server log line `[CarePassport] {...}` shows metadata only (`state`, `providerId`, `latencyMs`, `droppedClaims`), never user text.

## Commands and tests

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server (`apps/web`) |
| `npm run build` | Production build |
| `npm test` | Full suite (660+ node:test cases plus script tests) |
| `npm run typecheck` | TypeScript checks (`tsc --noEmit`) |
| `npm run lint` | ESLint |

Selected suites:
```bash
npm run test:carebridge     # Care Passport contract, validator, AMD adapter/probe, handler, routes
npm run test:crisis         # Crisis engine (ID + EN), coverage gaps, contact consistency
npm run test:validator      # Action validator and forum moderation
npm run test:orchestrator   # Chat pipeline and domain gate
npm run test:crypto         # AES-GCM / PBKDF2 end-to-end encryption
npm run test:security-m04   # No medical diagnosis or prescription output
```

## API reference

Next.js route handlers in `apps/web/src/app/api/`. Full contracts: [`docs/API_SPEC.md`](docs/API_SPEC.md).

| Endpoint | Method | Description | Safety |
|---|---|---|---|
| `/api/chat` | `POST` | Chat (text and voice room), `lang: "id" \| "en"` | Crisis gate on message and history, domain gate, rate limit, PII redaction |
| `/api/care-passport/preview` | `POST` | Redaction preview before inference | Crisis gate first, no AI call |
| `/api/care-passport` | `POST` | Care Passport draft via the AMD pipeline | Consent, crisis gate, server-side redaction, grounding validator |
| `/api/care-passport/opening` | `POST` | Grounded opening lines for the consultation | Same pipeline rules |
| `/api/forum` | `GET`, `POST` | List or submit anonymous stories | Auto-moderation, crisis filter |
| `/api/forum/[id]/support` | `POST` | Empathy counter | Rate limit |
| `/api/forum/[id]/moderate` | `PATCH` | Approve or reject stories | Admin session |
| `/api/sync` | `GET`, `PUT` | Encrypted backup | Zero-knowledge (ciphertext only) |
| `/api/report/weekly` | `POST` | Weekly reflection | Rate limit |
| `/api/admin/login`, `/logout`, `/me` | `POST`, `GET` | Moderator session | scrypt, HTTP-only signed cookie |
| `/api/health` | `GET` | Health check | Public |

## Security and privacy controls

- **No registration, no PII:** client-generated UUID v4 and a 12-part recovery key. No names, emails, or phone numbers collected.
- **Zero-knowledge encrypted sync:** Web Crypto AES-GCM-256 with PBKDF2 (100,000 iterations). The server stores ciphertext only.
- **Rate limiting:** Redis-backed with in-memory fallback ([`docs/M01_RATE_LIMITING.md`](docs/M01_RATE_LIMITING.md)).
- **PII redaction:** before model output reaches users (chat), and before inference with a user preview (CareBridge).
- **Local data wipe:** `/recovery` removes every `dengarin_*` key on the device.
- **Metadata-only logs:** server logs never contain user text.

## Documentation

- [`docs/AMD_01_SCOPE_DAN_SYARAT.md`](docs/AMD_01_SCOPE_DAN_SYARAT.md): hackathon rules, scope decisions, sources
- [`docs/AMD_SETUP.md`](docs/AMD_SETUP.md): AMD Token Factory and vLLM on AMD Developer Cloud, probe procedure
- [`docs/AMD_TRACK2_DEVELOPMENT_PLAN.md`](docs/AMD_TRACK2_DEVELOPMENT_PLAN.md) and [`docs/AMD_TRACK2_TASKS.md`](docs/AMD_TRACK2_TASKS.md): plan and task status
- [`docs/CAREBRIDGE_ARCHITECTURE.md`](docs/CAREBRIDGE_ARCHITECTURE.md), [`docs/CAREBRIDGE_SAFETY_POLICY.md`](docs/CAREBRIDGE_SAFETY_POLICY.md), [`docs/CAREBRIDGE_EVAL_RUBRIC.md`](docs/CAREBRIDGE_EVAL_RUBRIC.md)
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) and [`docs/SUBMISSION_COPY.md`](docs/SUBMISSION_COPY.md): demo and lablab.ai submission copy
- [`docs/SAFETY.md`](docs/SAFETY.md), [`docs/AI_POLICY.md`](docs/AI_POLICY.md), [`docs/API_SPEC.md`](docs/API_SPEC.md)
- [`docs/RUANG_NGOBROL.md`](docs/RUANG_NGOBROL.md) and [`docs/VOICE_ACCESSIBILITY.md`](docs/VOICE_ACCESSIBILITY.md): voice room

## Team

Built by **Kata Justin Nama Timnya Gokil Udah** (Telkom University Surabaya).

## Disclaimer and license

> **Disclaimer:** Dengar.in is a self-help companion prototype and **not a replacement for licensed medical, psychiatric, or emergency services**. It does not diagnose, treat, triage, or prescribe, and it does not give legal or financial advice. All CareBridge demo data is synthetic. If you are in acute distress in Indonesia, contact **Healing119 (Kemenkes) at 119 ext 8** or local emergency services.

Licensed under the [MIT License](LICENSE).
