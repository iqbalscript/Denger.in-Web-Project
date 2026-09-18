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
  Info,
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
          <div className="flex items-center justify-between text-xs text-sand-600 font-semibold">
            <span className="uppercase tracking-wider">Langkah Awal Pendampingan</span>
            <span className="font-bold text-terracotta-700">Langkah {step} dari 2</span>
          </div>
          <ProgressBar value={step} max={2} />
        </div>

        {/* STEP 1: AGE SELECTION */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="space-y-2">
              <Badge variant="calm" size="md">
                Konteks Pengguna
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
                Berapa rentang usia Anda saat ini?
              </h1>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Pilih kartu yang menggambarkan generasimu untuk menyesuaikan bahasa asesmen.
              </p>
            </div>

            {/* Explanatory Callout: Why age is requested */}
            <div className="p-4 rounded-2xl bg-white border border-terracotta-200/80 shadow-soft-xs flex items-start gap-3 text-xs text-sand-700">
              <Info className="w-4 h-4 text-terracotta-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sand-900 block">Mengapa rentang usia diperlukan?</span>
                <p className="leading-relaxed text-[11px] sm:text-xs">
                  Usia membantu Dengar.in mengadaptasi kosakata, nada bicara, serta protokol perlindungan
                  khusus (seperti hotline anak untuk usia 15–17). Kami{' '}
                  <strong className="text-sand-900 font-semibold">tidak pernah</strong> meminta nama,
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
                    className={`p-5 rounded-2xl text-left border transition-all duration-150 cursor-pointer min-h-[100px] flex flex-col justify-between focus-visible:outline-terracotta-500 touch-target-primary ${
                      isSelected
                        ? 'border-terracotta-500 bg-terracotta-50/95 shadow-soft-sm ring-1 ring-terracotta-500 -translate-y-0.5'
                        : 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/60 shadow-soft-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-base sm:text-lg text-sand-900">
                        {opt.label}
                      </span>
                      {opt.highProtection && (
                        <Badge variant="calm" size="sm" className="gap-1">
                          <ShieldCheck className="w-3 h-3 text-terracotta-600" />
                          Remaja
                        </Badge>
                      )}
                      {opt.accessibilityMode && (
                        <Badge variant="sand" size="sm">
                          Teks Besar
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-sand-600 mt-1 leading-relaxed">{opt.subtext}</p>
                    <p className="text-[11px] text-terracotta-700 mt-2 italic">{opt.rationale}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: TOPIC SELECTION */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="space-y-2">
              <Badge variant="calm" size="md">
                Fokus Asesmen
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
                Pilih topik yang paling membebanimu saat ini
              </h1>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Asesmen adaptif akan mengarahkan alur pertanyaan sesuai topik pilihanmu.
              </p>
            </div>

            {/* 3 Primary Pillars */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-sand-900 uppercase tracking-wider block">
                Tiga Pilar Topik Utama (PRD 2.0):
              </span>

              <div className="grid grid-cols-1 gap-3.5">
                {pillarList.map((pillar) => {
                  const isSelected = selectedPillar === pillar.id;
                  const Icon = pillar.id === 'finance' ? Coins : pillar.id === 'trauma' ? HeartHandshake : Shield;
                  return (
                    <button
                      key={pillar.id}
                      type="button"
                      onClick={() => {
                        setSelectedPillar(pillar.id);
                        setSelectedSubDomain(null);
                      }}
                      className={`p-5 rounded-2xl text-left border transition-all duration-150 cursor-pointer flex items-start gap-4 focus-visible:outline-terracotta-500 touch-target-primary ${
                        isSelected
                          ? 'border-terracotta-500 bg-terracotta-50/95 shadow-soft-sm ring-1 ring-terracotta-500 -translate-y-0.5'
                          : 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/60 shadow-soft-xs'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-terracotta-500 text-white shadow-soft-xs'
                            : 'bg-sand-100 text-terracotta-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-sand-900">
                            {pillar.label}
                          </h3>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-terracotta-500 shrink-0" />}
                        </div>
                        <p className="text-xs font-semibold text-terracotta-700">
                          {pillar.tagline}
                        </p>
                        <p className="text-[11px] sm:text-xs text-sand-600 leading-relaxed pt-0.5">
                          {pillar.description}
                        </p>
                        {pillar.isSensitive && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-terracotta-800 bg-terracotta-100 px-2 py-0.5 rounded-md">
                            Pertanyaan sensitif dapat dilewati
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Life-Context Domains (Architecture Coexistence) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAllDomains(!showAllDomains)}
                className="flex items-center gap-1.5 text-xs font-bold text-terracotta-700 hover:text-terracotta-800 focus-visible:outline-terracotta-500 py-1"
              >
                <span>Atau telusuri topik konteks hidup lainnya (sekolah, kampus, pekerjaan, dll.)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllDomains ? 'rotate-180' : ''}`} />
              </button>

              {showAllDomains && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 animate-fadeIn">
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
                        className={`p-3.5 rounded-xl border text-left text-xs transition-colors flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-terracotta-500 bg-terracotta-50 font-bold ring-1 ring-terracotta-500'
                            : 'border-sand-200 bg-white hover:bg-sand-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-sand-900 block">{dom.label}</span>
                          <span className="text-[11px] text-sand-600 leading-tight block">{dom.description}</span>
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
        <div className="pt-4 flex items-center justify-between gap-4 border-t border-sand-200/80">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="md"
              onClick={handleBack}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Sebelumnya
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
            className="flex-row-reverse touch-target-primary shadow-soft-sm"
          >
            {step === 2 ? 'Mulai Asesmen Adaptif' : 'Lanjutkan ke Topik'}
          </Button>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
