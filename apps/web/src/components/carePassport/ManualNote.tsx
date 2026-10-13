'use client';

import React, { useMemo, useState } from 'react';
import { CheckSquare, Square, RotateCcw, ArrowLeft } from 'lucide-react';
import type { CarePassport, CarePassportProvenance, EvidenceField } from '@dengarin/types';
import { CARE_PASSPORT_DISCLAIMER } from '@dengarin/validator';
import { Button } from '@/components/ui';
import { EXPORT_SECTION_LABELS } from '@/lib/carePassportExport';
import { ExportActions } from './ExportActions';
import { MUTED, ProvenanceTag, SectionCard, StepHeading, Tag, UrgentHelpLink, provenanceLabel } from './shared';

export type ManualNoteReason = 'declined' | 'unavailable';

export interface ManualNoteProps {
  reason: ManualNoteReason;
  provenance: CarePassportProvenance;
  warnings: string[];
  /** Present when retrying the AI path makes sense (consent given, provider failed). */
  onRetry?: () => void;
  onBack: () => void;
  busy?: boolean;
  /** Shown when a retry failed; the manual path stays usable regardless. */
  error?: string | null;
}

const FIELD_HELP: Record<keyof typeof EXPORT_SECTION_LABELS, string> = {
  concerns: 'Satu hal per baris. Misalnya: susah tidur, cemas kalau mikirin kerjaan.',
  dailyImpact: 'Apa yang berubah di keseharian: tidur, makan, fokus, hubungan.',
  duration: 'Perkiraan saja cukup, misalnya "sekitar dua bulan".',
  relevantContext: 'Hal lain yang menurutmu penting diketahui profesional.',
  questionsForProfessional: 'Satu pertanyaan per baris.',
  unknowns: '',
};

function linesToFields(text: string): EvidenceField[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((value) => ({ value, source: 'user_confirmed' as const, needsReview: false }));
}

const INPUT_CLASS =
  'w-full px-4 py-3 bg-white border-2 border-[#151515] rounded-[6px] text-base leading-[1.6] font-medium text-[#151515] placeholder:text-[#6B665E] shadow-[2px_2px_0px_#151515] resize-y focus:outline-none focus:shadow-[3px_3px_0px_#3357EE]';

/**
 * Rules-only path for PROVIDER_UNAVAILABLE and declined AI consent. The user
 * writes every field; nothing here pretends an AI summary exists.
 */
export function ManualNote({ reason, provenance, warnings, onRetry, onBack, busy = false, error = null }: ManualNoteProps) {
  const [concerns, setConcerns] = useState('');
  const [impact, setImpact] = useState('');
  const [duration, setDuration] = useState('');
  const [context, setContext] = useState('');
  const [questions, setQuestions] = useState('');
  const [reviewed, setReviewed] = useState(false);

  const passport = useMemo<CarePassport>(
    () => ({
      version: 1,
      subject: 'anonymous_adult',
      concerns: linesToFields(concerns),
      dailyImpact: linesToFields(impact),
      duration: duration.trim()
        ? { value: duration.trim(), source: 'user_confirmed', needsReview: false }
        : { value: null, source: 'unknown', needsReview: false },
      relevantContext: linesToFields(context),
      questionsForProfessional: questions.split('\n').map((q) => q.trim()).filter(Boolean),
      unknowns: [],
      disclaimer: CARE_PASSPORT_DISCLAIMER,
      reviewStatus: reviewed ? 'user_approved' : 'user_pending',
    }),
    [concerns, impact, duration, context, questions, reviewed]
  );

  const hasContent = passport.concerns.length > 0 || passport.questionsForProfessional.length > 0;
  const noProvider = warnings.includes('no_provider_configured');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <StepHeading
          step={reason === 'declined' ? 'Tanpa AI' : 'AI tidak tersedia'}
          title={reason === 'declined' ? 'Kamu menulis, kami menyiapkan kerangkanya.' : 'AI sedang tidak bisa dipakai. Kerangkanya tetap ada.'}
          lede={
            reason === 'declined'
              ? 'Tidak ada yang dikirim ke AI. Isi bagian yang terasa relevan saja, sisanya boleh kosong.'
              : noProvider
                ? 'Layanan AI belum dikonfigurasi di server ini. Tidak ada draf yang dibuat, jadi tidak ada yang perlu dicurigai. Kamu bisa mengisi kerangka ini sendiri.'
                : 'Permintaan ke AI gagal, dan kami tidak mau mengarang ringkasan. Kamu bisa coba lagi, atau isi kerangka ini sendiri sekarang.'
          }
        />
        <UrgentHelpLink className="shrink-0" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceTag provenance={provenance} />
        {reason === 'unavailable' && <Tag tone="yellow">Tidak ada draf AI</Tag>}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} isLoading={busy} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Coba AI lagi
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-[#B3261E] border-2 border-[#FF5252] bg-[#FFEBEB] rounded-[4px] px-3 py-2 max-w-[44rem]">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-5 animate-reveal-up [animation-delay:120ms]">
          <SectionCard as="div" className="space-y-5">
            <Field id="manual-concerns" label={EXPORT_SECTION_LABELS.concerns} help={FIELD_HELP.concerns} value={concerns} onChange={setConcerns} rows={3} />
            <Field id="manual-impact" label={EXPORT_SECTION_LABELS.dailyImpact} help={FIELD_HELP.dailyImpact} value={impact} onChange={setImpact} rows={3} />
            <Field id="manual-duration" label={EXPORT_SECTION_LABELS.duration} help={FIELD_HELP.duration} value={duration} onChange={setDuration} rows={1} />
            <Field id="manual-context" label={EXPORT_SECTION_LABELS.relevantContext} help={FIELD_HELP.relevantContext} value={context} onChange={setContext} rows={3} />
            <Field id="manual-questions" label={EXPORT_SECTION_LABELS.questionsForProfessional} help={FIELD_HELP.questionsForProfessional} value={questions} onChange={setQuestions} rows={3} />
          </SectionCard>

          <button
            type="button"
            role="checkbox"
            aria-checked={reviewed}
            disabled={!hasContent}
            onClick={() => setReviewed((v) => !v)}
            className={`flex items-start gap-3.5 text-left w-full rounded-[6px] p-4 border-2 border-[#151515] transition-[transform,box-shadow,background-color] duration-200 ease-spring disabled:opacity-60 disabled:cursor-not-allowed ${
              reviewed ? 'bg-[#E6ECFF] shadow-[2px_2px_0px_#151515]' : 'bg-white hover:bg-[#FFF8EF]'
            } focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE]`}
          >
            {reviewed ? (
              <CheckSquare className="w-5 h-5 text-[#3357EE] shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Square className="w-5 h-5 text-[#6B665E] shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className="text-base text-[#151515] leading-snug font-medium">
              Saya sudah membaca ulang catatan ini dan isinya benar menurut saya.
            </span>
          </button>

          <ExportActions passport={passport} provenanceLabel={provenanceLabel(provenance)} />
        </div>

        <aside className="lg:col-span-4 space-y-4 animate-reveal-up [animation-delay:200ms]">
          <SectionCard as="div" tone="paper" elevation="low" className="space-y-2">
            <h2 className="text-base font-bold text-[#151515]">Catatan penting</h2>
            <p className={`text-base leading-relaxed ${MUTED}`}>{CARE_PASSPORT_DISCLAIMER}</p>
          </SectionCard>
          <Button variant="outline" size="md" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />} fullWidth>
            Kembali ke awal
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  help,
  value,
  onChange,
  rows,
}: {
  id: string;
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-bold text-[#151515]">
        {label}
      </label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} aria-describedby={`${id}-help`} className={INPUT_CLASS} />
      <p id={`${id}-help`} className={`text-sm ${MUTED}`}>
        {help}
      </p>
    </div>
  );
}
