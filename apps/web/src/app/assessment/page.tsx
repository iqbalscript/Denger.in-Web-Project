'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, AlertTriangle, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { GENERIC_ASSESSMENT_QUESTIONS } from '@dengarin/config';
import { getAnonymousSession, saveAssessmentResult } from '@/lib/storage';
import type { AssessmentEvaluation } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, ProgressBar, Textarea } from '@/components/ui';

export default function AssessmentPage() {
  const router = useRouter();
  const session = getAnonymousSession();

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [freeTextNote, setFreeTextNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuestions = GENERIC_ASSESSMENT_QUESTIONS.length;
  const isLastQuestion = currentIdx === totalQuestions - 1;
  const isReviewPhase = currentIdx >= totalQuestions;

  const currentQ = GENERIC_ASSESSMENT_QUESTIONS[currentIdx];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  const handleSelectOption = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFreeTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setFreeTextNote(text);

    // Live safety crisis evaluation on free-text (ZERO AI, 100% deterministic)
    const safetyCheck = evaluateCrisisInput(text, session?.ageBracket || '18-24');
    if (safetyCheck.isCrisis) {
      router.push('/crisis');
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);

    // 1. Final deterministic safety verification on any free text note
    if (freeTextNote.trim()) {
      const finalCheck = evaluateCrisisInput(freeTextNote, session?.ageBracket || '18-24');
      if (finalCheck.isCrisis) {
        router.push('/crisis');
        return;
      }
    }

    // 2. Compute non-diagnostic distress score
    const totalScore = Object.values(answers).reduce((acc, val) => acc + val, 0);
    let normalizedLevel: 'mild' | 'moderate' | 'high' = 'mild';
    let summaryFeedback = 'Beban pikiran Anda saat ini berada dalam tingkat ringan dan relatif terkelola.';

    if (totalScore >= 8) {
      normalizedLevel = 'high';
      summaryFeedback =
        'Tingkat kelelahan mental Anda cukup tinggi. Memerlukan langkah pemulihan dan jeda yang lebih teratur.';
    } else if (totalScore >= 4) {
      normalizedLevel = 'moderate';
      summaryFeedback =
        'Anda sedang mengalami tekanan emosional yang cukup membebani. Fokus pada satu tindakan kecil hari ini.';
    }

    const domain = session?.primaryDomain || 'general';

    const evaluation: AssessmentEvaluation = {
      distressScore: totalScore,
      normalizedLevel,
      recommendedPathId: `path-${domain}-14d`,
      summaryFeedback,
    };

    saveAssessmentResult(evaluation);

    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8">
        {/* Top: Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-sand-600 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-calm-800">
              <Sparkles className="w-3.5 h-3.5 text-calm-700" />
              Asesmen Konteks Mandiri
            </span>
            <span className="font-semibold text-sand-700">
              {isReviewPhase
                ? 'Langkah Terakhir: Catatan Tambahan'
                : `Pertanyaan ${currentIdx + 1} dari ${totalQuestions}`}
            </span>
          </div>
          <ProgressBar
            value={Math.min(currentIdx + (isReviewPhase ? 1 : 0), totalQuestions + 1)}
            max={totalQuestions + 1}
          />
        </div>

        {/* Middle: Active Question (THE VISUAL FOCUS) */}
        {!isReviewPhase && currentQ && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-calm-700 bg-calm-100 px-3 py-1 rounded-full">
                Pertanyaan #{currentIdx + 1}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-sand-900 tracking-tight leading-snug">
                {currentQ.text}
              </h2>
              <p className="text-xs text-sand-600">
                Pilih satu opsi yang paling mendekati kondisimu dalam beberapa hari terakhir.
              </p>
            </div>

            {/* Answer Options as clean tactile buttons with generous spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options?.map((opt) => {
                const isSelected = currentAnswer === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, opt.value)}
                    className={`p-4 rounded-2xl text-left border transition-all duration-150 cursor-pointer focus-visible:outline-calm-700 min-h-[64px] flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-calm-700 bg-calm-50/90 text-calm-950 shadow-soft-xs ring-1 ring-calm-700 font-bold'
                        : 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/60 text-sand-800 font-medium'
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-calm-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Review & Free Text Phase */}
        {isReviewPhase && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-sand-900 tracking-tight">
                Ada hal lain yang ingin kamu ceritakan?
              </h2>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Tuliskan secara singkat unek-unek atau beban yang sedang kamu pikul. Bagian ini
                opsional.
              </p>
            </div>

            <div className="space-y-3">
              <Textarea
                value={freeTextNote}
                onChange={handleFreeTextChange}
                rows={4}
                placeholder="Contoh: 'Tugas kuliah terasa menumpuk', 'Cemas memikirkan cicilan hutang keluarga'..."
              />
              <div className="flex items-center gap-1.5 text-xs text-sand-600">
                <AlertTriangle className="w-3.5 h-3.5 text-calm-700 shrink-0" />
                <span>
                  Teks ini diawasi oleh filter keselamatan deterministik untuk memastikan kamu aman tanpa keterlibatan AI.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom: Navigation */}
        <div className="pt-4 flex items-center justify-between gap-4 border-t border-sand-200/80">
          {currentIdx > 0 ? (
            <Button
              variant="ghost"
              size="md"
              onClick={handlePrev}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Sebelumnya
            </Button>
          ) : (
            <div />
          )}

          {!isReviewPhase ? (
            <Button
              variant="primary"
              size="lg"
              disabled={currentAnswer === undefined}
              onClick={handleNext}
              icon={<ArrowRight className="w-4 h-4" />}
              className="flex-row-reverse"
            >
              {isLastQuestion ? 'Lanjut ke Catatan' : 'Pertanyaan Berikutnya'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={handleFinalSubmit}
              icon={<ArrowRight className="w-4 h-4" />}
              className="flex-row-reverse"
            >
              {isSubmitting ? 'Menyiapkan Jalur...' : 'Selesaikan Asesmen & Lihat Jalur'}
            </Button>
          )}
        </div>

        {/* Non-Diagnostic Disclaimer */}
        <div className="pt-2 text-center text-xs text-sand-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-calm-700 shrink-0" />
          <span>Hasil asesmen ini semata-mata untuk menentukan jalur misi pendampingan mandiri, bukan label medis.</span>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
