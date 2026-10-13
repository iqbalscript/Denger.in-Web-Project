import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleCarePassportRequest,
  validateCarePassportBody,
  selectAcceptedFindings,
  CARE_PASSPORT_MAX_TEXT,
  CARE_PASSPORT_MAX_REDACTIONS,
} from '../../apps/web/src/lib/api/carePassportHandler.ts';
import { runCarePassportPipeline } from '../../services/orchestrator/src/carePassportPipeline.ts';
import { detectPii } from '../../services/validator/src/piiRedactor.ts';
import { buildCarePassportExport, carePassportExportFileName } from '../../apps/web/src/lib/carePassportExport.ts';

// Synthetic inputs only. No real person, number or address.
const STORY =
  'Aku kewalahan dengan tugas kuliah. Kalau deadline berdekatan, aku sulit fokus. Aku belum tahu gimana menjelaskan ini saat minta bantuan.';
const STORY_WITH_PII =
  'Namaku Rina Pratiwi. Aku kewalahan dengan tugas kuliah dan sering dihubungi dosen di 0812-3456-7890 atau rina@example.com. Kalau deadline berdekatan, aku sulit fokus.';
const CRISIS = 'Aku capek, rasanya pengen mati aja.';

const READY = {
  state: 'READY_FOR_USER_REVIEW',
  passport: {
    version: 1,
    subject: 'anonymous_adult',
    concerns: [{ value: 'Kewalahan dengan tugas kuliah', source: 'user_input', sourceQuote: 'kewalahan dengan tugas kuliah', needsReview: true }],
    dailyImpact: [],
    duration: { value: null, source: 'unknown', needsReview: false },
    relevantContext: [],
    questionsForProfessional: ['Bagaimana cara mengatur tugas saat deadline menumpuk?'],
    unknowns: ['Sejak kapan hal ini dirasakan'],
    disclaimer: 'Bukan diagnosis.',
    reviewStatus: 'user_pending',
  },
  provenance: { providerId: 'amd:test', isAmd: true, isFallback: false, latencyMs: 12 },
  droppedClaims: 1,
  warnings: ['dropped_claim', 'amd:test: HTTP 200 but slow'],
};

function spyPipeline(result = READY) {
  const calls = [];
  return {
    calls,
    runPipeline: async (input) => {
      calls.push(input);
      return result;
    },
  };
}

function spyProvider() {
  const provider = {
    id: 'amd:test',
    isAmd: true,
    calls: [],
    isConfigured: () => true,
    async generate(request) {
      provider.calls.push(request);
      return { rawText: JSON.stringify(READY.passport) };
    },
  };
  return provider;
}

describe('Care Passport route handler: safety precedence', () => {
  it('returns IMMEDIATE_HELP_SCREEN for crisis text without ever calling the pipeline (generate)', async () => {
    const spy = spyPipeline();
    const out = await handleCarePassportRequest({ text: CRISIS, aiConsent: true }, spy);
    assert.equal(out.ok, true);
    assert.equal(out.data.kind, 'result');
    assert.equal(out.data.result.state, 'IMMEDIATE_HELP_SCREEN');
    assert.ok(out.data.result.emergencyContacts.length > 0);
    assert.equal(out.data.result.provenance.isFallback, true);
    assert.equal(out.data.result.passport, undefined);
    assert.equal(spy.calls.length, 0);
  });

  it('runs the crisis gate even in preview mode, before PII detection', async () => {
    const spy = spyPipeline();
    const out = await handleCarePassportRequest({ mode: 'preview', text: `${CRISIS} Hubungi 0812-3456-7890.` }, spy);
    assert.equal(out.data.kind, 'result');
    assert.equal(out.data.result.state, 'IMMEDIATE_HELP_SCREEN');
    assert.equal(spy.calls.length, 0);
  });

  it('honours an explicit urgent-help request regardless of consent', async () => {
    const spy = spyPipeline();
    const out = await handleCarePassportRequest({ text: 'Tolong, aku butuh bantuan darurat sekarang.', aiConsent: false }, spy);
    assert.equal(out.data.result.state, 'IMMEDIATE_HELP_SCREEN');
    assert.deepEqual(out.data.result.warnings, ['urgent_help_requested']);
    assert.equal(spy.calls.length, 0);
  });
});

describe('Care Passport route handler: consent', () => {
  it('declined AI consent goes through the real pipeline and never reaches a provider', async () => {
    const provider = spyProvider();
    const out = await handleCarePassportRequest(
      { text: STORY, aiConsent: false },
      { runPipeline: (input) => runCarePassportPipeline(input, { providers: [provider] }) }
    );
    assert.equal(out.ok, true);
    assert.equal(out.data.result.state, 'PROVIDER_UNAVAILABLE');
    assert.ok(out.data.result.warnings.includes('ai_consent_declined'));
    assert.equal(out.data.result.provenance.isFallback, true);
    assert.equal(out.data.result.passport, undefined);
    assert.equal(out.data.sanitizedText, undefined);
    assert.equal(provider.calls.length, 0);
  });

  it('treats a missing aiConsent as declined', async () => {
    const provider = spyProvider();
    const out = await handleCarePassportRequest(
      { text: STORY },
      { runPipeline: (input) => runCarePassportPipeline(input, { providers: [provider] }) }
    );
    assert.equal(out.data.result.state, 'PROVIDER_UNAVAILABLE');
    assert.equal(provider.calls.length, 0);
  });

  it('with consent, the provider only ever sees sanitized text', async () => {
    const provider = spyProvider();
    const out = await handleCarePassportRequest(
      { text: STORY_WITH_PII, aiConsent: true },
      { runPipeline: (input) => runCarePassportPipeline(input, { providers: [provider] }) }
    );
    assert.equal(out.ok, true);
    assert.equal(provider.calls.length, 1);
    const sent = provider.calls[0].userPrompt;
    assert.ok(!sent.includes('0812-3456-7890'));
    assert.ok(!sent.includes('rina@example.com'));
    assert.ok(!sent.includes('Rina Pratiwi'));
    assert.ok(sent.includes('[NOMOR_TELEPON]'));
  });
});

describe('Care Passport route handler: server-side redaction', () => {
  it('preview returns the server findings and a fully redacted text without calling the pipeline', async () => {
    const spy = spyPipeline();
    const out = await handleCarePassportRequest({ mode: 'preview', text: STORY_WITH_PII, aiConsent: true }, spy);
    assert.equal(out.ok, true);
    assert.equal(out.data.kind, 'preview');
    assert.equal(spy.calls.length, 0);
    const kinds = out.data.findings.map((f) => f.kind).sort();
    assert.deepEqual(kinds, ['email', 'person_name_hint', 'phone']);
    assert.ok(out.data.redactedText.includes('[NAMA]'));
    assert.ok(out.data.redactedText.includes('[NOMOR_TELEPON]'));
    assert.ok(out.data.redactedText.includes('[EMAIL]'));
    assert.ok(!out.data.redactedText.includes('0812'));
  });

  it('redacts everything it detects when the client sends no choices', async () => {
    const spy = spyPipeline();
    await handleCarePassportRequest({ text: STORY_WITH_PII, aiConsent: true }, spy);
    const { rawText, sanitizedText } = spy.calls[0];
    assert.equal(rawText, STORY_WITH_PII);
    assert.ok(!sanitizedText.includes('0812-3456-7890'));
    assert.ok(!sanitizedText.includes('rina@example.com'));
    assert.ok(!sanitizedText.includes('Rina Pratiwi'));
  });

  it('lets the client keep a finding, but re-detects and ignores spans the server did not find', async () => {
    const spy = spyPipeline();
    const findings = detectPii(STORY_WITH_PII);
    const phone = findings.find((f) => f.kind === 'phone');
    const email = findings.find((f) => f.kind === 'email');
    const redactions = [
      { kind: phone.kind, start: phone.start, end: phone.end },
      // Tampered: right kind, wrong offsets -> not a server finding -> ignored.
      { kind: email.kind, start: email.start + 1, end: email.end + 1 },
      // Fabricated span over ordinary words -> ignored, text untouched.
      { kind: 'url', start: 0, end: 6 },
    ];
    const out = await handleCarePassportRequest({ text: STORY_WITH_PII, aiConsent: true, redactions }, spy);
    assert.equal(out.ok, true);
    const { sanitizedText } = spy.calls[0];
    assert.ok(sanitizedText.includes('[NOMOR_TELEPON]'));
    assert.ok(sanitizedText.includes('rina@example.com'), 'user chose to keep the email');
    assert.ok(sanitizedText.includes('Rina Pratiwi'), 'not in the client choices, so kept');
    assert.ok(sanitizedText.startsWith('Namaku'), 'fabricated span must not blank ordinary words');
    assert.ok(!sanitizedText.includes('undefined'));
  });

  it('never trusts a client-provided redacted text', async () => {
    const spy = spyPipeline();
    await handleCarePassportRequest(
      { text: STORY_WITH_PII, aiConsent: true, sanitizedText: 'teks palsu', redactedText: 'teks palsu' },
      spy
    );
    assert.notEqual(spy.calls[0].sanitizedText, 'teks palsu');
    assert.ok(spy.calls[0].sanitizedText.includes('[EMAIL]'));
  });

  it('selectAcceptedFindings intersects by exact span identity', () => {
    const server = detectPii(STORY_WITH_PII);
    assert.equal(selectAcceptedFindings(server, undefined).length, server.length);
    assert.equal(selectAcceptedFindings(server, []).length, 0);
    const [first] = server;
    assert.deepEqual(selectAcceptedFindings(server, [{ kind: first.kind, start: first.start, end: first.end }]), [first]);
  });

  it('returns the sanitized text alongside a passport so the UI can ground quotes', async () => {
    const spy = spyPipeline();
    const out = await handleCarePassportRequest({ text: STORY_WITH_PII, aiConsent: true }, spy);
    assert.equal(typeof out.data.sanitizedText, 'string');
    assert.ok(!out.data.sanitizedText.includes('0812'));
  });
});

describe('Care Passport route handler: limits and validation', () => {
  it('rejects text over the limit with 413', async () => {
    const spy = spyPipeline();
    const out = await handleCarePassportRequest({ text: 'a'.repeat(CARE_PASSPORT_MAX_TEXT + 1), aiConsent: true }, spy);
    assert.equal(out.ok, false);
    assert.equal(out.status, 413);
    assert.equal(spy.calls.length, 0);
  });

  it('accepts text exactly at the limit', async () => {
    const spy = spyPipeline();
    const out = await handleCarePassportRequest({ text: 'a'.repeat(CARE_PASSPORT_MAX_TEXT), aiConsent: true }, spy);
    assert.equal(out.ok, true);
  });

  it('rejects empty, missing and non-string text with 400', async () => {
    for (const body of [{ text: '   ' }, {}, { text: 42 }, null, 'str']) {
      const out = await handleCarePassportRequest(body, spyPipeline());
      assert.equal(out.ok, false);
      assert.equal(out.status, 400);
    }
  });

  it('rejects malformed redactions and unknown modes', async () => {
    const bad = [
      { text: STORY, redactions: 'nope' },
      { text: STORY, redactions: [{ kind: 'ssn', start: 0, end: 1 }] },
      { text: STORY, redactions: [{ kind: 'phone', start: 'a', end: 1 }] },
      { text: STORY, redactions: Array.from({ length: CARE_PASSPORT_MAX_REDACTIONS + 1 }, () => ({ kind: 'phone', start: 0, end: 1 })) },
      { text: STORY, mode: 'debug' },
      { text: STORY, aiConsent: 'yes' },
    ];
    for (const body of bad) {
      const v = validateCarePassportBody(body);
      assert.equal(v.ok, false, JSON.stringify(body).slice(0, 60));
      assert.equal(v.status, 400);
    }
  });

  it('normalises CRLF and NFKC before detection so offsets match what the UI shows', () => {
    const v = validateCarePassportBody({ text: 'baris satu\r\nbaris dua' });
    assert.equal(v.ok, true);
    assert.equal(v.text, 'baris satu\nbaris dua');
  });
});

describe('Care Passport route handler: telemetry and passthrough', () => {
  it('reports metadata only: no text, no findings content, only bare warning codes', async () => {
    const seen = [];
    await handleCarePassportRequest(
      { text: STORY_WITH_PII, aiConsent: true },
      { runPipeline: spyPipeline().runPipeline, onTelemetry: (meta) => seen.push(meta) }
    );
    assert.equal(seen.length, 1);
    const meta = seen[0];
    const serialized = JSON.stringify(meta);
    assert.ok(!serialized.includes('kewalahan'));
    assert.ok(!serialized.includes('0812'));
    assert.ok(!serialized.includes('HTTP 200'));
    assert.deepEqual(meta.warningCodes, ['dropped_claim']);
    assert.equal(meta.state, 'READY_FOR_USER_REVIEW');
    assert.equal(meta.providerId, 'amd:test');
    assert.equal(meta.findings, 3);
  });

  it('passes the pipeline result through unchanged', async () => {
    const out = await handleCarePassportRequest({ text: STORY, aiConsent: true }, spyPipeline());
    assert.deepEqual(out.data.result, READY);
  });
});

describe('Care Passport local export', () => {
  const approved = { ...READY.passport, reviewStatus: 'user_approved', duration: { value: 'sekitar dua bulan', source: 'user_confirmed', needsReview: false } };
  const when = new Date('2026-10-14T03:00:00Z');

  it('refuses to build anything before the user approves', () => {
    assert.equal(buildCarePassportExport(READY.passport, { format: 'md', generatedAt: when }), null);
  });

  it('includes approved values, questions, unknowns and the disclaimer, but never source quotes', () => {
    const md = buildCarePassportExport(approved, { format: 'md', generatedAt: when, provenanceLabel: 'Draf awal dibantu AI di AMD.' });
    assert.ok(md.startsWith('# Catatan Persiapan Konsultasi'));
    assert.ok(md.includes('- Kewalahan dengan tugas kuliah'));
    assert.ok(md.includes('- sekitar dua bulan'));
    assert.ok(md.includes('1. Bagaimana cara mengatur tugas saat deadline menumpuk?'));
    assert.ok(md.includes('- Sejak kapan hal ini dirasakan'));
    assert.ok(md.includes('> Bukan diagnosis.'));
    assert.ok(md.includes('Draf awal dibantu AI di AMD.'));
    assert.ok(!md.includes('kewalahan dengan tugas kuliah'), 'lower-case source quote must not leak');
    assert.ok(!md.includes('amd:test'));
    assert.ok(!md.includes('user_input'));
  });

  it('renders plain text without markdown markers', () => {
    const txt = buildCarePassportExport(approved, { format: 'txt', generatedAt: when });
    assert.ok(!txt.includes('# '));
    assert.ok(!txt.includes('> '));
    assert.ok(txt.includes('CATATAN PERSIAPAN KONSULTASI'));
    assert.ok(txt.includes('Bukan diagnosis.'));
  });

  it('skips null values and names the file by date', () => {
    const md = buildCarePassportExport({ ...approved, duration: { value: null, source: 'unknown', needsReview: false } }, { format: 'md', generatedAt: when });
    assert.ok(md.includes('## Sejak kapan dirasakan\nBelum diisi.'));
    assert.equal(carePassportExportFileName('txt', when), 'catatan-konsultasi-2026-10-14.txt');
  });
});
