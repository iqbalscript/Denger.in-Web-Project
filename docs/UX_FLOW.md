# UX FLOW & USER JOURNEY — Dengar.in

**Product**: Dengar.in  
**Document Version**: 1.0.0 (Foundation)  

---

## 1. End-to-End User Journey Diagram

```
[ / ] Landing Page
  │  (Value proposition, anon pledge, quick start)
  ▼
[ /consent ] Informed Anonymous Consent
  │  (Consent to terms, understand non-diagnostic nature)
  ▼
[ /onboarding ] Demographic & Context Selection
  │  (Age bracket: 15–17, 18–24, 25–34, 35–54; Domain: School, Campus, Work, Finance, Relationship)
  ▼
[ /assessment ] Contextual Distress Assessment
  │
  ├─────────────────────────────────────────────────┐
  │ [Text / Score triggers Crisis Engine]           │ [Normal Path]
  ▼                                                 ▼
[ /crisis ] Safety Crisis Gate                  [ /dashboard ] Main Companion Hub
  - Instant Emergency Hotlines (Sejiwa 119, Lisa)   ├── [ /mission ] Active Daily Mission
  - 1-Click WhatsApp / Call Escalation             ├── [ /checkin ] Daily Mood & Energy Check-in
  - Age-tailored Resources (KPAI for 15-17)        ├── [ /journal ] Private Local-first Journal
  - NO AI INVOLVEMENT                              ├── [ /chat ] Safety-gated AI Companion Chat
                                                   ├── [ /resources ] Verified Directory
                                                   ├── [ /recovery ] 12-Word Recovery Code
                                                   ├── [ /report ] Weekly Progress Summary
                                                   └── [ /forum ] Anonymous Community Wall
```

---

## 2. Route Specifications

### 1. `/` — Landing Page
- Hero header: "Ruang Aman & Anonim untuk Memahami Beban Pikiranmu."
- Context tags: Ujian, Skripsi, Beban Kerja, Jeratan Finansial, Masalah Hubungan.
- Quick CTA: "Mulai Tanpa Mendaftar" → routes to `/consent`.
- Always-visible "Bantuan Darurat" button in header.

### 2. `/consent` — Anonymous Consent
- Disclaimers: Non-clinical companion, not an emergency dispatcher, 100% anonymous.
- User clicks "Saya Mengerti & Setuju" → generates client UUID, routes to `/onboarding`.

### 3. `/onboarding` — Age & Context
- Select Age Bracket: `15-17`, `18-24`, `25-34`, `35-54`.
- Select Primary Life Context: `school`, `campus`, `work`, `finance`, `relationship`, `general`.

### 4. `/assessment` — Contextual Distress Assessment
- Generic questions measuring emotional strain and context impact.
- Live safety monitor: Every free-text input runs through `services/crisis-engine`.
- If crisis detected → immediate reroute to `/crisis`.

### 5. `/crisis` — Deterministic Safety Gate
- Calming reassurance banner: "Kamu tidak sendirian. Bantuan profesional tersedia sekarang."
- 1-Tap direct action buttons (Sejiwa 119 ext 8, Lisa Helpline, WhatsApp Pulih).
- Minor-specific hotlines shown prominently for users aged 15–17.

### 6. `/dashboard` — Main Companion Hub
- Greeting with anonymous pseudonym (e.g. "Sahabat #8210").
- Today's Daily Mission card.
- Daily check-in status card.
- Path progress indicator (e.g., "Hari ke-3 dari 14 Hari Jalur Pemulihan").

### 7. `/mission` — Interactive Daily Mission
- 3–7 minute actionable micro-step (e.g., 4-7-8 grounding, financial prioritization, boundary setting).
- Completion checkmark with micro-reflection.

### 8. `/checkin` — Mood & Energy Check-in
- 5-point emotional scale (Sangat Baik, Baik, Netral, Berat, Kewalahan).
- Energy slider (1–10).
- Context tags selection.

### 9. `/journal` — Private Local-First Journal
- 100% stored in browser `localStorage`.
- Never sent to remote LLM servers without user action.

### 10. `/chat` — AI Companion Dialogue
- Strict safety gate on input: any message is screened by `crisisDetector` before AI response.
- Governed by AI Action Whitelist.

### 11. `/resources` — Help Directory
- Filterable verified contacts: Mental health, crisis helplines, financial debt advocacy (OJK 157).

### 12. `/recovery` — 12-Word Recovery Code
- Generates or restores user session from 12 mnemonic words.

### 13. `/forum` — Anonymous Story Space *(Skeleton)*
- Informational skeleton for community peer solidarity wall.

### 14. `/report` — Weekly Progress Report *(Skeleton)*
- Synthesis skeleton of 7-day mood trends and mission completions.
