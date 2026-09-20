'use client';

import React, { useState } from 'react';
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

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className={`space-y-8 ${isSenior ? 'accessibility-large-text' : ''}`}>
        {/* Top: Progress Indicator */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-ink">
            <span>LANGKAH AWAL PENDAMPINGAN</span>
            <span className="bg-yellow px-2 py-0.5 border-2 border-ink rounded shadow-hard-sm">
              LANGKAH {step} DARI 2
            </span>
          </div>
          <ProgressBar value={step} max={2} />
        </div>

        {/* STEP 1: AGE SELECTION */}
        {step === 1 && (
          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <Badge variant="calm" size="md">
                Konteks Pengguna
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink tracking-tight uppercase leading-tight">
                BERAPA RENTANG USIA ANDA SAAT INI?
              </h1>
              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
                Pilih kartu yang menggambarkan generasimu untuk menyesuaikan bahasa asesmen.
              </p>
            </div>

            {/* Explanatory Callout */}
            <div className="p-4 rounded-md bg-white border-2 border-ink shadow-hard-sm flex items-start gap-3 text-xs text-ink/80">
              <div className="w-6 h-6 rounded bg-yellow border border-ink flex items-center justify-center shrink-0 mt-0.5 font-bold text-ink">
                !
              </div>
              <div className="space-y-1 font-medium">
                <span className="font-black text-ink block uppercase tracking-wide">Mengapa rentang usia diperlukan?</span>
                <p className="leading-relaxed text-[11px] sm:text-xs">
                  Usia membantu Dengar.in mengadaptasi kosakata, nada bicara, serta protokol perlindungan
                  khusus (seperti hotline anak untuk usia 15–17). Kami{' '}
                  <strong className="text-ink font-bold">tidak pernah</strong> meminta nama,
                  tanggal lahir, KTP, ataupun data pribadi lainnya.
                </p>
              </div>
            </div>

            {/* 4 Age Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {ageList.map((opt) => {
                const isSelected = selectedAge === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedAge(opt.id)}
                    className={`p-5 rounded-md text-left border-2 border-ink transition-all cursor-pointer min-h-[110px] flex flex-col justify-between focus-visible:outline-ink ${
                      isSelected
                        ? 'bg-yellow/30 shadow-hard font-bold translate-x-[1px] translate-y-[1px]'
                        : 'bg-white hover:bg-paper shadow-hard-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-base sm:text-lg text-ink">
                        {opt.label}
                      </span>
                      {opt.highProtection && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-cobalt text-white border border-ink rounded">
                          <ShieldCheck className="w-3 h-3" />
                          Remaja
                        </span>
                      )}
                      {opt.accessibilityMode && (
                        <span className="inline-flex items-center text-[10px] font-black uppercase px-2 py-0.5 bg-lime text-ink border border-ink rounded">
                          Teks Besar
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/80 mt-1 leading-relaxed font-medium">{opt.subtext}</p>
                    <p className="text-[11px] text-cobalt mt-2 font-bold uppercase tracking-wider">{opt.rationale}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: TOPIC SELECTION */}
        {step === 2 && (
          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <Badge variant="calm" size="md">
                Fokus Asesmen
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink tracking-tight uppercase leading-tight">
                PILIH TOPIK YANG PALING MEMBEBANIMU
              </h1>
              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
                Asesmen adaptif akan mengarahkan alur pertanyaan sesuai topik pilihanmu.
              </p>
            </div>

            {/* 3 Primary Pillars */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-black text-ink uppercase tracking-wider block">
                TIGA PILAR TOPIK UTAMA:
              </span>

              <div className="grid grid-cols-1 gap-3.5">
                {pillarList.map((pillar) => {
                  const isSelected = selectedPillar === pillar.id;
                  const Icon = pillar.id === 'finance' ? Coins : pillar.id === 'trauma' ? HeartHandshake : Shield;
                  const iconBg = pillar.id === 'finance' ? 'bg-yellow text-ink' : pillar.id === 'trauma' ? 'bg-tangerine text-white' : 'bg-coral text-white';

                  return (
                    <button
                      key={pillar.id}
                      type="button"
                      onClick={() => {
                        setSelectedPillar(pillar.id);
                        setSelectedSubDomain(null);
                      }}
                      className={`p-5 rounded-md text-left border-2 border-ink transition-all cursor-pointer flex items-start gap-4 focus-visible:outline-ink ${
                        isSelected
                          ? 'bg-cobalt/10 shadow-hard translate-x-[1px] translate-y-[1px]'
                          : 'bg-white hover:bg-paper shadow-hard-sm'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-md border-2 border-ink flex items-center justify-center shrink-0 shadow-hard-sm ${iconBg}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-black text-base text-ink uppercase tracking-wider">
                            {pillar.label}
                          </h3>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-cobalt shrink-0" />}
                        </div>
                        <p className="text-xs font-bold text-cobalt">
                          {pillar.tagline}
                        </p>
                        <p className="text-[11px] sm:text-xs text-ink/80 leading-relaxed pt-0.5 font-medium">
                          {pillar.description}
                        </p>
                        {pillar.isSensitive && (
                          <span className="inline-block mt-1 text-[10px] font-black uppercase text-ink bg-yellow px-2 py-0.5 rounded border border-ink">
                            Pertanyaan sensitif dapat dilewati
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Life-Context Domains */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAllDomains(!showAllDomains)}
                className="flex items-center gap-1.5 text-xs font-black text-ink uppercase tracking-wider hover:text-cobalt py-1"
              >
                <span>Atau telusuri topik konteks hidup lainnya (sekolah, kampus, pekerjaan, dll.)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllDomains ? 'rotate-180' : ''}`} />
              </button>

              {showAllDomains && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                  {Object.entries(DOMAIN_CONFIGS).map(([key, dom]) => {
                    const domainKey = key as InterventionDomain;
                    const isSelected = selectedSubDomain === domainKey;
                    return (
                      <button
                        key={domainKey}
                        type="button"
                        onClick={() => {
                          setSelectedSubDomain(domainKey);
                          setSelectedPillar(null);
                        }}
                        className={`p-3.5 rounded-md border-2 border-ink text-left text-xs transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-yellow/30 font-bold shadow-hard-sm'
                            : 'bg-white hover:bg-paper shadow-hard-sm'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-black text-ink block uppercase tracking-wider">{dom.label}</span>
                          <span className="text-[11px] text-ink/70 leading-tight block font-medium">{dom.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="pt-4 flex items-center justify-between gap-4 border-t-2 border-ink">
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
            icon={<ArrowRight className="w-4 h-4" />}
            className="flex-row-reverse"
          >
            {step === 2 ? 'MULAI ASESMEN ADAPTIF →' : 'LANJUTKAN KE TOPIK →'}
          </Button>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

