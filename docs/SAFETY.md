# SAFETY CHARTER & CRISIS PROTOCOL — Dengar.in

**Document Version**: 1.1.0  
**Classification**: Mandatory Clinical & Technical Boundary  
**Last reconciled with code**: 14 Oct 2026 (working tree on `main`; `services/crisis-engine/src/crisisDetector.ts`, `packages/config/src/index.ts`, `apps/web/src/lib/api/*`, `apps/web/src/lib/crisisGuard.ts`). GAP_AUDIT M8.  

---

## 1. The Safety Golden Rule

> **AI is NEVER the crisis gatekeeper.**  
> Under no circumstance may an LLM determine whether a user is experiencing an acute life-threatening crisis or suicidal ideation.

Crisis screening is **100% deterministic**, implemented in `services/crisis-engine`, executed locally on the server before any request reaches an AI orchestrator.

```
USER INPUT
    │
    ▼
┌────────────────────────────────────────────────────────┐
│  RULE-BASED CRISIS ENGINE (services/crisis-engine)     │
│  - Indonesian Pattern Catalog (Slang, Leet, Dialects)   │
│  - Suicidal Ideation / Self-Harm Regex Rules           │
│  - ZERO AI / LLM / Vector Dependencies               │
└────────────────────────────────────────────────────────┘
    │
    ├─────────────────────────────────┐
    │ [CRISIS TRIGGERED]              │ [NO CRISIS]
    ▼                                 ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ IMMEDIATE CRISIS GATE        │  │ AI ORCHESTRATOR PIPELINE     │
│ - Halt all LLM processing    │  │ - Structured Action Schema   │
│ - Render static crisis UI    │  │ - Whitelist Validator        │
│ - Age-specific Hotlines      │  │ - Action Execution           │
│ - Emergency Call & WA Links  │  └──────────────────────────────┘
│ - AI CANNOT OVERRIDE THIS    │
└──────────────────────────────┘
```

---

## 2. Hard Architectural Boundary

`services/crisis-engine` has an inviolable isolation boundary:
1. **Forbidden Imports**: It MUST NOT import or depend on `openai`, `deepseek`, `@google/genai`, `openrouter`, `services/orchestrator`, `packages/prompts`, or any external HTTP inference API.
2. **Deterministic Execution**: It operates purely on string normalization, tokenization, and regex matching against an Indonesian clinical distress dictionary.
3. **Execution Precedence**: The crisis check runs as Step 0 wherever free-form user text enters a pipeline. Where it runs today (CODE):

| Surface | Where | What is scanned | On `crisis` |
|---|---|---|---|
| `POST /api/chat` | `lib/api/chatHistory.ts`, `crisisGate.ts` via `chatHandler.ts` | every history entry **and** the message, before quota, cache and AI | `{ crisis: true, evaluation }`, no AI call |
| `POST /api/forum` | `app/api/forum/route.ts` | pseudonym, then title + body, before moderation and storage | `{ crisis: true, evaluation }`, nothing saved |
| `POST /api/forum/[postId]/replies` | route | reply body, before moderation and storage | `{ crisis: true, evaluation }`, nothing saved |
| `POST /api/care-passport` (+ `/preview`) | `lib/api/carePassportHandler.ts`, again in `carePassportPipeline.ts` | raw text of **all** segments joined (story + selected journal/check-in entries), before consent, PII redaction and AI; also an explicit urgent-help request (`isUrgentHelpRequest`) | `state: 'IMMEDIATE_HELP_SCREEN'`, provider called 0 times |
| `POST /api/care-passport/opening` | `openingLinesPipeline.ts` | the user-approved passport text | `state: 'IMMEDIATE_HELP_SCREEN'`, no lines |
| Journal, check-in, assessment, mission, weekly report pages (client) | `lib/useCrisisGuard.ts` + `lib/crisisGuard.ts` (GAP_AUDIT M6) | text as the user types | inline crisis card with contacts (`InlineCrisisCard`), save/AI blocked while the text matches; the text is kept and there is **no automatic navigation** |
| Chat page, Ruang Ngobrol (client) | `app/chat/page.tsx`, `lib/voiceRoom.ts` | message before sending | local crisis UI; the server gate still runs |

`severity: 'high'` (distress without explicit lethal intent) does **not** halt any route. How it is handled: chat attaches a deterministic `supportPathway` (human-help card, up to 3 contacts, links to `/resources` and `/crisis`) after the AI reply and never caches that turn; Care Passport locks the result to `HUMAN_SUPPORT_RECOMMENDED` with warning `deterministic_high_distress`. In both cases the pathway is built from the rule engine only, so the model can neither remove nor downgrade it.

---

## 3. Indonesian Crisis Pattern Catalog

The pattern catalog covers standard Indonesian, colloquial phrases, youth slang, and common evasive spellings. The source of truth is `CRISIS_RULES` in `services/crisis-engine/src/crisisDetector.ts` (10 `crisis` rules, 1 `high` rule); the lists below are illustrative. Input is normalised first (lower case, NFKD, accents and zero-width characters stripped, leetspeak `0→o 1→i 3→e 4→a 5→s 8→b`, elongation "matiiii" → "mati", spaced-out "b u n u h d i r i"). Only a wholly explicit denial ("aku tidak mau bunuh diri") or a clearly third-person film/news framing without first-person words is exempt.

### A. Explicit Suicidal Intent
- `bunuh diri`, `bundir`, `akhiri hidup`, `mau mati aja`, `pengen mati`, `ga mau hidup lagi`, `mending mati`, `ingin mati`, `bunuh diri sekarang`

### B. Severe Self-Harm & Acute Harm Methods
- `nyayat`, `sayat tangan`, `sayat pergelangan`, `minum racun`, `minum baygon`, `gantung diri`, `loncat dari`, `nabrakin diri`

### C. Severe Hopelessness with Farewell Ideation
- `surat wasiat`, `pamit selamanya`, `selamat tinggal semuanya`, `titip pesan terakhir`, `dunia lebih baik tanpa aku`

### D. High Distress (severity `high`, not a crisis halt)
- `sakit banget jiwaku`, `hancur lebur`, `ga kuat lagi nanggung hidup`, `teror pinjol bikin gila`
- Handling per surface: see §2.3 (chat `supportPathway`, Care Passport `HUMAN_SUPPORT_RECOMMENDED`).

---

## 4. Age-Adapted Escalation Tiers

When a crisis is triggered, the system checks the user's demographic group:

### Tier A: Minor / Teen Users (Aged 15–17)
- **Child Line**: TePSA Kemensos (Telepon Pelayanan Sosial Anak): `1500-771` (id `tepsa-kemensos`; number confirmed by Kemensos, hours not officially published so none are claimed)
- **Child Protection**: KPAI pengaduan `(021) 3190-1556` / WhatsApp `0811-177-2273` (id `kpai-pengaduan`; landline from the official KPAI site, WhatsApp still **unverified**: 2025-2026 media cite `0811-1002-7727`, GAP_AUDIT H2)
- **Emergency Psychological Care**: Healing119 (Kemenkes): `119 ext 8`
- **Additional Protocol**: Immediate parental/trusted adult consultation guidance without breaching user identity.

### Tier B: Adult Users (Aged 18–54)
- **National Emergency Line**: Healing119 (Kemenkes) `119 ext 8`, gratis, "pagi hingga malam" (no official source confirms 24/7). WhatsApp via healing119.id
- **Crisis Helpline**: LISA Helpline (Bali Bersama Bisa Foundation, bisahelpline.org): WhatsApp `0811-3855-472`, free, scheduled online sessions (may be waitlisted), ID/EN
- **Community Support**: Yayasan Pulih `(021) 788-42580` / WA `0811-8436-633` (hari dan jam kerja)
- Into The Light Indonesia, listed in earlier versions of this document, is **not** in the app's contact catalog and has been removed here.
- Sources and access dates for every number are in the comment block above `EMERGENCY_CONTACTS` in `packages/config/src/index.ts`. The unconfirmed LISA landline and English-line WhatsApp were removed (GAP_AUDIT H2).

### Tier C: Financial Crisis & Debt Extortion
- If severe distress is linked to illegal online lending (pinjol ilegal) or loan shark extortion:
  - **Kontak OJK 157** (pengaduan pinjol ilegal / Satgas PASTI): `157` (24 jam setiap hari) / WhatsApp `081-157-157-157` (Senin–Minggu 07.45–16.50 WIB)
  - **Email Pengaduan**: `konsumen@ojk.go.id`
- Note (CODE): Satgas PASTI / OJK is in `packages/config#EMERGENCY_CONTACTS` (shown on `/resources` and `/crisis`) but **not** in the crisis engine's `STATIC_EMERGENCY_CONTACTS`, so it is not part of a crisis API response or a chat `supportPathway`.

### How the contact list is chosen (CODE)
- Crisis API responses use the crisis engine's own list, filtered by the caller's `ageBracket` (default `18-24`): 15–17 → Healing119, LISA, TePSA, KPAI; adults → Healing119, LISA, Yayasan Pulih. An unknown bracket returns the **full** list, never an empty one. The chat `supportPathway` shows the first three of these.
- `/crisis` and `/resources` render `packages/config#EMERGENCY_CONTACTS`. `tests/crisis/emergencyContactsConsistency.test.mjs` fails when the two catalogs drift (matched by id: name, phone, WhatsApp, website, hours, cost, category).
- CareBridge (adults only) always uses the adult list (`18-29`).

---

## 5. Non-Medical Product Boundaries

Dengar.in adheres to strict ethical standards:
- **No Diagnosis**: Never outputs DSM-5, ICD-10, or clinical diagnostic labels.
- **No Prescriptions**: Never recommends medications, psychiatric drugs, or dosages.
- **No Human Mimicry**: Transparently identifies as an AI companion, never as a human doctor.
- **No Financial Advice**: Never advises on stock purchases, loan approvals, or debt settlement contracts.
