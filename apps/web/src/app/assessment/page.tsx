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
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { ADAPTIVE_ASSESSMENT_QUESTIONS, evaluateSeverityLevel } from '@dengarin/config';
import {
  getAnonymousSession,
  saveAssessmentResult,
  saveAssessmentDraft,
  getAssessmentDraft,
  clearAssessmentDraft,
} from '@/lib/storage';
import type {
  AdaptiveAssessmentQuestion,
  AssessmentDraft,
  AssessmentEvaluation,
  NonDiagnosticSeverityLevel,
} from '@dengarin/types';
import { PageContainer, ContentColumn, Button, ProgressBar, Textarea, Badge } from '@/components/ui';

export default function AssessmentPage() {
  const router = useRouter();
  const session = getAnonymousSession();

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

    // Live safety crisis evaluation on free-text (ZERO AI, 100% deterministic)
    const safetyCheck = evaluateCrisisInput(text, ageBracket);
    if (safetyCheck.isCrisis) {
      router.push('/crisis');
    }
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
    setIsSubmitting(true);

    // 1. Deterministic safety verification on free text
    if (freeTextNote.trim()) {
      const finalCheck = evaluateCrisisInput(freeTextNote, ageBracket);
      if (finalCheck.isCrisis) {
        router.push('/crisis');
        return;
      }
    }

    // 2. Compute non-diagnostic triage score
    const totalScore = Object.values(answers).reduce((acc, val) => acc + val, 0);
    const severity: NonDiagnosticSeverityLevel = evaluateSeverityLevel(totalScore);

    let summaryFeedback = '';
    let supportSpaces: string[] = [];

    if (severity === 'MILD') {
      summaryFeedback =
        'Beban pikiran Anda saat ini berada dalam tingkat ringan dan relatif terkelola. Ruang pemulihan mandiri dan misi harian terarah direkomendasikan untuk menjaga stabilitas emosimu.';
      supportSpaces = ['Misi Harian Mandiri (3–7 Menit)', 'Jurnal Privat Lokal', 'Ruang Cerita Anonim Suportif'];
    } else if (severity === 'MODERATE') {
      summaryFeedback =
        'Anda sedang mengalami tekanan emosional menengah yang cukup menguras energi harian. Kami merekomendasikan latihan regulasi emosi terarah, jurnal refleksi, serta mempertimbangkan opsi pendampingan profesional.';
      supportSpaces = ['Panduan Regulasi Emosi', 'Jurnal Privat Refleksi', 'Forum Suportif Terarah', 'Opsi Konsultasi Psikolog'];
    } else {
      summaryFeedback =
        'Tingkat tekanan emosional yang Anda rasakan berada dalam intensitas tinggi dan memerlukan perhatian ekstra. Kami merekomendasikan akses prioritas ke tenaga profesional terverifikasi dan saluran bantuan krisis segera.';
      supportSpaces = ['Akses Rujukan Profesional Prioritas', 'Saluran Darurat Bebas Pulsa Kemenkes 119', 'Layanan Pemulihan Trauma'];
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

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className={`space-y-8 text-left ${isSenior ? 'accessibility-large-text' : ''}`}>
        {/* Draft Resume Notice Banner */}
        {hasDraftNotice && (
          <div className="p-4 rounded-md bg-yellow/20 border-2 border-ink text-ink shadow-hard-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BookmarkCheck className="w-5 h-5 text-ink shrink-0" />
              <div className="text-xs">
                <span className="font-black uppercase tracking-wider block text-ink">DRAF ASESMEN DITEMUKAN</span>
                <span className="text-ink/80 font-medium">Anda memiliki jawaban tersimpan dari sesi sebelumnya.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResumeDraft}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded bg-cobalt text-white font-bold text-xs border-2 border-ink shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                Lanjutkan Draf
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded bg-white border-2 border-ink text-ink font-bold text-xs shadow-hard-sm hover:bg-paper transition-all"
              >
                Mulai Baru
              </button>
            </div>
          </div>
        )}

        {/* Top Header: Progress & Pause Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-ink">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cobalt" />
              ASESMEN ADAPTIF NON-DIAGNOSTIK
            </span>
            <div className="flex items-center gap-3">
              <span className="bg-yellow px-2 py-0.5 border border-ink rounded">
                {isReviewPhase
                  ? 'CATATAN OPSIONAL'
                  : `PERTANYAAN ${currentStepIndex + 1} DARI ${totalQuestions}`}
              </span>
              <button
                type="button"
                onClick={handleSaveAndPause}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border-2 border-ink bg-white hover:bg-paper text-ink font-bold text-[11px] shadow-hard-sm transition-all"
                title="Simpan draf dan jeda asesmen"
              >
                <Pause className="w-3 h-3 text-cobalt" />
                <span>Jeda &amp; Lanjut Nanti</span>
              </button>
            </div>
          </div>
          <ProgressBar
            value={Math.min(currentStepIndex + (isReviewPhase ? 1 : 0), totalQuestions + 1)}
            max={totalQuestions + 1}
          />
        </div>

        {/* ACTIVE QUESTION (ONE QUESTION PER SCREEN) */}
        {!isReviewPhase && currentQ && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-ink bg-yellow px-3 py-1 rounded border-2 border-ink shadow-hard-sm">
                  PERTANYAAN #{currentStepIndex + 1}
                </span>
                {currentQ.sensitive && (
                  <span className="text-xs font-black uppercase tracking-wider text-white bg-coral px-2.5 py-1 rounded border-2 border-ink shadow-hard-sm">
                    SENSITIF • DAPAT DILEWATI
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-ink tracking-tight leading-snug">
                {currentQ.text}
              </h2>

              {currentQ.subtext && (
                <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
                  {currentQ.subtext}
                </p>
              )}
            </div>

            {/* Answer Options as Tactile Large Cards */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = currentAnswer === opt.score;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, opt.score)}
                    className={`p-4 sm:p-5 rounded-md text-left border-2 border-ink transition-all cursor-pointer focus-visible:outline-ink min-h-[60px] flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cobalt text-white shadow-hard font-bold translate-x-[1px] translate-y-[1px]'
                        : 'bg-white hover:bg-paper text-ink font-medium shadow-hard-sm'
                    }`}
                  >
                    <span className="text-sm sm:text-base leading-snug font-medium">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Skip Sensitive Question Action */}
            {currentQ.sensitive && currentQ.skippable && (
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => handleSkipQuestion(currentQ.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-ink hover:underline py-1 px-2"
                >
                  <SkipForward className="w-3.5 h-3.5 text-cobalt" />
                  <span>Lewati pertanyaan ini (tanpa mengurangi penilaian)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* OPTIONAL NOTES & REVIEW PHASE */}
        {isReviewPhase && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="calm" size="md">
                Langkah Terakhir
              </Badge>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-ink tracking-tight uppercase">
                ADA UNEK-UNEK LAIN YANG INGIN DITULISKAN?
              </h2>
              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
                Tuliskan secara bebas jika ada hal spesifik yang sedang Anda rasakan. Bagian ini sepenuhnya
                opsional dan tersimpan aman di peramban Anda.
              </p>
            </div>

            <div className="space-y-3">
              <Textarea
                value={freeTextNote}
                onChange={handleFreeTextChange}
                rows={4}
                placeholder="Contoh: 'Tugas menumpuk dan takut mengecewakan keluarga', 'Cemas memikirkan tagihan bulan depan'..."
              />
              <div className="p-3 rounded-md bg-yellow/20 border-2 border-ink shadow-hard-sm flex items-center gap-2 text-xs text-ink font-medium">
                <AlertTriangle className="w-4 h-4 text-ink shrink-0" />
                <span>
                  Input teks diawasi oleh filter krisis deterministik 100% bebas AI demi keselamatanmu.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="pt-4 flex items-center justify-between gap-4 border-t-2 border-ink">
          {currentStepIndex > 0 ? (
            <Button
              variant="outline"
              size="md"
              onClick={handlePrev}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              SEBELUMNYA
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
              PERTANYAAN BERIKUTNYA →
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
              {isSubmitting ? 'MENYUSUN REKOMENDASI...' : 'SELESAIKAN & LIHAT REKOMENDASI →'}
            </Button>
          )}
        </div>

        {/* Non-Diagnostic Disclaimer */}
        <div className="pt-2 text-center text-xs text-ink/70 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-cobalt shrink-0" />
          <span>Hasil asesmen non-diagnostik untuk mengarahkan ruang dukungan, bukan label medis.</span>
        </div>

        {/* Pause & Resume Modal */}
        {showPauseModal && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-none flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full space-y-5 shadow-hard-lg border-2 border-ink text-left">
              <div className="w-10 h-10 rounded-md bg-yellow text-ink border-2 border-ink shadow-hard-sm flex items-center justify-center font-black">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-black text-lg text-ink uppercase tracking-wider">
                  DRAF BERHASIL DISIMPAN
                </h3>
                <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
                  Jawabanmu telah tersimpan aman di peramban ini. Kamu dapat menutup halaman ini atau kembali ke
                  dashboard, lalu melanjutkan kapan saja saat kamu siap.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => setShowPauseModal(false)}
                >
                  Lanjut Mengerjakan
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => router.push('/dashboard')}
                >
                  Ke Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </ContentColumn>
    </PageContainer>
  );
}

