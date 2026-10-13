'use client';

import React, { useState } from 'react';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Coins,
  HeartHandshake,
  Shield,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import type { AgeBracket, InterventionDomain, TopicPillarId } from '@dengarin/types';
import { PRD_AGE_BRACKET_CONFIGS, TOPIC_PILLARS, DOMAIN_CONFIGS } from '@dengarin/config';
import { updateUserContext } from '@/lib/storage';
import { ContentColumn, PageContainer, Button, ProgressBar, Badge } from '@/components/ui';

export default function OnboardingPage() {
  const router = useRouter();
  const { ready } = useConsentGuard();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAge, setSelectedAge] = useState<AgeBracket | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<TopicPillarId | null>(null);
  const [selectedSubDomain, setSelectedSubDomain] = useState<InterventionDomain | null>(null);
  const [showAllDomains, setShowAllDomains] = useState(false);

  const ageList = Object.values(PRD_AGE_BRACKET_CONFIGS);
  const pillarList = Object.values(TOPIC_PILLARS);

  const canProceed =
    (step === 1 && selectedAge !== null) ||
    (step === 2 && (selectedPillar !== null || selectedSubDomain !== null));

  const handleNext = () => {
    if (!canProceed) return;
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (selectedAge) {
        let primaryDomain: InterventionDomain = 'general';
        if (selectedPillar) {
          primaryDomain = TOPIC_PILLARS[selectedPillar].primaryDomain;
        } else if (selectedSubDomain) {
          primaryDomain = selectedSubDomain;
        }

        updateUserContext(selectedAge, undefined, primaryDomain, selectedPillar || undefined);
        router.push('/assessment');
      }
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const isSenior = selectedAge === '50+';

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="narrow" className="sm:py-16">
      <ContentColumn size="md" className={`space-y-8 ${isSenior ? 'accessibility-large-text' : ''}`}>
        {/* Top: Progress Indicator */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.05em] text-ink">
            <span>Kenalan dulu, sebentar saja</span>
            <span className="bg-yellow px-2 py-0.5 border-2 border-ink rounded-[4px] tabular-nums" aria-live="polite">
              Langkah {step} dari 2
            </span>
          </div>
          <ProgressBar value={step} max={2} label={`Langkah ${step} dari 2`} className="[&>div:first-child]:sr-only" />
        </div>

        {/* STEP 1: AGE SELECTION */}
        {step === 1 && (
          <div key="langkah-1" className="space-y-6 text-left">
            <div className="space-y-2 animate-reveal-up">
              <Badge variant="calm" size="md">
                Biar Kami Lebih Paham
              </Badge>
              <h1 id="judul-langkah" className="text-[1.75rem] sm:text-4xl lg:text-[2.5rem] font-bold text-ink tracking-[-0.02em] leading-[1.15]">
                Kamu di rentang usia berapa?
              </h1>
              <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed">
                Pilih yang paling sesuai, supaya bahasa kami terasa pas untukmu.
              </p>
            </div>

            {/* Explanatory Callout */}
            <div className="animate-reveal-up [animation-delay:80ms] p-4 sm:p-5 rounded-md bg-[#FFF1C2] border-l-4 border-yellow flex items-start gap-3 text-[#4A453E]">
              <div className="space-y-1">
                <span className="font-bold text-ink block text-[15px]">Kenapa kami bertanya usia?</span>
                <p className="leading-relaxed text-sm sm:text-[15px]">
                  Usia membantu Dengar.in menyesuaikan kosakata, nada bicara, serta perlindungan
                  khusus (seperti hotline anak untuk usia 15–17). Kami{' '}
                  <strong className="text-ink font-bold">tidak pernah</strong> meminta nama,
                  tanggal lahir, KTP, ataupun data pribadi lainnya.
                </p>
              </div>
            </div>

            {/* 4 Age Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1" role="radiogroup" aria-labelledby="judul-langkah">
              {ageList.map((opt, index) => {
                const isSelected = selectedAge === opt.id;
                return (
                  <div key={opt.id} className="animate-reveal-up flex" style={{ animationDelay: `${160 + index * 40}ms` }}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedAge(opt.id)}
                    className={`w-full p-5 rounded-md text-left border-2 border-ink transition-[transform,box-shadow,background-color] duration-200 ease-spring cursor-pointer min-h-[110px] flex flex-col justify-between focus-visible:outline-ink ${
                      isSelected
                        ? 'bg-[#FFF1C2] shadow-hard -translate-x-[1px] -translate-y-[1px]'
                        : 'bg-white hover:bg-paper shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-lg sm:text-xl text-ink tracking-[-0.01em] tabular-nums">
                        {opt.label}
                      </span>
                      {opt.highProtection && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 bg-cobalt text-white border border-ink rounded-[4px]">
                          <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                          Remaja
                        </span>
                      )}
                      {opt.accessibilityMode && (
                        <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 bg-lime text-ink border border-ink rounded-[4px]">
                          Teks Besar
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] text-[#4A453E] mt-1 leading-relaxed">{opt.subtext}</p>
                    <p className="text-xs text-cobalt mt-2 font-semibold">{opt.rationale}</p>
                  </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: TOPIC SELECTION */}
        {step === 2 && (
          <div key="langkah-2" className="space-y-6 text-left">
            <div className="space-y-2 animate-reveal-up">
              <Badge variant="calm" size="md">
                Yang Ingin Kamu Bicarakan
              </Badge>
              <h1 id="judul-langkah" className="text-[1.75rem] sm:text-4xl lg:text-[2.5rem] font-bold text-ink tracking-[-0.02em] leading-[1.15]">
                Apa yang paling terasa berat saat ini?
              </h1>
              <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed">
                Tidak ada jawaban yang salah. Pertanyaan berikutnya akan menyesuaikan dengan pilihanmu.
              </p>
            </div>

            {/* 3 Primary Pillars */}
            <div className="space-y-3 pt-1 animate-reveal-up [animation-delay:80ms]">
              <span id="label-pilar" className="text-xs font-bold text-ink uppercase tracking-[0.05em] block">
                Pilih yang paling dekat denganmu
              </span>

              <div className="grid grid-cols-1 gap-3.5" role="radiogroup" aria-labelledby="label-pilar">
                {pillarList.map((pillar, index) => {
                  const isSelected = selectedPillar === pillar.id;
                  const Icon = pillar.id === 'finance' ? Coins : pillar.id === 'trauma' ? HeartHandshake : Shield;
                  const iconBg = pillar.id === 'finance' ? 'bg-yellow text-ink' : pillar.id === 'trauma' ? 'bg-tangerine text-white' : 'bg-coral text-white';

                  return (
                    <div key={pillar.id} className="animate-reveal-up" style={{ animationDelay: `${140 + index * 40}ms` }}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setSelectedPillar(pillar.id);
                        setSelectedSubDomain(null);
                      }}
                      className={`w-full p-5 rounded-md text-left border-2 border-ink transition-[transform,box-shadow,background-color] duration-200 ease-spring cursor-pointer flex items-start gap-4 focus-visible:outline-ink ${
                        isSelected
                          ? 'bg-[#E6ECFF] shadow-hard -translate-x-[1px] -translate-y-[1px]'
                          : 'bg-white hover:bg-paper shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-md border-2 border-ink flex items-center justify-center shrink-0 ${iconBg}`}
                        aria-hidden="true"
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="font-bold text-lg text-ink tracking-[-0.01em] leading-[1.25]">
                            {pillar.label}
                          </h2>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-cobalt shrink-0" aria-hidden="true" />}
                        </div>
                        <p className="text-sm font-semibold text-cobalt">
                          {pillar.tagline}
                        </p>
                        <p className="text-[15px] text-[#4A453E] leading-relaxed pt-0.5">
                          {pillar.description}
                        </p>
                        {pillar.isSensitive && (
                          <span className="inline-block mt-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink bg-yellow px-2 py-0.5 rounded-[4px] border border-ink">
                            Pertanyaan sensitif boleh kamu lewati
                          </span>
                        )}
                      </div>
                    </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expandable Life-Context Domains */}
            <div className="pt-2 animate-reveal-up [animation-delay:280ms]">
              <button
                type="button"
                onClick={() => setShowAllDomains(!showAllDomains)}
                aria-expanded={showAllDomains}
                aria-controls="topik-lain"
                className="flex items-center gap-1.5 text-sm font-semibold text-ink underline decoration-[#D8D3C9] decoration-2 underline-offset-4 hover:text-cobalt hover:decoration-cobalt transition-colors duration-120 py-2 min-h-[44px] text-left"
              >
                <span>Atau lihat topik lain (sekolah, kampus, pekerjaan, dan lainnya)</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-400 ease-spring ${showAllDomains ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {showAllDomains && (
                <div id="topik-lain" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3" role="radiogroup" aria-label="Topik lain">
                  {Object.entries(DOMAIN_CONFIGS).map(([key, dom], index) => {
                    const domainKey = key as InterventionDomain;
                    const isSelected = selectedSubDomain === domainKey;
                    return (
                      <div key={domainKey} className="animate-reveal-up flex" style={{ animationDelay: `${index * 30}ms` }}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          setSelectedSubDomain(domainKey);
                          setSelectedPillar(null);
                        }}
                        className={`w-full p-3.5 rounded-md border-2 border-ink text-left transition-[transform,box-shadow,background-color] duration-200 ease-spring flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#FFF1C2] shadow-hard -translate-x-[1px] -translate-y-[1px]'
                            : 'bg-white hover:bg-paper shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-[15px] text-ink block">{dom.label}</span>
                          <span className="text-sm text-[#59544D] leading-snug block">{dom.description}</span>
                        </div>
                      </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="pt-5 flex items-center justify-between gap-4 border-t border-[#D8D3C9]">
          {step > 1 ? (
            <Button
              variant="outline"
              size="md"
              onClick={handleBack}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              SEBELUMNYA
            </Button>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            size="lg"
            disabled={!canProceed}
            onClick={handleNext}
            iconPosition="end"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {step === 2 ? 'LANJUT KE PERTANYAAN' : 'LANJUTKAN KE TOPIK'}
          </Button>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

