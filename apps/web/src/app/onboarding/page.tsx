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
import { useLanguage, useText } from '@/i18n';
import { ageBracketRationale, ageBracketText, domainText, topicPillarText } from '@/i18n/config';
import { onboardingText } from '@/i18n/pages/onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const { ready } = useConsentGuard();
  const { lang } = useLanguage();
  const t = useText(onboardingText);
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
          <div className="flex items-center justify-between gap-3 text-sm font-bold text-ink">
            <span>{t.header}</span>
            <span className="bg-yellow px-2.5 py-1 border-2 border-ink rounded-[4px] tabular-nums" aria-live="polite">
              {t.stepOf(step, 2)}
            </span>
          </div>
          <ProgressBar value={step} max={2} label={t.stepOf(step, 2)} className="[&>div:first-child]:sr-only" />
        </div>

        {/* STEP 1: AGE SELECTION */}
        {step === 1 && (
          <div key="langkah-1" className="space-y-6 text-left">
            <div className="space-y-2 animate-reveal-up">
              <Badge variant="calm" size="md">
                {t.step1Badge}
              </Badge>
              <h1 id="judul-langkah" className="text-[1.75rem] sm:text-4xl lg:text-[2.5rem] font-bold text-ink tracking-[-0.02em] leading-[1.15]">
                {t.step1Title}
              </h1>
              <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed">
                {t.step1Lede}
              </p>
            </div>

            {/* Explanatory Callout */}
            <div className="animate-reveal-up [animation-delay:80ms] p-4 sm:p-5 rounded-md bg-[#FFF1C2] border-l-4 border-yellow flex items-start gap-3 text-[#4A453E]">
              <div className="space-y-1">
                <span className="font-bold text-ink block text-base">{t.whyAgeTitle}</span>
                <p className="leading-relaxed text-base">
                  {t.whyAgeA}{' '}
                  <strong className="text-ink font-bold">{t.whyAgeNever}</strong> {t.whyAgeB}
                </p>
              </div>
            </div>

            {/* 4 Age Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1" role="radiogroup" aria-labelledby="judul-langkah">
              {ageList.map((opt, index) => {
                const isSelected = selectedAge === opt.id;
                const ageText = ageBracketText(opt.id, lang);
                return (
                  <div key={opt.id} className="animate-reveal-up flex" style={{ animationDelay: `${160 + index * 40}ms` }}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedAge(opt.id)}
                    className={`w-full p-5 rounded-md text-left border-2 border-ink transition-[transform,box-shadow,background-color] duration-200 ease-spring cursor-pointer min-h-[110px] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'bg-[#FFF1C2] shadow-hard -translate-x-[1px] -translate-y-[1px]'
                        : 'bg-white hover:bg-paper shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-lg sm:text-xl text-ink tracking-[-0.01em] tabular-nums">
                        {ageText.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-6 h-6 text-cobalt shrink-0" aria-hidden="true" />}
                      {!isSelected && opt.highProtection && (
                        <span className="inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 bg-cobalt text-white border border-ink rounded-[4px]">
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          {t.teen}
                        </span>
                      )}
                      {!isSelected && opt.accessibilityMode && (
                        <span className="inline-flex items-center text-sm font-bold px-2 py-0.5 bg-lime text-ink border border-ink rounded-[4px]">
                          {t.largeText}
                        </span>
                      )}
                    </div>
                    <p className="text-base text-[#4A453E] mt-1 leading-relaxed">{ageText.subtext}</p>
                    <p className="text-sm text-[#2B51E6] mt-2 font-semibold">{ageBracketRationale(opt.id, lang)}</p>
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
                {t.step2Badge}
              </Badge>
              <h1 id="judul-langkah" className="text-[1.75rem] sm:text-4xl lg:text-[2.5rem] font-bold text-ink tracking-[-0.02em] leading-[1.15]">
                {t.step2Title}
              </h1>
              <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed">
                {t.step2Lede}
              </p>
            </div>

            {/* 3 Primary Pillars */}
            <div className="space-y-3 pt-1 animate-reveal-up [animation-delay:80ms]">
              <span id="label-pilar" className="text-base font-bold text-ink block">
                {t.pickPillar}
              </span>

              <div className="grid grid-cols-1 gap-3.5" role="radiogroup" aria-labelledby="label-pilar">
                {pillarList.map((pillar, index) => {
                  const isSelected = selectedPillar === pillar.id;
                  const pillarText = topicPillarText(pillar.id, lang);
                  const Icon = pillar.id === 'finance' ? Coins : pillar.id === 'trauma' ? HeartHandshake : Shield;
                  const iconBg = pillar.id === 'finance' ? 'bg-yellow text-ink' : pillar.id === 'trauma' ? 'bg-tangerine text-ink' : 'bg-[#D32F2F] text-white';

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
                      className={`w-full p-5 rounded-md text-left border-2 border-ink transition-[transform,box-shadow,background-color] duration-200 ease-spring cursor-pointer flex items-start gap-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2 ${
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
                            {pillarText.label}
                          </h2>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-cobalt shrink-0" aria-hidden="true" />}
                        </div>
                        <p className="text-base font-semibold text-[#2B51E6]">
                          {pillarText.tagline}
                        </p>
                        <p className="text-base text-[#4A453E] leading-relaxed pt-0.5">
                          {pillarText.description}
                        </p>
                        {pillar.isSensitive && (
                          <span className="inline-block mt-1.5 text-sm font-bold text-ink bg-yellow px-2 py-0.5 rounded-[4px] border border-ink">
                            {t.sensitiveSkip}
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
                className="flex items-center gap-1.5 text-base font-semibold text-ink underline decoration-[#D8D3C9] decoration-2 underline-offset-4 hover:text-cobalt hover:decoration-cobalt transition-colors duration-120 py-2 min-h-[44px] text-left rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt"
              >
                <span>{showAllDomains ? t.hideDomains : t.showDomains}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-400 ease-spring ${showAllDomains ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {showAllDomains && (
                <div id="topik-lain" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3" role="radiogroup" aria-label={t.otherTopics}>
                  {Object.keys(DOMAIN_CONFIGS).map((key, index) => {
                    const domainKey = key as InterventionDomain;
                    const dom = domainText(domainKey, lang);
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
                        className={`w-full p-3.5 min-h-[56px] rounded-md border-2 border-ink text-left transition-[transform,box-shadow,background-color] duration-200 ease-spring flex items-start gap-2.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2 ${
                          isSelected
                            ? 'bg-[#FFF1C2] shadow-hard -translate-x-[1px] -translate-y-[1px]'
                            : 'bg-white hover:bg-paper shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-base text-ink block">{dom.label}</span>
                          <span className="text-base text-[#59544D] leading-snug block">{dom.description}</span>
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
        <div className="pt-5 space-y-3 border-t border-[#D8D3C9]">
          {!canProceed && (
            <p className="text-base text-[#59544D]" aria-live="polite">
              {step === 1 ? t.pickAgeFirst : t.pickTopicFirst}
            </p>
          )}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={handleBack}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                {t.back}
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
              {step === 2 ? t.nextToQuestions : t.nextToTopic}
            </Button>
          </div>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

