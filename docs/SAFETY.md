# SAFETY CHARTER & CRISIS PROTOCOL — Dengar.in

**Document Version**: 1.0.0 (Foundation)  
**Classification**: Mandatory Clinical & Technical Boundary  

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
3. **Execution Precedence**: The crisis check runs as Step 0 in all message pipelines (Assessment, Chat, Check-in, Journal text if scanned).

---

## 3. Indonesian Crisis Pattern Catalog

The pattern catalog covers standard Indonesian, colloquial phrases, youth slang, and common evasive spellings:

### A. Explicit Suicidal Intent
- `bunuh diri`, `bundir`, `akhiri hidup`, `mau mati aja`, `pengen mati`, `ga mau hidup lagi`, `mending mati`, `ingin mati`, `bunuh diri sekarang`

### B. Severe Self-Harm & Acute Harm Methods
- `nyayat`, `sayat tangan`, `sayat pergelangan`, `minum racun`, `minum baygon`, `gantung diri`, `loncat dari`, `nabrakin diri`

### C. Severe Hopelessness with Farewell Ideation
- `surat wasiat`, `pamit semua`, `terima kasih semuanya selamat tinggal`, `titip pesen terakhir`, `dunia lebih baik tanpa aku`

---

## 4. Age-Adapted Escalation Tiers

When a crisis is triggered, the system checks the user's demographic group:

### Tier A: Minor / Teen Users (Aged 15–17)
- **Primary Line**: Telepon Pelayanan Sosial Anak (Teencare / Kemensos): `1500-771`
- **Child Protection**: Komisi Perlindungan Anak Indonesia (KPAI): `(021) 319-01988` / WhatsApp `0811-177-2273`
- **Emergency Psychological Care**: Kemenkes Sejiwa: `119 ext 8`
- **Additional Protocol**: Immediate parental/trusted adult consultation guidance without breaching user identity.

### Tier B: Adult Users (Aged 18–54)
- **National Emergency Line**: Kemenkes Sejiwa `119 ext 8` (24/7 Gratis)
- **Crisis Helpline**: Lisa Helpline (Love Inside Suicide Awareness): `(021) 3777-5472` / WhatsApp `0811-381-5472` (Bilingual ID/EN)
- **Community Support**: Yayasan Pulih `(021) 788-42580` / WA `0811-8436-633`
- **Information & Education**: Into The Light Indonesia (`www.intothelightid.org`)

### Tier C: Financial Crisis & Debt Extortion
- If severe distress is linked to illegal online lending (pinjol ilegal) or loan shark extortion:
  - **Satgas PASTI / OJK Hotline**: `157` / WhatsApp `081-157-157-157`
  - **Email Pengaduan**: `konsumen@ojk.go.id`

---

## 5. Non-Medical Product Boundaries

Dengar.in adheres to strict ethical standards:
- **No Diagnosis**: Never outputs DSM-5, ICD-10, or clinical diagnostic labels.
- **No Prescriptions**: Never recommends medications, psychiatric drugs, or dosages.
- **No Human Mimicry**: Transparently identifies as an AI companion, never as a human doctor.
- **No Financial Advice**: Never advises on stock purchases, loan approvals, or debt settlement contracts.
