/**
 * PII DETECTION & REDACTION (AMD-06 data minimisation)
 *
 * Runs on the user's text BEFORE any remote AI call. Findings carry exact
 * offsets into the ORIGINAL text so the UI can show them for review; the user
 * may accept a subset, and only accepted findings are replaced.
 *
 * Deterministic and conservative: it reduces accidental disclosure but is not
 * a guarantee of anonymity. Never log `match` values.
 */

export type PiiKind = 'email' | 'phone' | 'nik' | 'url' | 'handle' | 'card' | 'address_hint' | 'person_name_hint';

export interface PiiFinding {
  kind: PiiKind;
  start: number;
  end: number;
  match: string;
  replacement: string;
}

const REPLACEMENTS: Record<PiiKind, string> = {
  email: '[EMAIL]',
  phone: '[NOMOR_TELEPON]',
  nik: '[NIK]',
  url: '[TAUTAN]',
  handle: '[AKUN_MEDSOS]',
  card: '[NOMOR_KARTU]',
  address_hint: '[ALAMAT]',
  person_name_hint: '[NAMA]',
};

/** Lower index wins when two candidates overlap. */
const PRIORITY: PiiKind[] = ['email', 'url', 'nik', 'phone', 'card', 'handle', 'address_hint', 'person_name_hint'];

interface Candidate {
  kind: PiiKind;
  start: number;
  end: number;
}

const NAME = String.raw`[A-Z][\p{Ll}'’-]+(?:\s+[A-Z][\p{Ll}'’-]+){0,2}`;

function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

function collect(text: string, pattern: RegExp, kind: PiiKind, out: Candidate[], accept?: (value: string) => boolean): void {
  for (const match of text.matchAll(pattern)) {
    const value = match[0];
    if (!value || (accept && !accept(value))) continue;
    const start = match.index ?? 0;
    out.push({ kind, start, end: start + value.length });
  }
}

/** For cue-based patterns: only the capture group (the name) is the finding. */
function collectGroup(text: string, pattern: RegExp, kind: PiiKind, out: Candidate[]): void {
  for (const match of text.matchAll(pattern)) {
    const span = match.indices?.[1];
    if (span) out.push({ kind, start: span[0], end: span[1] });
  }
}

function findCandidates(text: string): Candidate[] {
  const out: Candidate[] = [];

  collect(text, /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, 'email', out);

  // Explicit URLs, then bare domains with common TLDs. Trailing punctuation is not part of the link.
  for (const pattern of [
    /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi,
    /\b[a-z0-9][a-z0-9-]*\.(?:com|net|org|co\.id|id|me|io|ly|link)\b(?:\/[^\s<>"'`]*)?/gi,
  ]) {
    for (const match of text.matchAll(pattern)) {
      const value = match[0].replace(/[.,;:!?)\]]+$/, '');
      const start = match.index ?? 0;
      if (value) out.push({ kind: 'url', start, end: start + value.length });
    }
  }

  // NIK: exactly 16 contiguous digits.
  collect(text, /(?<![\d+])\d{16}(?!\d)/g, 'nik', out);

  // Indonesian mobile numbers: +62 / 62 / 0 then 8, optional separators; 9-13 digits once normalised to 0-prefix.
  collect(text, /(?<![\w+])(?:\+62|62|0)[\s.-]?8\d{1,3}(?:[\s.-]?\d{2,5}){1,4}(?![\w])/g, 'phone', out, (value) => {
    const digits = digitsOf(value);
    const national = digits.startsWith('62') ? `0${digits.slice(2)}` : digits;
    return national.length >= 9 && national.length <= 13;
  });

  // Payment cards: 13-19 digits (grouped or not) that pass Luhn.
  collect(text, /(?<![\d+])\d(?:[ -]?\d){12,18}(?!\d)/g, 'card', out, (value) => {
    const digits = digitsOf(value);
    return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits);
  });

  collect(text, /(?<![\w.@])@[A-Za-z0-9_](?:[A-Za-z0-9_.]{0,28}[A-Za-z0-9_])?/g, 'handle', out);

  // Address hints.
  collect(text, /\b(?:jl|jln)\.?\s+[^\n,;]{1,50}?\s*\bno\.?\s*\d+[a-z]?\b/giu, 'address_hint', out);
  collect(text, /\b(?:Jl|Jln)\.?\s+[A-Z0-9][\p{L}\d'.-]*(?:\s+[A-Z0-9][\p{L}\d'.-]*){0,3}/gu, 'address_hint', out);
  collect(text, /\bJalan\s+[A-Z][\p{L}'.-]*(?:\s+[A-Z0-9][\p{L}\d'.-]*){0,3}(?:\s*\b[Nn]o\.?\s*\d+[a-z]?\b)?/gu, 'address_hint', out);
  collect(text, /\bRT\s*\.?\s*\/?\s*RW\s*\.?\s*\d{1,3}\s*\/\s*\d{1,3}\b|\bRT\s*\.?\s*\d{1,3}\s*\/\s*RW\s*\.?\s*\d{1,3}\b/gi, 'address_hint', out);
  collect(
    text,
    new RegExp(String.raw`\b(?:[Kk]el(?:urahan)?|[Kk]ec(?:amatan)?|[Kk]ab(?:upaten)?|[Dd]esa)\.?\s+${NAME}`, 'gu'),
    'address_hint',
    out
  );

  // Person-name hints, only after explicit self-introduction cues.
  collectGroup(
    text,
    new RegExp(
      String.raw`\b(?:[Nn]ama(?:ku|\s+(?:aku|saya|gue|gw))(?:\s+adalah)?|[Pp]anggil\s+(?:aku|saya))\s+(${NAME})`,
      'gdu'
    ),
    'person_name_hint',
    out
  );
  collectGroup(text, new RegExp(String.raw`\b(?:[Aa]ku|[Ss]aya)\s+(${NAME})\s+dari\b`, 'gdu'), 'person_name_hint', out);

  return out;
}

export function detectPii(text: string): PiiFinding[] {
  const candidates = findCandidates(text).sort(
    (a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind) || a.start - b.start || b.end - a.end
  );
  const accepted: Candidate[] = [];
  for (const candidate of candidates) {
    if (candidate.end <= candidate.start) continue;
    if (accepted.some((taken) => candidate.start < taken.end && taken.start < candidate.end)) continue;
    accepted.push(candidate);
  }
  return accepted
    .sort((a, b) => a.start - b.start)
    .map(({ kind, start, end }) => ({ kind, start, end, match: text.slice(start, end), replacement: REPLACEMENTS[kind] }));
}

/**
 * Replaces findings right-to-left so earlier offsets stay valid. Pass the
 * subset the user accepted; findings that no longer match the text (stale
 * offsets) or overlap an earlier one are skipped.
 */
export function redactPii(text: string, accepted?: PiiFinding[]): { text: string; findings: PiiFinding[] } {
  const requested = (accepted ?? detectPii(text))
    .filter((finding) => finding.start >= 0 && finding.end <= text.length && text.slice(finding.start, finding.end) === finding.match)
    .sort((a, b) => a.start - b.start);

  const applied: PiiFinding[] = [];
  for (const finding of requested) {
    const previous = applied[applied.length - 1];
    if (previous && finding.start < previous.end) continue;
    applied.push({ ...finding, replacement: REPLACEMENTS[finding.kind] });
  }

  let result = text;
  for (let i = applied.length - 1; i >= 0; i -= 1) {
    const { start, end, replacement } = applied[i];
    result = result.slice(0, start) + replacement + result.slice(end);
  }
  return { text: result, findings: applied };
}

export function containsPii(text: string): boolean {
  return detectPii(text).length > 0;
}
