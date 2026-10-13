'use client';

import React, { useMemo, useState } from 'react';
import { CheckSquare, Square, RotateCcw, ArrowLeft } from 'lucide-react';
import type { CarePassport, CarePassportProvenance, EvidenceField } from '@dengarin/types';
import { CARE_PASSPORT_DISCLAIMER } from '@dengarin/validator';
import { Button } from '@/components/ui';
import { useLanguage } from '@/i18n';
import { exportSectionLabels } from '@/lib/carePassportExport';
import { ExportActions } from './ExportActions';
import { MUTED, ProvenanceTag, SectionCard, StepHeading, Tag, UrgentHelpLink, provenanceLabel, usePassportText } from './shared';

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
  const t = usePassportText().manual;
  const { lang } = useLanguage();
  const labels = exportSectionLabels(lang);
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
          step={reason === 'declined' ? t.stepDeclined : t.stepUnavailable}
          title={reason === 'declined' ? t.titleDeclined : t.titleUnavailable}
          lede={reason === 'declined' ? t.ledeDeclined : noProvider ? t.ledeNoProvider : t.ledeFailed}
        />
        <UrgentHelpLink className="shrink-0" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceTag provenance={provenance} />
        {reason === 'unavailable' && <Tag tone="yellow">{t.noDraft}</Tag>}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} isLoading={busy} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            {t.retry}
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
            <Field id="manual-concerns" label={labels.concerns} help={t.fieldHelp.concerns} value={concerns} onChange={setConcerns} rows={3} />
            <Field id="manual-impact" label={labels.dailyImpact} help={t.fieldHelp.dailyImpact} value={impact} onChange={setImpact} rows={3} />
            <Field id="manual-duration" label={labels.duration} help={t.fieldHelp.duration} value={duration} onChange={setDuration} rows={1} />
            <Field id="manual-context" label={labels.relevantContext} help={t.fieldHelp.relevantContext} value={context} onChange={setContext} rows={3} />
            <Field id="manual-questions" label={labels.questionsForProfessional} help={t.fieldHelp.questionsForProfessional} value={questions} onChange={setQuestions} rows={3} />
          </SectionCard>

          <button
            type="button"
            role="checkbox"
            aria-checked={reviewed}
            disabled={!hasContent}
            onClick={() => setReviewed((v) => !v)}
            className={`flex items-start gap-3.5 text-left w-full rounded-[6px] p-4 border-2 border-[#151515] transition-[transform,box-shadow,background-color] duration-200 ease-spring disabled:opacity-60 disabled:cursor-not-allowed ${
              reviewed ? 'bg-[#E6ECFF] shadow-[2px_2px_0px_#151515]' : 'bg-white hover:bg-[#FAFAFA]'
            } focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE]`}
          >
            {reviewed ? (
              <CheckSquare className="w-5 h-5 text-[#3357EE] shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Square className="w-5 h-5 text-[#6B665E] shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className="text-base text-[#151515] leading-snug font-medium">{t.reviewed}</span>
          </button>

          <ExportActions passport={passport} provenanceLabel={provenanceLabel(provenance, lang)} />
        </div>

        <aside className="lg:col-span-4 space-y-4 animate-reveal-up [animation-delay:200ms]">
          <SectionCard as="div" tone="paper" elevation="low" className="space-y-2">
            <h2 className="text-base font-bold text-[#151515]">{t.importantTitle}</h2>
            <p className={`text-base leading-relaxed ${MUTED}`} lang="id">{CARE_PASSPORT_DISCLAIMER}</p>
          </SectionCard>
          <Button variant="outline" size="md" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />} fullWidth>
            {t.back}
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
