'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Coins,
  Lock,
  PhoneCall,
  Shield,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer, GlassCard, SoftCard, Button, Badge } from '@/components/ui';
import { TOPIC_PILLARS } from '@dengarin/config';
import { initAnonymousSession, saveDailyCheckin } from '@/lib/storage';
import type { MoodScore } from '@dengarin/types';

export default function LandingPage() {
  const [selectedQuickMood, setSelectedQuickMood] = useState<MoodScore | null>(null);
  const [moodSavedNotice, setMoodSavedNotice] = useState(false);

  const moodOptions: Array<{ id: MoodScore; emoji: string; label: string }> = [
    { id: 'sangat_baik', emoji: '😊', label: 'Bertenaga' },
    { id: 'baik', emoji: '🙂', label: 'Stabil' },
    { id: 'netral', emoji: '😐', label: 'Biasa Saja' },
    { id: 'berat', emoji: '😟', label: 'Terasa Berat' },
    { id: 'kewalahan', emoji: '😞', label: 'Kewalahan' },
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
      {/* 1. EDITORIAL HERO WITH QUICK MOOD INTERACTION */}
      <section className="pt-8 sm:pt-14">
        <PageContainer size="default">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-terracotta-100/90 border border-terracotta-200/80 text-terracotta-900 text-xs font-semibold shadow-soft-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-terracotta-600" />
                <span>Ruang Aman, Asesmen Adaptif, & Rujukan Kesehatan Mental</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-sand-900 tracking-tight leading-[1.14]">
                Ruang Aman untuk <br />
                <span className="text-terracotta-500">Meredakan Beban</span> Pikiranmu.
              </h1>

              <p className="text-base sm:text-lg text-sand-700 max-w-xl font-normal leading-relaxed">
                Dengar.in mendampingi kamu memahami beban mental tanpa penghakiman. Melalui asesmen
                adaptif non-diagnostik, misi pemulihan mandiri, serta akses cepat ke rujukan profesional
                terverifikasi.
              </p>

              {/* QUICK MOOD CHECK-IN WIDGET ON LANDING */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-sand-200 shadow-soft-xs space-y-2.5 max-w-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sand-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                    Quick Mood Check-in: Bagaimana perasaanmu saat ini?
                  </span>
                  {moodSavedNotice && (
                    <span className="text-[11px] font-semibold text-sage-600 flex items-center gap-1 animate-fadeIn">
                      <CheckCircle2 className="w-3 h-3" /> Tercatat aman
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
                        className={`py-2.5 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer min-h-[56px] ${
                          isSelected
                            ? 'border-terracotta-500 bg-terracotta-50/90 text-terracotta-900 font-bold shadow-soft-xs ring-1 ring-terracotta-500'
                            : 'border-sand-200 bg-sand-50/60 hover:bg-white hover:border-sand-300 text-sand-800'
                        }`}
                      >
                        <span className="text-xl select-none" aria-hidden="true">{m.emoji}</span>
                        <span className="text-[10px] text-center leading-tight truncate w-full">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link href="/consent" className="flex-1 sm:flex-initial">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<ArrowRight className="w-4 h-4" />}
                    className="flex-row-reverse shadow-soft-sm touch-target-primary"
                  >
                    Mulai Asesmen Adaptif (Anonim)
                  </Button>
                </Link>

                <Link href="/resources" className="flex-1 sm:flex-initial">
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    icon={<PhoneCall className="w-4 h-4 text-terracotta-600" />}
                    className="touch-target-primary"
                  >
                    Daftar Bantuan Krisis
                  </Button>
                </Link>
              </div>

              {/* Anonymity Guarantee Reassurance */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-sand-600 font-medium">
                <Lock className="w-3.5 h-3.5 text-terracotta-600 shrink-0" />
                <span>100% Bebas Registrasi • Tanpa Nama • Tanpa Email • Identitas Alias Anonim</span>
              </div>
            </div>

            {/* Right Column: Meditative Orb & Floating Safety Element */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-terracotta-100/60 blur-xl animate-pulse" />
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-terracotta-200/70 bg-gradient-to-tr from-terracotta-100/30 to-honey-100/50 flex items-center justify-center">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-terracotta-300/60 bg-gradient-to-bl from-terracotta-50/60 to-white/80 flex items-center justify-center shadow-inner">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-terracotta-500 text-white flex flex-col items-center justify-center shadow-soft-lg transition-transform hover:scale-105 duration-300">
                      <Sparkles className="w-6 h-6 mb-1 text-honey-200" />
                      <span className="text-xs font-bold tracking-wider uppercase text-cream">
                        Ruang Aman
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Contextual Glass Element: Anonymous Identity */}
                <GlassCard
                  tint="calm"
                  className="absolute -bottom-4 -left-2 sm:-left-6 p-4 max-w-[240px] shadow-glass"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sage-500 animate-ping" />
                    <span className="text-xs font-bold text-sand-900">Identitas Alias Lokal</span>
                  </div>
                  <p className="text-[11px] text-sand-700 mt-1 leading-tight">
                    Tersimpan di peramban Anda dengan nama ramah (cth. &quot;Bunga Tenang #2481&quot;).
                  </p>
                </GlassCard>

                {/* Floating Safety Badge (Top Right) */}
                <GlassCard
                  tint="none"
                  className="absolute -top-3 -right-2 sm:-right-4 px-3.5 py-2 flex items-center gap-2 shadow-glass"
                >
                  <Shield className="w-4 h-4 text-terracotta-600" />
                  <span className="text-xs font-semibold text-sand-900">Filter Krisis Bebas AI</span>
                </GlassCard>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 2. THREE PRIMARY TOPIC PILLARS (PRD 2.0 Core Focus) */}
      <section>
        <PageContainer size="default">
          <div className="text-center space-y-3 mb-10">
            <Badge variant="calm" size="md">
              Pilar Asesmen & Pendampingan
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
              Tiga Topik Utama Pendampingan
            </h2>
            <p className="text-xs sm:text-sm text-sand-700 max-w-xl mx-auto leading-relaxed">
              Dengar.in dirancang khusus untuk memahami beban nyata yang kerap diabaikan atau diselimuti rasa malu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topicPillarsList.map((pillar) => {
              const Icon = pillar.id === 'finance' ? Coins : pillar.id === 'trauma' ? HeartHandshake : ShieldCheck;
              return (
                <SoftCard
                  key={pillar.id}
                  variant="white"
                  elevation="low"
                  hoverEffect
                  className="p-6 space-y-4 text-left flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-terracotta-50 text-terracotta-600 border border-terracotta-200/80 flex items-center justify-center shadow-soft-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base text-sand-900 leading-snug">
                        {pillar.label}
                      </h3>
                      <p className="text-xs font-semibold text-terracotta-700">
                        {pillar.tagline}
                      </p>
                    </div>
                    <p className="text-xs text-sand-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-sand-100 flex items-center justify-between text-xs text-sand-500">
                    <span>{pillar.isSensitive ? 'Tersedia Opsi Lewati' : 'Misi Mandiri Harian'}</span>
                    <span className="font-bold text-terracotta-600">Pelajari &rarr;</span>
                  </div>
                </SoftCard>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* 3. FOUR ADAPTIVE AGE DEMOGRAPHICS */}
      <section className="bg-sand-100/60 border-y border-sand-200/80 py-12">
        <PageContainer size="default">
          <div className="text-center space-y-2 mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-sand-900 tracking-tight">
              Menjangkau Setiap Rentang Usia
            </h3>
            <p className="text-xs sm:text-sm text-sand-600 max-w-lg mx-auto">
              Bahasa dan kedalaman asesmen disesuaikan agar selalu relevan dan nyaman bagi generasimu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-white border border-sand-200/80 shadow-soft-xs space-y-1">
              <span className="text-xs font-extrabold text-terracotta-600">15–17 Tahun</span>
              <h4 className="font-bold text-sm text-sand-900">Remaja & Pelajar</h4>
              <p className="text-[11px] text-sand-600 leading-relaxed">
                Perlindungan khusus anak, bahasa ramah sebaya, dan rujukan Teencare/KPAI.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-sand-200/80 shadow-soft-xs space-y-1">
              <span className="text-xs font-extrabold text-terracotta-600">18–29 Tahun</span>
              <h4 className="font-bold text-sm text-sand-900">Dewasa Muda</h4>
              <p className="text-[11px] text-sand-600 leading-relaxed">
                Krisis seperempat abad, skripsi, ekspektasi karir awal, dan relasi mandiri.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-sand-200/80 shadow-soft-xs space-y-1">
              <span className="text-xs font-extrabold text-terracotta-600">30–49 Tahun</span>
              <h4 className="font-bold text-sm text-sand-900">Dewasa & Keluarga</h4>
              <p className="text-[11px] text-sand-600 leading-relaxed">
                Generasi sandwich, beban tanggungan nafkah, dan burnout karir mapan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-sand-200/80 shadow-soft-xs space-y-1">
              <span className="text-xs font-extrabold text-terracotta-600">50+ Tahun</span>
              <h4 className="font-bold text-sm text-sand-900">Senior & Lansia</h4>
              <p className="text-[11px] text-sand-600 leading-relaxed">
                Mode keterbacaan teks besar (18px+), navigasi tenang, dan refleksi hidup bermakna.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 4. DETERMINISTIC CRISIS SAFETY GATE COMMITMENT */}
      <section>
        <PageContainer size="default">
          <div className="rounded-3xl border border-red-200/80 bg-red-50/70 p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-left">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-crisis bg-red-100/90 px-2.5 py-1 rounded-full border border-red-200">
                Pintu Keamanan Pertama
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-sand-900 pt-1">
                Filter Krisis Deterministik Tanpa Keterlibatan AI
              </h3>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Jika sistem mendeteksi sinyal bahaya akut atau pikiran melukai diri, sistem segera
                menghentikan alur asesmen normal dan langsung menyajikan kontak darurat Kemenkes Sejiwa
                (119 ext 8) dan Lisa Helpline tanpa penundaan bot atau model bahasa.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <Link href="/crisis" className="block w-full sm:w-auto">
                <Button variant="crisis" size="md" fullWidth icon={<PhoneCall className="w-4 h-4" />}>
                  Akses Saluran Darurat
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
