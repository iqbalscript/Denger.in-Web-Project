'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer, Button, PrivacyWarningPopup, Reveal, MoodIcon } from '@/components/ui';
import { TOPIC_PILLARS } from '@dengarin/config';
import { initAnonymousSession, saveDailyCheckin, getTodayCheckin } from '@/lib/storage';
import { awardLangkah } from '@/lib/gamification';
import { getLocalDateString } from '@/lib/calendar';
import type { MoodScore } from '@dengarin/types';
import { useLanguage, useText } from '@/i18n';
import { topicPillarText } from '@/i18n/config';
import { landingText } from '@/i18n/pages/landing';

// Satu warna penanda per pilar (lime, cobalt, oranye) di baris daftar pilar.
const PILLAR_SURFACES = [
  { marker: 'bg-[#B8F34A]' },
  { marker: 'bg-[#3357EE]' },
  { marker: 'bg-[#FF8A3D]' },
];

export default function LandingPage() {
  const t = useText(landingText);
  const { lang } = useLanguage();
  const [selectedQuickMood, setSelectedQuickMood] = useState<MoodScore | null>(null);
  const [moodSavedNotice, setMoodSavedNotice] = useState(false);

  useEffect(() => {
    const today = getTodayCheckin();
    if (today) {
      setSelectedQuickMood(today.mood);
    }
  }, []);

  const moodOptions: Array<{ id: MoodScore; label: string; color: string }> = [
    { id: 'sangat_baik', label: t.moods.sangat_baik, color: '#B8F34A' },
    { id: 'baik', label: t.moods.baik, color: '#C7D3FF' },
    { id: 'netral', label: t.moods.netral, color: '#FFD84D' },
    { id: 'berat', label: t.moods.berat, color: '#FF8A3D' },
    { id: 'kewalahan', label: t.moods.kewalahan, color: '#FF5252' },
  ];

  const handleQuickMoodClick = (mood: MoodScore) => {
    setSelectedQuickMood(mood);
    const session = initAnonymousSession();
    saveDailyCheckin({
      id: Date.now().toString(),
      userId: session.userId,
      timestamp: new Date().toISOString(),
      mood,
      energyLevel: mood === 'sangat_baik' ? 9 : mood === 'baik' ? 7 : mood === 'netral' ? 5 : mood === 'berat' ? 3 : 2,
      stressorTags: ['Quick Mood Landing Check-in'],
    });

    // Gamification: same canonical idempotency key as /checkin
    // First eligible check-in of the local calendar day = +10 Langkah
    const localDate = getLocalDateString();
    awardLangkah('daily_checkin', `checkin:${localDate}`, localDate);

    setMoodSavedNotice(true);
    setTimeout(() => {
      setMoodSavedNotice(false);
    }, 3000);
  };

  const topicPillarsList = Object.values(TOPIC_PILLARS);

  return (
    <>
    <div className="space-y-20 sm:space-y-24 lg:space-y-32 pb-12 sm:pb-16">
      {/* Jarak antarbagian lebih lega khusus halaman depan (layar aplikasi tetap padat). */}
      {/* 1. EDITORIAL HERO (PRD-DESIGN.md section 15)
          Jarak atas termasuk py PageContainer: 40px / 72px / 88px, supaya judul dan
          kedua tombol selalu terlihat tanpa menggulir di laptop 1366x768. */}
      <section className="pt-2 sm:pt-6 lg:pt-10" aria-labelledby="judul-utama">
        <PageContainer size="default">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Kolom kiri: satu pesan utama saja (lencana, judul, pengantar, dua tombol). */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="animate-reveal-up inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#B8F34A] border-2 border-[#151515] text-[#151515] text-sm font-bold shadow-[2px_2px_0px_#151515]">
                <ShieldCheck className="w-4 h-4 text-[#151515]" aria-hidden="true" />
                <span>{t.badge}</span>
              </div>

              {/* Display Headline per PRD-DESIGN.md */}
              <h1 id="judul-utama" className="animate-reveal-up [animation-delay:80ms] text-[2rem] sm:text-5xl lg:text-[4rem] font-bold text-[#151515] tracking-[-0.03em] leading-[1.05]">
                {t.heroLine1} <br />
                {t.heroLine2} <br />
                <span className="text-[#2B51E6] underline decoration-[#B8F34A] decoration-4 underline-offset-4">{t.heroLine3}</span>
              </h1>

              <p className="animate-reveal-up [animation-delay:160ms] text-lg sm:text-xl text-[#4A453E] max-w-[34rem] font-medium leading-[1.45]">
                {t.heroBody}
              </p>

              {/* Primary Call to Action Buttons (no entrance animation: holds the emergency-help button) */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-1">
                <Button
                  href="/consent"
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="end"
                  className="text-[#151515] font-bold flex-1 sm:flex-initial"
                >
                  {t.start}
                </Button>

                <Button
                  href="/crisis"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  icon={<PhoneCall className="w-4 h-4 text-[#B3261E]" />}
                  className="font-bold flex-1 sm:flex-initial"
                >
                  {t.emergency}
                </Button>
              </div>
            </div>

            {/* Kolom kanan: check-in suasana hati yang benar-benar berfungsi (bukan
                tiruan tampilan). Satu kartu saja, tanpa nampan di sekelilingnya. */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end animate-reveal-up [animation-delay:240ms]">
              <div className="bezel w-full max-w-xl lg:max-w-none">
              <div className="bezel-core p-4 sm:p-5 bg-white border-t-[6px] border-t-[#B8F34A] space-y-3 text-left" role="group" aria-labelledby="label-mood-cepat">
                <span id="label-mood-cepat" className="text-base font-bold text-[#151515] flex items-start gap-1.5">
                  <Sparkles className="w-4 h-4 mt-1 text-[#3357EE] shrink-0" aria-hidden="true" />
                  {t.moodQuestion}
                </span>
                <p role="status" aria-live="polite" className="min-h-[1.5rem] text-sm font-bold text-[#151515]">
                  {moodSavedNotice && (
                    <span className="inline-flex items-center gap-1 bg-[#B8F34A] px-2 py-0.5 rounded-[2px] border border-[#151515]">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t.moodSaved}
                    </span>
                  )}
                </p>

                {/* Lima pilihan dalam dua baris (3 + 2) tanpa sel kosong; di tablet
                    muat lima sejajar. Label tetap utuh, tidak terpotong di tengah kata. */}
                <div className="grid grid-cols-6 sm:grid-cols-5 lg:grid-cols-6 gap-2 pt-1">
                  {moodOptions.map((m, index) => {
                    const isSelected = selectedQuickMood === m.id;
                    const span = index < 3 ? 'col-span-2 sm:col-span-1 lg:col-span-2' : 'col-span-3 sm:col-span-1 lg:col-span-3';
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleQuickMoodClick(m.id)}
                        aria-pressed={isSelected}
                        style={{
                          backgroundColor: isSelected ? m.color : '#FFFFFF',
                        }}
                        className={`${span} py-2.5 px-1.5 rounded-[4px] border-2 border-[#151515] flex flex-col items-center justify-center gap-1 transition-[transform,box-shadow,background-color] duration-200 ease-spring cursor-pointer min-h-[76px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2 ${isSelected
                            ? 'shadow-[2px_2px_0px_#151515] -translate-x-[1px] -translate-y-[1px]'
                            : 'hover:bg-[#FFF8EF] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_#151515] active:translate-x-0 active:translate-y-0 active:shadow-none'
                          }`}
                      >
                        <MoodIcon mood={m.id} className="w-7 h-7 text-[#151515]" />
                        <span className="text-sm text-center font-bold leading-tight w-full text-[#151515] break-words">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="flex items-center gap-1.5 text-sm text-[#59544D]">
                  <Lock className="w-4 h-4 text-[#2B51E6] shrink-0" aria-hidden="true" />
                  {t.moodPrivacy}
                </p>
              </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 2. THREE PRIMARY TOPIC PILLARS */}
      <section aria-labelledby="judul-pilar">
        <PageContainer size="default">
          <Reveal className="max-w-2xl space-y-3 mb-10 sm:mb-12">
            <h2 id="judul-pilar" className="text-[1.75rem] sm:text-4xl font-bold text-[#151515] tracking-[-0.02em] leading-[1.15]">
              {t.pillarsTitle}
            </h2>
            <p className="text-base text-[#59544D] leading-relaxed max-w-[65ch]">
              {t.pillarsBody}
            </p>
          </Reveal>

          {/* Daftar baris, bukan kartu berikon: tiap pilar satu baris dengan judul di
              kiri dan penjelasan di kanan, dipisah garis tinta. */}
          <ol className="border-b-2 border-[#151515]">
            {topicPillarsList.map((pillar, index) => {
              const surface = PILLAR_SURFACES[index % PILLAR_SURFACES.length];
              const text = topicPillarText(pillar.id, lang);
              return (
                <Reveal
                  as="li"
                  key={pillar.id}
                  delay={index * 80}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-3 border-t-2 border-[#151515] py-8 sm:py-10 text-left"
                >
                  <div className="lg:col-span-5 flex gap-4">
                    <span className={`shrink-0 w-1.5 self-stretch rounded-full ${surface.marker}`} aria-hidden="true" />
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-2xl sm:text-[1.75rem] text-[#151515] tracking-[-0.02em] leading-[1.15]">
                        {text.label}
                      </h3>
                      <p className="text-base font-semibold leading-snug text-[#2B51E6]">{text.tagline}</p>
                    </div>
                  </div>
                  <div className="lg:col-span-7 space-y-3 lg:pl-0 pl-[1.375rem]">
                    <p className="text-base sm:text-lg leading-relaxed text-[#4A453E] max-w-[60ch]">{text.description}</p>
                    <p className="text-sm font-semibold text-[#151515]">
                      {pillar.isSensitive ? t.pillarSkippable : t.pillarMission}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </PageContainer>
      </section>

      {/* 3. FOUR ADAPTIVE AGE DEMOGRAPHICS */}
      <section aria-labelledby="judul-usia">
        <PageContainer size="default">
          <Reveal className="max-w-2xl space-y-3 mb-10 sm:mb-12">
            <h2 id="judul-usia" className="text-[1.75rem] sm:text-4xl font-bold text-[#151515] tracking-[-0.02em] leading-[1.15]">
              {t.agesTitle}
            </h2>
            <p className="text-base text-[#59544D] leading-relaxed">
              {t.agesBody}
            </p>
          </Reveal>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 text-left">
            {t.ages.map((group, index) => (
              <Reveal as="li" key={group.range} delay={index * 80} className="border-t-2 border-[#151515] pt-4 space-y-2">
                <span className="block text-sm font-bold text-[#2B51E6] tabular-nums">
                  {group.range}
                </span>
                <h3 className="font-bold text-lg text-[#151515] leading-[1.25]">{group.title}</h3>
                <p className="text-base text-[#59544D] leading-relaxed">{group.body}</p>
              </Reveal>
            ))}
          </ul>
        </PageContainer>
      </section>

      {/* 4. DETERMINISTIC CRISIS SAFETY GATE COMMITMENT (never animated or hidden) */}
      <section aria-labelledby="judul-krisis">
        <PageContainer size="default">
          <div className="bezel">
          <div className="bezel-core bg-[#FFEBEB] p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-left">
            <div className="space-y-3 max-w-2xl">
              <h2 id="judul-krisis" className="text-2xl sm:text-[1.75rem] font-bold text-[#151515] tracking-[-0.01em] leading-[1.2]">
                {t.crisisTitle}
              </h2>
              <p className="text-base sm:text-base text-[#4A453E] leading-relaxed">
                {t.crisisBody}
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <Button
                href="/crisis"
                variant="crisis"
                size="md"
                fullWidth
                icon={<PhoneCall className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {t.emergency}
              </Button>
            </div>
          </div>
          </div>
        </PageContainer>
      </section>
    </div>

      {/* Popup privasi (sekali saat kunjungan pertama) di luar wadah space-y: elemen fixed
          tidak boleh jadi saudara di dalamnya, karena hero ikut mendapat margin atas
          dan melompat naik begitu popup ditutup. */}
      <PrivacyWarningPopup />
    </>
  );
}
