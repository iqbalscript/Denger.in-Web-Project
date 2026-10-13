import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleCarePassportRequest,
  validateCarePassportBody,
  selectSegmentFindings,
  scrubWarning,
  piiFindingId,
  CARE_PASSPORT_MAX_SEGMENTS,
  CARE_PASSPORT_MAX_TOTAL_TEXT,
  CARE_PASSPORT_MAX_TEXT,
} from '../../apps/web/src/lib/api/carePassportHandler.ts';
import { runCarePassportPipeline } from '../../services/orchestrator/src/carePassportPipeline.ts';
import { detectPii } from '../../services/validator/src/piiRedactor.ts';
import { CARE_PASSPORT_SEGMENT_SEPARATOR } from '../../services/validator/src/carePassport.ts';

/**
 * F-A "Bukti Bertanggal" handler tests (research doc §4.5, tests 4-11 and
 * shape checks). Synthetic inputs only; no real person, number or address.
 */

const STORY = 'Aku kewalahan dengan tugas kuliah. Kalau deadline berdekatan, aku sulit fokus.';
const JOURNAL = 'Udah hampir tiga minggu aku susah fokus dan sulit tidur.';
const CRISIS = 'Aku capek, rasanya pengen mati aja.';
const WITH_PHONE = 'Namaku Rina Pratiwi. Dosen sering menghubungi di 0812-3456-7890 soal tugas.';

const seg = (id, kind, text, date) => ({ id, kind, text, ...(date ? { date } : {}) });
const intake = (text = STORY) => seg('intake', 'intake', text);
const journal = (text = JOURNAL, date = '2026-09-24') => seg(`journal:${date}`, 'journal', text, date);

const field = (value, sourceQuote) => ({ value, source: 'user_input', sourceQuote });
const BASE_DRAFT = {
  concerns: [field('Kewalahan dengan tugas kuliah', 'kewalahan dengan tugas kuliah')],
  dailyImpact: [field('Sulit fokus saat deadline berdekatan', 'Kalau deadline berdekatan, aku sulit fokus')],
  duration: { value: null, source: 'unknown' },
};

function spyProvider(generate = async () => ({ rawText: JSON.stringify(BASE_DRAFT) })) {
  const provider = { id: 'amd:test', isAmd: true, calls: [], isConfigured: () => true };
  provider.generate = async (request) => {
    provider.calls.push(request);
    return generate(request);
  };
  return provider;
}

const withProvider = (provider, onTelemetry) => ({
  runPipeline: (input) => runCarePassportPipeline(input, { providers: [provider] }),
  ...(onTelemetry ? { onTelemetry } : {}),
});

describe('F-A handler: safety precedence across segments', () => {
  it('4. a crisis phrase only in a journal entry -> IMMEDIATE_HELP_SCREEN, no provider call, no segments in the body', async () => {
    const provider = spyProvider();
    const out = await handleCarePassportRequest(
      { segments: [intake(), journal(CRISIS)], aiConsent: true },
      withProvider(provider)
    );
    assert.equal(out.ok, true);
    assert.equal(out.data.kind, 'result');
    assert.equal(out.data.result.state, 'IMMEDIATE_HELP_SCREEN');
    assert.ok(out.data.result.emergencyContacts.length > 0);
    assert.equal(provider.calls.length, 0);
    assert.equal(out.data.sanitizedSegments, undefined);
    assert.equal(out.data.sanitizedText, undefined);
    assert.equal(out.data.result.passport, undefined);
  });

  it('runs the crisis gate on joined segments in preview mode too', async () => {
    const provider = spyProvider();
    const out = await handleCarePassportRequest({ mode: 'preview', segments: [intake(), journal(CRISIS)] }, withProvider(provider));
    assert.equal(out.data.kind, 'result');
    assert.equal(out.data.result.state, 'IMMEDIATE_HELP_SCREEN');
    assert.equal(provider.calls.length, 0);
  });
});

describe('F-A handler: server-side redaction per segment', () => {
  it('preview lists findings per segment with stable ids and a canKeep flag; hard kinds are locked', async () => {
    const out = await handleCarePassportRequest({ mode: 'preview', segments: [intake(), journal(WITH_PHONE)] });
    assert.equal(out.ok, true);
    assert.equal(out.data.kind, 'preview');
    assert.equal(out.data.segments.length, 2);
    const [story, entry] = out.data.segments;
    assert.equal(story.findings.length, 0);
    assert.equal(entry.id, 'journal:2026-09-24');
    assert.equal(entry.date, '2026-09-24');
    const kinds = entry.findings.map((f) => f.kind).sort();
    assert.deepEqual(kinds, ['person_name_hint', 'phone']);
    const phone = entry.findings.find((f) => f.kind === 'phone');
    const name = entry.findings.find((f) => f.kind === 'person_name_hint');
    assert.equal(phone.canKeep, false);
    assert.equal(name.canKeep, true);
    assert.equal(phone.id, `journal:2026-09-24:${phone.start}-${phone.end}`);
    assert.equal(phone.segmentId, 'journal:2026-09-24');
    assert.ok(entry.redactedText.includes('[NOMOR_TELEPON]') && entry.redactedText.includes('[NAMA]'));
    assert.ok(!entry.redactedText.includes('0812'));
    assert.ok(out.data.redactedText.includes(CARE_PASSPORT_SEGMENT_SEPARATOR));
    assert.equal(out.data.findings.length, 2, 'flattened findings mirror the per-segment lists');
  });

  it('5. keepSoftPii naming a phone finding changes nothing: digits never reach the provider', async () => {
    const findings = detectPii(WITH_PHONE);
    const phone = findings.find((f) => f.kind === 'phone');
    const provider = spyProvider();
    const out = await handleCarePassportRequest(
      {
        segments: [intake(), journal(WITH_PHONE)],
        keepSoftPii: [piiFindingId('journal:2026-09-24', phone), 'journal:2026-09-24:0-6', 'intake:0-3'],
        aiConsent: true,
      },
      withProvider(provider)
    );
    assert.equal(out.ok, true);
    assert.equal(provider.calls.length, 1);
    const sent = provider.calls[0].userPrompt;
    assert.ok(!sent.includes('0812'), 'no digits of the number');
    assert.ok(!/\d{4}-\d{4}/.test(sent));
    assert.ok(sent.includes('[NOMOR_TELEPON]'));
    assert.ok(sent.includes('[NAMA]'), 'name hint stays redacted unless its own id is kept');
    const journalSent = out.data.sanitizedSegments.find((s) => s.id === 'journal:2026-09-24');
    assert.ok(!journalSent.text.includes('0812'));
  });

  it('a kept SOFT finding stays visible, only that one', async () => {
    const findings = detectPii(WITH_PHONE);
    const name = findings.find((f) => f.kind === 'person_name_hint');
    const provider = spyProvider();
    const out = await handleCarePassportRequest(
      { segments: [intake(), journal(WITH_PHONE)], keepSoftPii: [piiFindingId('journal:2026-09-24', name)], aiConsent: true },
      withProvider(provider)
    );
    const sent = provider.calls[0].userPrompt;
    assert.ok(sent.includes('Rina Pratiwi'), 'user chose to keep the name');
    assert.ok(!sent.includes('0812'));
    assert.ok(sent.includes('[NOMOR_TELEPON]'));
    const entry = out.data.sanitizedSegments.find((s) => s.id === 'journal:2026-09-24');
    assert.ok(entry.text.includes('Rina Pratiwi'));
    assert.equal(out.data.sanitizedSegments.length, 2);
    assert.equal(out.data.sanitizedSegments[0].id, 'intake');
    assert.deepEqual(out.data.sanitizedSegments.map((s) => s.text).join(CARE_PASSPORT_SEGMENT_SEPARATOR), out.data.sanitizedText);
  });

  it('selectSegmentFindings only ever releases soft kinds', () => {
    const findings = detectPii(WITH_PHONE);
    const all = new Set(findings.map((f) => piiFindingId('s', f)));
    const kept = selectSegmentFindings('s', findings, all);
    assert.deepEqual(kept.map((f) => f.kind), ['phone']);
    assert.equal(selectSegmentFindings('s', findings, new Set()).length, findings.length);
    assert.equal(selectSegmentFindings('other', findings, all).length, findings.length, 'ids are segment-scoped');
  });

  it('never trusts client-provided sanitized text or redacted segments', async () => {
    const provider = spyProvider();
    await handleCarePassportRequest(
      {
        segments: [intake(WITH_PHONE)],
        sanitizedSegments: [{ id: 'intake', kind: 'intake', text: 'teks palsu' }],
        sanitizedText: 'teks palsu',
        aiConsent: true,
      },
      withProvider(provider)
    );
    const sent = provider.calls[0].userPrompt;
    assert.ok(!sent.includes('teks palsu'));
    assert.ok(sent.includes('[NOMOR_TELEPON]'));
  });
});

describe('F-A handler: consent, age and limits', () => {
  it('6. aiConsent false -> PROVIDER_UNAVAILABLE, no provider call, ai_consent_declined', async () => {
    const provider = spyProvider();
    const out = await handleCarePassportRequest({ segments: [intake(), journal()], aiConsent: false }, withProvider(provider));
    assert.equal(out.ok, true);
    assert.equal(out.data.result.state, 'PROVIDER_UNAVAILABLE');
    assert.ok(out.data.result.warnings.includes('ai_consent_declined'));
    assert.equal(provider.calls.length, 0);
    assert.equal(out.data.sanitizedSegments, undefined);
  });

  it('7. ageBracket 15-17 -> 403 in both modes, before any processing', async () => {
    const provider = spyProvider();
    for (const mode of ['generate', 'preview']) {
      const out = await handleCarePassportRequest({ mode, segments: [intake(CRISIS)], aiConsent: true, ageBracket: '15-17' }, withProvider(provider));
      assert.equal(out.ok, false);
      assert.equal(out.status, 403);
      assert.ok(!out.error.toLowerCase().includes('krisis'), 'neutral message');
    }
    assert.equal(provider.calls.length, 0);
    const adult = await handleCarePassportRequest({ segments: [intake()], aiConsent: true, ageBracket: '30-49' }, withProvider(provider));
    assert.equal(adult.ok, true);
    const bad = validateCarePassportBody({ segments: [intake()], ageBracket: 'dewasa' });
    assert.equal(bad.ok, false);
    assert.equal(bad.status, 400);
  });

  it('8. too many segments or too much text -> 413; selected entries count toward the limit', async () => {
    const tooMany = Array.from({ length: CARE_PASSPORT_MAX_SEGMENTS + 1 }, (_, i) => seg(`journal:${i}`, 'journal', 'teks', '2026-10-01'));
    let out = await handleCarePassportRequest({ segments: tooMany, aiConsent: true });
    assert.equal(out.ok, false);
    assert.equal(out.status, 413);

    const half = 'a'.repeat(Math.ceil(CARE_PASSPORT_MAX_TOTAL_TEXT / 2) + 1);
    out = await handleCarePassportRequest({ segments: [intake(half), journal(half)], aiConsent: true });
    assert.equal(out.ok, false);
    assert.equal(out.status, 413);

    out = await handleCarePassportRequest({ segments: [intake('a'.repeat(CARE_PASSPORT_MAX_TEXT + 1))], aiConsent: true });
    assert.equal(out.ok, false);
    assert.equal(out.status, 413);

    const exact = [intake('a'.repeat(CARE_PASSPORT_MAX_TEXT)), journal('b'.repeat(CARE_PASSPORT_MAX_TOTAL_TEXT - CARE_PASSPORT_MAX_TEXT))];
    out = await handleCarePassportRequest({ mode: 'preview', segments: exact });
    assert.equal(out.ok, true);
  });

  it('rejects malformed segments with 400 and drops empty ones silently', async () => {
    const bad = [
      { segments: [] },
      { segments: 'nope' },
      { segments: [seg('intake', 'story', 'x')] },
      { segments: [seg('bad id!', 'intake', 'x')] },
      { segments: [seg('a', 'intake', 'x'), seg('a', 'journal', 'y', '2026-10-01')] },
      { segments: [seg('j', 'journal', 'x', '1 Okt 2026')] },
      { segments: [seg('j', 'journal', 42)] },
      { segments: [intake()], keepSoftPii: 'x' },
      { segments: [intake()], keepSoftPii: [1] },
      { segments: [seg('intake', 'intake', '   ')] },
    ];
    for (const body of bad) {
      const v = validateCarePassportBody(body);
      assert.equal(v.ok, false, JSON.stringify(body).slice(0, 80));
      assert.equal(v.status, 400);
    }
    const v = validateCarePassportBody({ segments: [seg('intake', 'intake', '  '), journal()] });
    assert.equal(v.ok, true);
    assert.equal(v.segments.length, 1);
    assert.equal(v.segments[0].kind, 'journal');
    assert.equal(v.legacy, false);
  });

  it('normalises CRLF and NFKC in every segment', () => {
    const v = validateCarePassportBody({ segments: [intake('baris satu\r\nbaris dua'), journal('ｃａｔａｔａｎ')] });
    assert.equal(v.ok, true);
    assert.equal(v.segments[0].text, 'baris satu\nbaris dua');
    assert.equal(v.segments[1].text, 'catatan');
  });
});

describe('F-A handler: clarification rounds and attribution end to end', () => {
  it('9. a clarification segment fills the duration and raises completeness from 2 to 3', async () => {
    const provider = spyProvider(async (request) =>
      request.userPrompt.includes('sejak tiga minggu lalu')
        ? { rawText: JSON.stringify({ ...BASE_DRAFT, duration: field('Sejak tiga minggu lalu', 'sejak tiga minggu lalu') }) }
        : { rawText: JSON.stringify(BASE_DRAFT) }
    );
    const first = await handleCarePassportRequest({ segments: [intake()], aiConsent: true }, withProvider(provider));
    assert.equal(first.data.result.state, 'READY_FOR_USER_REVIEW');
    assert.equal(first.data.result.passport.duration.source, 'unknown');
    assert.deepEqual(first.data.result.completeness, { known: 2, total: 3, unknownLabels: ['Sejak kapan hal ini dirasakan'] });

    const second = await handleCarePassportRequest(
      { segments: [intake(), seg('clarification:1', 'clarification', 'Kira-kira sejak tiga minggu lalu.')], aiConsent: true },
      withProvider(provider)
    );
    assert.equal(provider.calls.length, 2);
    const { passport, completeness } = second.data.result;
    assert.equal(passport.duration.source, 'user_input');
    assert.deepEqual(passport.duration.sourceRef, { segmentId: 'clarification:1', kind: 'clarification' });
    assert.equal(completeness.known, 3);
    assert.equal(completeness.total, 3);
    assert.deepEqual(passport.concerns[0].sourceRef, { segmentId: 'intake', kind: 'intake' });
  });

  it('links a fact to the dated journal entry it was quoted from', async () => {
    const provider = spyProvider(async () => ({
      rawText: JSON.stringify({ ...BASE_DRAFT, duration: field('Hampir tiga minggu', 'Udah hampir tiga minggu') }),
    }));
    const out = await handleCarePassportRequest({ segments: [intake(), journal()], aiConsent: true }, withProvider(provider));
    assert.deepEqual(out.data.result.passport.duration.sourceRef, { segmentId: 'journal:2026-09-24', kind: 'journal', date: '2026-09-24' });
    assert.equal(out.data.result.completeness.known, 3);
  });
});

describe('F-A handler: warnings, failures and telemetry', () => {
  it('10. provider error messages that echo user text are scrubbed before leaving the server', async () => {
    const provider = spyProvider(async (request) => {
      throw new Error(`HTTP 400: body rejected: ${request.userPrompt}`);
    });
    const out = await handleCarePassportRequest({ segments: [intake(), journal()], aiConsent: true }, withProvider(provider));
    assert.equal(out.data.result.state, 'PROVIDER_UNAVAILABLE');
    const serialized = JSON.stringify(out.data.result.warnings);
    assert.ok(!serialized.includes('kewalahan'));
    assert.ok(!serialized.includes('tiga minggu'));
    assert.ok(out.data.result.warnings.some((w) => w.startsWith('amd:test')));
    for (const w of out.data.result.warnings) assert.ok(w.length <= 120);
  });

  it('scrubWarning keeps bare codes, truncates, and drops everything after the second colon', () => {
    assert.equal(scrubWarning('ai_consent_declined'), 'ai_consent_declined');
    assert.equal(scrubWarning('amd:test: HTTP 400: body: rahasia'), 'amd:test:');
    assert.equal(scrubWarning('concerns[0]: kutipan sumber tidak ditemukan pada input'), 'concerns[0]: kutipan sumber tidak ditemukan pada input');
    assert.equal(scrubWarning(`x: ${'y'.repeat(300)}`).length, 120);
  });

  it('11. every provider failing -> PROVIDER_UNAVAILABLE, isAmd false, no passport, no segments echoed', async () => {
    const provider = spyProvider(async () => {
      throw new Error('timeout');
    });
    const out = await handleCarePassportRequest({ segments: [intake(), journal()], aiConsent: true }, withProvider(provider));
    assert.equal(out.ok, true);
    assert.equal(out.data.result.state, 'PROVIDER_UNAVAILABLE');
    assert.equal(out.data.result.provenance.isAmd, false);
    assert.equal(out.data.result.provenance.isFallback, true);
    assert.equal(out.data.result.passport, undefined);
    assert.equal(out.data.sanitizedSegments, undefined);
    assert.equal(out.data.sanitizedText, undefined);
  });

  it('telemetry is metadata only and counts segments', async () => {
    const seen = [];
    await handleCarePassportRequest(
      { segments: [intake(), journal(WITH_PHONE)], aiConsent: true },
      withProvider(spyProvider(), (meta) => seen.push(meta))
    );
    assert.equal(seen.length, 1);
    const serialized = JSON.stringify(seen[0]);
    assert.ok(!serialized.includes('kewalahan') && !serialized.includes('0812') && !serialized.includes('Rina'));
    assert.equal(seen[0].segmentsCount, 2);
    assert.equal(seen[0].findings, 2);
    assert.equal(seen[0].isAmd, true);
    assert.equal(seen[0].state, 'READY_FOR_USER_REVIEW');
  });
});
