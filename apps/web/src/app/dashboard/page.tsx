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
import { PageContainer, Button } from '@/components/ui';

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

  const currentDay = session?.currentDay || 1;
  const assessment = session?.assessmentResult;

  return (
    <PageContainer size="default">
      <div className="space-y-8">
        {/* 1. HEADER / GREETING (Clean editorial layout, STRICT ZERO-PROFILE MANDATE) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-ink pb-6">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-ink bg-yellow px-2.5 py-0.5 rounded border border-ink shadow-hard-sm uppercase tracking-wider">
                100% ANONIM • TANPA AKUN
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none">
              GIMANA KEADAANMU HARI INI?
            </h1>
            <p className="text-xs sm:text-sm text-ink/80 max-w-xl font-medium">
              {domainInfo
                ? `Fokus Pendampingan: ${domainInfo.label} — ${domainInfo.description}`
                : 'Satu langkah kecil yang bermakna untuk menstabilkan harimu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {ageInfo && (
              <span className="text-xs font-black uppercase px-2.5 py-1 bg-white text-ink border-2 border-ink rounded shadow-hard-sm">
                {ageInfo.label}
              </span>
            )}
            {occupationInfo && (
              <span className="text-xs font-black uppercase px-2.5 py-1 bg-white text-ink border-2 border-ink rounded shadow-hard-sm">
                {occupationInfo}
              </span>
            )}
            <span className="text-xs font-black uppercase px-2.5 py-1 bg-lime text-ink border-2 border-ink rounded shadow-hard-sm">
              Hari ke-{currentDay} dari 14
            </span>
          </div>
        </div>

        {/* 2. MAIN COMPOSITION: TODAY'S MISSION (Primary) + CHECK-IN & RHYTHM (Secondary) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: TODAY'S MISSION (Dominant Action Hero Card - 8 Cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-6 shadow-hard text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-ink bg-yellow px-3 py-1 rounded border-2 border-ink shadow-hard-sm">
                  MISI UTAMA HARI INI • HARI #{currentDay}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-ink font-bold">
                  <Clock className="w-3.5 h-3.5 text-cobalt" />
                  <span>~{todayMission?.durationMinutes || 5} MENIT</span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight uppercase">
                  {todayMission?.title || 'MISI PENSTABILAN EMOSI HARIAN'}
                </h2>
                <p className="text-xs sm:text-sm text-ink/80 leading-relaxed max-w-2xl font-medium">
                  {todayMission?.summary ||
                    'Ambil jeda sejenak untuk menenangkan sistem saraf dan mengembalikan kendali kesadaranmu.'}
                </p>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t-2 border-ink">
                <div className="text-xs text-ink font-bold flex items-center gap-2">
                  {isMissionDone ? (
                    <span className="inline-flex items-center gap-1.5 text-ink bg-lime px-2.5 py-1 rounded border border-ink">
                      <CheckCircle2 className="w-4 h-4 text-ink" />
                      Misi hari ini telah selesai dijalankan
                    </span>
                  ) : (
                    <span>3 langkah terstruktur disiapkan untukmu</span>
                  )}
                </div>

                <Link href="/mission" className="shrink-0">
                  <Button
                    variant={isMissionDone ? 'outline' : 'primary'}
                    size="lg"
                    fullWidth
                    icon={<ArrowRight className="w-4 h-4" />}
                    className="flex-row-reverse"
                  >
                    {isMissionDone ? 'Tinjau Kembali Langkah Misi' : 'MULAI MISI SEKARANG →'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: CONTEXT WIDGETS (Check-in Status + Weekly Rhythm - 4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Check-in Widget */}
            <div className="bg-white border-2 border-ink rounded-lg p-5 space-y-3 text-left shadow-hard-sm">
              <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                <span className="text-xs font-black text-ink uppercase tracking-wider">
                  Check-in Emosi
                </span>
                <Smile className="w-4 h-4 text-cobalt" />
              </div>

              {todayCheckin ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
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
                    <span className="text-xs font-black text-ink uppercase tracking-wider">
                      {todayCheckin.mood.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink/70 font-medium">
                    Energi: {todayCheckin.energyLevel}/10 • Tercatat hari ini
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-ink/80 leading-snug font-medium">
                    Bagaimana perasaanmu saat ini? Catat suasana hati dalam 1 menit.
                  </p>
                  <Link href="/checkin" className="block">
                    <Button variant="outline" size="sm" fullWidth icon={<Smile className="w-3.5 h-3.5" />}>
                      CHECK-IN SEKARANG
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Weekly Rhythm / Continuity Indicator */}
            <div className="bg-white border-2 border-ink rounded-lg p-4 space-y-2 text-left shadow-hard-sm">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-ink border-b-2 border-ink pb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cobalt" />
                  Ritme Pekan Ini
                </span>
                <span className="bg-yellow px-1.5 py-0.5 rounded border border-ink text-[10px]">Pekan 1</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const isPast = d < currentDay;
                  const isCurrent = d === currentDay;
                  return (
                    <div
                      key={d}
                      className={`h-8 rounded flex items-center justify-center text-[10px] font-black border-2 border-ink transition-all ${
                        isCurrent
                          ? 'bg-cobalt text-white shadow-hard-sm'
                          : isPast
                          ? 'bg-lime text-ink'
                          : 'bg-paper text-ink/40'
                      }`}
                      title={`Hari ${d}`}
                    >
                      H{d}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECONDARY COMPOSITION: PROGRESS OVERVIEW & SUPPORT TOOLKIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Your Progress / Assessment Synthesis (6 Cols) */}
          <div className="lg:col-span-6 space-y-3 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-ink">
              PERKEMBANGAN &amp; JALUR PEMULIHAN
            </h3>

            <div className="bg-white border-2 border-ink rounded-lg p-6 space-y-4 shadow-hard-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-ink bg-yellow px-2.5 py-1 rounded border border-ink uppercase tracking-wider">
                  {assessment?.recommendedPathId ? 'Jalur 14 Hari Aktif' : 'Tahap Awal'}
                </span>
                {assessment && (
                  <span className="text-xs font-black uppercase px-2.5 py-1 bg-paper border border-ink rounded">
                    Beban: {assessment.severityLevel || 'MILD'}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
                {assessment?.summaryFeedback ||
                  'Jalur pemulihan 14 hari dirancang untuk mendampingi ritme harianmu dengan langkah-langkah mikro yang terbukti aman.'}
              </p>

              <div className="pt-2 border-t-2 border-ink flex items-center justify-between">
                <Link
                  href="/report"
                  className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cobalt hover:underline"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Lihat Sintesis Laporan Mingguan</span>
                </Link>
                <ArrowRight className="w-3.5 h-3.5 text-cobalt" />
              </div>
            </div>
          </div>

          {/* RIGHT: SUPPORT TOOLKIT (4 Compact Tiles - 6 Cols) */}
          <div className="lg:col-span-6 space-y-3 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-ink">
              KOTAK ALAT PENDAMPINGAN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/journal" className="block focus-visible:outline-ink">
                <div className="bg-white border-2 border-ink rounded-md p-4 space-y-1.5 h-full shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  <div className="w-8 h-8 rounded bg-yellow text-ink border-2 border-ink shadow-hard-sm flex items-center justify-center font-black">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-xs sm:text-sm text-ink uppercase tracking-wide">Jurnal Privat Lokal</h4>
                  <p className="text-[11px] text-ink/70 font-medium">Catat pikiran tanpa server.</p>
                </div>
              </Link>

              <Link href="/chat" className="block focus-visible:outline-ink">
                <div className="bg-white border-2 border-ink rounded-md p-4 space-y-1.5 h-full shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  <div className="w-8 h-8 rounded bg-cobalt text-white border-2 border-ink shadow-hard-sm flex items-center justify-center font-black">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-xs sm:text-sm text-ink uppercase tracking-wide">Teman Bicara</h4>
                  <p className="text-[11px] text-ink/70 font-medium">Bimbingan aksi terorkestrasi.</p>
                </div>
              </Link>

              <Link href="/resources" className="block focus-visible:outline-ink">
                <div className="bg-white border-2 border-ink rounded-md p-4 space-y-1.5 h-full shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  <div className="w-8 h-8 rounded bg-coral text-white border-2 border-ink shadow-hard-sm flex items-center justify-center font-black">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-xs sm:text-sm text-ink uppercase tracking-wide">Direktori Bantuan</h4>
                  <p className="text-[11px] text-ink/70 font-medium">Kontak resmi darurat &amp; psikolog.</p>
                </div>
              </Link>

              <Link href="/forum" className="block focus-visible:outline-ink">
                <div className="bg-white border-2 border-ink rounded-md p-4 space-y-1.5 h-full shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  <div className="w-8 h-8 rounded bg-lime text-ink border-2 border-ink shadow-hard-sm flex items-center justify-center font-black">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-xs sm:text-sm text-ink uppercase tracking-wide">Ruang Cerita</h4>
                  <p className="text-[11px] text-ink/70 font-medium">Solidaritas sesama pengguna.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. TERTIARY UTILITY FOOTER (Recovery key & Crisis safety bar) */}
        <div className="pt-4 border-t-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-ink">
          <Link
            href="/recovery"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <Key className="w-4 h-4 text-cobalt" />
            <span>Simpan atau pulihkan sesi dengan 12-kata kunci</span>
          </Link>

          <Link
            href="/crisis"
            className="inline-flex items-center gap-1.5 text-white bg-coral px-3 py-1 rounded border-2 border-ink shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>BUTUH BANTUAN SEGERA? KEMENKES 119 EXT 8</span>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

