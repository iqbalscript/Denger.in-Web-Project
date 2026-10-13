'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Coins,
  Lock,
  PhoneCall,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer, Button, PrivacyWarningPopup, Reveal, MoodIcon } from '@/components/ui';
import { TOPIC_PILLARS } from '@dengarin/config';
import { initAnonymousSession, saveDailyCheckin, getTodayCheckin } from '@/lib/storage';
import { awardLangkah } from '@/lib/gamification';
import { getLocalDateString } from '@/lib/calendar';
import type { MoodScore } from '@dengarin/types';

// Bento cells get distinct flat surfaces from the landing palette (cream + cobalt + lime, PRD §5.2).
const PILLAR_SURFACES = [
  { tile: 'bg-[#B8F34A]', icon: 'bg-white', tagline: 'text-[#151515]', body: 'text-[#2E2B26]', rule: 'border-[#8FBF2F]' },
  { tile: 'bg-white', icon: 'bg-[#B8F34A]', tagline: 'text-[#2B51E6]', body: 'text-[#59544D]', rule: 'border-[#D8D3C9]' },
  { tile: 'bg-[#E6ECFF]', icon: 'bg-white', tagline: 'text-[#2B51E6]', body: 'text-[#4A453E]', rule: 'border-[#BAC9FE]' },
];

const AGE_GROUPS = [
  {
    range: '15-17 tahun',
    title: 'Remaja & pelajar',
    body: 'Bahasa yang ramah untuk remaja, plus perlindungan khusus dan rujukan TePSA Kemensos/KPAI bila kamu butuh.',
  },
  {
    range: '18-29 tahun',
    title: 'Dewasa muda',
    body: 'Skripsi, awal karier, krisis seperempat abad, dan belajar mandiri. Wajar kalau terasa berat.',
  },
  {
    range: '30-49 tahun',
    title: 'Dewasa & keluarga',
    body: 'Generasi sandwich, tanggung jawab menafkahi, dan lelah bekerja. Kamu boleh merasa capek.',
  },
  {
    range: '50+ tahun',
    title: 'Senior & lansia',
    body: 'Teks yang lebih besar dan mudah dibaca, tampilan yang tenang, dan tanpa terburu-buru.',
  },
];

export default function LandingPage() {
  const [selectedQuickMood, setSelectedQuickMood] = useState<MoodScore | null>(null);
  const [moodSavedNotice, setMoodSavedNotice] = useState(false);

  useEffect(() => {
    const today = getTodayCheckin();
    if (today) {
      setSelectedQuickMood(today.mood);
    }
  }, []);

  const moodOptions: Array<{ id: MoodScore; label: string; color: string }> = [
    { id: 'sangat_baik', label: 'Bertenaga', color: '#B8F34A' },
    { id: 'baik', label: 'Cukup Baik', color: '#C7D3FF' },
    { id: 'netral', label: 'Biasa Saja', color: '#FFD84D' },
    { id: 'berat', label: 'Berat', color: '#FF8A3D' },
    { id: 'kewalahan', label: 'Kewalahan', color: '#FF5252' },
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
      {/* 1. EDITORIAL HERO (PRD-DESIGN.md section 15) */}
      <section className="pt-10 sm:pt-16 lg:pt-20" aria-labelledby="judul-utama">
        <PageContainer size="default">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="animate-reveal-up inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#B8F34A] border-2 border-[#151515] text-[#151515] text-sm font-bold shadow-[2px_2px_0px_#151515]">
                <ShieldCheck className="w-4 h-4 text-[#151515]" aria-hidden="true" />
                <span>100% anonim, tanpa akun</span>
              </div>

              {/* Display Headline per PRD-DESIGN.md */}
              <h1 id="judul-utama" className="animate-reveal-up [animation-delay:80ms] text-[2rem] sm:text-5xl lg:text-[4rem] font-bold text-[#151515] tracking-[-0.03em] leading-[1.05]">
                Gak harus <br />
                beres semuanya <br />
                <span className="text-[#2B51E6] underline decoration-[#B8F34A] decoration-4 underline-offset-4">hari ini.</span>
              </h1>

              <p className="animate-reveal-up [animation-delay:160ms] text-lg sm:text-xl text-[#4A453E] max-w-[34rem] font-medium leading-[1.45]">
                Kalau hari ini terasa berat, kamu tidak sendirian. Rehat sebentar, bercerita tanpa dihakimi, lalu melangkah pelan-pelan.
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
                  Mulai tanpa akun
                </Button>

                <Button
                  href="/crisis"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  icon={<PhoneCall className="w-4 h-4 text-[#B3261E]" />}
                  className="font-bold flex-1 sm:flex-initial"
                >
                  Bantuan darurat
                </Button>
              </div>

              {/* QUICK MOOD CHECK-IN WIDGET ON LANDING */}
              <div className="animate-reveal-up [animation-delay:240ms] mt-2 p-4 sm:p-5 rounded-[6px] bg-white border-2 border-[#151515] shadow-[3px_3px_0px_#151515] space-y-3 max-w-xl" role="group" aria-labelledby="label-mood-cepat">
                <div className="flex items-center justify-between">
                  <span id="label-mood-cepat" className="text-base font-bold text-[#151515] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#3357EE]" aria-hidden="true" />
                    Apa kabar hatimu hari ini? Ketuk salah satu.
                  </span>
                </div>
                <p role="status" aria-live="polite" className="min-h-[1.5rem] text-sm font-bold text-[#151515]">
                  {moodSavedNotice && (
                    <span className="inline-flex items-center gap-1 bg-[#B8F34A] px-2 py-0.5 rounded-[2px] border border-[#151515]">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Tersimpan di perangkat ini
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                  {moodOptions.map((m) => {
                    const isSelected = selectedQuickMood === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleQuickMoodClick(m.id)}
                        aria-pressed={isSelected}
                        style={{
                          backgroundColor: isSelected ? m.color : '#FFFFFF',
                        }}
                        className={`py-2.5 px-1.5 rounded-[4px] border-2 border-[#151515] flex flex-col items-center justify-center gap-1 transition-[transform,box-shadow,background-color] duration-200 ease-spring cursor-pointer min-h-[76px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2 ${isSelected
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
                  Pilihanmu hanya tersimpan di perangkat ini.
                </p>
              </div>

            </div>

            {/* Right Column: Abstract Colorful Neo-Brutalist Composition */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end animate-reveal-up [animation-delay:320ms]">
              <div className="bezel w-full max-w-[348px] sm:max-w-[388px] shadow-[6px_6px_0px_#151515]">
              <div className="bezel-core relative p-6 bg-[#3357EE] space-y-4 text-left text-white">
                <div className="inline-block px-2.5 py-1 bg-[#B8F34A] text-[#151515] border-2 border-[#151515] font-bold text-sm rounded-[4px] shadow-[2px_2px_0px_#151515]">
                  Ruang aman anonim
                </div>

                <p className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] leading-[1.15]">
                  Tenang. <br />
                  Semua bisa <br />
                  diurai perlahan.
                </p>

                <p className="text-base text-white leading-relaxed">
                  Dengar.in bukan diagnosis medis, melainkan teman refleksi yang mendengarkan tanpa menghakimi dan menemanimu mengambil satu langkah kecil hari ini.
                </p>

                {/* Sub-card composition element */}
                <div className="p-3.5 bg-white text-[#151515] border-2 border-[#151515] shadow-[3px_3px_0px_#151515] rounded-[4px] space-y-1 md:-mx-2 md:translate-y-1">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Misi hari ini</span>
                    <span className="text-[#2B51E6] tabular-nums">5 menit</span>
                  </div>
                  <p className="text-base text-[#59544D] leading-relaxed">
                    “Berhenti sejenak. Tarik napas 4 detik, embuskan pelan 4 detik. Tidak perlu terburu-buru.”
                  </p>
                </div>
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
              Tiga hal yang sering terasa berat
            </h2>
            <p className="text-base text-[#59544D] leading-relaxed max-w-[65ch]">
              Beban-beban ini nyata, dan kamu tidak perlu memikulnya dalam diam.
            </p>
          </Reveal>

          {/* Asymmetric bento: the first pillar leads, the other two stack beside it */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 gap-6">
            {topicPillarsList.map((pillar, index) => {
              const Icon = pillar.id === 'finance' ? Coins : pillar.id === 'trauma' ? HeartHandshake : ShieldCheck;
              const isLead = index === 0;
              const surface = PILLAR_SURFACES[index % PILLAR_SURFACES.length];
              return (
                <Reveal
                  key={pillar.id}
                  delay={index * 80}
                  className={`text-left flex flex-col justify-between border-2 border-[#151515] rounded-[8px] ${surface.tile} ${
                    isLead
                      ? 'md:col-span-2 lg:col-span-7 lg:row-span-2 p-7 sm:p-10 gap-8 shadow-[4px_4px_0px_#151515]'
                      : 'lg:col-span-5 p-6 sm:p-7 gap-5 shadow-[3px_3px_0px_#151515]'
                  }`}
                >
                  <div className={isLead ? 'space-y-5' : 'space-y-3'}>
                    <div
                      className={`rounded-[4px] text-[#151515] border-2 border-[#151515] flex items-center justify-center shadow-[2px_2px_0px_#151515] ${surface.icon} ${
                        isLead ? 'w-14 h-14' : 'w-10 h-10'
                      }`}
                    >
                      <Icon className={isLead ? 'w-7 h-7' : 'w-5 h-5'} aria-hidden="true" />
                    </div>
                    <div className="space-y-1.5">
                      <h3
                        className={`font-bold text-[#151515] ${
                          isLead
                            ? 'text-2xl sm:text-[2rem] tracking-[-0.02em] leading-[1.15]'
                            : 'text-xl tracking-[-0.01em] leading-[1.25]'
                        }`}
                      >
                        {pillar.label}
                      </h3>
                      <p className={`text-base font-semibold leading-snug ${surface.tagline}`}>
                        {pillar.tagline}
                      </p>
                    </div>
                    <p className={`leading-relaxed ${surface.body} ${isLead ? 'text-base sm:text-lg max-w-[32rem]' : 'text-base'}`}>
                      {pillar.description}
                    </p>
                  </div>

                  <div className={`pt-4 border-t flex items-center justify-between text-sm font-semibold text-[#151515] ${surface.rule}`}>
                    <span>{pillar.isSensitive ? 'Opsi lewati tersedia' : 'Misi mandiri harian'}</span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* 3. FOUR ADAPTIVE AGE DEMOGRAPHICS */}
      <section aria-labelledby="judul-usia">
        <PageContainer size="default">
          <Reveal className="max-w-2xl space-y-3 mb-10 sm:mb-12">
            <h2 id="judul-usia" className="text-[1.75rem] sm:text-4xl font-bold text-[#151515] tracking-[-0.02em] leading-[1.15]">
              Untuk siapa pun, di usia berapa pun
            </h2>
            <p className="text-base text-[#59544D] leading-relaxed">
              Bahasa dan pertanyaan kami sesuaikan supaya terasa dekat dan nyaman untukmu.
            </p>
          </Reveal>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 text-left">
            {AGE_GROUPS.map((group, index) => (
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
              <span className="inline-block text-sm font-bold text-white bg-[#D32F2F] px-2.5 py-1 rounded-[4px] border-2 border-[#151515] shadow-[1px_1px_0px_#151515]">
                Pintu keamanan pertama
              </span>
              <h2 id="judul-krisis" className="text-2xl sm:text-[1.75rem] font-bold text-[#151515] tracking-[-0.01em] leading-[1.2] pt-1">
                Kalau terasa terlalu berat, bantuan manusia langsung ada
              </h2>
              <p className="text-base sm:text-base text-[#4A453E] leading-relaxed">
                Kalau tulisanmu menunjukkan kamu sedang dalam bahaya atau ingin melukai diri, kami langsung
                menghentikan alur biasa dan menampilkan kontak bantuan: Healing119 dari Kemenkes (119 ext 8) dan
                LISA Helpline. Deteksinya memakai aturan tetap, bukan AI, jadi tidak ada yang menunda bantuan untukmu.
                Kamu penting, dan kamu tidak harus melewatinya sendirian.
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
                Bantuan darurat
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
