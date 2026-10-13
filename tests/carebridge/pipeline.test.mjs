import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  runCarePassportPipeline,
  DEFAULT_CLARIFICATION_QUESTION,
} from '../../services/orchestrator/src/carePassportPipeline.ts';
import { CARE_PASSPORT_INPUT_OPEN } from '../../packages/prompts/src/carePassport.ts';

const STUDENT_STRESS =
  'Aku kewalahan dengan tugas kuliah. Kalau deadline berdekatan, aku sulit fokus. Aku belum tahu gimana menjelaskan ini saat minta bantuan.';

const GROUNDED_DRAFT = {
  version: 1,
  concerns: [{ value: 'Kewalahan dengan tugas kuliah', source: 'user_input', sourceQuote: 'kewalahan dengan tugas kuliah' }],
  dailyImpact: [{ value: 'Sulit fokus saat deadline berdekatan', source: 'user_input', sourceQuote: 'Kalau deadline berdekatan, aku sulit fokus' }],
  duration: { value: null, source: 'unknown' },
  relevantContext: [],
  questionsForProfessional: ['Bagaimana cara mengatur tugas saat deadline menumpuk?'],
  unknowns: [],
};

function mockProvider(id, generate, extra = {}) {
  const provider = {
    id,
    calls: [],
    isConfigured: () => true,
    async generate(request) {
      provider.calls.push(request);
      return generate(request);
    },
    ...extra,
  };
  return provider;
}

const returns = (draft) => async () => ({ rawText: typeof draft === 'string' ? draft : JSON.stringify(draft) });

describe('Care Passport pipeline: safety precedence', () => {
  it('routes deterministic crisis input to IMMEDIATE_HELP_SCREEN without calling any provider', async () => {
    const provider = mockProvider('amd:test', returns(GROUNDED_DRAFT), { isAmd: true });
    const text = 'Aku capek, rasanya pengen mati aja.';
    const result = await runCarePassportPipeline(
      { rawText: text, sanitizedText: text, aiConsent: true },
      { providers: [provider] }
    );
    assert.equal(result.state, 'IMMEDIATE_HELP_SCREEN');
    assert.equal(provider.calls.length, 0);
    assert.ok(result.emergencyContacts.length > 0);
    assert.equal(result.passport, undefined);
    assert.equal(result.provenance.isFallback, true);
  });

  it('honours an explicit request for urgent help without any model call', async () => {
    const provider = mockProvider('amd:test', returns(GROUNDED_DRAFT), { isAmd: true });
    const text = 'Tolong, aku butuh bantuan darurat sekarang.';
    const result = await runCarePassportPipeline(
      { rawText: text, sanitizedText: text, aiConsent: true },
      { providers: [provider] }
    );
    assert.equal(result.state, 'IMMEDIATE_HELP_SCREEN');
    assert.equal(provider.calls.length, 0);
  });

  it('never calls a provider when AI consent is declined', async () => {
    const provider = mockProvider('amd:test', returns(GROUNDED_DRAFT), { isAmd: true });
    const result = await runCarePassportPipeline(
      { rawText: STUDENT_STRESS, sanitizedText: STUDENT_STRESS, aiConsent: false },
      { providers: [provider] }
    );
    assert.equal(result.state, 'PROVIDER_UNAVAILABLE');
    assert.equal(provider.calls.length, 0);
    assert.ok(result.warnings.includes('ai_consent_declined'));
    assert.equal(result.passport, undefined);
  });

  it('still runs the crisis gate before the consent check', async () => {
    const text = 'Aku ingin bunuh diri.';
    const result = await runCarePassportPipeline({ rawText: text, sanitizedText: text, aiConsent: false });
    assert.equal(result.state, 'IMMEDIATE_HELP_SCREEN');
  });
});

describe('Care Passport pipeline: inference and grounding', () => {
  it('returns READY_FOR_USER_REVIEW with AMD provenance for a grounded draft', async () => {
    let tick = 1000;
    const provider = mockProvider('amd:test-model', returns(GROUNDED_DRAFT), { isAmd: true });
    const result = await runCarePassportPipeline(
      { rawText: STUDENT_STRESS, sanitizedText: STUDENT_STRESS, aiConsent: true },
      { providers: [provider], now: () => (tick += 250) }
    );
    assert.equal(result.state, 'READY_FOR_USER_REVIEW');
    assert.equal(result.provenance.providerId, 'amd:test-model');
    assert.equal(result.provenance.isAmd, true);
    assert.equal(result.provenance.isFallback, false);
    assert.equal(result.provenance.latencyMs, 250);
    assert.equal(result.passport.reviewStatus, 'user_pending');
    assert.equal(result.passport.duration.source, 'unknown');
  });

  it('marks a non-AMD provider honestly in provenance', async () => {
    const provider = mockProvider('deepseek:test', returns(GROUNDED_DRAFT));
    const result = await runCarePassportPipeline(
      { rawText: STUDENT_STRESS, sanitizedText: STUDENT_STRESS, aiConsent: true },
      { providers: [provider] }
    );
    assert.equal(result.provenance.isAmd, false);
  });

  it('falls through to the next provider when the first returns malformed output', async () => {
    const broken = mockProvider('amd:broken', returns('maaf, saya tidak bisa'), { isAmd: true });
    const backup = mockProvider('amd:backup', returns(GROUNDED_DRAFT), { isAmd: true });
    const result = await runCarePassportPipeline(
      { rawText: STUDENT_STRESS, sanitizedText: STUDENT_STRESS, aiConsent: true },
      { providers: [broken, backup] }
    );
    assert.equal(broken.calls.length, 1);
    assert.equal(backup.calls.length, 1);
    assert.equal(result.state, 'READY_FOR_USER_REVIEW');
    assert.equal(result.provenance.providerId, 'amd:backup');
    assert.ok(result.warnings.some((w) => w.startsWith('amd:broken')));
  });

  it('returns PROVIDER_UNAVAILABLE without a passport when every provider fails', async () => {
    const timeout = mockProvider('amd:down', async () => {
      throw new Error('timeout');
    }, { isAmd: true });
    const invalid = mockProvider('deepseek:invalid', returns({ foo: 'bar' }));
    const result = await runCarePassportPipeline(
      { rawText: STUDENT_STRESS, sanitizedText: STUDENT_STRESS, aiConsent: true },
      { providers: [timeout, invalid] }
    );
    assert.equal(result.state, 'PROVIDER_UNAVAILABLE');
    assert.equal(result.passport, undefined);
    assert.equal(result.provenance.providerId, 'none');
    assert.equal(result.provenance.isFallback, true);
  });

  it('returns PROVIDER_UNAVAILABLE when no provider is configured', async () => {
    const result = await runCarePassportPipeline({ rawText: STUDENT_STRESS, sanitizedText: STUDENT_STRESS, aiConsent: true });
    assert.equal(result.state, 'PROVIDER_UNAVAILABLE');
    assert.ok(result.warnings.includes('no_provider_configured'));
  });

  it('asks for clarification when nothing in the draft is grounded', async () => {
    const vague = 'Aku sering ngerasa nggak baik, entah kenapa.';
    const provider = mockProvider('amd:test', returns({
      concerns: [{ value: 'Gangguan tidur', source: 'user_input', sourceQuote: 'susah tidur tiap malam' }],
      duration: { value: '6 bulan', source: 'user_input', sourceQuote: 'enam bulan' },
      clarificationQuestion: 'Perasaan tidak baik itu paling sering muncul kapan?',
    }), { isAmd: true });
    const result = await runCarePassportPipeline(
      { rawText: vague, sanitizedText: vague, aiConsent: true },
      { providers: [provider] }
    );
    assert.equal(result.state, 'NEEDS_CLARIFICATION');
    assert.equal(result.passport.concerns.length, 0);
    assert.equal(result.passport.duration.source, 'unknown');
    assert.equal(result.clarificationQuestion, 'Perasaan tidak baik itu paling sering muncul kapan?');
    assert.equal(result.droppedClaims, 2);
  });

  it('uses a safe default clarification question when the model gives none', async () => {
    const vague = 'Aku sering ngerasa nggak baik, entah kenapa.';
    const provider = mockProvider('amd:test', returns({ concerns: [] }), { isAmd: true });
    const result = await runCarePassportPipeline(
      { rawText: vague, sanitizedText: vague, aiConsent: true },
      { providers: [provider] }
    );
    assert.equal(result.state, 'NEEDS_CLARIFICATION');
    assert.equal(result.clarificationQuestion, DEFAULT_CLARIFICATION_QUESTION);
  });
});

describe('Care Passport pipeline: escalation only', () => {
  it('escalates to HUMAN_SUPPORT_RECOMMENDED when the model suggests human support', async () => {
    const provider = mockProvider('amd:test', returns({ ...GROUNDED_DRAFT, humanSupportSuggested: true }), { isAmd: true });
    const result = await runCarePassportPipeline(
      { rawText: STUDENT_STRESS, sanitizedText: STUDENT_STRESS, aiConsent: true },
      { providers: [provider] }
    );
    assert.equal(result.state, 'HUMAN_SUPPORT_RECOMMENDED');
    assert.ok(result.warnings.includes('model_escalation'));
  });

  it('a model claiming no risk cannot downgrade a deterministic high-distress flag', async () => {
    const text = 'Aku udah hancur lebur karena tugas kuliah, kewalahan banget.';
    const provider = mockProvider('amd:test', returns({
      concerns: [{ value: 'Kewalahan karena tugas kuliah', source: 'user_input', sourceQuote: 'kewalahan banget' }],
      humanSupportSuggested: false,
      riskLevel: 'none',
    }), { isAmd: true });
    const result = await runCarePassportPipeline(
      { rawText: text, sanitizedText: text, aiConsent: true },
      { providers: [provider] }
    );
    assert.equal(result.state, 'HUMAN_SUPPORT_RECOMMENDED');
    assert.ok(result.warnings.includes('deterministic_high_distress'));
  });
});

describe('Care Passport pipeline: data minimisation', () => {
  it('sends only the sanitized text to the provider', async () => {
    const raw = 'Aku kewalahan dengan tugas kuliah. Hubungi aku di 0812-3456-7890 ya.';
    const sanitized = 'Aku kewalahan dengan tugas kuliah. Hubungi aku di [NOMOR_TELEPON] ya.';
    const provider = mockProvider('amd:test', returns(GROUNDED_DRAFT), { isAmd: true });
    await runCarePassportPipeline({ rawText: raw, sanitizedText: sanitized, aiConsent: true }, { providers: [provider] });

    assert.equal(provider.calls.length, 1);
    const sent = JSON.stringify(provider.calls[0]);
    assert.ok(!sent.includes('0812-3456-7890'));
    assert.ok(provider.calls[0].userPrompt.includes('[NOMOR_TELEPON]'));
    assert.ok(provider.calls[0].userPrompt.includes(CARE_PASSPORT_INPUT_OPEN));
  });

  it('validates grounding against sanitized text, so redacted identifiers cannot be quoted back', async () => {
    const raw = 'Aku kewalahan dengan tugas kuliah. Hubungi aku di 0812-3456-7890 ya.';
    const sanitized = 'Aku kewalahan dengan tugas kuliah. Hubungi aku di [NOMOR_TELEPON] ya.';
    const provider = mockProvider('amd:test', returns({
      ...GROUNDED_DRAFT,
      dailyImpact: [],
      relevantContext: [{ value: 'Nomor 0812-3456-7890', source: 'user_input', sourceQuote: '0812-3456-7890' }],
    }), { isAmd: true });
    const result = await runCarePassportPipeline({ rawText: raw, sanitizedText: sanitized, aiConsent: true }, { providers: [provider] });
    assert.equal(result.passport.relevantContext.length, 0);
    assert.ok(!JSON.stringify(result.passport).includes('0812'));
  });
});
