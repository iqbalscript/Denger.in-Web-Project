'use client';

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, MessageCircleQuestion, SkipForward } from 'lucide-react';
import type { CarePassportProvenance } from '@dengarin/types';
import { Button } from '@/components/ui';
import { MUTED, ProvenanceTag, SectionCard, StepHeading, Tag, UrgentHelpLink } from './shared';

export interface ClarificationStepProps {
  question: string;
  provenance: CarePassportProvenance;
  /** Characters still available across all segments (story + entries + answers). */
  remainingChars: number;
  /** 1-based round that this answer will complete. */
  round: number;
  maxRounds: number;
  onAnswer: (answer: string) => void;
  /** Show the review with what is known so far; nothing is invented. */
  onSkip: () => void;
  onBack: () => void;
  busy: boolean;
  error: string | null;
}

/**
 * NEEDS_CLARIFICATION: exactly one question per round, at most `maxRounds`.
 * The answer becomes its own dated-less `clarification` segment alongside the
 * story and selected entries, and goes through preview and redaction again.
 */
export function ClarificationStep({ question, provenance, remainingChars, round, maxRounds, onAnswer, onSkip, onBack, busy, error }: ClarificationStepProps) {
  const [answer, setAnswer] = useState('');
  const room = Math.max(0, remainingChars);
  const tooLong = answer.length > room;
  const canSubmit = answer.trim().length >= 5 && !tooLong && !busy;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <StepHeading
          step={`Putaran ${round} dari ${maxRounds}`}
          title="Ceritamu sudah dibaca, tapi ada yang belum jelas."
          lede="Supaya catatannya tidak menebak-nebak, jawab satu pertanyaan ini. Jawabanmu jadi bagian tersendiri, diperiksa lagi datanya, lalu catatan disusun ulang. Boleh juga dilewati; yang belum diketahui akan ditulis apa adanya."
        />
        <UrgentHelpLink className="shrink-0" />
      </div>

      <form
        className="max-w-[44rem] space-y-5 animate-reveal-up [animation-delay:120ms]"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onAnswer(answer.trim());
        }}
      >
        <SectionCard as="div" tone="cobalt" elevation="high" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.05em] text-[#151515]">
              <MessageCircleQuestion className="w-4 h-4 text-[#4169FF]" aria-hidden="true" />
              Pertanyaan
            </span>
            <span className="flex items-center gap-2">
              <Tag tone="white">Putaran {round}/{maxRounds}</Tag>
              <ProvenanceTag provenance={provenance} />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-[#151515] leading-[1.3]">{question}</p>
        </SectionCard>

        <div className="space-y-1.5">
          <label htmlFor="jawaban" className="block text-[13px] font-bold uppercase tracking-[0.05em] text-[#151515]">
            Jawabanmu
          </label>
          <textarea
            id="jawaban"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={busy}
            rows={5}
            aria-invalid={tooLong || undefined}
            aria-describedby="jawaban-sisa"
            className={`w-full min-h-[140px] px-4 py-3.5 bg-white border-2 rounded-[6px] text-base leading-[1.6] font-medium text-[#151515] resize-y focus:outline-none focus:shadow-[3px_3px_0px_#4169FF] disabled:bg-[#D8D3C9]/40 disabled:cursor-wait ${
              tooLong ? 'border-[#FF5252] shadow-[2px_2px_0px_#FF5252]' : 'border-[#151515] shadow-[2px_2px_0px_#151515]'
            }`}
          />
          <p id="jawaban-sisa" className={`text-sm ${tooLong ? 'text-[#D93838] font-bold' : MUTED}`}>
            {tooLong ? `Kelebihan ${answer.length - room} karakter.` : `${room - answer.length} karakter tersisa.`}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-bold text-[#D93838] border-2 border-[#FF5252] bg-[#FFEBEB] rounded-[4px] px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} isLoading={busy} iconPosition="end" icon={<ArrowRight className="w-4 h-4" />} className="sm:flex-1">
            Kirim jawaban dan susun ulang
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={onSkip} disabled={busy} icon={<SkipForward className="w-4 h-4" />}>
            Lewati
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={busy} icon={<ArrowLeft className="w-4 h-4" />}>
            Ubah cerita
          </Button>
        </div>
      </form>
    </div>
  );
}
