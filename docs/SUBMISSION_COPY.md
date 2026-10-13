# Submission Copy — Dengar.in (AMD Developer Hackathon ACT III, Track 2)

Language: English (lablab.ai submissions are in English). Brand: **Dengar.in**. "CareBridge" is the module name only.
Limits, verified 13 Oct 2026 at https://lablab.ai/ai-articles/hackathon-guidelines: title ≤ 50 chars, short description ≤ 255 chars, long description ≥ 100 words, video ≤ 5 min and < 300 MB, cover 16:9 recommended.

**Pre-flight before pasting any of this into the portal (owner: Product/Pitch):**

- [ ] A real AMD endpoint has answered `probeAmdEndpoint()` with `ok: true` and Cases A, B, D, E have been run against it (AMD-02, AMD-13). Until then, every sentence below that says the model "runs" or "is served" on AMD is a **plan**, not a fact. Use the conservative short-description variant if submitting earlier.
- [ ] The hosted app URL works. As of 14 Oct 2026 the `/care-passport` page, `/api/care-passport` routes, review and export exist in the working tree but are **uncommitted and untested**; `/support-options` and `/review-demo` do not exist.
- [ ] `LICENSE` (MIT) and `apps/web/Dockerfile` are committed (both exist in the working tree, uncommitted) and the image has been built at least once.
- [ ] Emergency-contact labels verified (Healing119.id).
- [ ] Exact submission deadline and timezone confirmed in the dashboard.

## 1. Title options (≤ 50 characters)

| # | Title | Chars |
|---|---|---|
| 1 | `Dengar.in CareBridge: Grounded Consult Prep on AMD` | 50 |
| 2 | `Dengar.in: Care Passport for Mental Health Intake` | 49 |
| 3 | `Dengar.in: From Being Heard to Human Support` | 44 |

Recommendation: option 2 (says what the artifact is; no AMD claim in the title, so it stays true regardless of integration timing). Option 1 only if the live AMD trace exists.

## 2. Short description (≤ 255 characters)

Primary (224 chars; use only after the live AMD trace exists):

> Dengar.in turns a hard-to-explain mental wellbeing story into a user-reviewed, source-linked consultation note. Open model served by vLLM on AMD; crisis rules and PII redaction run first; unknowns stay unknown; no diagnosis.

Conservative variant (234 chars; safe to use before the live AMD trace exists, since "built for" is a design statement, not a runtime claim):

> Dengar.in turns a hard-to-explain mental wellbeing story into a user-reviewed, source-linked consultation note. Crisis rules and PII redaction run before any model call; unknowns stay unknown; no diagnosis. Built for inference on AMD.

## 3. Long description (≥ 100 words; this draft is 301 words)

> Dengar.in is an anonymous mental wellbeing companion for Indonesian adults. For AMD Developer Hackathon ACT III, Track 2, we added CareBridge: a module that turns a hard-to-explain story into a Care Passport, a short, user-owned preparation note for a first consultation with a psychologist or counselor.
>
> The problem is narrow and measurable. Many adults sit in a first session unable to explain what has been happening, for how long, and what it affects. CareBridge asks for the story in the user's own words and returns a structured note: main concerns, daily impact, duration, relevant context, questions to ask a professional, and an explicit list of what is still unknown.
>
> Every fact in the note must quote the user's own sanitized text. The model, an open model served by vLLM on an AMD Instinct MI300X in AMD Developer Cloud, only proposes a draft. A deterministic validator removes anything it cannot trace to a quote, including invented durations, diagnostic labels, medication advice, and confidence percentages. Missing information is shown as unknown, never guessed.
>
> Safety comes first, in code. A rule-based crisis gate runs on the raw text before consent and before any model call; a crisis or an explicit request for urgent help shows verified support resources and calls no AI at all. The model can only escalate toward human support, never downgrade a rule-based flag. Identifiers are detected and redacted, with a preview the user controls, before anything leaves our server. If the AMD endpoint is unreachable, the app says so and offers a manual path instead of a fabricated summary. The note stays with the user: review, correct, approve, and export locally; sharing requires a separate, affirmative permission.
>
> All demo data is synthetic. CareBridge does not diagnose, treat, or triage, and it is not a substitute for a mental health professional.

Edit before submitting: replace "an open model" with the exact model name and license, and "AMD Instinct MI300X in AMD Developer Cloud" with whatever infrastructure was actually used (if the team ends up on AMD Token Factory instead of a self-hosted vLLM, say so). Add measured numbers only from AMD-14, with sample sizes.

## 4. Technology tags

Confirmed in code: `AMD`, `vLLM`, `ROCm`, `Next.js`, `React`, `TypeScript`, `Node.js`, `PostgreSQL`, `Redis`, `OpenAI-compatible API`, `Docker` (Dockerfile present, uncommitted, not yet built).
Add only after use is real: `AMD Instinct MI300X`, `AMD Developer Cloud`, the model family (e.g. `Qwen`).
Category tags: `Health & Wellbeing`, `Mental Health`, `Privacy`, `Responsible AI`, `Indonesian`.

## 5. Mapping to the judging criteria

Criteria from the event page (no published weights): Application of Technology, Business Value, Originality, Presentation.

| Criterion | What to show | Evidence in repo |
|---|---|---|
| Application of Technology | Care Passport extraction and consultation questions run on an open model served by vLLM on AMD, through the project's own OpenAI-compatible adapter. Provenance (`providerId: amd:<model>`, `isAmd`, `latencyMs`) is visible in the UI and in server metadata logs. Capability probe reports model list, chat latency, and whether JSON mode works. | `services/orchestrator/src/providers/amdProvider.ts`, `services/orchestrator/src/carePassportPipeline.ts`, `docs/AMD_SETUP.md`. **Live trace: pending (AMD-02).** |
| Business Value | A narrow, measurable workflow: time to prepare a consultation note and completeness of required information, with explicit unknowns. Reuses an existing anonymous product with onboarding, check-ins, journal, forum, and crisis resources. Fits counselor/intake preparation without claiming a clinical service. | `docs/AMD_TRACK2_DEVELOPMENT_PLAN.md` §1, §7 (targets, **not measured yet**; AMD-14). |
| Originality | Grounding-by-quotation as a hard rule rather than a prompt wish; a five-state result model where AI can only escalate; redaction preview owned by the user; honest provider-outage state instead of silent fallback to a non-AMD model. | `services/validator/src/carePassport.ts`, `services/validator/src/piiRedactor.ts`, `packages/types/src/index.ts`, `docs/CAREBRIDGE_SAFETY_POLICY.md`. |
| Presentation | ≤ 4-minute demo on synthetic Cases A–E showing sources/unknowns, review/export, redaction preview, crisis precedence without sensational text, outage honesty, and the AMD trace; recorded fallback prepared. | `docs/DEMO_SCRIPT.md`, `tests/carebridge/fixtures.mjs`. |

Track 2 explanation requirements (the page asks teams to explain how they handle incorrect responses, sensitive data, uncertain results, high-risk decisions, and human review):

- **Incorrect or ungrounded responses:** validator drops any field without a verbatim quote from the sanitized input; dropped count is reported, never shown as fact.
- **Sensitive data:** PII detection and redaction before inference; provider receives sanitized text only; no AI response cache for this flow; logs carry metadata only.
- **Uncertain results:** `unknowns` list, `needsReview` flag on paraphrases, `NEEDS_CLARIFICATION` with at most one question, no confidence percentages.
- **High-risk decisions:** deterministic crisis gate before consent and before AI; `IMMEDIATE_HELP_SCREEN` with zero model calls; model may only escalate.
- **Human review:** every note is `user_pending` until the user approves; a human-support recommendation is informational; a synthetic-only review panel is planned, not a clinical service.

## 6. Honest limitations (include in the submission, do not hide)

- **AMD integration status.** The adapter, probe, and pipeline exist and pass 135 tests (13 Oct 2026), but all against mock servers. No AMD endpoint is configured in the repository at the time of writing. The live trace, latency numbers, and model-quality results come from AMD-02/AMD-13/AMD-14 and must be inserted here before submission.
- **Not committed, not tested end to end.** The intake API route, Care Passport page, redaction preview, separate AI consent step, review and local export exist only as uncommitted files in the working tree as of 14 Oct 2026, with no automated tests for the route, page or export. The support-options page and the synthetic review panel (AMD-12) do not exist. Provider error messages are still forwarded to the browser in `warnings` (secrets stripped), pending use of `publicWarnings.ts` in the Care Passport route.
- **Not clinical.** No diagnosis, treatment, triage, or emergency dispatch. No clinical partner; any staff view uses synthetic records only.
- **Crisis detection is rule-based and imperfect.** Indonesian phrase rules miss some cases and misfire on others. A "need help now" control independent of any classifier is required in the UI. The `high`-distress policy is still a proposal awaiting Safety/QA approval.
- **Redaction is best-effort.** Deterministic patterns for emails, Indonesian phone numbers, NIK, URLs, handles, cards, address hints, and self-introduced names. Not a guarantee of anonymity; the user reviews the preview.
- **Small synthetic test sets.** Zero unsupported claims on 5 golden cases and 20 attribution scenarios with hand-written mock drafts proves the validator, not the model, and is not proof of safety or production readiness.
- **Scope.** Adults (18+) only, Indonesian language, text intake. Voice intake and document upload are later priorities. The broader Dengar.in product keeps its existing 15–54 scope and policies.
- **Deployment.** Self-hosted vLLM is reached over an SSH tunnel to the team's AMD Developer Cloud instance; the instance is destroyed between sessions to control credit use, so the hosted demo may rely on recordings when judged outside a live session. `apps/web/Dockerfile` and a root MIT `LICENSE` exist in the working tree but are uncommitted, and the image has not been built or run on the AMD instance yet.
- **Pre-existing project.** Dengar.in predates the hackathon (MindCraft Web Competition 2026). CareBridge work starts from 13 Oct 2026; whether and how to declare this is an open question for the organizers (see `docs/AMD_01_SCOPE_DAN_SYARAT.md` §5).

## 7. Supporting links to paste

- Repository: https://github.com/iqbalscript/Denger.in-Web-Project
- Architecture: `docs/CAREBRIDGE_ARCHITECTURE.md` · AMD setup: `docs/AMD_SETUP.md` · Safety policy: `docs/CAREBRIDGE_SAFETY_POLICY.md` · Evaluation rubric: `docs/CAREBRIDGE_EVAL_RUBRIC.md` · Demo script: `docs/DEMO_SCRIPT.md`
- Tests: `npm run test:carebridge`
- Hosted app URL: _to be filled (AMD-15)_
- Video URL: _to be filled (AMD-16)_
