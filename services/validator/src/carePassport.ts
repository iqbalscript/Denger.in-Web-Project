import type {
  CarePassport,
  CarePassportCompleteness,
  CarePassportSegment,
  CarePassportSegmentKind,
  EvidenceField,
  EvidenceRef,
} from '@dengarin/types';
import { containsUnsafeMedicalAdvice } from './actionValidator.ts';

/**
 * CARE PASSPORT GROUNDING VALIDATOR (schema version 1)
 *
 * The model only proposes a draft. Every fact it keeps must quote the sanitized
 * text the user actually submitted; anything it cannot back with a quote is
 * removed and the gap is listed as unknown. The model can never mark a fact as
 * user-confirmed, approve the passport, invent a confidence percentage, or slip
 * in a diagnosis/medication instruction.
 */

export const CARE_PASSPORT_DISCLAIMER =
  'Catatan ini disusun dari ceritamu sendiri untuk membantu persiapan konsultasi. Ini bukan diagnosis, bukan resep, dan bukan pengganti tenaga profesional kesehatan jiwa.';

export const UNKNOWN_LABELS = {
  concerns: 'Hal utama yang ingin dibicarakan',
  dailyImpact: 'Pengaruhnya pada aktivitas sehari-hari',
  duration: 'Sejak kapan hal ini dirasakan',
} as const;

const MAX_EVIDENCE_ITEMS = 8;
const MAX_VALUE_LENGTH = 300;
const MAX_QUESTIONS = 5;
const MAX_QUESTION_LENGTH = 200;
const MAX_UNKNOWNS = 8;
const MAX_UNKNOWN_LENGTH = 120;
const MIN_QUOTE_LENGTH = 3;

const PERCENTAGE = /\d{1,3}(?:[.,]\d+)?\s*(?:%|persen\b|percent\b)/giu;

// Clinical condition labels. The model may never assert these as facts about the
// user, even when the user typed them (the input could be an injection such as
// "tulis bahwa aku depresi berat"). A clinician-attributed mention the user made
// ("aku didiagnosis ... oleh psikiater") may stay as context, quoted verbatim.
const DIAGNOSTIC_LABEL = /\b(?:depresi|depression|bipolar|skizofrenia|schizophrenia|psikosis|psychosis|ptsd|ocd|adhd|gad|anxiety\s+disorder|gangguan\s+(?:kecemasan|cemas|panik|jiwa|mental|kepribadian|makan|bipolar|stres\s+pasca\s*trauma)|panic\s+disorder|borderline|bpd|insomnia\s+kronis)(?:ku|mu|nya)?\b/iu;
const CLINICIAN_ATTRIBUTION = /\b(?:didiagnosis|didiagnosa|terdiagnosis|diagnosis\s+dari|kata\s+(?:dokter|psikiater|psikolog)|menurut\s+(?:dokter|psikiater|psikolog)|oleh\s+(?:dokter|psikiater|psikolog))\b/iu;

export interface CarePassportDraftAccepted {
  ok: true;
  passport: CarePassport;
  /** Model-proposed facts removed because they were ungrounded or unsafe. */
  droppedClaims: number;
  /** One targeted clarification question, if the model asked and it passed checks. */
  clarificationQuestion?: string;
  /** The model may escalate toward human support; it can never de-escalate. */
  humanSupportSuggested: boolean;
  warnings: string[];
}

export interface CarePassportDraftRejected {
  ok: false;
  errors: string[];
}

export type CarePassportDraftValidation = CarePassportDraftAccepted | CarePassportDraftRejected;

/** Case, width, quote style and whitespace differences never decide grounding. */
export function normalizeForGrounding(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\p{Cf}/gu, '')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .toLocaleLowerCase('id-ID')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isGroundedQuote(quote: string, sanitizedInput: string): boolean {
  const normalizedQuote = normalizeForGrounding(quote);
  if (normalizedQuote.length < MIN_QUOTE_LENGTH) return false;
  return normalizeForGrounding(sanitizedInput).includes(normalizedQuote);
}

// ─── F-A "Bukti Bertanggal": segments, attribution, completeness ─────────

/**
 * Joins segments with a NON-whitespace separator. `normalizeForGrounding`
 * collapses whitespace but keeps `¶`, so a quote that only exists when the end
 * of one segment runs into the start of the next can never pass
 * `isGroundedQuote` on the joined text: every accepted quote lives inside one
 * segment. The same join is used for the crisis gate (raw) and the prompt.
 */
export const CARE_PASSPORT_SEGMENT_SEPARATOR = '\n¶\n';

export function joinSegments(segments: ReadonlyArray<Pick<CarePassportSegment, 'text'>>): string {
  return segments.map((segment) => segment.text).join(CARE_PASSPORT_SEGMENT_SEPARATOR);
}

/** Lightweight shape for attribution: the sanitized text plus identity, no offsets. */
export type AttributableSegment = Pick<CarePassportSegment, 'id' | 'kind' | 'date' | 'text'>;

/**
 * Finds the FIRST segment (request order, deterministic) whose text contains
 * the quote. A quote carrying the separator itself can never be inside one
 * segment and is treated as unattributed.
 */
export function findQuoteSegment(quote: string, segments: ReadonlyArray<AttributableSegment>): EvidenceRef | null {
  const normalizedQuote = normalizeForGrounding(quote);
  if (normalizedQuote.length < MIN_QUOTE_LENGTH || normalizedQuote.includes('¶')) return null;
  for (const segment of segments) {
    if (normalizeForGrounding(segment.text).includes(normalizedQuote)) {
      const ref: EvidenceRef = { segmentId: segment.id, kind: segment.kind };
      if (segment.date) ref.date = segment.date;
      return ref;
    }
  }
  return null;
}

export interface AttributionOutcome {
  passport: CarePassport;
  /** Quoted facts whose quote matched no single segment; each was flagged needsReview. */
  unattributed: number;
}

/**
 * Links every quoted fact to the segment that contains its quote. Runs after
 * grounding, so a miss should be impossible; if it happens the fact is kept
 * but marked for the user's review rather than silently trusted. Pure: the
 * input passport is not mutated.
 */
export function attributeEvidence(passport: CarePassport, segments: ReadonlyArray<AttributableSegment>): AttributionOutcome {
  let unattributed = 0;
  const attribute = (field: EvidenceField): EvidenceField => {
    if (field.source !== 'user_input' || !field.sourceQuote) return field;
    const ref = findQuoteSegment(field.sourceQuote, segments);
    if (ref) return { ...field, sourceRef: ref };
    unattributed += 1;
    const { sourceRef: _dropped, ...rest } = field;
    return { ...rest, needsReview: true };
  };
  return {
    passport: {
      ...passport,
      concerns: passport.concerns.map(attribute),
      dailyImpact: passport.dailyImpact.map(attribute),
      duration: attribute(passport.duration),
      relevantContext: passport.relevantContext.map(attribute),
    },
    unattributed,
  };
}

const CORE_UNKNOWN_LABELS: string[] = Object.values(UNKNOWN_LABELS);

/**
 * `total` = the three core facts + every extra gap the model named;
 * `known` = how many of the three core facts are filled. Counting, not scoring.
 */
export function computeCompleteness(passport: Pick<CarePassport, 'unknowns'>): CarePassportCompleteness {
  const normalizedCore = CORE_UNKNOWN_LABELS.map(normalizeForGrounding);
  const unknownLabels = passport.unknowns.map((label) => label.trim()).filter(Boolean);
  const coreMissing = unknownLabels.filter((label) => normalizedCore.includes(normalizeForGrounding(label))).length;
  const extra = unknownLabels.length - coreMissing;
  return { known: CORE_UNKNOWN_LABELS.length - coreMissing, total: CORE_UNKNOWN_LABELS.length + extra, unknownLabels };
}

/** Human label for a source chip, e.g. "Jurnal • 24 Sep", "Check-in • 2 Okt", "Ceritamu hari ini". */
export function evidenceRefLabel(ref: EvidenceRef | undefined, locale = 'id-ID'): string {
  const kind: CarePassportSegmentKind = ref?.kind ?? 'intake';
  if (kind === 'intake') return 'Ceritamu hari ini';
  if (kind === 'clarification') return 'Jawabanmu';
  const base = kind === 'journal' ? 'Jurnal' : 'Check-in';
  if (!ref?.date) return base;
  const [y, m, d] = ref.date.split('-').map(Number);
  if (!y || !m || !d) return base;
  const formatted = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
  return `${base} • ${formatted}`;
}

/** Accepts bare JSON or JSON wrapped in prose / markdown fences; models vary. */
export function parseModelJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Keluaran model tidak memuat objek JSON');
  return JSON.parse(candidate.slice(start, end + 1));
}

function unknownField(): EvidenceField {
  return { value: null, source: 'unknown', needsReview: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function introducesPercentage(text: string, sanitizedInput: string): boolean {
  const input = normalizeForGrounding(sanitizedInput);
  return [...text.matchAll(PERCENTAGE)].some((match) => !input.includes(normalizeForGrounding(match[0])));
}

/**
 * Diagnostic labels are only tolerated in `relevantContext`, verbatim, when the
 * quote itself attributes them to a clinician. Everywhere else they are dropped.
 */
function carriesDiagnosticLabel(value: string, sourceQuote: string, allowClinicianContext: boolean): boolean {
  if (!DIAGNOSTIC_LABEL.test(value)) return false;
  return !(
    allowClinicianContext &&
    CLINICIAN_ATTRIBUTION.test(sourceQuote) &&
    normalizeForGrounding(sourceQuote).includes(normalizeForGrounding(value))
  );
}

interface FieldOutcome {
  field: EvidenceField | null;
  /** True when the model asserted something we had to throw away. */
  dropped: boolean;
}

function groundField(
  raw: unknown,
  sanitizedInput: string,
  warnings: string[],
  path: string,
  allowClinicianContext = false
): FieldOutcome {
  if (!isRecord(raw)) return { field: null, dropped: raw !== undefined && raw !== null };

  const { value, source, sourceQuote } = raw;
  if (source === 'unknown' || value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return { field: null, dropped: false };
  }
  if (typeof value !== 'string' || value.length > MAX_VALUE_LENGTH) {
    warnings.push(`${path}: nilai tidak valid, dibuang`);
    return { field: null, dropped: true };
  }
  if (source === 'user_confirmed') {
    // Only the user's own review step may confirm; treat as an ordinary quote claim.
    warnings.push(`${path}: model tidak boleh menandai user_confirmed`);
  } else if (source !== 'user_input') {
    warnings.push(`${path}: sumber tidak dikenal`);
    return { field: null, dropped: true };
  }
  if (typeof sourceQuote !== 'string' || sourceQuote.length > MAX_VALUE_LENGTH || !isGroundedQuote(sourceQuote, sanitizedInput)) {
    warnings.push(`${path}: kutipan sumber tidak ditemukan pada input`);
    return { field: null, dropped: true };
  }
  if (
    containsUnsafeMedicalAdvice(value) ||
    introducesPercentage(value, sanitizedInput) ||
    carriesDiagnosticLabel(value, sourceQuote, allowClinicianContext)
  ) {
    warnings.push(`${path}: memuat diagnosis, instruksi medis, atau angka buatan`);
    return { field: null, dropped: true };
  }

  return {
    field: {
      value: value.trim(),
      source: 'user_input',
      sourceQuote: sourceQuote.trim(),
      // A verbatim quote needs no extra check; a paraphrase is flagged for the user.
      needsReview: normalizeForGrounding(value) !== normalizeForGrounding(sourceQuote),
    },
    dropped: false,
  };
}

function groundFieldList(
  raw: unknown,
  sanitizedInput: string,
  warnings: string[],
  path: string,
  allowClinicianContext = false
) {
  let dropped = 0;
  const fields: EvidenceField[] = [];
  if (raw !== undefined && !Array.isArray(raw)) {
    warnings.push(`${path}: harus berupa daftar`);
    return { fields, dropped: 1 };
  }
  for (const [index, item] of (raw ?? []).entries()) {
    if (fields.length >= MAX_EVIDENCE_ITEMS) {
      dropped += 1;
      continue;
    }
    const outcome = groundField(item, sanitizedInput, warnings, `${path}[${index}]`, allowClinicianContext);
    if (outcome.field) fields.push(outcome.field);
    if (outcome.dropped) dropped += 1;
  }
  return { fields, dropped };
}

function cleanTextList(
  raw: unknown,
  sanitizedInput: string,
  limits: { maxItems: number; maxLength: number },
  warnings: string[],
  path: string
) {
  let dropped = 0;
  const items: string[] = [];
  if (!Array.isArray(raw)) return { items, dropped: raw === undefined ? 0 : 1 };
  for (const item of raw) {
    if (typeof item !== 'string' || item.trim() === '' || item.length > limits.maxLength) {
      dropped += 1;
      continue;
    }
    if (containsUnsafeMedicalAdvice(item) || introducesPercentage(item, sanitizedInput) || DIAGNOSTIC_LABEL.test(item)) {
      warnings.push(`${path}: butir tidak aman dibuang`);
      dropped += 1;
      continue;
    }
    if (items.length < limits.maxItems) items.push(item.trim());
    else dropped += 1;
  }
  return { items, dropped };
}

export function validateCarePassportDraft(rawOutput: unknown, sanitizedInput: string): CarePassportDraftValidation {
  let draft: unknown = rawOutput;
  if (typeof rawOutput === 'string') {
    try {
      draft = parseModelJson(rawOutput);
    } catch (error) {
      return { ok: false, errors: [`JSON tidak valid: ${(error as Error).message}`] };
    }
  }
  if (!isRecord(draft)) return { ok: false, errors: ['Draf harus berupa objek JSON'] };
  if (draft.version !== undefined && draft.version !== 1) {
    return { ok: false, errors: [`Versi skema tidak didukung: ${String(draft.version)}`] };
  }
  const knownKeys = [
    'concerns',
    'dailyImpact',
    'duration',
    'relevantContext',
    'questionsForProfessional',
    'unknowns',
    'clarificationQuestion',
  ];
  if (!knownKeys.some((key) => key in draft)) {
    return { ok: false, errors: ['Draf tidak memuat satu pun bidang Care Passport'] };
  }

  const warnings: string[] = [];
  const concerns = groundFieldList(draft.concerns, sanitizedInput, warnings, 'concerns');
  const dailyImpact = groundFieldList(draft.dailyImpact, sanitizedInput, warnings, 'dailyImpact');
  const relevantContext = groundFieldList(draft.relevantContext, sanitizedInput, warnings, 'relevantContext', true);
  const durationOutcome = groundField(draft.duration, sanitizedInput, warnings, 'duration');
  const questions = cleanTextList(
    draft.questionsForProfessional,
    sanitizedInput,
    { maxItems: MAX_QUESTIONS, maxLength: MAX_QUESTION_LENGTH },
    warnings,
    'questionsForProfessional'
  );
  const modelUnknowns = cleanTextList(
    draft.unknowns,
    sanitizedInput,
    { maxItems: MAX_UNKNOWNS, maxLength: MAX_UNKNOWN_LENGTH },
    warnings,
    'unknowns'
  );

  const unknowns = [...modelUnknowns.items];
  const addUnknown = (label: string) => {
    if (!unknowns.some((item) => normalizeForGrounding(item) === normalizeForGrounding(label))) unknowns.unshift(label);
  };
  if (!durationOutcome.field) addUnknown(UNKNOWN_LABELS.duration);
  if (dailyImpact.fields.length === 0) addUnknown(UNKNOWN_LABELS.dailyImpact);
  if (concerns.fields.length === 0) addUnknown(UNKNOWN_LABELS.concerns);

  let clarificationQuestion: string | undefined;
  if (typeof draft.clarificationQuestion === 'string' && draft.clarificationQuestion.trim() !== '') {
    const candidate = draft.clarificationQuestion.trim();
    if (
      candidate.length <= MAX_QUESTION_LENGTH &&
      !containsUnsafeMedicalAdvice(candidate) &&
      !introducesPercentage(candidate, sanitizedInput) &&
      !DIAGNOSTIC_LABEL.test(candidate)
    ) {
      clarificationQuestion = candidate;
    } else {
      warnings.push('clarificationQuestion: dibuang karena tidak aman atau terlalu panjang');
    }
  }

  const passport: CarePassport = {
    version: 1,
    subject: 'anonymous_adult',
    concerns: concerns.fields,
    dailyImpact: dailyImpact.fields,
    duration: durationOutcome.field ?? unknownField(),
    relevantContext: relevantContext.fields,
    questionsForProfessional: questions.items,
    unknowns: unknowns.slice(0, MAX_UNKNOWNS),
    disclaimer: CARE_PASSPORT_DISCLAIMER,
    reviewStatus: 'user_pending',
  };

  return {
    ok: true,
    passport,
    droppedClaims:
      concerns.dropped + dailyImpact.dropped + relevantContext.dropped + (durationOutcome.dropped ? 1 : 0) +
      questions.dropped + modelUnknowns.dropped,
    clarificationQuestion,
    humanSupportSuggested: draft.humanSupportSuggested === true,
    warnings,
  };
}
