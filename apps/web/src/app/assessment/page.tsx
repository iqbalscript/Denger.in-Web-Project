'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Pause,
  BookmarkCheck,
  SkipForward,
} from 'lucide-react';
import { ADAPTIVE_ASSESSMENT_QUESTIONS, evaluateSeverityLevel } from '@dengarin/config';
import {
  saveAssessmentResult,
  saveAssessmentDraft,
  getAssessmentDraft,
  clearAssessmentDraft,
} from '@/lib/storage';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { useCrisisGuard } from '@/lib/useCrisisGuard';
import { InlineCrisisCard, CrisisBlockedNote } from '@/components/InlineCrisisCard';
import { ConsentPending } from '@/components/ConsentPending';
import type {
  AdaptiveAssessmentQuestion,
  AssessmentDraft,
  AssessmentEvaluation,
  NonDiagnosticSeverityLevel,
} from '@dengarin/types';
import { PageContainer, ContentColumn, Button, ProgressBar, Textarea, Badge } from '@/components/ui';

export default function AssessmentPage() {
  const router = useRouter();
  const { ready, session } = useConsentGuard();

  // Determine user's topic
  const topicPillar = session?.topicPillar || 'general';
  const ageBracket = session?.ageBracket || '18-29';
  const isSenior = ageBracket === '50+';

  // Build the adaptive question sequence tailored to the topic
  const topicQuestionId =
    topicPillar === 'finance'
      ? 'context-finance'
      : topicPillar === 'trauma'
        ? 'context-trauma'
        : topicPillar === 'sexual_violence'
          ? 'context-sexual-violence'
          : 'context-general';

  const questionCatalog = ADAPTIVE_ASSESSMENT_QUESTIONS;
  const questionSequenceIds = [
    'root-emotional-strain',
    topicQuestionId,
    'functioning-impact',
    'support-readiness',
  ];

  // Active state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([]);
  const [freeTextNote, setFreeTextNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const crisis = useCrisisGuard(ageBracket);

  const totalQuestions = questionSequenceIds.length;
  const isReviewPhase = currentStepIndex >= totalQuestions;
  const currentQuestionId = questionSequenceIds[currentStepIndex];
  const currentQ = questionCatalog.find((q) => q.id === currentQuestionId) as AdaptiveAssessmentQuestion | undefined;
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  // Check for existing saved draft upon mounting
  useEffect(() => {
    const draft = getAssessmentDraft();
    if (draft && Object.keys(draft.answers).length > 0) {
      setHasDraftNotice(true);
    }
  }, []);

  const handleResumeDraft = () => {
    const draft = getAssessmentDraft();
    if (draft) {
      setAnswers(draft.answers);
      setSkippedQuestions(draft.skippedQuestionIds || []);
      const draftStep = questionSequenceIds.indexOf(draft.currentQuestionId);
      if (draftStep >= 0) {
        setCurrentStepIndex(draftStep);
      }
    }
    setHasDraftNotice(false);
  };

  const handleDiscardDraft = () => {
    clearAssessmentDraft();
    setHasDraftNotice(false);
  };

  const handleSelectOption = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleSkipQuestion = (questionId: string) => {
    setSkippedQuestions((prev) => [...prev, questionId]);
    // Advance to next without scoring
    if (currentStepIndex < totalQuestions) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleSaveAndPause = () => {
    const draft: AssessmentDraft = {
      currentQuestionId: currentQuestionId || questionSequenceIds[0],
      topic: topicPillar,
      ageBracket,
      answers,
      skippedQuestionIds: skippedQuestions,
      lastUpdated: new Date().toISOString(),
    };
    saveAssessmentDraft(draft);
    setShowPauseModal(true);
  };

  const handleFreeTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setFreeTextNote(text);

    // Live safety crisis evaluation on free-text (ZERO AI, 100% deterministic).
    // Shows the inline crisis card; never navigates or clears the text (M6).
    crisis.checkText(text);
  };

  const handleNext = () => {
    if (currentStepIndex < totalQuestions) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = () => {
    // 1. Deterministic safety verification on free text: keep it, block submit.
    if (!crisis.allowSubmit(freeTextNote)) return;
    setIsSubmitting(true);

    // 2. Compute non-diagnostic triage score
    const totalScore = Object.values(answers).reduce((acc, val) => acc + val, 0);
    const severity: NonDiagnosticSeverityLevel = evaluateSeverityLevel(totalScore);

    let summaryFeedback = '';
    let supportSpaces: string[] = [];

    if (severity === 'MILD') {
      summaryFeedback =
        'Terima kasih sudah meluangkan waktu untuk jujur pada dirimu. Beban pikiranmu saat ini terasa ringan dan masih bisa kamu kelola. Misi harian yang singkat dan jurnal bisa membantu menjaga ritme dan ketenanganmu.';
      supportSpaces = ['Misi Harian Mandiri (3-7 Menit)', 'Jurnal Privat Lokal', 'Ruang Cerita Anonim'];
    } else if (severity === 'MODERATE') {
      summaryFeedback =
        'Terima kasih sudah bercerita. Sepertinya belakangan ini kamu memikul tekanan yang cukup menguras tenaga, dan itu wajar dirasakan. Latihan menenangkan diri, jurnal, dan ruang cerita bisa menemanimu. Berbicara dengan profesional juga pilihan yang baik kalau kamu mau.';
      supportSpaces = ['Panduan Mengelola Emosi', 'Jurnal Privat Refleksi', 'Ruang Cerita Anonim', 'Opsi Konsultasi Psikolog'];
    } else {
      summaryFeedback =
        'Terima kasih sudah berani jujur. Sepertinya beban yang kamu rasakan sedang sangat berat, dan kamu tidak perlu menanggungnya sendirian. Kami menyarankan menghubungi tenaga profesional atau saluran bantuan, dan kami tetap ada menemanimu di sini.';
      supportSpaces = ['Bantuan Profesional Segera', 'Hotline Gratis Kemenkes (119 ext 8)', 'Layanan Pemulihan Trauma'];
    }

    const domain = session?.primaryDomain || 'general';

    const evaluation: AssessmentEvaluation = {
      distressScore: totalScore,
      severityLevel: severity,
      normalizedLevel: severity === 'SEVERE' ? 'high' : severity === 'MODERATE' ? 'moderate' : 'mild',
      recommendedPathId: `path-${domain}-14d`,
      summaryFeedback,
      recommendedSupportSpaces: supportSpaces,
    };

    saveAssessmentResult(evaluation);

    setTimeout(() => {
      router.push('/assessment/result');
    }, 400);
  };

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="narrow" className="sm:py-16">
      <ContentColumn size="md" className={`space-y-8 text-left ${isSenior ? 'accessibility-large-text' : ''}`}>
        {/* Draft Resume Notice Banner */}
        {hasDraftNotice && (
          <div role="status" className="animate-reveal-up p-4 rounded-md bg-[#FFF1C2] border-2 border-ink text-ink flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <BookmarkCheck className="w-5 h-5 text-ink shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-base space-y-0.5">
                <span className="font-bold block text-ink text-lg">Jawaban tersimpan ditemukan</span>
                <span className="text-[#4A453E]">Kamu punya jawaban yang tersimpan dari sebelumnya. Mau lanjut dari sana?</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResumeDraft}
                className="flex-1 sm:flex-initial min-h-[48px] px-4 py-2 rounded-[4px] bg-cobalt text-white font-bold text-base border-2 border-ink shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-[transform,box-shadow,background-color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
              >
                Lanjutkan jawaban
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="min-h-[48px] px-4 py-2 rounded-[4px] bg-white border-2 border-ink text-ink font-bold text-base shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-[transform,box-shadow,background-color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
              >
                Mulai dari awal
              </button>
            </div>
          </div>
        )}

        {/* Top Header: Progress & Pause Control */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-ink">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cobalt" aria-hidden="true" />
              Cek kondisi (bukan diagnosis)
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-yellow px-2.5 py-1 border border-ink rounded-[4px] tabular-nums" aria-live="polite">
                {isReviewPhase
                  ? 'Catatan opsional'
                  : `Pertanyaan ${currentStepIndex + 1} dari ${totalQuestions}`}
              </span>
              <button
                type="button"
                onClick={handleSaveAndPause}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-[4px] border-2 border-ink bg-white text-ink font-bold text-sm shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-[transform,box-shadow,background-color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
              >
                <Pause className="w-4 h-4 text-cobalt" aria-hidden="true" />
                <span>Simpan dan lanjut nanti</span>
              </button>
            </div>
          </div>
          <ProgressBar
            value={Math.min(currentStepIndex + (isReviewPhase ? 1 : 0), totalQuestions + 1)}
            max={totalQuestions + 1}
            label={isReviewPhase ? 'Catatan opsional' : `Pertanyaan ${currentStepIndex + 1} dari ${totalQuestions}`}
            className="[&>div:first-child]:sr-only"
          />
        </div>

        {/* ACTIVE QUESTION (ONE QUESTION PER SCREEN) */}
        {/* Keyed by question id so each new question enters once */}
        {!isReviewPhase && currentQ && (
          <div key={currentQ.id} className="space-y-6">
            <div className="space-y-3 animate-reveal-up">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#2B51E6] tabular-nums">
                  Pertanyaan {currentStepIndex + 1}
                </span>
                {currentQ.sensitive && (
                  <span className="text-sm font-bold text-ink bg-[#FFEBEB] px-2 py-0.5 rounded-[4px] border border-coral">
                    Pertanyaan sensitif, boleh dilewati
                  </span>
                )}
              </div>

              <h1 id="teks-pertanyaan" className="text-2xl sm:text-3xl lg:text-[2.25rem] font-bold text-ink tracking-[-0.02em] leading-[1.2]">
                {currentQ.text}
              </h1>

              {currentQ.subtext && (
                <p className="text-base text-[#4A453E] leading-relaxed">
                  {currentQ.subtext}
                </p>
              )}
            </div>

            {/* Answer Options as Tactile Large Cards */}
            <div className="grid grid-cols-1 gap-3 pt-2" role="radiogroup" aria-labelledby="teks-pertanyaan">
              {currentQ.options.map((opt, index) => {
                const isSelected = currentAnswer === opt.score;
                return (
                  <div key={opt.id} className="animate-reveal-up" style={{ animationDelay: `${100 + index * 40}ms` }}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(currentQ.id, opt.score)}
                    className={`w-full p-4 sm:p-5 rounded-md text-left border-2 border-ink transition-[transform,box-shadow,background-color,color] duration-200 ease-spring cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2 min-h-[64px] flex items-center justify-between gap-3 ${isSelected
                        ? 'bg-cobalt text-white shadow-hard -translate-x-[1px] -translate-y-[1px]'
                        : 'bg-white hover:bg-paper text-ink shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none'
                      }`}
                  >
                    <span className={`text-lg leading-snug ${isSelected ? 'font-semibold' : 'font-medium'}`}>{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-white shrink-0" aria-hidden="true" />}
                  </button>
                  </div>
                );
              })}
            </div>

            {/* Skip Sensitive Question Action */}
            {currentQ.sensitive && currentQ.skippable && (
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => handleSkipQuestion(currentQ.id)}
                  className="inline-flex items-center gap-1.5 text-base font-semibold text-ink underline decoration-[#D8D3C9] decoration-2 underline-offset-4 hover:decoration-ink transition-colors duration-120 min-h-[44px] py-2 px-2 text-left rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt"
                >
                  <SkipForward className="w-5 h-5 text-cobalt shrink-0" aria-hidden="true" />
                  <span>Lewati pertanyaan ini. Kamu tidak harus menjawabnya.</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* OPTIONAL NOTES & REVIEW PHASE */}
        {isReviewPhase && (
          <div className="space-y-6">
            <div className="space-y-2 animate-reveal-up">
              <Badge variant="calm" size="md">
                Langkah terakhir
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-bold text-ink tracking-[-0.02em] leading-[1.2]">
                Ada keluh kesah lain yang ingin dituliskan?
              </h1>
              <p className="text-base text-[#4A453E] leading-relaxed">
                Kalau ada hal lain yang ingin kamu ceritakan, tulis saja di sini. Boleh dikosongkan,
                dan tulisanmu hanya tersimpan di peramban perangkatmu.
              </p>
            </div>

            <div className="space-y-3 animate-reveal-up [animation-delay:100ms]">
              <Textarea
                value={freeTextNote}
                onChange={handleFreeTextChange}
                rows={4}
                aria-label="Catatan opsional"
                placeholder="Contoh: 'Tugas menumpuk dan takut mengecewakan keluarga', 'Cemas memikirkan tagihan bulan depan'..."
              />
              <div className="p-3 sm:p-4 rounded-md bg-[#FFF1C2] border-l-4 border-yellow flex items-start gap-2.5 text-base text-[#4A453E]">
                <AlertTriangle className="w-5 h-5 text-ink shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Tulisanmu diperiksa oleh pemeriksa krisis berbasis aturan tetap, 100% tanpa AI, demi keselamatanmu.
                </span>
              </div>
            </div>

            {crisis.cardVisible && (
              <InlineCrisisCard
                contacts={crisis.contacts}
                onAcknowledge={crisis.acknowledge}
                blockedNote="Tulisanmu tetap ada di sini dan asesmen belum kami selesaikan."
              />
            )}
            {crisis.isCrisis && <CrisisBlockedNote id="asesmen-krisis-catatan" />}
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="pt-5 space-y-3 border-t border-[#D8D3C9]">
          {!isReviewPhase && currentAnswer === undefined && (
            <p className="text-base text-[#59544D]" aria-live="polite">Pilih satu jawaban dulu, lalu tombol Lanjut akan aktif.</p>
          )}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {currentStepIndex > 0 ? (
              <Button
                variant="outline"
                size="md"
                onClick={handlePrev}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Kembali
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
                iconPosition="end"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Lanjut
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={isSubmitting || crisis.isCrisis}
                aria-describedby={crisis.isCrisis ? 'asesmen-krisis-catatan' : undefined}
                isLoading={isSubmitting}
                onClick={handleFinalSubmit}
                iconPosition="end"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {isSubmitting ? 'Menyusun saran...' : 'Selesai, lihat saran'}
              </Button>
            )}
          </div>
        </div>

        {/* Non-Diagnostic Disclaimer */}
        <div className="pt-2 text-center text-base text-[#59544D] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-5 h-5 text-cobalt shrink-0" aria-hidden="true" />
          <span>Hasil ini hanya untuk mengarahkan ke dukungan yang cocok, bukan label medis atau diagnosis.</span>
        </div>

        {/* Pause & Resume Modal */}
        {showPauseModal && (
          <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="judul-draf-tersimpan"
              onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setShowPauseModal(false); } }}
              className="animate-reveal-up bg-white rounded-lg p-6 sm:p-8 max-w-md w-full space-y-5 shadow-hard-lg border-2 border-ink text-left"
            >
              <div className="w-10 h-10 rounded-md bg-yellow text-ink border-2 border-ink flex items-center justify-center" aria-hidden="true">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h2 id="judul-draf-tersimpan" className="font-bold text-xl text-ink tracking-[-0.01em] leading-[1.25]">
                  Jawabanmu sudah disimpan
                </h2>
                <p className="text-base text-[#4A453E] leading-relaxed">
                  Jawabanmu tersimpan di perangkat ini. Kamu boleh menutup halaman ini atau kembali ke
                  beranda, lalu melanjutkan kapan saja saat kamu siap.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => setShowPauseModal(false)}
                >
                  Lanjut menjawab
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => router.push('/dashboard')}
                >
                  Ke beranda
                </Button>
              </div>
            </div>
          </div>
        )}
      </ContentColumn>
    </PageContainer>
  );
}

