import type { CarePassport, EvidenceField } from '@dengarin/types';

/**
 * LOCAL EXPORT OF AN APPROVED CARE PASSPORT (AMD-11 slice of AMD-10)
 *
 * Pure text builder, no browser APIs, so it can be unit-tested. It only ever
 * serialises fields the user approved: values and the user's own questions.
 * A value quoted from a selected journal / check-in entry carries its date in
 * brackets (F-A "Bukti Bertanggal"), because "since when" is what the
 * professional will ask. Source quotes, model/provider ids, warnings and dropped-claim counters are
 * deliberately left out; a professional needs the user's statements, not the
 * machinery behind them. Nothing here sends data anywhere.
 */

export type CarePassportExportFormat = 'md' | 'txt';

export interface CarePassportExportOptions {
  format: CarePassportExportFormat;
  /** Defaults to now; injectable for deterministic tests. */
  generatedAt?: Date;
  /** Honest one-liner about how the draft was produced, e.g. "Disusun dengan bantuan AI di AMD". */
  provenanceLabel?: string;
}

export const EXPORT_SECTION_LABELS = {
  concerns: 'Hal utama yang ingin dibicarakan',
  dailyImpact: 'Pengaruhnya pada aktivitas sehari-hari',
  duration: 'Sejak kapan dirasakan',
  relevantContext: 'Konteks lain yang relevan',
  questionsForProfessional: 'Pertanyaan untuk profesional',
  unknowns: 'Belum diketahui / belum diceritakan',
} as const;

/** "(jurnal, 24 September 2026)": the dated source behind a fact, when it came from a local entry. */
function datedSourceSuffix(field: EvidenceField): string {
  const ref = field.sourceRef;
  if (!ref || (ref.kind !== 'journal' && ref.kind !== 'checkin') || !ref.date) return '';
  const [y, m, d] = ref.date.split('-').map(Number);
  if (!y || !m || !d) return '';
  const when = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
  return ` (${ref.kind === 'journal' ? 'jurnal' : 'check-in'}, ${when})`;
}

function presentValues(fields: EvidenceField[]): string[] {
  return fields
    .map((f) => (typeof f.value === 'string' && f.value.trim() ? `${f.value.trim()}${datedSourceSuffix(f)}` : ''))
    .filter((v) => v.length > 0);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(date);
}

export function carePassportExportFileName(format: CarePassportExportFormat, date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `catatan-konsultasi-${stamp}.${format}`;
}

/**
 * Returns null unless the passport has been approved by the user; the UI must
 * never offer a download before that affirmative step.
 */
export function buildCarePassportExport(
  passport: CarePassport,
  options: CarePassportExportOptions
): string | null {
  if (passport.reviewStatus !== 'user_approved') return null;
  const md = options.format === 'md';
  const date = options.generatedAt ?? new Date();

  const h1 = (text: string) => (md ? `# ${text}` : text.toUpperCase());
  const h2 = (text: string) => (md ? `## ${text}` : `${text}`);
  const bullet = (text: string) => (md ? `- ${text}` : `- ${text}`);
  const quoteBlock = (text: string) => (md ? `> ${text}` : text);

  const lines: string[] = [];
  lines.push(h1('Catatan Persiapan Konsultasi'));
  lines.push(`Disusun ${formatDate(date)}. Ditinjau dan disetujui sendiri oleh penulisnya.`);
  if (options.provenanceLabel) lines.push(options.provenanceLabel);
  lines.push('');

  const sections: Array<[string, string[]]> = [
    [EXPORT_SECTION_LABELS.concerns, presentValues(passport.concerns)],
    [EXPORT_SECTION_LABELS.dailyImpact, presentValues(passport.dailyImpact)],
    [EXPORT_SECTION_LABELS.duration, presentValues([passport.duration])],
    [EXPORT_SECTION_LABELS.relevantContext, presentValues(passport.relevantContext)],
  ];
  for (const [label, values] of sections) {
    lines.push(h2(label));
    if (values.length === 0) {
      lines.push('Belum diisi.');
    } else {
      for (const value of values) lines.push(bullet(value));
    }
    lines.push('');
  }

  lines.push(h2(EXPORT_SECTION_LABELS.questionsForProfessional));
  const questions = passport.questionsForProfessional.map((q) => q.trim()).filter(Boolean);
  if (questions.length === 0) lines.push('Belum ada pertanyaan yang dicatat.');
  else questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  lines.push('');

  const unknowns = passport.unknowns.map((u) => u.trim()).filter(Boolean);
  if (unknowns.length > 0) {
    lines.push(h2(EXPORT_SECTION_LABELS.unknowns));
    for (const u of unknowns) lines.push(bullet(u));
    lines.push('');
  }

  lines.push(h2('Catatan penting'));
  lines.push(quoteBlock(passport.disclaimer));
  lines.push('');

  return lines.join('\n');
}
