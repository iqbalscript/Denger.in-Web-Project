# PRODUCT REQUIREMENTS DOCUMENT (PRD) — Dengar.in

**Product**: Dengar.in (Pendamping Mental Well-being Anonim Berbasis AI)  
**Version**: 1.0.0 (MVP Foundation)  
**Competition Target**: MindCraft Web Competition 2026  

---

## 1. Product Vision & Goals

Dengar.in provides a frictionless, non-stigmatizing, and completely anonymous digital sanctuary for Indonesians aged 15–54 experiencing life-context stressors (academic, campus, workplace, financial debt, relationships). 

### Core Product Formula:
**Understand (Context) → Act (Micro-Missions) → Continue (Daily Follow-Up)**

---

## 2. Feature Scope & Priority Matrix

| ID | Feature Name | Description | Priority | Sprint 0 State |
| :--- | :--- | :--- | :--- | :--- |
| F01 | **Landing Page** | Value prop, positioning, problem context, 1-click start | P0 / MVP | Route Skeleton & Hero |
| F02 | **Informed Consent** | Transparent terms, non-diagnostic disclaimer, privacy commitment | P0 / MVP | Route Skeleton & Copy |
| F03 | **Anonymous Identity** | UUID creation, local persistence, zero PII collection | P0 / MVP | Client UUID Engine |
| F04 | **Onboarding** | Age bracket selection (15–17, 18–24, 25–34, 35–54), main life context | P0 / MVP | Route Skeleton & State |
| F05 | **Assessment** | Generic assessment contract (e.g. DASS-21 ringkas or modular questionnaire) | P0 / MVP | Route Skeleton & Generic Contract |
| F06 | **Crisis Gate** | Deterministic interception, 1-tap call/WhatsApp emergency lines | P0 / MVP | Fully Functional Rule Engine & UI |
| F07 | **Dashboard Hub** | Central companion dashboard, active mission banner, streak, quick check-in | P1 / MVP | Route Skeleton & Layout |
| F08 | **Intervention Path** | 2–4 week structured pathway tailored to user domain | P1 / MVP | Route Skeleton & Path Types |
| F09 | **Daily Mission** | Bite-sized actionable grounding/reframing exercise (3–10 mins) | P1 / MVP | Route Skeleton & Mission View |
| F10 | **Daily Check-in** | Mood rating, energy level, contextual stressor selection | P1 / MVP | Route Skeleton & Form |
| F11 | **Mood Tracking** | Visual timeline/graph of emotional states over time | P2 / Support | Integrated in Checkin/Report |
| F12 | **Private Journal** | Local-first reflection space; content kept on-device | P2 / Support | Route Skeleton & Local Storage |
| F13 | **AI Companion Chat** | Safety-filtered contextual dialogue governed by action whitelist | P2 / Support | Route Skeleton & Safety Gate |
| F14 | **Resource Directory** | Verified Indonesian mental health & financial distress hotlines | P1 / MVP | Route Skeleton & Data Config |
| F15 | **Weekly Report** | Weekly progress synthesis, adherence streak, mood patterns | P3 / Polish | Route Skeleton `/report` |
| F16 | **Anonymous Forum** | Peer story space and solidarity wall *(No backend in Sprint 0)* | P3 / Polish | Route Skeleton `/forum` (Static Skeleton) |
| F17 | **Recovery Code** | 12-word mnemonic phrase for cross-device state restoration | P1 / MVP | Route Skeleton & Key Generator |

---

## 3. Demographics & Contextual Adaptation

1. **Age Bracket 15–17 (Teens)**:
   - High exam stress, social pressure, parental expectations.
   - High-protection safety filters, child rights hotline (Teencare 1500-771, KPAI).
2. **Age Bracket 18–24 (College / Early Career)**:
   - Thesis stress, post-grad anxiety, relocation loneliness.
   - Grounding exercises, career transition framing.
3. **Age Bracket 25–34 (Workforce / Sandwich Generation)**:
   - Work burnout, financial strain, illegal loan (pinjol) debt distress.
   - Dedicated financial well-being modules (Satgas PASTI / OJK 157 resources).
4. **Age Bracket 35–54 (Mid-Career / Family Responsibilities)**:
   - Chronic fatigue, sandwich generation caregiving, economic load.
   - Low-cognitive-demand daily missions.
