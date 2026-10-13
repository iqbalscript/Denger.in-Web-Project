import type { CarePassport, EvidenceField } from '@dengarin/types';
import { containsUnsafeMedicalAdvice } from './actionValidator.ts';
import { normalizeForGrounding, parseModelJson } from './carePassport.ts';

/**
 * OPENING LINES VALIDATOR (F-B "Kalimat Pembuka per Tujuan")
 *
 * Input: a Care Passport the user has reviewed and approved. The model may
 * only turn approved values into 2-3 first-person sentences. Every sentence
 * must be traceable to at least one approved field (phrase overlap) and may
 * not add anything: no new content words, no numbers or number words, no
 * duration/frequency/severity markers that the user did not write, no
 * diagnostic label, no medical instruction, no identifier.
 *
 * When the model's output does not survive, callers fall back to
 * `buildOpeningLinesTemplate`, a deterministic template built from the same
 * approved values and labelled "tanpa AI".
 */

export const OPENING_LINE_MAX_CHARS = 200;
export const OPENING_LINES_MIN = 2;
export const OPENING_LINES_MAX = 3;
export const OPENING_LINES_MAX_TOTAL_WORDS = 60;
const MIN_WORDS_PER_LINE = 3;
const TEMPLATE_VALUE_MAX_CHARS = 150;
/** `basedOn` marker for a sentence that only states the configured intent toward the destination. */
export const DESTINATION_BASIS = 'destination';

/** One approved passport value with a stable id the UI can show as "based on". */
export interface ApprovedFact {
  id: string;
  label: string;
  value: string;
}

export interface OpeningLine {
  text: string;
  /** Ids of the approved facts this sentence is grounded in (recomputed server-side, never trusted from the model). */
  basedOn: string[];
}

export interface OpeningLinesAccepted {
  ok: true;
  lines: OpeningLine[];
  /** Model sentences removed because they were ungrounded, unsafe or over budget. */
  droppedLines: number;
  warnings: string[];
}

export interface OpeningLinesRejected {
  ok: false;
  errors: string[];
  droppedLines: number;
}

export type OpeningLinesValidation = OpeningLinesAccepted | OpeningLinesRejected;

export interface OpeningLinesDestinationWords {
  /** Who the user is speaking to; its words are allowed in a sentence. */
  speakingTo: string;
  /** Optional opener such as "Dok,". */
  vocative: string;
  /** The single intent the model may add; its words are allowed in a sentence. */
  ask: string;
}

export const APPROVED_FACT_LABELS = {
  concerns: 'Hal utama yang ingin dibicarakan',
  dailyImpact: 'Pengaruhnya pada aktivitas sehari-hari',
  duration: 'Sejak kapan dirasakan',
  relevantContext: 'Konteks lain',
  question: 'Pertanyaan untuk profesional',
} as const;

// Same clinical labels the Care Passport validator refuses. Re-declared here so
// that file keeps its own behaviour untouched; keep the two lists in sync.
const DIAGNOSTIC_LABEL =
  /\b(?:depresi|depression|bipolar|skizofrenia|schizophrenia|psikosis|psychosis|ptsd|ocd|adhd|gad|anxiety\s+disorder|gangguan\s+(?:kecemasan|cemas|panik|jiwa|mental|kepribadian|makan|bipolar|stres\s+pasca\s*trauma)|panic\s+disorder|borderline|bpd|insomnia\s+kronis)(?:ku|mu|nya)?\b/iu;

const PERCENTAGE = /\d{1,3}(?:[.,]\d+)?\s*(?:%|persen\b|percent\b)/iu;
const IDENTIFIER = /\[[A-Z_]+\]|@|https?:\/\/|www\./iu;

/** Words that carry no fact of their own: function words, pronouns, politeness, connectives. */
const STOPWORDS = new Set([
  'saya', 'aku', 'kami', 'kita', 'dan', 'atau', 'yang', 'ini', 'itu', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada',
  'juga', 'jadi', 'karena', 'kalau', 'jika', 'tapi', 'tetapi', 'namun', 'agar', 'supaya', 'sudah', 'belum', 'akan',
  'sedang', 'lagi', 'masih', 'bisa', 'dapat', 'boleh', 'mau', 'ingin', 'perlu', 'butuh', 'harus', 'ada', 'tidak',
  'nggak', 'gak', 'bukan', 'ya', 'nya', 'ku', 'mu', 'dok', 'dokter', 'bu', 'pak', 'mbak', 'mas', 'kak', 'halo',
  'hai', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'permisi', 'maaf', 'mohon', 'tolong', 'terima', 'kasih',
  'apakah', 'bagaimana', 'gimana', 'apa', 'kenapa', 'mengapa', 'siapa', 'mana', 'seperti', 'begitu', 'sih',
  'deh', 'dong', 'kok', 'sebenarnya', 'rasanya', 'merasa', 'terasa', 'rasakan', 'merasakan', 'dirasakan',
  'sendiri', 'soal', 'tentang', 'hal',
  'sesuatu', 'sini', 'situ', 'sana', 'lebih', 'saat', 'ketika', 'waktu', 'sekarang', 'nanti', 'bikin', 'membuat',
  'buat', 'menjadi', 'sampai', 'hingga', 'sehingga', 'makanya', 'soalnya', 'terutama', 'misalnya', 'cukup',
  'agak', 'sedikit', 'coba', 'mencoba', 'tentu', 'memang', 'justru', 'pun', 'saja', 'aja', 'hanya', 'cuma',
  'bahwa', 'kalo', 'kalau', 'lalu', 'kemudian', 'serta', 'oleh', 'bagi', 'dalam', 'luar', 'antara', 'tanpa',
  'sama', 'biar', 'semoga', 'mungkin', 'sebaiknya', 'kira', 'persis', 'secara', 'begini', 'gitu', 'gini',
  'kayak', 'kaya', 'ya', 'nih', 'tuh', 'loh', 'kan', 'dia', 'mereka', 'orang', 'diri', 'punya', 'adalah',
  'ialah', 'yakni', 'yaitu', 'ini', 'tersebut', 'tersebutlah', 'dulu', 'baru', 'lama', 'pertama', 'kali',
]);

/** The only extra vocabulary a sentence may add: how one asks a helper for help. */
const INTENT_VOCAB = new Set([
  'dirujuk', 'rujukan', 'merujuk', 'rujuk', 'psikolog', 'psikiater', 'poli', 'jiwa', 'konseling', 'konselor',
  'konsultasi', 'bercerita', 'cerita', 'menceritakan', 'ceritakan', 'bantuan', 'dibantu', 'membantu', 'bantu',
  'bicara', 'berbicara', 'membicarakan', 'dibicarakan', 'bicarakan', 'ngobrol', 'layanan', 'langkah',
  'selanjutnya', 'berikutnya', 'lanjut', 'lanjutan', 'mulai', 'memulai', 'dimulai', 'tahu', 'mengetahui',
  'tanya', 'bertanya', 'menanyakan', 'tanyakan', 'minta', 'meminta', 'saran', 'arahan', 'dukungan',
  'pendampingan', 'kampus', 'kantor', 'puskesmas', 'klinik', 'faskes', 'fktp', 'bertemu', 'ketemu', 'janji',
  'catatan', 'membawa', 'bawa', 'sesi', 'kerahasiaan', 'rahasia', 'dicatat', 'bersama', 'tempat', 'tepat',
  'cocok', 'pilihan', 'jalur', 'proses', 'cara', 'menjelaskan', 'jelaskan', 'menyampaikan', 'sampaikan',
  'mengatakan', 'bilang', 'situasi', 'keadaan', 'kondisi', 'menghubungi', 'hubungi', 'chat', 'telepon',
  'whatsapp', 'menulis', 'tulis', 'bahas', 'membahas', 'pertanyaan', 'datang', 'mampir', 'dengar',
  'mendengar', 'didengar', 'dengarkan', 'bertanya', 'siap', 'bersedia', 'sebaiknya', 'ditangani', 'penanganan',
  'profesional', 'ahli', 'spesialis', 'ditemani', 'teman', 'menemani', 'keseharian',
  'pengaruhnya', 'pengaruh', 'utama', 'menyebutnya', 'mulainya', 'ceritanya',
]);

/** Quantities the model could invent. Allowed only when the user wrote them. */
const NUMBER_WORDS = new Set([
  'nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas',
  'belas', 'puluh', 'ratus', 'ribu', 'setengah', 'beberapa', 'banyak', 'sebagian', 'semua', 'seluruh',
]);

/** Time, frequency and severity claims. Allowed only when the user wrote them. */
const CLAIM_MARKERS = new Set([
  'hari', 'minggu', 'bulan', 'tahun', 'sehari', 'seminggu', 'sebulan', 'setahun', 'berhari', 'berminggu',
  'berbulan', 'bertahun', 'sejak', 'selama', 'belakangan', 'akhir', 'kemarin', 'terakhir', 'tempo', 'sering',
  'selalu', 'setiap', 'tiap', 'jarang', 'kadang', 'terus', 'menerus', 'rutin', 'berulang', 'lama', 'semalam',
  'parah', 'berat', 'ringan', 'sangat', 'banget', 'sekali', 'ekstrem', 'semakin', 'makin', 'memburuk',
  'buruk', 'hebat', 'kronis', 'akut', 'gawat', 'darurat', 'pernah', 'kembali',
]);

export function toWords(text: string): string[] {
  return normalizeForGrounding(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function countWords(text: string): number {
  return toWords(text).length;
}

function isContentWord(word: string): boolean {
  return word.length >= 3 && !STOPWORDS.has(word);
}

/** Loose morphology: "berfokus" covers "fokus", "tugas-tugas" splits to "tugas". */
function covers(factWord: string, word: string): boolean {
  if (factWord === word) return true;
  const shorter = Math.min(factWord.length, word.length);
  return shorter >= 4 && (factWord.includes(word) || word.includes(factWord));
}

function hasValue(field: EvidenceField): field is EvidenceField & { value: string } {
  return typeof field.value === 'string' && field.value.trim() !== '' && field.source !== 'unknown' && !field.needsReview;
}

/**
 * Values the user approved. Only an approved passport yields anything; fields
 * still flagged for review or marked unknown are never used.
 */
export function approvedFacts(passport: CarePassport): ApprovedFact[] {
  if (passport.reviewStatus !== 'user_approved') return [];
  const facts: ApprovedFact[] = [];
  const push = (id: string, label: string, value: string) => facts.push({ id, label, value: value.trim() });

  passport.concerns.forEach((f, i) => hasValue(f) && push(`concerns:${i}`, APPROVED_FACT_LABELS.concerns, f.value));
  passport.dailyImpact.forEach((f, i) => hasValue(f) && push(`dailyImpact:${i}`, APPROVED_FACT_LABELS.dailyImpact, f.value));
  if (hasValue(passport.duration)) push('duration', APPROVED_FACT_LABELS.duration, passport.duration.value);
  passport.relevantContext.forEach((f, i) => hasValue(f) && push(`relevantContext:${i}`, APPROVED_FACT_LABELS.relevantContext, f.value));
  passport.questionsForProfessional.forEach((q, i) => {
    if (typeof q === 'string' && q.trim() !== '') push(`question:${i}`, APPROVED_FACT_LABELS.question, q);
  });
  return facts;
}

/** The approved text as one block, for re-running the deterministic crisis gate. */
export function approvedFactsText(passport: CarePassport): string {
  return approvedFacts(passport).map((f) => f.value).join('\n');
}

/** A value is safe to speak aloud: no diagnosis, no medical instruction, no redaction placeholder. */
export function isSpeakableValue(value: string): boolean {
  return !DIAGNOSTIC_LABEL.test(value) && !containsUnsafeMedicalAdvice(value) && !IDENTIFIER.test(value);
}

interface FactWords {
  fact: ApprovedFact;
  words: string[];
  content: string[];
}

function indexFacts(facts: ApprovedFact[]): FactWords[] {
  return facts.map((fact) => {
    const words = toWords(fact.value);
    return { fact, words, content: words.filter(isContentWord) };
  });
}

function containsRun(haystack: string[], run: string[]): boolean {
  outer: for (let i = 0; i + run.length <= haystack.length; i += 1) {
    for (let j = 0; j < run.length; j += 1) {
      if (!covers(run[j], haystack[i + j])) continue outer;
    }
    return true;
  }
  return false;
}

/**
 * A sentence is grounded in a fact when it repeats a run of three consecutive
 * words of that fact (or the whole fact when shorter), or when it reuses at
 * least two of the fact's content words.
 */
function groundedIn(sentenceWords: string[], fact: FactWords): boolean {
  if (fact.words.length === 0) return false;
  const runLength = Math.min(3, fact.words.length);
  for (let start = 0; start + runLength <= fact.words.length; start += 1) {
    if (containsRun(sentenceWords, fact.words.slice(start, start + runLength))) return true;
  }
  if (fact.content.length >= 2) {
    const reused = fact.content.filter((cw) => sentenceWords.some((w) => covers(cw, w)));
    if (new Set(reused).size >= 2) return true;
  }
  return false;
}

export interface LineCheck {
  ok: boolean;
  reason?: string;
  basedOn: string[];
}

/**
 * Checks one candidate sentence against the approved facts and the
 * destination's allowed intent words. Pure and deterministic.
 */
export function checkOpeningLine(text: string, facts: ApprovedFact[], destination: OpeningLinesDestinationWords): LineCheck {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > OPENING_LINE_MAX_CHARS) return { ok: false, reason: 'panjang tidak valid', basedOn: [] };
  if (IDENTIFIER.test(trimmed)) return { ok: false, reason: 'memuat penanda identitas atau tautan', basedOn: [] };
  if (DIAGNOSTIC_LABEL.test(trimmed)) return { ok: false, reason: 'memuat label diagnosis', basedOn: [] };
  if (containsUnsafeMedicalAdvice(trimmed)) return { ok: false, reason: 'memuat instruksi medis', basedOn: [] };

  const indexed = indexFacts(facts);
  const factWords = new Set(indexed.flatMap((f) => f.words));
  const factText = normalizeForGrounding(facts.map((f) => f.value).join(' '));
  const allowed = new Set([...toWords(destination.speakingTo), ...toWords(destination.vocative), ...toWords(destination.ask)]);

  const percentage = trimmed.match(PERCENTAGE);
  if (percentage && !factText.includes(normalizeForGrounding(percentage[0]))) {
    return { ok: false, reason: 'memuat persentase yang tidak ditulis pengguna', basedOn: [] };
  }

  const words = toWords(trimmed);
  if (words.length < MIN_WORDS_PER_LINE) return { ok: false, reason: 'terlalu pendek', basedOn: [] };

  const inFacts = (w: string) => [...factWords].some((fw) => covers(fw, w));
  for (const w of words) {
    const numeric = /\p{N}/u.test(w) || NUMBER_WORDS.has(w);
    if (numeric && !factWords.has(w)) return { ok: false, reason: `memuat angka atau bilangan "${w}" yang tidak ditulis pengguna`, basedOn: [] };
    if (CLAIM_MARKERS.has(w) && !factWords.has(w) && !allowed.has(w)) {
      return { ok: false, reason: `memuat klaim waktu/keparahan "${w}" yang tidak ditulis pengguna`, basedOn: [] };
    }
  }

  const novel = words.filter((w) => isContentWord(w) && !allowed.has(w) && !INTENT_VOCAB.has(w) && !inFacts(w));
  if (novel.length > 0) {
    return { ok: false, reason: `menambah kata yang tidak ada di catatan: ${[...new Set(novel)].join(', ')}`, basedOn: [] };
  }

  const basedOn = indexed.filter((f) => groundedIn(words, f)).map((f) => f.fact.id);
  if (basedOn.length > 0) return { ok: true, basedOn };

  // A closing sentence made only of the destination's configured intent words
  // ("saya ingin tahu apakah bisa dirujuk ke psikolog") states no fact about
  // the user, so it is accepted and attributed to the destination, not a field.
  const content = words.filter(isContentWord);
  if (content.length > 0 && content.every((w) => allowed.has(w))) return { ok: true, basedOn: [DESTINATION_BASIS] };
  return { ok: false, reason: 'tidak memuat frasa dari catatan yang disetujui', basedOn: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates the model's `{ "lines": [] }` output. Accepts bare JSON or fenced
 * JSON. Survivors keep their order; the result is rejected when fewer than
 * OPENING_LINES_MIN sentences survive so the caller can fall back to the template.
 */
export function validateOpeningLines(
  rawOutput: unknown,
  passport: CarePassport,
  destination: OpeningLinesDestinationWords
): OpeningLinesValidation {
  let draft: unknown = rawOutput;
  if (typeof rawOutput === 'string') {
    try {
      draft = parseModelJson(rawOutput);
    } catch (error) {
      return { ok: false, errors: [`JSON tidak valid: ${(error as Error).message}`], droppedLines: 0 };
    }
  }
  if (!isRecord(draft) || !Array.isArray(draft.lines)) {
    return { ok: false, errors: ['Keluaran harus berupa objek JSON dengan daftar "lines"'], droppedLines: 0 };
  }

  const facts = approvedFacts(passport);
  if (facts.length === 0) return { ok: false, errors: ['Tidak ada fakta yang disetujui pengguna'], droppedLines: draft.lines.length };

  const warnings: string[] = [];
  const lines: OpeningLine[] = [];
  const seen = new Set<string>();
  let dropped = 0;
  let totalWords = 0;

  draft.lines.forEach((item, index) => {
    if (typeof item !== 'string') {
      dropped += 1;
      return;
    }
    if (lines.length >= OPENING_LINES_MAX) {
      dropped += 1;
      warnings.push(`lines[${index}]: melebihi ${OPENING_LINES_MAX} kalimat, dibuang`);
      return;
    }
    const check = checkOpeningLine(item, facts, destination);
    if (!check.ok) {
      dropped += 1;
      warnings.push(`lines[${index}]: ${check.reason}`);
      return;
    }
    const text = item.trim().replace(/\s+/g, ' ');
    const key = normalizeForGrounding(text);
    if (seen.has(key)) {
      dropped += 1;
      return;
    }
    const wordCount = countWords(text);
    if (totalWords + wordCount > OPENING_LINES_MAX_TOTAL_WORDS) {
      dropped += 1;
      warnings.push(`lines[${index}]: melebihi ${OPENING_LINES_MAX_TOTAL_WORDS} kata total, dibuang`);
      return;
    }
    totalWords += wordCount;
    seen.add(key);
    lines.push({ text, basedOn: check.basedOn });
  });

  if (lines.length < OPENING_LINES_MIN) {
    return { ok: false, errors: [`Hanya ${lines.length} kalimat yang lolos (minimal ${OPENING_LINES_MIN})`, ...warnings], droppedLines: dropped };
  }
  if (!lines.some((l) => l.basedOn.some((id) => id !== DESTINATION_BASIS))) {
    return { ok: false, errors: ['Tidak ada kalimat yang memakai catatan pengguna', ...warnings], droppedLines: dropped };
  }
  return { ok: true, lines, droppedLines: dropped, warnings };
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLocaleLowerCase('id-ID') + value.slice(1);
}

function clip(value: string): string {
  const clean = value.replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
  if (clean.length <= TEMPLATE_VALUE_MAX_CHARS) return clean;
  const cut = clean.slice(0, TEMPLATE_VALUE_MAX_CHARS);
  const boundary = cut.lastIndexOf(' ');
  return `${boundary > 40 ? cut.slice(0, boundary) : cut}...`;
}

/**
 * Deterministic fallback ("tanpa AI"): the same approved values, in a fixed
 * frame. Used when the user declined AI, the provider failed, or the model's
 * sentences did not pass validation. Never returns fewer than two lines.
 */
export function buildOpeningLinesTemplate(passport: CarePassport, destination: OpeningLinesDestinationWords): OpeningLine[] {
  const facts = approvedFacts(passport).filter((f) => isSpeakableValue(f.value));
  const pick = (prefix: string) => facts.filter((f) => f.id.startsWith(prefix));
  const concerns = pick('concerns:').slice(0, 2);
  const impact = pick('dailyImpact:')[0];
  const duration = pick('duration')[0];
  const opener = destination.vocative ? `${destination.vocative.trim()} ` : '';

  const lines: OpeningLine[] = [];

  if (concerns.length > 0) {
    const joined = concerns.map((c) => lowerFirst(clip(c.value))).join(', dan juga ');
    lines.push({ text: `${opener}Hal utama yang ingin saya bicarakan: ${joined}.`, basedOn: concerns.map((c) => c.id) });
  } else {
    lines.push({ text: `${opener}Saya belum tahu harus mulai dari mana, tapi ada hal yang ingin saya bicarakan.`, basedOn: [] });
  }

  if (impact || duration) {
    const parts: string[] = [];
    const basedOn: string[] = [];
    if (impact) {
      parts.push(`Pengaruhnya ke keseharian saya: ${lowerFirst(clip(impact.value))}.`);
      basedOn.push(impact.id);
    }
    if (duration) {
      parts.push(`Ini saya rasakan ${lowerFirst(clip(duration.value))}.`);
      basedOn.push(duration.id);
    }
    lines.push({ text: parts.join(' '), basedOn });
  } else {
    lines.push({ text: 'Saya belum tahu persis sejak kapan dan seberapa sering, tapi saya ingin membicarakannya.', basedOn: [] });
  }

  lines.push({ text: `Saya ${destination.ask.trim().replace(/[.!?]+$/, '')}.`, basedOn: [DESTINATION_BASIS] });
  return lines;
}
