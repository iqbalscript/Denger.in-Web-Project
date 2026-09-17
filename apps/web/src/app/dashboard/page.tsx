'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Smile,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Key,
  BarChart3,
  Users,
  PhoneCall,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  getAnonymousSession,
  initAnonymousSession,
  getTodayMission,
  getTodayCheckin,
  isTodayMissionCompleted,
} from '@/lib/storage';
import { DOMAIN_CONFIGS, AGE_BRACKET_CONFIGS, OCCUPATION_OPTIONS } from '@dengarin/config';
import type { AnonymousUserSession, DailyMission, DailyCheckin } from '@dengarin/types';
import { PageContainer, SoftCard, Button, Badge } from '@/components/ui';

export default function DashboardPage() {
  const [session, setSession] = useState<AnonymousUserSession | null>(null);
  const [todayMission, setTodayMission] = useState<DailyMission | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [isMissionDone, setIsMissionDone] = useState<boolean>(false);

  useEffect(() => {
    let current = getAnonymousSession();
    if (!current) {
      current = initAnonymousSession(true);
    }
    setSession(current);

    const mission = getTodayMission(current.primaryDomain);
    setTodayMission(mission);
    setIsMissionDone(isTodayMissionCompleted());
    setTodayCheckin(getTodayCheckin());
  }, []);

  const ageInfo = session?.ageBracket ? AGE_BRACKET_CONFIGS[session.ageBracket] : null;
  const domainInfo = session?.primaryDomain ? DOMAIN_CONFIGS[session.primaryDomain] : null;
  const occupationInfo = session?.occupation
    ? OCCUPATION_OPTIONS.find((o) => o.id === session.occupation)?.label
    : null;

  const shortId = session?.userId ? session.userId.slice(0, 8) : '8210-anon';
  const currentDay = session?.currentDay || 1;
  const assessment = session?.assessmentResult;

  return (
    <PageContainer size="default">
      <div className="space-y-10">
        {/* 1. HEADER / GREETING (Clean editorial layout, NOT a giant card) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-200/80 pb-6">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-calm-700 bg-calm-100 px-2.5 py-0.5 rounded-full">
                Sesi Terenkripsi Lokal
              </span>
              <span className="text-xs text-sand-500 font-mono">#{shortId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-sand-900 tracking-tight">
              Selamat Datang di Ruang Tenangmu
            </h1>
            <p className="text-xs sm:text-sm text-sand-600 max-w-xl">
              {domainInfo
                ? `Fokus Pendampingan: ${domainInfo.label} — ${domainInfo.description}`
                : 'Satu langkah kecil yang bermakna untuk menstabilkan harimu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {ageInfo && <Badge variant="sand" size="sm">{ageInfo.label}</Badge>}
            {occupationInfo && <Badge variant="sand" size="sm">{occupationInfo}</Badge>}
            <Badge variant="calm" size="sm">Hari ke-{currentDay} dari 14</Badge>
          </div>
        </div>

        {/* 2. MAIN COMPOSITION: TODAY'S MISSION (Primary) + CHECK-IN & RHYTHM (Secondary) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: TODAY'S MISSION (Dominant Action Hero Card - 8 Cols) */}
          <div className="lg:col-span-8">
            <SoftCard
              variant="white"
              elevation="medium"
              className="p-6 sm:p-8 space-y-6 border-calm-200/80 bg-gradient-to-br from-white via-white to-calm-50/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-calm-800 bg-calm-100 px-3 py-1 rounded-full border border-calm-200/80">
                  Misi Utama Hari Ini • Hari #{currentDay}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-sand-600 font-medium">
                  <Clock className="w-3.5 h-3.5 text-calm-600" />
                  <span>~{todayMission?.durationMinutes || 5} Menit</span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <h2 className="text-xl sm:text-2xl font-extrabold text-sand-900 tracking-tight">
                  {todayMission?.title || 'Misi Penstabilan Emosi Harian'}
                </h2>
                <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-2xl">
                  {todayMission?.summary ||
                    'Ambil jeda sejenak untuk menenangkan sistem saraf dan mengembalikan kendali kesadaranmu.'}
                </p>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-sand-200/80">
                <div className="text-xs text-sand-600 font-medium flex items-center gap-2">
                  {isMissionDone ? (
                    <span className="inline-flex items-center gap-1.5 text-calm-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-calm-700" />
                      Misi hari ini telah selesai dijalankan
                    </span>
                  ) : (
                    <span>3 langkah terstruktur disiapkan untukmu</span>
                  )}
                </div>

                <Link href="/mission" className="shrink-0">
                  <Button
                    variant={isMissionDone ? 'secondary' : 'primary'}
                    size="lg"
                    fullWidth
                    icon={<ArrowRight className="w-4 h-4" />}
                    className="flex-row-reverse shadow-soft-xs"
                  >
                    {isMissionDone ? 'Tinjau Kembali Langkah Misi' : 'Mulai Misi Sekarang'}
                  </Button>
                </Link>
              </div>
            </SoftCard>
          </div>

          {/* RIGHT: CONTEXT WIDGETS (Check-in Status + Weekly Rhythm - 4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Check-in Widget */}
            <SoftCard variant="white" elevation="low" className="p-5 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-900 uppercase tracking-wider">
                  Check-in Emosi
                </span>
                <Smile className="w-4 h-4 text-calm-700" />
              </div>

              {todayCheckin ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {todayCheckin.mood === 'sangat_baik'
                        ? '😊'
                        : todayCheckin.mood === 'baik'
                        ? '🙂'
                        : todayCheckin.mood === 'netral'
                        ? '😐'
                        : todayCheckin.mood === 'berat'
                        ? '😟'
                        : '😞'}
                    </span>
                    <span className="text-xs font-bold text-sand-900 capitalize">
                      {todayCheckin.mood.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-sand-600">
                    Energi: {todayCheckin.energyLevel}/10 • Tercatat hari ini
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-sand-600 leading-snug">
                    Bagaimana perasaanmu saat ini? Catat suasana hati dalam 1 menit.
                  </p>
                  <Link href="/checkin" className="block">
                    <Button variant="outline" size="sm" fullWidth icon={<Smile className="w-3.5 h-3.5" />}>
                      Check-in Sekarang
                    </Button>
                  </Link>
                </div>
              )}
            </SoftCard>

            {/* Weekly Rhythm / Continuity Indicator */}
            <SoftCard variant="sand" elevation="flat" className="p-4 space-y-2 border-sand-200 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-sand-900">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-calm-700" />
                  Ritme Pekan Ini
                </span>
                <span className="text-calm-800 font-semibold">Pekan 1</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const isPast = d < currentDay;
                  const isCurrent = d === currentDay;
                  return (
                    <div
                      key={d}
                      className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                        isCurrent
                          ? 'bg-calm-700 text-white shadow-soft-xs ring-2 ring-calm-700/30'
                          : isPast
                          ? 'bg-calm-200 text-calm-900'
                          : 'bg-sand-200/60 text-sand-400'
                      }`}
                      title={`Hari ${d}`}
                    >
                      H{d}
                    </div>
                  );
                })}
              </div>
            </SoftCard>
          </div>
        </div>

        {/* 3. SECONDARY COMPOSITION: PROGRESS OVERVIEW & SUPPORT TOOLKIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Your Progress / Assessment Synthesis (6 Cols) */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sand-900">
              Perkembangan & Jalur Pemulihan
            </h3>

            <SoftCard variant="white" elevation="low" className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-calm-700 bg-calm-50 px-2.5 py-1 rounded-full border border-calm-100">
                  {assessment?.recommendedPathId ? 'Jalur 14 Hari Aktif' : 'Tahap Awal'}
                </span>
                {assessment && (
                  <Badge
                    variant={assessment.normalizedLevel === 'high' ? 'warm' : 'calm'}
                    size="sm"
                  >
                    Beban: {assessment.normalizedLevel === 'high' ? 'Tinggi' : assessment.normalizedLevel === 'moderate' ? 'Menengah' : 'Ringan'}
                  </Badge>
                )}
              </div>

              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                {assessment?.summaryFeedback ||
                  'Jalur pemulihan 14 hari dirancang untuk mendampingi ritme harianmu dengan langkah-langkah mikro yang terbukti aman.'}
              </p>

              <div className="pt-2 border-t border-sand-100 flex items-center justify-between">
                <Link
                  href="/report"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-calm-800 hover:text-calm-950 hover:underline"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-calm-700" />
                  <span>Lihat Sintesis Laporan Mingguan</span>
                </Link>
                <ArrowRight className="w-3.5 h-3.5 text-calm-700" />
              </div>
            </SoftCard>
          </div>

          {/* RIGHT: SUPPORT TOOLKIT (4 Compact Tiles - 6 Cols) */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sand-900">
              Kotak Alat Pendampingan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/journal" className="block focus-visible:outline-calm-700 rounded-2xl">
                <SoftCard variant="white" elevation="low" hoverEffect className="p-4 space-y-1.5 h-full">
                  <div className="w-8 h-8 rounded-xl bg-calm-50 text-calm-700 flex items-center justify-center border border-calm-100">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-sand-900">Jurnal Privat Lokal</h4>
                  <p className="text-[11px] text-sand-600">Catat pikiran tanpa server.</p>
                </SoftCard>
              </Link>

              <Link href="/chat" className="block focus-visible:outline-calm-700 rounded-2xl">
                <SoftCard variant="white" elevation="low" hoverEffect className="p-4 space-y-1.5 h-full">
                  <div className="w-8 h-8 rounded-xl bg-calm-50 text-calm-700 flex items-center justify-center border border-calm-100">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-sand-900">Teman Bicara</h4>
                  <p className="text-[11px] text-sand-600">Bimbingan aksi terorkestrasi.</p>
                </SoftCard>
              </Link>

              <Link href="/resources" className="block focus-visible:outline-calm-700 rounded-2xl">
                <SoftCard variant="white" elevation="low" hoverEffect className="p-4 space-y-1.5 h-full">
                  <div className="w-8 h-8 rounded-xl bg-calm-50 text-calm-700 flex items-center justify-center border border-calm-100">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-sand-900">Direktori Bantuan</h4>
                  <p className="text-[11px] text-sand-600">Kontak resmi darurat & psikolog.</p>
                </SoftCard>
              </Link>

              <Link href="/forum" className="block focus-visible:outline-calm-700 rounded-2xl">
                <SoftCard variant="white" elevation="low" hoverEffect className="p-4 space-y-1.5 h-full">
                  <div className="w-8 h-8 rounded-xl bg-calm-50 text-calm-700 flex items-center justify-center border border-calm-100">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-sand-900">Ruang Cerita (Skeleton)</h4>
                  <p className="text-[11px] text-sand-600">Solidaritas sesama pengguna.</p>
                </SoftCard>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. TERTIARY UTILITY FOOTER (Recovery key & Crisis safety bar) */}
        <div className="pt-4 border-t border-sand-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sand-600">
          <Link
            href="/recovery"
            className="inline-flex items-center gap-1.5 font-medium hover:text-sand-900 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-calm-700" />
            <span>Simpan atau pulihkan sesi dengan 12-kata kunci</span>
          </Link>

          <Link
            href="/crisis"
            className="inline-flex items-center gap-1.5 text-crisis font-semibold hover:underline"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Butuh bantuan segera? Kemenkes Sejiwa 119 ext 8</span>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
