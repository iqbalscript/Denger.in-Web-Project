'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import {
  getTodayMission,
  completeTodayMission,
  isTodayMissionCompleted,
  getTodayMissionReflection,
} from '@/lib/storage';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { useCrisisGuard } from '@/lib/useCrisisGuard';
import { InlineCrisisCard, CrisisBlockedNote } from '@/components/InlineCrisisCard';
import type { DailyMission, CelebrationData } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, Input, CelebrationToast, Reveal } from '@/components/ui';
import { awardLangkah } from '@/lib/gamification';
import { getLocalDateString } from '@/lib/calendar';
import { useLanguage, useText } from '@/i18n';
import { domainText, localizedMission } from '@/i18n/config';
import { missionText } from '@/i18n/pages/mission';

export default function MissionPage() {
  const { ready, session } = useConsentGuard();
  const crisis = useCrisisGuard(session?.ageBracket);
  const t = useText(missionText);
  const { lang } = useLanguage();
  const [mission, setMission] = useState<DailyMission | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  useEffect(() => {
    // Mission stays on its loading skeleton until consent is confirmed (H5).
    if (!ready) return;
    const domain = session?.primaryDomain || 'general';
    const activeMission = getTodayMission(domain);
    setMission(activeMission);
    setIsCompleted(isTodayMissionCompleted());
    setReflectionText(getTodayMissionReflection());
    setCurrentDay(session?.currentDay || 1);
  }, [ready, session]);

  // Teks misi dan label fokus ikut bahasa antarmuka; data tersimpan tetap Indonesia.
  const shownMission = mission ? localizedMission(mission, lang) : null;
  const domainLabel = domainText(session?.primaryDomain || 'general', lang).label;

  const handleReflectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setReflectionText(text);

    // Live safety filter: inline crisis card, no navigation (M6).
    crisis.checkText(text);
  };

  const handleComplete = () => {
    if (!mission) return;

    // Safety check: keep the reflection text, block completion while it matches.
    if (!crisis.allowSubmit(reflectionText)) return;

    completeTodayMission(reflectionText);
    setIsCompleted(true);

    // Gamification: award mission completion Langkah
    const localDate = getLocalDateString();
    const missionRes = awardLangkah('mission_complete', `mission:${localDate}`, localDate);

    // Optional reflection bonus
    let reflectionRes: CelebrationData | null = null;
    if (reflectionText.trim().length > 0) {
      reflectionRes = awardLangkah('mission_reflection', `reflection:${localDate}`, localDate);
    }

    if (reflectionRes) {
      setCelebration({
        ...reflectionRes,
        langkahAwarded: (missionRes?.langkahAwarded ?? 0) + reflectionRes.langkahAwarded,
      });
    } else if (missionRes) {
      setCelebration(missionRes);
    }
  };

  if (!mission || !shownMission) {
    return (
      <PageContainer size="narrow">
        <ContentColumn size="md" className="space-y-6 py-4" role="status" aria-live="polite">
          <span className="sr-only">{t.preparing}</span>
          <div className="h-9 w-56 rounded-[4px] bg-[#EFE8DC] animate-pulse" aria-hidden="true" />
          <div className="space-y-3" aria-hidden="true">
            <div className="h-6 w-40 rounded-[4px] bg-[#EFE8DC] animate-pulse" />
            <div className="h-11 w-full rounded-[4px] bg-[#EFE8DC] animate-pulse" />
            <div className="h-5 w-4/5 rounded-[4px] bg-[#EFE8DC] animate-pulse" />
          </div>
          <div className="space-y-3" aria-hidden="true">
            <div className="h-20 w-full rounded-[6px] bg-[#EFE8DC] animate-pulse" />
            <div className="h-20 w-full rounded-[6px] bg-[#EFE8DC] animate-pulse" />
          </div>
          <p className="text-base text-[#59544D]" aria-hidden="true">{t.preparing}</p>
        </ContentColumn>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-10 text-left">
        {/* Top: Breadcrumb / Back */}
        <div className="animate-reveal-up">
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            {t.backHome}
          </Button>
        </div>

        {/* Center: THE MISSION HERO */}
        <header className="space-y-5 animate-reveal-up [animation-delay:80ms]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold px-2.5 py-1 bg-cobalt text-white border-2 border-ink rounded shadow-hard-sm tabular-nums">
              {t.dayOf(currentDay)}
            </span>
            <span className="text-sm font-bold px-2.5 py-1 bg-white text-ink border border-borderSubtle rounded">
              {t.focus(domainLabel)}
            </span>
            <div className="flex items-center gap-1.5 text-sm text-ink font-bold sm:ml-auto">
              <Clock className="w-4 h-4 text-cobalt" aria-hidden="true" />
              <span className="tabular-nums">{t.duration(shownMission.durationMinutes)}</span>
            </div>
          </div>

          <h1 className="text-[2rem] sm:text-4xl lg:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05]">
            {shownMission.title}
          </h1>

          <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-[38rem]">
            {shownMission.summary}
          </p>
        </header>

        {/* Vertical Connected Timeline of Guided Steps */}
        <section aria-labelledby="judul-langkah" className="space-y-5 animate-reveal-up [animation-delay:160ms]">
          <h2 id="judul-langkah" className="flex items-center gap-2 text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25]">
            <Sparkles className="w-5 h-5 text-cobalt" aria-hidden="true" />
            <span>{t.stepsTitle}</span>
          </h2>

          <ol className="space-y-3">
            {shownMission.steps.map((step, idx) => (
              <Reveal as="li" key={idx} delay={Math.min(idx, 5) * 70} className="p-5 sm:p-6 bg-white border border-borderSubtle rounded-lg flex items-start gap-4">
                <div className="w-11 h-11 rounded-md bg-cobalt text-white font-bold text-lg flex items-center justify-center border-2 border-ink shrink-0 tabular-nums" aria-hidden="true">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#2B51E6] tabular-nums">
                    {t.stepLabel(idx + 1)}
                  </span>
                  <p className="text-lg text-ink leading-relaxed">
                    {step}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Reflection Input Section */}
        <Reveal className="space-y-3 pt-8 border-t border-borderSubtle">
          <Input
            label={t.reflectionLabel(shownMission.reflectionQuestion)}
            value={reflectionText}
            onChange={handleReflectionChange}
            disabled={isCompleted}
            placeholder={t.reflectionPlaceholder}
          />
        </Reveal>

        {crisis.cardVisible && (
          <InlineCrisisCard
            contacts={crisis.contacts}
            onAcknowledge={crisis.acknowledge}
            blockedNote={t.blockedNote}
          />
        )}

        {/* Completion State / Action Button */}
        <div>
          {isCompleted ? (
            <div role="status" className="animate-reveal-up bg-lime border-2 border-ink rounded-lg p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-hard-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-ink shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-ink leading-snug">{t.doneTitle}</h2>
                  <p className="text-base text-ink leading-relaxed">
                    {t.doneBody}
                  </p>
                </div>
              </div>
              <Button
                href="/dashboard"
                variant="secondary"
                size="md"
                iconPosition="end"
                icon={<ArrowRight className="w-4 h-4" />}
                className="shrink-0 w-full sm:w-auto"
              >
                {t.backHome}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={crisis.isCrisis}
              aria-describedby={crisis.isCrisis ? 'misi-krisis-catatan' : undefined}
              onClick={handleComplete}
              icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
            >
              {t.complete}
            </Button>
            {crisis.isCrisis && <CrisisBlockedNote id="misi-krisis-catatan" />}
            </div>
          )}
        </div>
      </ContentColumn>

      <CelebrationToast celebration={celebration} onDismiss={() => setCelebration(null)} />
    </PageContainer>
  );
}

