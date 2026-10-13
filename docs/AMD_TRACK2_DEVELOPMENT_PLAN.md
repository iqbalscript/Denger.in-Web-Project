# Dengar.in CareBridge — AMD Track 2 Development Plan

> Proposal lanjutan tersedia di [Yang Tak Terucap](yang-tak-terucap/00_README.md), dengan [backlog khusus](yang-tak-terucap/08_TASKS.md). Perbedaan scope dicatat pada indeks; jangan menggabungkan prioritas kedua MVP secara otomatis.

**Event:** AMD Developer Hackathon: ACT III — Track 2, Health & Wellbeing  
**Planning date:** 2026-10-13 (Asia/Jakarta)  
**Repository:** https://github.com/iqbalscript/Denger.in-Web-Project  
**Status:** Rencana pengembangan (proposal), belum diimplementasikan atau diverifikasi melalui pengujian runtime.  
**Proposed module brand:** Dengar.in CareBridge, under existing Dengar.in brand.

## Panduan penggunaan dokumen

Dokumen ini merapikan blueprint sumber bertanggal 13 Oktober 2026. Isi teknis dan batasan proposal dipertahankan; backlog implementasi tersedia di [AMD_TRACK2_TASKS.md](AMD_TRACK2_TASKS.md). Penambahan dokumentasi ini tidak berarti fitur CareBridge sudah tersedia.

- **Cakupan:** modul persiapan konsultasi untuk pengguna dewasa (18+), dengan data sintetis untuk demo. Dokumentasi produk lama masih mencakup usia 15–54 dan kompetisi MindCraft; cakupan CareBridge ini tidak otomatis mengganti kebijakan seluruh aplikasi.
- **Status bukti:** temuan repositori di bawah berasal dari audit pembacaan kode pada dokumen sumber. Tinjau ulang terhadap branch implementasi sebelum mengubah kode. Tidak ada klaim seluruh test sudah lulus.
- **Target vs hasil:** angka evaluasi adalah hipotesis/target pengujian, bukan hasil benchmark.
- **Dependensi eksternal:** endpoint/model AMD, ketentuan lisensi, deadline portal, dan informasi layanan bantuan harus diverifikasi sebelum implementasi terkait atau submission. Tautan sumber dipertahankan sebagai referensi; belum diverifikasi ulang saat perapian ini.
- **Urutan kerja:** sepakati scope → kontrak data dan safety/privacy → adapter AMD → alur pengguna → verifikasi → demo/submission. Prioritaskan P0; P1/P2 dikerjakan setelah alur utama stabil.

## 1. Executive summary

Dengar.in today is a privacy-oriented, anonymous mental wellbeing web companion. For Track 2, evolve one clearly scoped workflow: **someone shares a mental wellbeing concern, receives an evidence-aware preparation summary, and can choose a safe human-support handoff**. Never claim autonomous diagnosis, treatment, emergency dispatch, or access to licensed clinicians without real integration.

**User:** Indonesian adults (18+) who find it difficult to explain stress, overwhelm, or emotional concerns during a first consultation. **Future audience:** counselors or intake staff at partner facilities, but not part of the MVP's real-world service claims.

**Measurable workflow:** Time and completeness of preparing a shareable consultation note, with explicit uncertainty and no unsafe medical advice.

## 2. Grounded findings from repository (main branch inspected on 2026-10-13)

Existing: Next.js/React monorepo, anonymous onboarding, assessment, chat, crisis gate, validator, missions, check-in, journal, weekly report, forum, speech accessibility, Redis cache, PostgreSQL persistence, encrypted sync, tests.

Key files:
- `services/orchestrator/src/orchestrator.ts`: DeepSeek primary, Gemini fallback, optional OpenRouter-based debiaser; no AMD provider found.
- `services/crisis-engine/src/crisisDetector.ts`: deterministic Indonesian risk phrases and classification.
- `apps/web/src/lib/api/crisisGate.ts`: `cleared: !evaluation.isCrisis`; a `high` classification can pass this gate without automatically triggering a handoff. Design review required; not equivalent to a clinical assessment.
- `apps/web/src/app/api/chat/route.ts`: crisis check before cache and LLM; raw user text enters orchestrator; input-specific PII minimization before provider calls should be added.
- `apps/web/src/lib/api/aiCache.ts`: SHA-256 hashed input/history key, Redis stores validated AI response for one hour. Hash-only keys do not prove comprehensive privacy; cached output may retain sensitive text.
- `services/validator/src/actionValidator.ts`: six whitelisted actions and deterministic text checks; extend for structured evidence and review actions.
- `apps/web/src/app/api/report/weekly/route.ts`: rule-based synthesis, not an AMD AI report.
- `apps/web/src/lib/crypto/e2ee.ts`: AES-GCM/PBKDF2 encrypted backup. Re-evaluate storage threat model and privacy disclosures.
- `apps/web/src/app/consent/page.tsx`: clear general service disclaimer; add distinct opt-in for AI processing and optional sharing.
- A standalone `LICENSE` and Dockerfile were not visible in the inspected repository file tree. Check and add before final submission where appropriate.

Do not claim test suites pass until run; code-read status is not a production security certification.

## 3. MVP user journey

1. **Consent** — adult user accepts wellbeing-only scope, AI-processing notice, no automatic third-party sharing.
2. **Intake** — user types/speaks a concern; may skip questions; speech transcription is editable before submit.
3. **Safety precedence** — deterministic rules and explicit safety-help controls always accessible; AI can raise concerns but cannot downgrade rule-based flags.
4. **Data minimization** — warn about identifiable data, allow redaction/correction before external AI calls. Use pseudonymous identifiers, no names required.
5. **AMD inference** — model produces structured, grounded questions and a summary from the user-supplied text only.
6. **Grounding/validation** — schema validation and evidence mapping require each factual summary statement to reference source spans or fields; unsupported details are removed or marked unknown.
7. **Care Passport** — user sees source-linked facts, missing data, suggested questions for a professional, and non-diagnostic disclaimer. User can edit/export/download locally.
8. **Human handoff** — for uncertainty or non-emergency support needs, offer verified resource directory. Optional sharing always requires separate affirmative permission. For the hackathon, an internal review panel uses ONLY synthetic records until a real partner exists.
9. **Follow-up** — existing check-in and journal track voluntary wellbeing progress; no automated clinical management.

### Proposed result states
- `READY_FOR_USER_REVIEW`: the summary is structured and traceable, but awaits user approval.
- `NEEDS_CLARIFICATION`: key fields are missing or claims cannot be traced.
- `HUMAN_SUPPORT_RECOMMENDED`: an informational suggestion to discuss matters with a professional; not a triage diagnosis.
- `IMMEDIATE_HELP_SCREEN`: deterministic crisis indicator or explicit urgent-help request, shows official emergency resources, halts ordinary AI response.
- `PROVIDER_UNAVAILABLE`: AI inference failed; return a safe, clearly labeled rules-based pathway, never imply an AI summary was produced.

## 4. Feature priorities

| Priority | Feature | Acceptance criteria |
|---|---|---|
| P0 | AMD provider adapter | Real request/response on approved AMD inference endpoint; failure tracked; server-side secret. |
| P0 | Structured Care Passport | Zero invented facts in seeded golden test cases, fields linked to user-provided evidence. |
| P0 | Source/unknown display | Every factual field: `source`, `user_confirmed`, or `unknown`; no fabricated numeric confidence. |
| P0 | Safety + human handoff | Crisis precedence, `high` review path, demo reviewer acknowledgment, no autonomous diagnosis. |
| P0 | Data disclosure | Separate opt-in for model processing and export/sharing, explicit cache policy. |
| P0 | Demo + reproducibility | Working hosted app, README, public repo, repeatable synthetic cases, AMD trace. |
| P1 | Voice/accessible intake | Browser speech-to-text editing + text fallback, mobile layout; no assumption audio remains on-device. |
| P1 | Intake-to-report workflow | Reuse existing check-in, assessment, and report storage. |
| P2 | Document upload | Redacted OCR and extraction only if P0 ready and allowed by privacy model. |
| P2 | Verified referral navigation | Source-backed provider directory, date-last-verified labels. |
| Out | Diagnosis/prescription | Forbidden. |
| Out | Live clinical dashboard without partner | Demo-only staff interface with synthetic records, not a care service. |

## 5. Suggested changes by module

### A. AMD provider integration

New file `services/orchestrator/src/providers/amdProvider.ts` implementing existing `LLMProvider` contract. Server-only config keys:

```env
AMD_API_KEY=
AMD_BASE_URL=
AMD_MODEL=
AMD_TIMEOUT_MS=12000
DENGARIN_AI_PROVIDER=amd
DENGARIN_DEMO_MODE=true
```

The actual API URL/model MUST come from the approved hackathon workspace. Use validated JSON schema after inference. Do not assume `response_format` support; probe endpoint capabilities. Provider fails closed to safe fallback if malformed. Never commit credentials.

`services/orchestrator/src/orchestrator.ts`: route meaningful primary inference (Care Passport extraction and consultation question generation) to AMD. Keep deterministic gate and validator independent. Preserve non-AMD fallback if appropriate but show provenance and don't present fallback as AMD-powered result.

**Optional advanced architecture:** your own vLLM-served open model on an AMD Developer Cloud ROCm GPU. More work than Token Factory; prioritize only if a functioning primary demo already exists. Evolus partner-prize requirements are separate and require at least two Evolus building blocks plus an AMD-hosted open model through your own vLLM endpoint.

### B. Structured intake schema

Proposed `CarePassport` type:

```ts
type EvidenceField = {
  value: string | null;
  source: 'user_input' | 'user_confirmed' | 'unknown';
  sourceQuote?: string;   // User-visible exact source phrase, redacted as needed
  needsReview: boolean;
};

type CarePassport = {
  version: 1;
  subject: 'anonymous_adult';
  concerns: EvidenceField[];
  dailyImpact: EvidenceField[];
  duration: EvidenceField;
  relevantContext: EvidenceField[];
  questionsForProfessional: string[];
  unknowns: string[];
  disclaimer: string;
  reviewStatus: 'user_pending' | 'user_approved';
};
```

Do not use a model-issued `confidence=97%`; report measurable support completeness and exact missing fields instead. `sourceQuote` must be verified against sanitized input text before display. Never copy model-generated personal identifiers into exports unreviewed.

### C. Human review and permissions

`/care-passport`: user-owned draft, confirm/correct fields, export locally.  
`/support-options`: verified informational help and referral resources, no false promise of provider availability.  
`/review-demo`: synthetic staff case queue (clearly labeled "Demo data — no real patients"). For a production partner workflow, require authenticated staff, role-based access, consent records, audit logs, retention/deletion limits, and incident handling.

### D. Safety engineering

- Rule-based imminent-risk interception always has precedence; display real verified emergency information and stop normal chat.
- `high` distress state requires separate policy and safe support-navigation UX; current gate only blocks `isCrisis`.
- Additional ML classification may **escalate** cases to human attention but cannot override deterministic crisis detection; measure errors and avoid claiming perfect risk detection.
- Provide a prominent "Need urgent help?" user-initiated action independent of model classifications.
- No automatic outreach or emergency contact without actual service integration and explicit permissions.
- Input PII detection before provider calls; purpose-limited logs, retention, deletion controls; eliminate/disable AI output caching for sensitive intake as default.
- Teens excluded from public pilot pending age-specific safeguards and professional/privacy review; adult synthetic cases used in demo.
- Check Indonesian crisis resources immediately before demo. Official Kemenkes public resources describe Healing119.id via 119 ext 8 and its website; older 24/7 Sejiwa labeling is not sufficiently grounded.

## 6. Golden synthetic demo cases

### Case A: Normal/medium concern — student stress
**Input:** "Aku kewalahan dengan tugas kuliah. Kalau deadline berdekatan, aku sulit fokus. Aku belum tahu gimana menjelaskan ini saat minta bantuan."  
**Expected:** care passport includes overload and concentration problem, marks duration as unknown, creates questions for a professional, user approves export. No diagnostic labels.

### Case B: Uncertain information
**Input:** "Aku sering ngerasa nggak baik, entah kenapa."  
**Expected:** no invented symptom duration/severity; shows missing information, asks at most one targeted clarification, no pseudo-confidence percentage.

### Case C: High-risk urgent user input
**Input:** synthetic explicit urgent self-harm statement, controlled test fixture, not shown publicly in verbose form.  
**Expected:** immediately displays verified support pathway; no standard model response, no Care Passport that pretends the risk is resolved. Demonstrate safety without sensational details.

### Case D: Privacy/PII
**Input:** message with synthetic phone/email and stress complaint.  
**Expected:** warning and redaction preview before remote inference; any export separately confirmed; logs and metrics do not contain plaintext identifiers.

### Case E: AMD offline
**Input:** Case A with temporary provider failure.  
**Expected:** accurate "AI unavailable" indicator, safe non-AI fallback, no fabricated results, retry option.

## 7. Evaluation methodology and suggested targets (NOT measured results)

Recruit consented adult testers using **synthetic** vignettes; where feasible ask a qualified practitioner to review the rubric.

| Metric | Baseline | Target to test | How to measure |
|---|---|---|---|
| Consultation note preparation time | Manual note-writing time | ≥40% median improvement | Same vignette, timed A/B or crossover study |
| Required info completeness | Human-authored baseline | ≥90% fields available or explicitly unknown | Reviewed checklist |
| Unsupported factual claims | Model outputs before grounding | 0 in 20 curated golden scenarios | Manual field-level attribution audit |
| Unsafe medical directions | Regression test suite | 0 releases with known failed critical tests | Red-team seeded test cases |
| Explicit crisis recall | Test baseline | Maximize recall; investigate every miss | Labeled synthetic scenarios, sensitivity/false positives |
| API reliability | Existing live baseline | ≥99% successful completion for non-crisis demo requests | Repeat requests with failure injection |
| AMD inference latency | Measure real endpoint | Collect median and p95 | Server-side timings; separate cached/fallback |
| Screenreader/mobile UX | Manual baseline | No critical WCAG blockers in demo | Keyboard, screen reader, small screen QA |

A zero-result in a small test set is **not** proof of 100% safety, diagnostic correctness, or production readiness.

## 8. Team workflow (6 people)

| Role | Accountability |
|---|---|
| Product/Pitch Lead | Scope, demo narrative, judge rubric, team synchronization |
| Full-stack Frontend | Intake UI, Care Passport, responsive UX, consent views |
| AI/AMD Engineer | Endpoint provisioning, adapter, observability, benchmark |
| Backend Engineer | APIs, schemas, persistence, export, privacy controls |
| Safety/QA Engineer | Adversarial tests, crisis paths, hallucination checks, security |
| UX/Research + Demo | Usability test, synthetic personas, video, slides, measurable impact |

All members cross-review high-risk code paths. No live patient records or real clinicians required for demo.

## 9. Proposed October sprint (subject to confirmed submission deadline)

**13 Oct:** freeze user story; inspect code; setup AMD endpoint; build golden synthetic cases and acceptance tests.  
**14 Oct:** integrate AMD provider; structured schema; server-side validation and instrumentation.  
**15 Oct:** Care Passport, explicit unknowns/source links, privacy consent and local export.  
**16 Oct:** escalation and synthetic human-review demo; tests; accessibility.  
**17 Oct:** deploy, repeat end-to-end demos, collect real measurements, record video, deck, README, containerization.  
**18 Oct:** buffer only if confirmed permitted by actual submission portal; verify exact cutoff/timezone in dashboard, as event listings may differ.

## 10. Suggested demo sequence (approx. 3 minutes)

1. **0:00–0:20:** Indonesian adult finds it hard to organize concerns before consultation; explain narrow measurable need.
2. **0:20–1:00:** synthetic user inputs story by text or editable voice transcript; AI intake requests missing detail.
3. **1:00–1:35:** AMD-hosted model generates structured note; source-backed fields, unknowns, visible provider trace.
4. **1:35–2:00:** user reviews/edits and exports Care Passport; show manual-vs-assisted timing.
5. **2:00–2:25:** second case triggers risk/human support path; clearly no diagnosis or automated clinical triage.
6. **2:25–2:45:** privacy and fallback proof: redact identifiers, disable AMD, demonstrate safe status.
7. **2:45–3:00:** impact chart, target customers, limitations, concrete next steps.

## 11. Submission readiness checklist

- [ ] Public repository reflects original work, proper attribution and eligible license.
- [ ] Root MIT `LICENSE` file if required by rules, and `Dockerfile` / reproducible deployment.
- [ ] Updated README with architecture, AMD setup, env.example, local run and tests.
- [ ] Working hosted URL and accessible live demo.
- [ ] Real AMD component in working user flow; telemetry shows successful live AMD calls.
- [ ] No secrets or real patient/sensitive data committed or shown.
- [ ] P0 safety tests pass; clear policy for provider failures and unknown results.
- [ ] Exact official hotline name, hours, links verified near submission.
- [ ] Consent and data-processing notices describe third-party inference accurately.
- [ ] Measured benchmark results honestly distinguished from target hypotheses.
- [ ] Short description, long description, pitch slides, cover, and video ready.
- [ ] Check submission portal's exact deadline and time zone.

## 12. Proposed submission copy

**Title:** Dengar.in CareBridge — From Being Heard to Getting Human Support

**Short description (draft; use AMD claim only after live integration is verified):** Dengar.in CareBridge helps Indonesian adults turn difficult mental wellbeing stories into clear, user-reviewed consultation preparation notes. Powered by AI inference on AMD infrastructure, it marks missing facts, protects privacy, and recommends human support when AI should not decide.

**Value proposition:** Lower preparation burden, better articulated concerns, traceable summaries, and a clear human handoff; no autonomous medical diagnosis or treatment.

## 13. Sources

- Repository: https://github.com/iqbalscript/Denger.in-Web-Project
- Track/event: https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii
- AMD ROCm/vLLM docs: https://rocm.docs.amd.com/en/docs-7.2.0/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html
- Official Healing119 guidance: https://kesprimkom.kemkes.go.id/konten/127/151/0/cegah-bunuh-diri-dukung-kesehatan-jiwa-kenali-layanan-healing119-id

**Scope boundary:** This blueprint does not represent clinical advice, certify safety, or assert unverified features are deployed. Human review is demo-simulated until a real authorized clinical partner is available.
