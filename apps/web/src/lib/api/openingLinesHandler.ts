import type { CarePassport, EvidenceField, EvidenceSource } from '@dengarin/types';
import { isHelpDestinationId, type HelpDestinationId } from '@dengarin/config';
import {
  runOpeningLinesPipeline,
  type OpeningLinesPipelineInput,
  type OpeningLinesResult,
} from '@dengarin/orchestrator';

/**
 * OPENING LINES API HANDLER (F-B "Kalimat Pembuka per Tujuan")
 *
 * Framework-free so it can be unit-tested with node:test. The Next.js route
 * app/api/care-passport/opening/route.ts only reads the body, applies quotas
 * and maps the outcome to an HTTP response.
 *
 * The passport lives on the client; the server receives a copy, rebuilds it
 * field by field (unknown keys are dropped, limits enforced), refuses anything
 * not marked user_approved, and hands it to the pipeline. Nothing is stored,
 * cached or logged beyond metadata.
 */

export const OPENING_LINES_MAX_BYTES = 32 * 1024;
const MAX_EVIDENCE_ITEMS = 8;
const MAX_VALUE_LENGTH = 300;
const MAX_QUESTIONS = 5;
const MAX_QUESTION_LENGTH = 200;
const MAX_UNKNOWNS = 8;
const MAX_UNKNOWN_LENGTH = 120;
const MAX_DISCLAIMER_LENGTH = 400;

const SOURCES: ReadonlySet<string> = new Set<EvidenceSource>(['user_input', 'user_confirmed', 'unknown']);

export interface OpeningLinesRequestBody {
  passport?: unknown;
  destination?: HelpDestinationId;
  aiConsent?: boolean;
}

export type OpeningLinesHandlerOutcome =
  | { ok: true; status: 200; data: OpeningLinesResult }
  | { ok: false; status: 400 | 413; error: string };

export interface OpeningLinesTelemetry {
  destination?: HelpDestinationId;
  state?: OpeningLinesResult['state'];
  providerId?: string;
  latencyMs?: number;
  droppedLines?: number;
  lineCount?: number;
  /** Only bare warning codes (`[a-z0-9_]`); provider messages are dropped. */
  warningCodes: string[];
}

export interface OpeningLinesHandlerDeps {
  runPipeline?: (input: OpeningLinesPipelineInput) => Promise<OpeningLinesResult>;
  onTelemetry?: (meta: OpeningLinesTelemetry) => void;
}

const INVALID = 'Permintaan tidak valid.';
const NOT_APPROVED = 'Kalimat pembuka hanya bisa disusun dari catatan yang sudah kamu setujui.';
const UNKNOWN_DESTINATION = 'Tujuan yang dipilih tidak dikenal.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanField(raw: unknown): EvidenceField | null {
  if (!isRecord(raw)) return null;
  const { value, source, sourceQuote, needsReview } = raw;
  if (typeof source !== 'string' || !SOURCES.has(source)) return null;
  if (value !== null && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.length > MAX_VALUE_LENGTH) return null;
  if (sourceQuote !== undefined && (typeof sourceQuote !== 'string' || sourceQuote.length > MAX_VALUE_LENGTH)) return null;
  if (needsReview !== undefined && typeof needsReview !== 'boolean') return null;
  const field: EvidenceField = {
    value: typeof value === 'string' ? value.normalize('NFKC').trim() : null,
    source: source as EvidenceSource,
    needsReview: needsReview === true,
  };
  if (typeof sourceQuote === 'string') field.sourceQuote = sourceQuote;
  return field;
}

function cleanFieldList(raw: unknown): EvidenceField[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > MAX_EVIDENCE_ITEMS) return null;
  const out: EvidenceField[] = [];
  for (const item of raw) {
    const field = cleanField(item);
    if (!field) return null;
    out.push(field);
  }
  return out;
}

function cleanTextList(raw: unknown, maxItems: number, maxLength: number): string[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > maxItems) return null;
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string' || item.length > maxLength) return null;
    const text = item.normalize('NFKC').trim();
    if (text) out.push(text);
  }
  return out;
}

/**
 * Rebuilds a Care Passport from an untrusted body. Returns null on any shape
 * violation. Extra keys (for example evidence refs added by other features)
 * are dropped rather than forwarded.
 */
export function sanitizeCarePassportInput(raw: unknown): CarePassport | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== 1 || raw.subject !== 'anonymous_adult') return null;
  if (raw.reviewStatus !== 'user_pending' && raw.reviewStatus !== 'user_approved') return null;

  const concerns = cleanFieldList(raw.concerns);
  const dailyImpact = cleanFieldList(raw.dailyImpact);
  const relevantContext = cleanFieldList(raw.relevantContext);
  const duration = raw.duration === undefined ? { value: null, source: 'unknown' as const, needsReview: false } : cleanField(raw.duration);
  const questionsForProfessional = cleanTextList(raw.questionsForProfessional, MAX_QUESTIONS, MAX_QUESTION_LENGTH);
  const unknowns = cleanTextList(raw.unknowns, MAX_UNKNOWNS, MAX_UNKNOWN_LENGTH);
  if (!concerns || !dailyImpact || !relevantContext || !duration || !questionsForProfessional || !unknowns) return null;
  if (raw.disclaimer !== undefined && (typeof raw.disclaimer !== 'string' || raw.disclaimer.length > MAX_DISCLAIMER_LENGTH)) return null;

  return {
    version: 1,
    subject: 'anonymous_adult',
    concerns,
    dailyImpact,
    duration,
    relevantContext,
    questionsForProfessional,
    unknowns,
    disclaimer: typeof raw.disclaimer === 'string' ? raw.disclaimer : '',
    reviewStatus: raw.reviewStatus,
  };
}

type Validated =
  | { ok: true; passport: CarePassport; destination: HelpDestinationId; aiConsent: boolean }
  | { ok: false; status: 400 | 413; error: string };

export function validateOpeningLinesBody(value: unknown): Validated {
  if (!isRecord(value)) return { ok: false, status: 400, error: INVALID };
  const body = value as OpeningLinesRequestBody;
  if (!isHelpDestinationId(body.destination)) return { ok: false, status: 400, error: UNKNOWN_DESTINATION };
  if (body.aiConsent !== undefined && typeof body.aiConsent !== 'boolean') return { ok: false, status: 400, error: INVALID };
  const passport = sanitizeCarePassportInput(body.passport);
  if (!passport) return { ok: false, status: 400, error: INVALID };
  if (passport.reviewStatus !== 'user_approved') return { ok: false, status: 400, error: NOT_APPROVED };
  return { ok: true, passport, destination: body.destination, aiConsent: body.aiConsent === true };
}

const WARNING_CODE = /^[a-z0-9_]+$/;

function telemetryFor(destination: HelpDestinationId, result: OpeningLinesResult): OpeningLinesTelemetry {
  return {
    destination,
    state: result.state,
    providerId: result.provenance.providerId,
    latencyMs: result.provenance.latencyMs,
    droppedLines: result.droppedLines,
    lineCount: result.lines.length,
    warningCodes: result.warnings.filter((w) => WARNING_CODE.test(w)),
  };
}

/** Provider error strings can echo model output; keep only a short, colon-free head. */
function sanitizeWarnings(warnings: string[]): string[] {
  return warnings.map((w) => (WARNING_CODE.test(w) ? w : w.split(':').slice(0, 2).join(':').slice(0, 120)));
}

export async function handleOpeningLinesRequest(
  body: unknown,
  deps: OpeningLinesHandlerDeps = {}
): Promise<OpeningLinesHandlerOutcome> {
  const validated = validateOpeningLinesBody(body);
  if (!validated.ok) return validated;
  const { passport, destination, aiConsent } = validated;
  const runPipeline = deps.runPipeline ?? ((input) => runOpeningLinesPipeline(input));
  const report = deps.onTelemetry ?? (() => undefined);

  // Crisis gate, consent and inference all live in the pipeline, in that order.
  const result = await runPipeline({ passport, destination, aiConsent });
  report(telemetryFor(destination, result));
  return { ok: true, status: 200, data: { ...result, warnings: sanitizeWarnings(result.warnings) } };
}
