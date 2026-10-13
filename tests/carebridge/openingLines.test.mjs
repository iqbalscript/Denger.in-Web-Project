import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  approvedFacts,
  buildOpeningLinesTemplate,
  checkOpeningLine,
  validateOpeningLines,
  DESTINATION_BASIS,
  OPENING_LINES_MAX_TOTAL_WORDS,
} from '../../services/validator/src/openingLines.ts';
import { runOpeningLinesPipeline } from '../../services/orchestrator/src/openingLinesPipeline.ts';
import { HELP_DESTINATIONS, getHelpDestination, isHelpDestinationId } from '../../packages/config/src/helpDestinations.ts';
import { OPENING_LINES_FACTS_OPEN } from '../../packages/prompts/src/openingLines.ts';
import {
  handleOpeningLinesRequest,
  sanitizeCarePassportInput,
  validateOpeningLinesBody,
} from '../../apps/web/src/lib/api/openingLinesHandler.ts';

// Synthetic data only. No real person, number or address.

const field = (value, source = 'user_input', extra = {}) => ({ value, source, needsReview: false, ...extra });

function approvedPassport(overrides = {}) {
  return {
    version: 1,
    subject: 'anonymous_adult',
    concerns: [field('Kewalahan dengan tugas kuliah', 'user_input', { sourceQuote: 'kewalahan dengan tugas kuliah' })],
    dailyImpact: [field('Sulit fokus saat deadline berdekatan', 'user_input', { sourceQuote: 'Kalau deadline berdekatan, aku sulit fokus' })],
    duration: { value: null, source: 'unknown', needsReview: false },
    relevantContext: [],
    questionsForProfessional: ['Bagaimana cara mengatur tugas saat deadline menumpuk?'],
    unknowns: ['Sejak kapan hal ini dirasakan'],
    disclaimer: 'Bukan diagnosis.',
    reviewStatus: 'user_approved',
    ...overrides,
  };
}

const FKTP = getHelpDestination('fktp');

const GROUNDED_LINES = [
  'Dok, saya kewalahan dengan tugas kuliah.',
  'Kalau deadline berdekatan, saya sulit fokus.',
  'Saya ingin tahu apakah bisa dirujuk ke psikolog atau poli jiwa.',
];

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

const returns = (payload) => async () => ({ rawText: typeof payload === 'string' ? payload : JSON.stringify(payload) });

describe('Help destinations data (static, source-cited)', () => {
  it('has four destinations, each with a verifiedOn date and at least one https source', () => {
    assert.deepEqual(HELP_DESTINATIONS.map((d) => d.id), ['fktp', 'psikolog', 'healing119', 'kampus']);
    for (const d of HELP_DESTINATIONS) {
      assert.match(d.verifiedOn, /^\d{4}-\d{2}-\d{2}$/, `${d.id} verifiedOn`);
      assert.ok(d.sources.length >= 1, `${d.id} sources`);
      for (const s of d.sources) {
        assert.match(s.url, /^https:\/\//, `${d.id} source url`);
        assert.match(s.accessedOn, /^\d{4}-\d{2}-\d{2}$/, `${d.id} source accessedOn`);
        assert.ok(['official', 'media', 'guide'].includes(s.kind));
      }
      assert.ok(d.checklist.length >= 3, `${d.id} checklist`);
      assert.ok(d.caveat.length > 0);
    }
  });

  it('every checklist item either cites a known source or is explicitly marked unverified', () => {
    for (const d of HELP_DESTINATIONS) {
      const ids = new Set(d.sources.map((s) => s.id));
      for (const item of d.checklist) {
        if (item.unverified) {
          assert.equal(item.sourceIds.length, 0, `${d.id}: unverified item must not cite sources`);
        } else {
          assert.ok(item.sourceIds.length > 0, `${d.id}: "${item.text}" has no source`);
          for (const id of item.sourceIds) assert.ok(ids.has(id), `${d.id}: unknown source ${id}`);
        }
      }
    }
  });

  it('omits unverified facts: no 24-jam claim, no WhatsApp digits, no prices, no referral validity period', () => {
    const text = JSON.stringify(HELP_DESTINATIONS).toLowerCase();
    // "bukan 24 jam" is the honest statement; any other 24-jam claim is forbidden.
    assert.doesNotMatch(text, /(?<!bukan )24\s*jam/);
    assert.doesNotMatch(text, /siaga/);
    assert.doesNotMatch(text, /08\d{8,}/);
    assert.doesNotMatch(text, /rp\s?\d/);
    assert.doesNotMatch(text, /3 bulan|tiga bulan/);
    assert.doesNotMatch(text, /sejiwa/);
  });

  it('Healing119 checklist states the official access path and hours honestly', () => {
    const h = getHelpDestination('healing119');
    const text = h.checklist.map((i) => i.text).join(' ');
    assert.match(text, /119/);
    assert.match(text, /ekstensi 8/);
    assert.match(text, /pagi sampai malam/);
    assert.match(text, /bukan 24 jam/);
    assert.ok(h.sources.some((s) => s.kind === 'official'));
  });

  it('isHelpDestinationId only accepts the four ids', () => {
    assert.equal(isHelpDestinationId('fktp'), true);
    assert.equal(isHelpDestinationId('rs-jiwa'), false);
    assert.equal(isHelpDestinationId(undefined), false);
  });
});

describe('approvedFacts', () => {
  it('returns nothing for a passport that is not user_approved', () => {
    assert.deepEqual(approvedFacts(approvedPassport({ reviewStatus: 'user_pending' })), []);
  });

  it('skips unknown, empty and needsReview fields, keeps questions', () => {
    const facts = approvedFacts(
      approvedPassport({
        concerns: [field('Kewalahan dengan tugas kuliah'), field('Takut gagal', 'user_input', { needsReview: true }), field('', 'user_confirmed')],
        duration: field('sejak tiga minggu lalu', 'user_confirmed'),
      })
    );
    assert.deepEqual(
      facts.map((f) => f.id),
      ['concerns:0', 'dailyImpact:0', 'duration', 'question:0']
    );
  });
});

describe('checkOpeningLine: grounding and safety', () => {
  const facts = approvedFacts(approvedPassport());

  it('accepts a sentence made of the user\'s own words and reports which fields it is based on', () => {
    const check = checkOpeningLine('Dok, saya kewalahan dengan tugas kuliah.', facts, FKTP);
    assert.equal(check.ok, true, check.reason);
    assert.deepEqual(check.basedOn, ['concerns:0']);
  });

  it('accepts the destination intent sentence when it reuses a question the user approved', () => {
    const check = checkOpeningLine('Saya ingin tahu cara mengatur tugas saat deadline menumpuk.', facts, FKTP);
    assert.equal(check.ok, true, check.reason);
    assert.ok(check.basedOn.includes('question:0'));
  });

  it('rejects a sentence with no phrase from the approved passport', () => {
    const check = checkOpeningLine('Dok, saya mimpi buruk dan jantung berdebar.', facts, FKTP);
    assert.equal(check.ok, false);
  });

  it('accepts a closing sentence made only of the destination\'s configured intent, attributed to the destination', () => {
    const check = checkOpeningLine(GROUNDED_LINES[2], facts, FKTP);
    assert.equal(check.ok, true, check.reason);
    assert.deepEqual(check.basedOn, [DESTINATION_BASIS]);
    // The same words toward a different destination are not configured intent there.
    assert.equal(checkOpeningLine(GROUNDED_LINES[2], facts, getHelpDestination('healing119')).ok, false);
    // An intent-only sentence with extra vocabulary is still rejected.
    assert.equal(checkOpeningLine('Saya ingin minta rujukan ke psikiater sekarang juga.', facts, FKTP).ok, false);
  });

  it('rejects a new symptom slipped next to a grounded phrase', () => {
    const check = checkOpeningLine('Saya kewalahan dengan tugas kuliah dan sulit tidur.', facts, FKTP);
    assert.equal(check.ok, false);
    assert.match(check.reason, /tidur/);
  });

  it('rejects a fabricated number or duration', () => {
    assert.equal(checkOpeningLine('Sudah 3 minggu saya kewalahan dengan tugas kuliah.', facts, FKTP).ok, false);
    assert.equal(checkOpeningLine('Sudah tiga minggu saya kewalahan dengan tugas kuliah.', facts, FKTP).ok, false);
    assert.equal(checkOpeningLine('Belakangan ini saya kewalahan dengan tugas kuliah.', facts, FKTP).ok, false);
    assert.equal(checkOpeningLine('Saya sering kewalahan dengan tugas kuliah.', facts, FKTP).ok, false);
  });

  it('allows a duration only when the user wrote it', () => {
    const withDuration = approvedFacts(approvedPassport({ duration: field('sejak tiga minggu lalu', 'user_confirmed') }));
    const check = checkOpeningLine('Sejak tiga minggu lalu saya kewalahan dengan tugas kuliah.', withDuration, FKTP);
    assert.equal(check.ok, true, check.reason);
    assert.deepEqual(check.basedOn.sort(), ['concerns:0', 'duration']);
  });

  it('rejects a severity claim the user did not make', () => {
    assert.equal(checkOpeningLine('Saya sangat kewalahan dengan tugas kuliah.', facts, FKTP).ok, false);
  });

  it('rejects a diagnostic label even when the rest is grounded', () => {
    const check = checkOpeningLine('Saya rasa saya depresi karena kewalahan dengan tugas kuliah.', facts, FKTP);
    assert.equal(check.ok, false);
    assert.match(check.reason, /diagnosis/);
  });

  it('rejects a medical instruction and a percentage', () => {
    assert.equal(checkOpeningLine('Saya kewalahan dengan tugas kuliah, jadi mulai minum obat tidur.', facts, FKTP).ok, false);
    assert.equal(checkOpeningLine('Saya 80% kewalahan dengan tugas kuliah.', facts, FKTP).ok, false);
  });

  it('rejects identifiers and redaction placeholders', () => {
    assert.equal(checkOpeningLine('Saya [NAMA], kewalahan dengan tugas kuliah.', facts, FKTP).ok, false);
    assert.equal(checkOpeningLine('Hubungi saya di a@b.id, saya kewalahan dengan tugas kuliah.', facts, FKTP).ok, false);
  });

  it('rejects sentences over 200 characters', () => {
    const long = `Saya kewalahan dengan tugas kuliah ${'dan tugas kuliah '.repeat(15)}.`;
    assert.equal(checkOpeningLine(long, facts, FKTP).ok, false);
  });
});

describe('validateOpeningLines', () => {
  const passport = approvedPassport();

  it('keeps grounded sentences, drops the rest and counts them', () => {
    const out = validateOpeningLines(
      { lines: [GROUNDED_LINES[0], 'Saya juga sering mimpi buruk.', GROUNDED_LINES[1], 'Saya depresi.', GROUNDED_LINES[2]] },
      passport,
      FKTP
    );
    assert.equal(out.ok, true, out.ok ? '' : out.errors.join('; '));
    assert.deepEqual(out.lines.map((l) => l.text), GROUNDED_LINES);
    assert.equal(out.droppedLines, 2);
    assert.ok(out.lines[0].basedOn.includes('concerns:0'));
    assert.ok(out.lines[1].basedOn.includes('dailyImpact:0'));
  });

  it('accepts fenced JSON and dedupes repeated sentences', () => {
    const raw = '```json\n' + JSON.stringify({ lines: [GROUNDED_LINES[0], GROUNDED_LINES[0], GROUNDED_LINES[1]] }) + '\n```';
    const out = validateOpeningLines(raw, passport, FKTP);
    assert.equal(out.ok, true);
    assert.equal(out.lines.length, 2);
    assert.equal(out.droppedLines, 1);
  });

  it('rejects when fewer than two sentences survive', () => {
    const out = validateOpeningLines({ lines: [GROUNDED_LINES[0], 'Saya mimpi buruk tiap malam.'] }, passport, FKTP);
    assert.equal(out.ok, false);
    assert.equal(out.droppedLines, 1);
  });

  it('rejects output where no sentence uses the user\'s own notes', () => {
    const out = validateOpeningLines({ lines: [GROUNDED_LINES[2], GROUNDED_LINES[2] + ' Terima kasih.'] }, passport, FKTP);
    assert.equal(out.ok, false);
  });

  it('rejects malformed output and a passport without approved facts', () => {
    assert.equal(validateOpeningLines('bukan json', passport, FKTP).ok, false);
    assert.equal(validateOpeningLines({ kalimat: [] }, passport, FKTP).ok, false);
    assert.equal(validateOpeningLines({ lines: GROUNDED_LINES }, approvedPassport({ reviewStatus: 'user_pending' }), FKTP).ok, false);
  });

  it('caps at three sentences and the total word budget', () => {
    const out = validateOpeningLines({ lines: [...GROUNDED_LINES, GROUNDED_LINES[0] + ' Ya.'] }, passport, FKTP);
    assert.equal(out.ok, true);
    assert.equal(out.lines.length, 3);
    const words = out.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
    assert.ok(words <= OPENING_LINES_MAX_TOTAL_WORDS);
  });
});

describe('buildOpeningLinesTemplate (deterministic, tanpa AI)', () => {
  it('builds three lines from approved values with the destination ask', () => {
    const lines = buildOpeningLinesTemplate(approvedPassport({ duration: field('sejak tiga minggu lalu', 'user_confirmed') }), FKTP);
    assert.equal(lines.length, 3);
    assert.match(lines[0].text, /^Dok, Hal utama yang ingin saya bicarakan: kewalahan dengan tugas kuliah\.$/);
    assert.deepEqual(lines[0].basedOn, ['concerns:0']);
    assert.match(lines[1].text, /sulit fokus saat deadline berdekatan/);
    assert.match(lines[1].text, /sejak tiga minggu lalu/);
    assert.deepEqual(lines[1].basedOn, ['dailyImpact:0', 'duration']);
    assert.equal(lines[2].text, 'Saya ingin tahu apakah bisa dirujuk ke psikolog atau poli jiwa.');
    assert.deepEqual(lines[2].basedOn, [DESTINATION_BASIS]);
    // The template's own lines pass the same grounding check the model is held to.
    for (const line of lines) assert.equal(checkOpeningLine(line.text, approvedFacts(approvedPassport({ duration: field('sejak tiga minggu lalu', 'user_confirmed') })), FKTP).ok, true, line.text);
  });

  it('is identical across calls and still yields two or more lines on a thin passport', () => {
    const thin = approvedPassport({ concerns: [], dailyImpact: [], questionsForProfessional: [] });
    const a = buildOpeningLinesTemplate(thin, getHelpDestination('healing119'));
    const b = buildOpeningLinesTemplate(thin, getHelpDestination('healing119'));
    assert.deepEqual(a, b);
    assert.ok(a.length >= 2);
    assert.match(a[0].text, /^Halo, /);
  });

  it('never speaks a value carrying a diagnostic label or a placeholder', () => {
    const lines = buildOpeningLinesTemplate(
      approvedPassport({ concerns: [field('Didiagnosis depresi oleh psikiater', 'user_confirmed'), field('Kewalahan dengan tugas kuliah')] }),
      FKTP
    );
    assert.doesNotMatch(lines[0].text, /depresi/);
    assert.match(lines[0].text, /kewalahan dengan tugas kuliah/);
  });
});

describe('Opening lines pipeline: safety precedence and provenance', () => {
  it('re-runs the crisis gate on the approved text and never calls a provider on crisis', async () => {
    const provider = mockProvider('amd:test', returns({ lines: GROUNDED_LINES }), { isAmd: true });
    const passport = approvedPassport({ relevantContext: [field('rasanya pengen mati aja', 'user_confirmed')] });
    const result = await runOpeningLinesPipeline({ passport, destination: 'fktp', aiConsent: true }, { providers: [provider] });
    assert.equal(result.state, 'IMMEDIATE_HELP_SCREEN');
    assert.equal(provider.calls.length, 0);
    assert.deepEqual(result.lines, []);
    assert.ok(result.emergencyContacts.length > 0);
    assert.equal(result.provenance.isAmd, false);
    assert.equal(result.provenance.isFallback, true);
  });

  it('returns the template without any model call when AI consent is declined', async () => {
    const provider = mockProvider('amd:test', returns({ lines: GROUNDED_LINES }), { isAmd: true });
    const result = await runOpeningLinesPipeline({ passport: approvedPassport(), destination: 'fktp', aiConsent: false }, { providers: [provider] });
    assert.equal(result.state, 'FALLBACK_TEMPLATE');
    assert.equal(provider.calls.length, 0);
    assert.ok(result.warnings.includes('ai_consent_declined'));
    assert.equal(result.provenance.providerId, 'none');
    assert.equal(result.provenance.isAmd, false);
    assert.equal(result.lines.length, 3);
  });

  it('marks isAmd only when the accepted lines came from the AMD provider', async () => {
    const provider = mockProvider('amd:test', returns({ lines: GROUNDED_LINES }), { isAmd: true });
    let t = 1000;
    const result = await runOpeningLinesPipeline(
      { passport: approvedPassport(), destination: 'fktp', aiConsent: true },
      { providers: [provider], now: () => (t += 250) }
    );
    assert.equal(result.state, 'READY');
    assert.equal(result.provenance.isAmd, true);
    assert.equal(result.provenance.isFallback, false);
    assert.equal(result.provenance.providerId, 'amd:test');
    assert.equal(result.provenance.latencyMs, 250);
    assert.deepEqual(result.lines.map((l) => l.text), GROUNDED_LINES);
    assert.equal(provider.calls.length, 1);
    assert.ok(provider.calls[0].userPrompt.includes(OPENING_LINES_FACTS_OPEN));
    assert.ok(provider.calls[0].userPrompt.includes('Kewalahan dengan tugas kuliah'));
    assert.ok(!provider.calls[0].userPrompt.includes('Sejak kapan hal ini dirasakan'), 'unknowns are not sent as facts');
  });

  it('reports a non-AMD provider honestly', async () => {
    const provider = mockProvider('other:test', returns({ lines: GROUNDED_LINES }));
    const result = await runOpeningLinesPipeline({ passport: approvedPassport(), destination: 'psikolog', aiConsent: true }, { providers: [provider] });
    assert.equal(result.state, 'READY');
    assert.equal(result.provenance.isAmd, false);
    assert.equal(result.provenance.isFallback, false);
  });

  it('falls back to the template, labelled tanpa AI, when the model adds facts', async () => {
    const provider = mockProvider(
      'amd:test',
      returns({ lines: ['Sudah 3 minggu saya kewalahan dengan tugas kuliah.', 'Saya depresi berat.', 'Saya mimpi buruk.'] }),
      { isAmd: true }
    );
    const result = await runOpeningLinesPipeline({ passport: approvedPassport(), destination: 'fktp', aiConsent: true }, { providers: [provider] });
    assert.equal(result.state, 'FALLBACK_TEMPLATE');
    assert.equal(provider.calls.length, 1);
    assert.equal(result.provenance.isAmd, false);
    assert.equal(result.provenance.isFallback, true);
    assert.ok(result.warnings.includes('provider_rejected'));
    assert.ok(result.warnings.some((w) => w.startsWith('amd:test:')));
    const text = result.lines.map((l) => l.text).join(' ');
    assert.doesNotMatch(text, /depresi|mimpi|3 minggu/);
    assert.match(text, /kewalahan dengan tugas kuliah/);
  });

  it('falls back when the provider throws or none is configured', async () => {
    const failing = mockProvider('amd:test', async () => { throw new Error('timeout'); }, { isAmd: true });
    const a = await runOpeningLinesPipeline({ passport: approvedPassport(), destination: 'kampus', aiConsent: true }, { providers: [failing] });
    assert.equal(a.state, 'FALLBACK_TEMPLATE');
    assert.ok(a.warnings.some((w) => w.includes('timeout')));
    const b = await runOpeningLinesPipeline({ passport: approvedPassport(), destination: 'kampus', aiConsent: true }, { providers: [] });
    assert.equal(b.state, 'FALLBACK_TEMPLATE');
    assert.ok(b.warnings.includes('no_provider_configured'));
  });
});

describe('Opening lines API handler', () => {
  const spy = (result) => {
    const calls = [];
    return { calls, runPipeline: async (input) => { calls.push(input); return result; } };
  };
  const READY = {
    state: 'READY',
    destination: 'fktp',
    lines: GROUNDED_LINES.map((text) => ({ text, basedOn: ['concerns:0'] })),
    provenance: { providerId: 'amd:test', isAmd: true, isFallback: false, latencyMs: 12 },
    droppedLines: 1,
    warnings: ['dropped_line', 'amd:test: lines[1]: menambah kata: tidur: "Aku sulit tidur sejak ibu sakit"'],
  };

  it('rejects an unknown destination and a passport that is not user_approved with 400', async () => {
    const s = spy(READY);
    const a = await handleOpeningLinesRequest({ passport: approvedPassport(), destination: 'rs-jiwa', aiConsent: true }, s);
    assert.equal(a.ok, false);
    assert.equal(a.status, 400);
    const b = await handleOpeningLinesRequest({ passport: approvedPassport({ reviewStatus: 'user_pending' }), destination: 'fktp', aiConsent: true }, s);
    assert.equal(b.ok, false);
    assert.equal(b.status, 400);
    assert.equal(s.calls.length, 0);
  });

  it('rebuilds the passport, dropping unknown keys and refusing bad shapes', () => {
    const cleaned = sanitizeCarePassportInput({
      ...approvedPassport(),
      concerns: [{ ...field('Kewalahan dengan tugas kuliah'), sourceRef: { segmentId: 'journal:2026-09-24', kind: 'journal' }, extra: 1 }],
      evidenceRefs: ['x'],
    });
    assert.ok(cleaned);
    assert.equal('sourceRef' in cleaned.concerns[0], false);
    assert.equal('evidenceRefs' in cleaned, false);
    assert.equal(sanitizeCarePassportInput({ ...approvedPassport(), version: 2 }), null);
    assert.equal(sanitizeCarePassportInput({ ...approvedPassport(), concerns: [{ value: 1, source: 'user_input' }] }), null);
    assert.equal(sanitizeCarePassportInput({ ...approvedPassport(), concerns: Array(9).fill(field('a')) }), null);
    assert.equal(validateOpeningLinesBody({ passport: approvedPassport(), destination: 'fktp', aiConsent: 'yes' }).ok, false);
  });

  it('passes the cleaned passport to the pipeline and sanitizes provider warnings and telemetry', async () => {
    const s = spy(READY);
    const telemetry = [];
    const out = await handleOpeningLinesRequest(
      { passport: approvedPassport(), destination: 'fktp', aiConsent: true },
      { ...s, onTelemetry: (m) => telemetry.push(m) }
    );
    assert.equal(out.ok, true);
    assert.equal(out.status, 200);
    assert.equal(s.calls.length, 1);
    assert.equal(s.calls[0].destination, 'fktp');
    assert.equal(s.calls[0].aiConsent, true);
    assert.equal(s.calls[0].passport.reviewStatus, 'user_approved');
    assert.deepEqual(out.data.lines, READY.lines);
    assert.ok(!out.data.warnings.join(' ').includes('ibu sakit'), 'user text after the second colon is cut');
    assert.deepEqual(telemetry[0].warningCodes, ['dropped_line']);
    assert.equal(telemetry[0].lineCount, 3);
    assert.equal(JSON.stringify(telemetry[0]).includes('kuliah'), false);
  });
});
