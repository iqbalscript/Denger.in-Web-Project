# AI POLICY & ORCHESTRATION GUARDRAILS — Dengar.in

**Document Version**: 1.0.0 (Foundation)  
**Status**: Active Engineering Directive  

---

## 1. Role of AI: Orchestrator, Not Unbounded Chatbot

In Dengar.in, the AI functions as an **Orchestrator of Structured Interventions**. It does NOT have free-form conversational authority to invent psychological exercises, give medical advice, or conduct open-ended pseudo-therapy.

### Allowed Architecture:
```
User Prompt (Validated Non-Crisis)
    │
    ▼
LLM Inference (DeepSeek V4.1 Flash direct / OpenRouter free-tier fallback)
    │
    ▼
JSON Output Generation (Strict Schema Enforcement)
    │
    ▼
Runtime Whitelist Validator (services/validator)
    │
    ├── [REJECT / INVALID SCHEMA] ──► Fallback to Deterministic Safe Payload
    │
    ▼ [APPROVED]
Application State Update / UI Render
```

---

## 2. Whitelisted Action Schema

The AI's JSON output MUST contain an `action` property restricted to one of six whitelisted types:

| Action | Purpose | Permitted Payload |
| :--- | :--- | :--- |
| `chat` | Empathetic validation & reflective conversation (max 150 words) | Text with non-diagnostic disclaimer |
| `suggest_mission` | Recommends a curated micro-mission tailored to user's domain | Mission ID from pre-approved mission catalog |
| `open_journal_prompt` | Proposes a focused private journaling prompt | Prompt text & reflection tags |
| `suggest_forum` | Suggests visiting a relevant anonymous topic space *(Sprint 1+)* | Topic slug & contextual tag |
| `adjust_path` | Recommends pacing adjustment for the 2–4 week path | Path ID & adjustment rationale |
| `show_help_directory` | Presents curated professional or community directories | Resource category (`counseling`, `financial`, `teen`) |

Any action outside this whitelist is immediately rejected by `services/validator`.

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

## 4. Multi-Tiered Fallback Architecture

To ensure 100% uptime and resilience during live competition judging and production use:

```
┌────────────────────────────────────────────────────────┐
│ TIER 1: Primary Model                                  │
│ Model: DeepSeek V4.1 Flash                             │
│ Provider: DeepSeek Platform direct (api.deepseek.com)  │
│ Latency Target: < 1.2s                                 │
│ Timeout: 4000ms                                        │
└──────────────────────────┬─────────────────────────────┘
                           │ Failure / Timeout / Rate Limit
                           ▼
┌────────────────────────────────────────────────────────┐
│ TIER 2: Secondary Cloud Fallback ("second brain")      │
│ Provider: OpenRouter, free-tier model                  │
│ Default: meta-llama/llama-3.3-70b-instruct:free        │
│ (overridable via OPENROUTER_MODEL; see .env.example)   │
│ Timeout: 4000ms                                        │
└──────────────────────────┬─────────────────────────────┘
                           │ Failure / Network Outage
                           ▼
┌────────────────────────────────────────────────────────┐
│ TIER 3: Deterministic Offline Fallback                 │
│ Provider: Local Rule-Based Response Matrix             │
│ Zero external HTTP calls; guaranteed instant response   │
│ Returns curated domain-specific grounding steps        │
└────────────────────────────────────────────────────────┘
```

The system will never show a broken screen or error state to a distressed user if AI services are unreachable.
