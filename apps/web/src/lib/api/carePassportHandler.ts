import type { AgeBracket, CarePassportResult, CarePassportSegment, CarePassportSegmentKind } from '@dengarin/types';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { detectPii, joinSegments, redactPii, type PiiFinding, type PiiKind } from '@dengarin/validator';
import {
  CARE_PASSPORT_MAX_SEGMENTS,
  CARE_PASSPORT_MAX_SEGMENT_TEXT,
  CARE_PASSPORT_MAX_TEXT,
  CARE_PASSPORT_MAX_TOTAL_TEXT,
} from '../carePassportLimits.ts';
import {
  isUrgentHelpRequest,
  runCarePassportPipeline,
  type CarePassportPipelineInput,
} from '@dengarin/orchestrator';

/**
 * CARE PASSPORT API HANDLER (AMD-09 + F-A "Bukti Bertanggal")
 *
 * Framework-free so it can be unit-tested with node:test. The Next.js routes in
 * app/api/care-passport/* only read the body, apply quotas and map the result
 * to an HTTP response.
 *
 * Order (docs/CAREBRIDGE_SAFETY_POLICY.md §1, research doc §4.2):
 *   0. Shape validation; `ageBracket: '15-17'` is refused (403) before anything runs.
 *   1. Deterministic crisis gate on the RAW text of ALL segments joined, before
 *      consent, redaction or any AI.
 *   2. PII detection and redaction on the server, per segment. The client may
 *      only ask to keep SOFT findings (address / person-name hints) the server
 *      itself detected; hard kinds (phone, email, NIK, card, url, handle) are
 *      always redacted. It can never hand us a "pre-redacted" text.
 *   3. `preview` stops here (no AI, no consent needed) so the user can review
 *      exactly what would be sent, segment by segment.
 *   4. `generate` runs the pipeline, which checks AI consent, only ever shows
 *      the sanitized segments to a provider, and links every accepted fact to
 *      the one segment its quote came from.
 *
 * Nothing here logs, caches or stores user text. Telemetry is metadata only.
 *
 * Two request shapes are accepted:
 *   - legacy `{ text, redactions? }`: one story, the client picks which of the
 *     server's findings to redact (unchanged behaviour);
 *   - segments `{ segments[], keepSoftPii? }`: story + selected local entries.
 */

export const CARE_PASSPORT_MAX_BYTES = 32 * 1024;
export { CARE_PASSPORT_MAX_TEXT, CARE_PASSPORT_MAX_SEGMENTS, CARE_PASSPORT_MAX_TOTAL_TEXT };
export const CARE_PASSPORT_MAX_REDACTIONS = 64;
export const CARE_PASSPORT_MAX_KEEP_SOFT_PII = 64;

/** Adults only for this module; the pipeline uses the same bracket. */
const ADULT_AGE_BRACKET = '18-29';
const MINOR_AGE_BRACKET: AgeBracket = '15-17';
const AGE_BRACKETS: ReadonlySet<string> = new Set<AgeBracket>(['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54']);

const PII_KINDS: ReadonlySet<string> = new Set<PiiKind>([
  'email',
  'phone',
  'nik',
  'url',
  'handle',
  'card',
  'address_hint',
  'person_name_hint',
]);

/** The only kinds a user may choose to leave visible. Everything else is always redacted. */
export const SOFT_PII_KINDS: ReadonlySet<PiiKind> = new Set<PiiKind>(['address_hint', 'person_name_hint']);

const SEGMENT_KINDS: ReadonlySet<string> = new Set<CarePassportSegmentKind>(['intake', 'journal', 'checkin', 'clarification']);
const SEGMENT_ID = /^[A-Za-z0-9:_.-]{1,64}$/;
const SEGMENT_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CarePassportMode = 'preview' | 'generate';

/** A finding the user accepted in the preview step (legacy shape). Only the span identity matters. */
export interface RedactionChoice {
  kind: PiiKind;
  start: number;
  end: number;
}

export interface CarePassportRequestBody {
  mode?: CarePassportMode;
  /** Legacy: one story. Ignored when `segments` is present. */
  text?: string;
  /** F-A: the story plus explicitly selected local entries, 1..12, raw text. */
  segments?: CarePassportSegment[];
  /** Legacy only. Omitted = redact everything the server finds. An array = exactly that subset. */
  redactions?: RedactionChoice[];
  /** Segments only: ids (`segmentId:start-end`) of SOFT findings the user chose to keep visible. */
  keepSoftPii?: string[];
  aiConsent?: boolean;
  /** Refused for minors; omitted = the consent step already asserted 18+. */
  ageBracket?: AgeBracket;
}

/** A server finding with the segment it belongs to; offsets are relative to that segment's text. */
export interface CarePassportPiiFinding extends PiiFinding {
  segmentId: string;
  /** Stable id the client echoes in `keepSoftPii`. */
  id: string;
  /** False for hard kinds: the UI shows them locked. */
  canKeep: boolean;
}

export interface CarePassportPreviewSegment {
  id: string;
  kind: CarePassportSegmentKind;
  date?: string;
  findings: CarePassportPiiFinding[];
  /** Fully redacted, the default that will be sent unless soft findings are kept. */
  redactedText: string;
}

export type CarePassportResponse =
  | {
      kind: 'preview';
      findings: CarePassportPiiFinding[];
      redactedText: string;
      segments: CarePassportPreviewSegment[];
    }
  | {
      kind: 'result';
      result: CarePassportResult;
      /** What the pipeline actually saw (joined), so the UI can ground quotes against it. */
      sanitizedText?: string;
      /** The exact sanitized segments sent to the model; absent on crisis / no-passport paths. */
      sanitizedSegments?: CarePassportSegment[];
    };

export type CarePassportHandlerOutcome =
  | { ok: true; status: 200; data: CarePassportResponse }
  | { ok: false; status: 400 | 403 | 413; error: string };

export interface CarePassportTelemetry {
  mode: CarePassportMode;
  state?: CarePassportResult['state'];
  providerId?: string;
  isAmd?: boolean;
  latencyMs?: number;
  droppedClaims?: number;
  /** Only bare warning codes (`[a-z0-9_]`); provider messages are dropped. */
  warningCodes: string[];
  findings: number;
  segmentsCount: number;
}

export interface CarePassportHandlerDeps {
  runPipeline?: (input: CarePassportPipelineInput) => Promise<CarePassportResult>;
  onTelemetry?: (meta: CarePassportTelemetry) => void;
}

const INVALID = 'Permintaan tidak valid.';
const EMPTY = 'Ceritanya masih kosong. Tulis dulu sedikit saja, ya.';
const TOO_LARGE = `Ceritamu terlalu panjang untuk satu catatan. Coba ringkas sampai ${CARE_PASSPORT_MAX_TEXT} karakter, ya.`;
const TOO_LARGE_TOTAL = `Cerita dan entri yang dipilih terlalu panjang untuk satu catatan. Batasnya ${CARE_PASSPORT_MAX_TOTAL_TEXT} karakter; coba kurangi entri yang disertakan.`;
const TOO_MANY_SEGMENTS = `Entri yang disertakan terlalu banyak. Pilih paling banyak ${CARE_PASSPORT_MAX_SEGMENTS - 1} entri, ya.`;
const MINOR = 'Fitur ini hanya untuk pengguna berusia 18 tahun ke atas. Kamu tetap bisa memakai bagian lain Dengar.in.';

type Validated =
  | {
      ok: true;
      mode: CarePassportMode;
      segments: CarePassportSegment[];
      /** True for the single-`text` shape, where `redactions` keep their old meaning. */
      legacy: boolean;
      /** Legacy shape only: the normalised story (kept for existing callers and tests). */
      text?: string;
      redactions?: RedactionChoice[];
      keepSoftPii: Set<string>;
      aiConsent: boolean;
    }
  | { ok: false; status: 400 | 403 | 413; error: string };

function normalizeText(text: string): string {
  return text.normalize('NFKC').replace(/\r\n?/g, '\n');
}

function validateSegments(raw: unknown): { ok: true; segments: CarePassportSegment[] } | Extract<Validated, { ok: false }> {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, status: 400, error: INVALID };
  if (raw.length > CARE_PASSPORT_MAX_SEGMENTS) return { ok: false, status: 413, error: TOO_MANY_SEGMENTS };
  const seen = new Set<string>();
  const segments: CarePassportSegment[] = [];
  let total = 0;
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return { ok: false, status: 400, error: INVALID };
    const { id, kind, date, text } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || !SEGMENT_ID.test(id) || seen.has(id)) return { ok: false, status: 400, error: INVALID };
    if (typeof kind !== 'string' || !SEGMENT_KINDS.has(kind)) return { ok: false, status: 400, error: INVALID };
    if (date !== undefined && (typeof date !== 'string' || !SEGMENT_DATE.test(date))) return { ok: false, status: 400, error: INVALID };
    if (typeof text !== 'string') return { ok: false, status: 400, error: INVALID };
    if (text.length > CARE_PASSPORT_MAX_SEGMENT_TEXT) return { ok: false, status: 413, error: TOO_LARGE };
    total += text.length;
    if (total > CARE_PASSPORT_MAX_TOTAL_TEXT) return { ok: false, status: 413, error: TOO_LARGE_TOTAL };
    seen.add(id);
    const normalized = normalizeText(text);
    if (normalized.trim().length === 0) continue; // an empty segment carries nothing; drop it silently
    const segment: CarePassportSegment = { id, kind: kind as CarePassportSegmentKind, text: normalized };
    if (typeof date === 'string') segment.date = date;
    segments.push(segment);
  }
  if (segments.length === 0) return { ok: false, status: 400, error: EMPTY };
  return { ok: true, segments };
}

export function validateCarePassportBody(value: unknown): Validated {
  if (!value || typeof value !== 'object') return { ok: false, status: 400, error: INVALID };
  const body = value as CarePassportRequestBody;

  const mode: CarePassportMode = body.mode === 'preview' ? 'preview' : 'generate';
  if (body.mode !== undefined && body.mode !== 'preview' && body.mode !== 'generate') {
    return { ok: false, status: 400, error: INVALID };
  }

  // Age first: a minor's text is never processed, not even by the crisis gate here.
  if (body.ageBracket !== undefined) {
    if (typeof body.ageBracket !== 'string' || !AGE_BRACKETS.has(body.ageBracket)) return { ok: false, status: 400, error: INVALID };
    if (body.ageBracket === MINOR_AGE_BRACKET) return { ok: false, status: 403, error: MINOR };
  }

  if (body.aiConsent !== undefined && typeof body.aiConsent !== 'boolean') {
    return { ok: false, status: 400, error: INVALID };
  }
  const aiConsent = body.aiConsent === true;

  let keepSoftPii = new Set<string>();
  if (body.keepSoftPii !== undefined) {
    if (!Array.isArray(body.keepSoftPii) || body.keepSoftPii.length > CARE_PASSPORT_MAX_KEEP_SOFT_PII) {
      return { ok: false, status: 400, error: INVALID };
    }
    if (!body.keepSoftPii.every((id) => typeof id === 'string' && id.length <= 128)) return { ok: false, status: 400, error: INVALID };
    keepSoftPii = new Set(body.keepSoftPii);
  }

  if (body.segments !== undefined) {
    const validated = validateSegments(body.segments);
    if (!validated.ok) return validated;
    return { ok: true, mode, segments: validated.segments, legacy: false, keepSoftPii, aiConsent };
  }

  // Legacy single-story shape.
  if (typeof body.text !== 'string') return { ok: false, status: 400, error: INVALID };
  if (body.text.length > CARE_PASSPORT_MAX_TEXT) return { ok: false, status: 413, error: TOO_LARGE };
  const text = normalizeText(body.text);
  if (text.trim().length === 0) return { ok: false, status: 400, error: EMPTY };

  let redactions: RedactionChoice[] | undefined;
  if (body.redactions !== undefined) {
    if (!Array.isArray(body.redactions) || body.redactions.length > CARE_PASSPORT_MAX_REDACTIONS) {
      return { ok: false, status: 400, error: INVALID };
    }
    redactions = [];
    for (const entry of body.redactions) {
      if (!entry || typeof entry !== 'object') return { ok: false, status: 400, error: INVALID };
      const { kind, start, end } = entry as unknown as Record<string, unknown>;
      if (typeof kind !== 'string' || !PII_KINDS.has(kind)) return { ok: false, status: 400, error: INVALID };
      if (!Number.isInteger(start) || !Number.isInteger(end)) return { ok: false, status: 400, error: INVALID };
      redactions.push({ kind: kind as PiiKind, start: start as number, end: end as number });
    }
  }

  return {
    ok: true,
    mode,
    segments: [{ id: 'intake', kind: 'intake', text }],
    legacy: true,
    text,
    redactions,
    keepSoftPii,
    aiConsent,
  };
}

/**
 * The client chooses WHICH server-detected spans to redact, never WHAT to
 * replace them with. Anything not in the server's own detection is ignored.
 */
export function selectAcceptedFindings(serverFindings: PiiFinding[], choices?: RedactionChoice[]): PiiFinding[] {
  if (!choices) return serverFindings;
  const wanted = new Set(choices.map((c) => `${c.kind}:${c.start}:${c.end}`));
  return serverFindings.filter((f) => wanted.has(`${f.kind}:${f.start}:${f.end}`));
}

/** Stable, offset-based id for one finding inside one segment. */
export function piiFindingId(segmentId: string, finding: Pick<PiiFinding, 'start' | 'end'>): string {
  return `${segmentId}:${finding.start}-${finding.end}`;
}

/**
 * Segments mode: everything the server found is redacted, except SOFT findings
 * whose id the user listed. A `keepSoftPii` entry naming a hard finding (or a
 * span the server never found) changes nothing.
 */
export function selectSegmentFindings(segmentId: string, serverFindings: PiiFinding[], keepSoftPii: ReadonlySet<string>): PiiFinding[] {
  return serverFindings.filter((f) => !(SOFT_PII_KINDS.has(f.kind) && keepSoftPii.has(piiFindingId(segmentId, f))));
}

function immediateHelpResult(rawText: string): CarePassportResult | null {
  const crisis = evaluateCrisisInput(rawText, ADULT_AGE_BRACKET);
  if (!crisis.isCrisis && !isUrgentHelpRequest(rawText)) return null;
  return {
    state: 'IMMEDIATE_HELP_SCREEN',
    emergencyContacts: crisis.emergencyContacts,
    provenance: { providerId: 'none', isAmd: false, isFallback: true },
    droppedClaims: 0,
    warnings: crisis.isCrisis ? ['crisis_gate'] : ['urgent_help_requested'],
  };
}

const WARNING_CODE = /^[a-z0-9_]+$/;
const WARNING_MAX_LENGTH = 120;

/**
 * Provider error messages may echo request bodies. Before a warning leaves the
 * server it is cut at 120 characters and everything after the second colon
 * (`provider:model: <message>`) is dropped, so no fragment of user text can
 * ride along. Bare codes pass through untouched.
 */
export function scrubWarning(warning: string): string {
  if (WARNING_CODE.test(warning)) return warning;
  const first = warning.indexOf(':');
  const second = first === -1 ? -1 : warning.indexOf(':', first + 1);
  const kept = second === -1 ? warning : warning.slice(0, second + 1);
  return kept.slice(0, WARNING_MAX_LENGTH).trim();
}

function telemetryFor(
  mode: CarePassportMode,
  findings: number,
  segmentsCount: number,
  result?: CarePassportResult
): CarePassportTelemetry {
  return {
    mode,
    state: result?.state,
    providerId: result?.provenance.providerId,
    isAmd: result?.provenance.isAmd,
    latencyMs: result?.provenance.latencyMs,
    droppedClaims: result?.droppedClaims,
    warningCodes: (result?.warnings ?? []).filter((w) => WARNING_CODE.test(w)),
    findings,
    segmentsCount,
  };
}

function toPreviewFinding(segmentId: string, finding: PiiFinding): CarePassportPiiFinding {
  return { ...finding, segmentId, id: piiFindingId(segmentId, finding), canKeep: SOFT_PII_KINDS.has(finding.kind) };
}

export async function handleCarePassportRequest(
  body: unknown,
  deps: CarePassportHandlerDeps = {}
): Promise<CarePassportHandlerOutcome> {
  const validated = validateCarePassportBody(body);
  if (!validated.ok) return validated;
  const { mode, segments, legacy, redactions, keepSoftPii, aiConsent } = validated;
  const runPipeline = deps.runPipeline ?? ((input) => runCarePassportPipeline(input));
  const report = deps.onTelemetry ?? (() => undefined);

  // 1. Crisis gate on the raw text of EVERY segment, before consent, redaction or any AI.
  //    A crisis phrase inside a selected journal entry counts exactly like one in the story.
  const rawText = joinSegments(segments);
  const immediate = immediateHelpResult(rawText);
  if (immediate) {
    report(telemetryFor(mode, 0, segments.length, immediate));
    return { ok: true, status: 200, data: { kind: 'result', result: immediate } };
  }

  // 2. Server-side detection per segment; the client only picks a subset.
  const detected = segments.map((segment) => ({ segment, findings: detectPii(segment.text) }));
  const findingsCount = detected.reduce((sum, d) => sum + d.findings.length, 0);

  if (mode === 'preview') {
    const previewSegments: CarePassportPreviewSegment[] = detected.map(({ segment, findings }) => ({
      id: segment.id,
      kind: segment.kind,
      ...(segment.date ? { date: segment.date } : {}),
      findings: findings.map((f) => toPreviewFinding(segment.id, f)),
      redactedText: redactPii(segment.text, findings).text,
    }));
    report(telemetryFor(mode, findingsCount, segments.length));
    return {
      ok: true,
      status: 200,
      data: {
        kind: 'preview',
        findings: previewSegments.flatMap((s) => s.findings),
        redactedText: joinSegments(previewSegments.map((s) => ({ text: s.redactedText }))),
        segments: previewSegments,
      },
    };
  }

  let acceptedCount = 0;
  const sanitizedSegments: CarePassportSegment[] = detected.map(({ segment, findings }) => {
    const accepted = legacy ? selectAcceptedFindings(findings, redactions) : selectSegmentFindings(segment.id, findings, keepSoftPii);
    acceptedCount += accepted.length;
    return { ...segment, text: redactPii(segment.text, accepted).text };
  });
  const sanitizedText = joinSegments(sanitizedSegments);

  // 3. Consent and inference live in the pipeline; it never sees the raw text
  //    for anything but the (already passed) crisis gate.
  const pipelineInput: CarePassportPipelineInput = legacy
    ? { rawText, sanitizedText, aiConsent }
    : { rawText, sanitizedText, aiConsent, segments: sanitizedSegments };
  const pipelineResult = await runPipeline(pipelineInput);
  const result: CarePassportResult = legacy
    ? pipelineResult
    : { ...pipelineResult, warnings: pipelineResult.warnings.map(scrubWarning) };
  report(telemetryFor(mode, acceptedCount, segments.length, result));

  if (result.state === 'IMMEDIATE_HELP_SCREEN' || !result.passport) {
    return { ok: true, status: 200, data: { kind: 'result', result } };
  }
  return {
    ok: true,
    status: 200,
    data: {
      kind: 'result',
      result,
      sanitizedText,
      ...(legacy ? {} : { sanitizedSegments }),
    },
  };
}
