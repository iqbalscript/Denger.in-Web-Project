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
import { PageContainer, Button, Badge } from '@/components/ui';
import { TOPIC_PILLARS } from '@dengarin/config';
import { initAnonymousSession, saveDailyCheckin, getTodayCheckin } from '@/lib/storage';
import type { MoodScore } from '@dengarin/types';

export default function LandingPage() {
  const [selectedQuickMood, setSelectedQuickMood] = useState<MoodScore | null>(null);
  const [moodSavedNotice, setMoodSavedNotice] = useState(false);

  useEffect(() => {
    const today = getTodayCheckin();
    if (today) {
      setSelectedQuickMood(today.mood);
    }
  }, []);

  const moodOptions: Array<{ id: MoodScore; emoji: string; label: string; color: string }> = [
    { id: 'sangat_baik', emoji: '😊', label: 'Bertenaga', color: '#B8F34A' },
    { id: 'baik', emoji: '🙂', label: 'Stabil', color: '#93C5FD' },
    { id: 'netral', emoji: '😐', label: 'Biasa Saja', color: '#FFD84D' },
    { id: 'berat', emoji: '😟', label: 'Berat', color: '#FF8A3D' },
    { id: 'kewalahan', emoji: '😞', label: 'Kewalahan', color: '#FF5252' },
  ];

  const handleQuickMoodClick = (mood: MoodScore) => {
    setSelectedQuickMood(mood);
    const session = initAnonymousSession(false);
    saveDailyCheckin({
      id: Date.now().toString(),
      userId: session.userId,
      timestamp: new Date().toISOString(),
      mood,
      energyLevel: mood === 'sangat_baik' ? 9 : mood === 'baik' ? 7 : mood === 'netral' ? 5 : mood === 'berat' ? 3 : 2,
      stressorTags: ['Quick Mood Landing Check-in'],
    });
    setMoodSavedNotice(true);
    setTimeout(() => {
      setMoodSavedNotice(false);
    }, 3000);
  };

  const topicPillarsList = Object.values(TOPIC_PILLARS);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. EDITORIAL HERO (PRD-DESIGN.md section 15) */}
      <section className="pt-8 sm:pt-14">
        <PageContainer size="default">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#B8F34A] border-2 border-[#151515] text-[#151515] text-xs font-bold shadow-[2px_2px_0px_#151515]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#151515]" />
                <span className="uppercase tracking-wider">100% Anonim • Tanpa Akun • Tanpa Jejak</span>
              </div>

              {/* Display Headline per PRD-DESIGN.md */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#151515] tracking-tight leading-[1.05] uppercase">
                GAK HARUS <br />
                BERES SEMUANYA <br />
                <span className="text-[#4169FF] underline decoration-[#B8F34A] decoration-4 underline-offset-4">HARI INI.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#59544D] max-w-xl font-medium leading-relaxed">
                Tempat aman buat rehat sejenak, mengurai beban pikiran tanpa takut dihakimi, dan kembali melangkah pelan-pelan. Mulai dari satu hal kecil.
              </p>

              {/* QUICK MOOD CHECK-IN WIDGET ON LANDING */}
              <div className="p-4 sm:p-5 rounded-[6px] bg-white border-2 border-[#151515] shadow-[3px_3px_0px_#151515] space-y-3 max-w-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#151515] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#4169FF]" />
                    Gimana perasaanmu saat ini?
                  </span>
                  {moodSavedNotice && (
                    <span className="text-[11px] font-bold text-[#151515] bg-[#B8F34A] px-2 py-0.5 rounded-[2px] border border-[#151515] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Tersimpan
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-2 pt-1">
                  {moodOptions.map((m) => {
                    const isSelected = selectedQuickMood === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleQuickMoodClick(m.id)}
                        style={{
                          backgroundColor: isSelected ? m.color : '#FFFFFF',
                        }}
                        className={`py-2 px-1 rounded-[4px] border-2 border-[#151515] flex flex-col items-center justify-center gap-1 transition-all duration-120 cursor-pointer min-h-[58px] ${
                          isSelected
                            ? 'shadow-[2px_2px_0px_#151515] -translate-x-[1px] -translate-y-[1px]'
                            : 'hover:bg-[#FFF8EF] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_#151515]'
                        }`}
                      >
                        <span className="text-xl select-none" aria-hidden="true">{m.emoji}</span>
                        <span className="text-[10px] text-center font-bold uppercase leading-tight truncate w-full text-[#151515]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Button
                  href="/consent"
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="flex-row-reverse text-[#151515] font-bold uppercase tracking-wide flex-1 sm:flex-initial"
                >
                  Mulai Tanpa Akun →
                </Button>

                <Button
                  href="/resources"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  icon={<PhoneCall className="w-4 h-4 text-[#FF5252]" />}
                  className="font-bold uppercase tracking-wide flex-1 sm:flex-initial"
                >
                  Bantuan Darurat
                </Button>
              </div>

              {/* Anonymity Guarantee Reassurance */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#59544D] font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-[#4169FF] shrink-0" />
                <span>Tanpa Nama • Tanpa Email • Data Privat di Perangkat Ini</span>
              </div>
            </div>

            {/* Right Column: Abstract Colorful Neo-Brutalist Composition */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] p-6 bg-[#4169FF] border-2 border-[#151515] shadow-[6px_6px_0px_#151515] rounded-[8px] space-y-4 text-left text-white">
                <div className="inline-block px-2.5 py-1 bg-[#B8F34A] text-[#151515] border-2 border-[#151515] font-bold text-xs uppercase tracking-wider rounded-[4px] shadow-[2px_2px_0px_#151515]">
                  Ruang Aman Anonim
                </div>

                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight">
                  Tenang. <br />
                  Semua Bisa <br />
                  Diurai Perlahan.
                </h3>

                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
                  Bukan diagnosis medis. Dengar.in adalah kawan refleksi objektif untuk membantumu mengambil satu langkah nyata hari ini.
                </p>

                {/* Sub-card composition element */}
                <div className="p-3.5 bg-white text-[#151515] border-2 border-[#151515] shadow-[3px_3px_0px_#151515] rounded-[4px] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold uppercase">
                    <span>Misi Hari Ini</span>
                    <span className="text-[#4169FF]">5 Menit</span>
                  </div>
                  <p className="text-xs text-[#59544D] font-medium">
                    &quot;Berhenti sejenak, tarik napas 4 detik, hembuskan 4 detik.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 2. THREE PRIMARY TOPIC PILLARS */}
      <section>
        <PageContainer size="default">
          <div className="text-center space-y-2 mb-10">
            <Badge variant="cobalt" size="md">
              Fokus Utama
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#151515] tracking-tight uppercase">
              Tiga Topik Utama Pendampingan
            </h2>
            <p className="text-xs sm:text-sm text-[#59544D] max-w-xl mx-auto leading-relaxed font-medium">
              Dengar.in dirancang khusus untuk memahami beban nyata yang kerap diabaikan atau diselimuti rasa malu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topicPillarsList.map((pillar) => {
              const Icon = pillar.id === 'finance' ? Coins : pillar.id === 'trauma' ? HeartHandshake : ShieldCheck;
              return (
                <div
                  key={pillar.id}
                  className="p-6 space-y-4 text-left flex flex-col justify-between bg-white border-2 border-[#151515] shadow-[3px_3px_0px_#151515] rounded-[6px] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] transition-all duration-120"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-[4px] bg-[#B8F34A] text-[#151515] border-2 border-[#151515] flex items-center justify-center shadow-[2px_2px_0px_#151515]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-[#151515] leading-snug uppercase">
                        {pillar.label}
                      </h3>
                      <p className="text-xs font-bold text-[#4169FF] uppercase tracking-wider">
                        {pillar.tagline}
                      </p>
                    </div>
                    <p className="text-xs text-[#59544D] leading-relaxed font-medium">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t-2 border-[#151515]/10 flex items-center justify-between text-xs font-bold text-[#151515]">
                    <span>{pillar.isSensitive ? 'Opsi Lewati Tersedia' : 'Misi Mandiri Harian'}</span>
                    <span className="text-[#4169FF]">Pelajari &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* 3. FOUR ADAPTIVE AGE DEMOGRAPHICS */}
      <section className="bg-white border-y-2 border-[#151515] py-12">
        <PageContainer size="default">
          <div className="text-center space-y-2 mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight uppercase">
              Menjangkau Setiap Rentang Usia
            </h3>
            <p className="text-xs sm:text-sm text-[#59544D] max-w-lg mx-auto font-medium">
              Bahasa dan kedalaman asesmen disesuaikan agar selalu relevan dan nyaman bagi generasimu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-[4px] bg-[#FFF8EF] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] space-y-1">
              <span className="text-xs font-bold text-[#4169FF] uppercase tracking-wider">15–17 Tahun</span>
              <h4 className="font-bold text-sm text-[#151515] uppercase">Remaja & Pelajar</h4>
              <p className="text-[11px] text-[#59544D] leading-relaxed font-medium">
                Perlindungan khusus anak, bahasa ramah sebaya, dan rujukan Teencare/KPAI.
              </p>
            </div>

            <div className="p-4 rounded-[4px] bg-[#FFF8EF] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] space-y-1">
              <span className="text-xs font-bold text-[#4169FF] uppercase tracking-wider">18–29 Tahun</span>
              <h4 className="font-bold text-sm text-[#151515] uppercase">Dewasa Muda</h4>
              <p className="text-[11px] text-[#59544D] leading-relaxed font-medium">
                Krisis seperempat abad, skripsi, ekspektasi karir awal, dan relasi mandiri.
              </p>
            </div>

            <div className="p-4 rounded-[4px] bg-[#FFF8EF] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] space-y-1">
              <span className="text-xs font-bold text-[#4169FF] uppercase tracking-wider">30–49 Tahun</span>
              <h4 className="font-bold text-sm text-[#151515] uppercase">Dewasa & Keluarga</h4>
              <p className="text-[11px] text-[#59544D] leading-relaxed font-medium">
                Generasi sandwich, beban tanggungan nafkah, dan burnout karir mapan.
              </p>
            </div>

            <div className="p-4 rounded-[4px] bg-[#FFF8EF] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] space-y-1">
              <span className="text-xs font-bold text-[#4169FF] uppercase tracking-wider">50+ Tahun</span>
              <h4 className="font-bold text-sm text-[#151515] uppercase">Senior & Lansia</h4>
              <p className="text-[11px] text-[#59544D] leading-relaxed font-medium">
                Mode keterbacaan teks besar (18px+), navigasi tenang, dan refleksi hidup bermakna.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 4. DETERMINISTIC CRISIS SAFETY GATE COMMITMENT */}
      <section>
        <PageContainer size="default">
          <div className="rounded-[6px] border-2 border-[#151515] bg-[#FFEBEB] p-6 sm:p-10 shadow-[4px_4px_0px_#151515] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-left">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#FF5252] px-2.5 py-1 rounded-[4px] border-2 border-[#151515] shadow-[1px_1px_0px_#151515]">
                Pintu Keamanan Pertama
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#151515] uppercase pt-1">
                Filter Krisis Deterministik Tanpa Keterlibatan AI
              </h3>
              <p className="text-xs sm:text-sm text-[#59544D] leading-relaxed font-medium">
                Jika sistem mendeteksi sinyal bahaya akut atau pikiran melukai diri, sistem segera
                menghentikan alur asesmen normal dan langsung menyajikan kontak darurat Kemenkes Sejiwa
                (119 ext 8) dan Lisa Helpline tanpa penundaan bot atau model bahasa.
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
                Akses Saluran Darurat
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
