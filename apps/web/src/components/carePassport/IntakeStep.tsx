'use client';

import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { CARE_PASSPORT_MAX_TEXT, CARE_PASSPORT_MIN_TEXT } from '@/lib/carePassportLimits';
import type { LocalEvidenceEntry, SegmentBudget } from '@/lib/carePassportClient';
import { EvidencePicker } from './EvidencePicker';
import { MUTED, SectionCard, StepHeading, UrgentHelpLink, usePassportText } from './shared';

export interface IntakeStepProps {
  text: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  busy: boolean;
  error: string | null;
  /** F-A "Bukti Bertanggal": dated local entries the user may tick. */
  evidence: {
    entries: LocalEvidenceEntry[];
    selectedIds: ReadonlySet<string>;
    loaded: boolean;
    onToggle: (entry: LocalEvidenceEntry) => void;
    canSelect: (entry: LocalEvidenceEntry) => boolean;
    budget: SegmentBudget;
  };
}

export function IntakeStep({ text, onChange, onSubmit, onBack, busy, error, evidence }: IntakeStepProps) {
  const t = usePassportText().intake;
  const remaining = CARE_PASSPORT_MAX_TEXT - text.length;
  const tooLong = remaining < 0;
  const selectedCount = evidence.entries.filter((e) => evidence.selectedIds.has(e.id)).length;
  const hasStory = text.trim().length >= CARE_PASSPORT_MIN_TEXT;
  // The story may be short or empty when dated entries carry the content.
  const canSubmit = (hasStory || selectedCount > 0) && !tooLong && !evidence.budget.overflow && !busy;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <StepHeading step={t.step} title={t.title} lede={t.lede} />
        <UrgentHelpLink className="shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <form
          className="lg:col-span-8 space-y-6 animate-reveal-up [animation-delay:120ms]"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onSubmit();
          }}
        >
          <div className="space-y-4">
            <label htmlFor="cerita" className="block text-base font-bold text-[#151515]">
              {t.label}
            </label>
            <textarea
              id="cerita"
              value={text}
              onChange={(event) => onChange(event.target.value)}
              disabled={busy}
              rows={10}
              placeholder={t.placeholder}
              aria-describedby="cerita-bantuan"
              aria-invalid={tooLong || undefined}
              className={`w-full min-h-[240px] px-4 py-3.5 bg-white border-2 rounded-[6px] text-base leading-[1.6] font-medium text-[#151515] placeholder:text-[#6B665E] resize-y focus:outline-none focus:shadow-[3px_3px_0px_#3357EE] disabled:bg-[#D8D3C9]/40 disabled:cursor-wait ${
                tooLong ? 'border-[#FF5252] shadow-[2px_2px_0px_#FF5252]' : 'border-[#151515] shadow-[2px_2px_0px_#151515]'
              }`}
            />
            <div id="cerita-bantuan" className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className={tooLong ? 'text-[#B3261E] font-bold' : MUTED}>
                {tooLong ? t.over(Math.abs(remaining)) : t.remaining(remaining)}
              </span>
              <span className={MUTED}>{selectedCount > 0 ? t.shortOk : t.min(CARE_PASSPORT_MIN_TEXT)}</span>
            </div>
          </div>

          <EvidencePicker
            entries={evidence.entries}
            selectedIds={evidence.selectedIds}
            loaded={evidence.loaded}
            onToggle={evidence.onToggle}
            canSelect={evidence.canSelect}
            budget={evidence.budget}
            disabled={busy}
          />

          {evidence.budget.overflow && (
            <p role="alert" className="text-sm font-bold text-[#B3261E] border-2 border-[#FF5252] bg-[#FFEBEB] rounded-[4px] px-3 py-2">
              {t.overflow(evidence.budget.max)}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm font-bold text-[#B3261E] border-2 border-[#FF5252] bg-[#FFEBEB] rounded-[4px] px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!canSubmit}
              isLoading={busy}
              iconPosition="end"
              icon={<ArrowRight className="w-4 h-4" />}
              className="sm:flex-1"
            >
              {t.submit}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={busy} icon={<ArrowLeft className="w-4 h-4" />}>
              {t.back}
            </Button>
          </div>
          <p className={`text-sm leading-relaxed ${MUTED}`}>{t.note}</p>
        </form>

        <aside className="lg:col-span-4 animate-reveal-up [animation-delay:200ms]">
          <SectionCard tone="paper" elevation="low" as="div" className="space-y-3">
            <h2 className="text-base font-bold text-[#151515]">{t.helpTitle}</h2>
            <ul className="space-y-2">
              {t.prompts.map((prompt) => (
                <li key={prompt} className={`flex gap-2 text-base leading-relaxed ${MUTED}`}>
                  <span className="w-1.5 h-1.5 mt-2.5 bg-[#3357EE] shrink-0" aria-hidden="true" />
                  <span>{prompt}</span>
                </li>
              ))}
            </ul>
            <p className={`text-sm leading-relaxed border-t border-[#D8D3C9] pt-3 ${MUTED}`}>{t.helpNote}</p>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
