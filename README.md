# Dengar.in

> **Anonymous, Local-First AI Mental Well-being Companion**  
> Built with Next.js 15, TypeScript, Multi-Brain AI Orchestration, and a Deterministic Crisis Safety Architecture.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.4-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](package.json)

---

## Technical Overview

Dengar.in is a privacy-first, zero-registration mental well-being companion for users in Indonesia. It connects real-life situational stressors (academic, workplace burnout, debt/pinjol, family dynamics) with 3–7 minute daily micro-interventions, local-first mood tracking, and emergency escalation.

### Key Architectural Pillars
- **Zero PII & Anonymous by Design**: Session identity relies on client-generated UUID v4 and a 12-word recovery mnemonic. No names, emails, or phone numbers collected.
- **Deterministic Crisis Gate (Zero-LLM)**: Life-safety screening runs sub-millisecond regex and text normalization *before* any AI processing.
- **Multi-Brain AI Pipeline**: Tiered LLM architecture with independent bias review and fallback resilience.
- **Local-First & Client-Side E2EE**: Journal and check-in logs reside in `localStorage`. Multi-device backup uses Web Crypto API (AES-GCM 256-bit + PBKDF2 100k rounds) with zero-knowledge server storage.
- **Hybrid Storage & Auto Fallback**: PostgreSQL persistence for public forum and admin moderation, with automatic in-memory fallback for offline/local development. Optional Redis for distributed rate-limiting and ISR caching.

---

## Safety Architecture (4-Layer Defense)

```
[ User Input (Chat / Assessment / Forum) ]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ LAYER 0: DETERMINISTIC CRISIS ENGINE                   │
│ (services/crisis-engine)                               │
│ • Sub-ms regex & leetspeak/elongation normalization    │
│ • ZERO LLM / Vector reliance                           │
└───────────────────────┬────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
 [CRISIS DETECTED]               [NON-CRISIS]
        │                               │
        ▼                               ▼
  AI Flow Halts           ┌────────────────────────────────────────────────────────┐
  Redirect to /crisis     │ LAYER 1: DOMAIN & ANTI-CODING GATE                     │
  (Kemenkes 119 ext 8)    │ (services/orchestrator)                                │
                          │ • Intercepts coding/IT syntax & off-topic spam         │
                          │ • Instant empathetic redirect (Zero token cost)        │
                          └─────────────────────┬──────────────────────────────────┘
                                                │
                                                ▼
                          ┌────────────────────────────────────────────────────────┐
                          │ LAYER 2: MULTI-BRAIN AI PIPELINE                       │
                          │ 1. Primary: DeepSeek Platform (deepseek-flash, JSON)   │
                          │ 2. Reviewer: NVIDIA Nemotron 3 Ultra 550B (Debiaser)   │
                          │ 3. Fallback: Google Gemini 3.1 Flash-Lite              │
                          │ 4. Deterministic Safe Rule Fallback                    │
                          └─────────────────────┬──────────────────────────────────┘
                                                │
                                                ▼
                          ┌────────────────────────────────────────────────────────┐
                          │ LAYER 3: ACTION VALIDATOR & MAXIMUM GUARDRAILS         │
                          │ (services/validator)                                   │
                          │ • Whitelist 6 JSON action schemas                      │
                          │ • Strips markdown code blocks (```)                    │
                          │ • Auto-redacts PII (NIK, email, Indonesian phone)      │
                          │ • Blocks psychiatric diagnosis & toxic positivity      │
                          └─────────────────────┬──────────────────────────────────┘
                                                │
                                                ▼
                                    [ Safe Client Output ]
```

---

## Monorepo Layout

Managed via **npm workspaces**:

```
Denger.in/
├── apps/
│   └── web/                   # Next.js 15 App Router (frontend pages & API routes)
│       ├── src/app/           # UI routes (/consent, /dashboard, /chat, /forum, etc.)
│       ├── src/app/api/       # Backend route handlers (REST API)
│       └── src/lib/           # Client storage, crypto, rate limiters, singleton repos
├── packages/
│   ├── types/                 # Shared TypeScript interfaces (@dengarin/types)
│   ├── config/                # Mnemonic dictionary, crisis hotlines, missions catalog
│   └── prompts/               # AI system prompts, JSON action schemas, guardrail rules
├── services/
│   ├── crisis-engine/         # Zero-dependency deterministic crisis detector
│   ├── orchestrator/          # Multi-Brain pipeline (DeepSeek → Nemotron → Gemini)
│   ├── validator/             # Action schema validator & forum content moderator
│   ├── persistence/           # Postgres repository + in-memory fallback (forum, sync, admin)
│   └── auth/                  # Scrypt password hashing & HMAC-SHA256 session management
├── tests/                     # 157+ automated tests (native Node.js test runner)
├── docs/                      # Architectural specs, API contracts, security & Redis guides
└── scripts/                   # Operational and verification scripts
```

---

## Quickstart

### Prerequisites
- **Node.js**: `v20.x` or higher (uses native `--experimental-strip-types`)
- **npm**: `v10.x` or higher

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Key environment variables:
```env
# AI Providers (At least one required for live /chat)
DEEPSEEK_API_KEY=sk-...                          # Primary Brain
OPENROUTER_API_KEY=sk-or-v1-...                  # Second Brain (Nemotron debiaser)
GEMINI_API_KEY=...                               # Third Brain Fallback

# Database & Auth (Optional in dev - defaults to in-memory)
DATABASE_URL=postgresql://user:pass@localhost:5432/dengarin
ADMIN_SESSION_SECRET=min-32-char-random-secret-string

# Redis (Optional - falls back to in-memory rate limiting & cache)
REDIS_URL=redis://localhost:6379
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). The app works out-of-the-box in local development with in-memory persistence if no database or Redis is configured.

### 4. Database Setup (Optional)
If using PostgreSQL:
```bash
npm run db:migrate
ADMIN_SEED_USERNAME=admin ADMIN_SEED_PASSWORD=strongpassword npm run db:seed-admin
```

---

## Key Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server (`apps/web`) |
| `npm run build` | Compile production build (`next build`) |
| `npm run test` | Run full test suite (157+ unit, security, and integration tests) |
| `npm run typecheck` | Run monorepo TypeScript checks (`tsc --noEmit`) |
| `npm run lint` | Run ESLint validation |
| `npm run db:migrate` | Run PostgreSQL migrations (`services/persistence`) |
| `npm run db:seed-admin` | Seed initial moderator credentials |

### Selective Testing
```bash
npm run test:crisis         # Deterministic crisis engine & regression tests
npm run test:validator      # Action validator & forum content moderation
npm run test:orchestrator   # Multi-Brain pipeline & domain gate
npm run test:crypto         # Web Crypto AES-GCM / PBKDF2 E2EE tests
npm run test:security-m01   # Rate limiting & request payload bounds
npm run test:security-m02   # Forum pseudonym anti-abuse filters
npm run test:security-m03   # Local storage data wipe verification
npm run test:security-m04   # Medical output prevention tests
npm run test:persistence-pg # PostgreSQL integration (auto-skipped if DATABASE_URL unset)
```

---

## Backend API Reference

Implemented as Next.js Route Handlers (`apps/web/src/app/api/`). Full specifications in [`docs/API_SPEC.md`](docs/API_SPEC.md).

| Endpoint | Method | Description | Auth / Security |
|---|---|---|---|
| `/api/chat` | `POST` | Empathetic chat via Multi-Brain AI | Crisis gate, domain gate, rate limited, PII redacted |
| `/api/forum` | `GET`, `POST` | List forum posts or submit new anonymous story | Auto-moderated (`moderateForumPost`), crisis filter |
| `/api/forum/[id]/support` | `POST` | Increment community empathy counter | Rate limited |
| `/api/forum/[id]/moderate`| `PATCH` | Approve / reject forum submissions | Admin HMAC session cookie required |
| `/api/sync` | `GET`, `PUT` | Retrieve or push encrypted backup payload | Zero-Knowledge E2EE (ciphertext only) |
| `/api/report/weekly` | `POST` | Synthesize dynamic weekly progress report | Rate limited |
| `/api/admin/login` | `POST` | Authenticate moderator (`scrypt` verification) | Rate limited, sets HTTP-only signed session cookie |
| `/api/admin/logout` | `POST` | Invalidate moderator session | Admin session |
| `/api/admin/me` | `GET` | Verify active admin session | Admin session |
| `/api/health` | `GET` | Service status check | Public |

---

## Security & Privacy Controls

- **Zero-Knowledge E2EE Sync**: Multi-device sync uses client-side Web Crypto API (`AES-GCM-256` + `PBKDF2` with 100,000 iterations). Server never sees plaintext keys or data.
- **Fixed-Window & Distributed Rate Limiting**: Protection across `/api/chat` (max 4 concurrent), `/api/admin/login`, and `/api/forum` with Redis backing and memory fallback ([`docs/M01_RATE_LIMITING.md`](docs/M01_RATE_LIMITING.md), [`docs/REDIS.md`](docs/REDIS.md)).
- **Forum Anti-Abuse Moderation**: Rejects phone numbers, emails, illegal loan/gambling promotions, profanity, and unicode obfuscation on pseudonyms and content.
- **Total Local Data Wipe**: Complete purge of all `dengarin_*` local storage keys via `/recovery`.
- **Automatic PII Redaction**: Regex-level redaction of Indonesian NIK (16-digit), phone numbers, and emails before LLM output reaches users.

---

## Documentation

- [`docs/API_SPEC.md`](docs/API_SPEC.md) — Comprehensive API schemas, request/response contracts.
- [`docs/SAFETY.md`](docs/SAFETY.md) — Safety charter, clinical boundaries, and crisis escalation protocols.
- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) — Product requirements, demographic contexts, and competition alignment.
- [`docs/REDIS.md`](docs/REDIS.md) & [`docs/REDIS_TESTING_CHECKLIST.md`](docs/REDIS_TESTING_CHECKLIST.md) — Redis caching and rate-limiting deployment guide.
- [`docs/Scriptwrite.md`](docs/Scriptwrite.md) — UI copy map and text editing guide for contributors.

---

## Disclaimer & License

> **Disclaimer**: Dengar.in is a self-help digital companion prototype and **NOT a replacement for licensed medical, psychiatric, or emergency services**. It does not diagnose conditions, prescribe medications, or offer legal/financial counsel. If in acute distress, contact **Kemenkes Sejiwa at 119 ext 8** or emergency services.

Licensed under the **MIT License**.
