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
import {
  loadGamificationState,
  getCurrentLevelInfo,
  getRitme,
  WEEKLY_QUEST_REQUIREMENTS,
  LEVEL_THRESHOLDS,
} from '@/lib/gamification';
import { DOMAIN_CONFIGS, AGE_BRACKET_CONFIGS, OCCUPATION_OPTIONS } from '@dengarin/config';
import type { AnonymousUserSession, DailyMission, DailyCheckin, GamificationStateV1 } from '@dengarin/types';
import { PageContainer, Button } from '@/components/ui';

export default function DashboardPage() {
  const [session, setSession] = useState<AnonymousUserSession | null>(null);
  const [todayMission, setTodayMission] = useState<DailyMission | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [isMissionDone, setIsMissionDone] = useState<boolean>(false);
  const [gamState, setGamState] = useState<GamificationStateV1 | null>(null);

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
    setGamState(loadGamificationState());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dengarin_gamification_v1' || e.key === null) {
        setGamState(loadGamificationState());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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

            {/* Perjalanan Kecil — Compact Progress Widget */}
            <div className="bg-white border-2 border-ink rounded-lg p-4 space-y-3 text-left shadow-hard-sm">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-ink border-b-2 border-ink pb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cobalt" />
                  Perjalanan Kecil
                </span>
                <Link href="/perjalanan" className="text-[10px] text-cobalt hover:underline">
                  DETAIL →
                </Link>
              </div>

              {gamState && (() => {
                const levelInfo = getCurrentLevelInfo(gamState);
                const ritme = getRitme();
                const activeCount = ritme.filter(d => d.active).length;
                return (
                  <div className="space-y-3">
                    {/* Langkah & Level */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-ink">{gamState.totalLangkah}</span>
                        <span className="text-[10px] font-black text-cobalt uppercase bg-cobalt/10 px-1.5 py-0.5 rounded border border-cobalt/30">
                          {levelInfo.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink/60 font-bold uppercase tracking-wider">LANGKAH</span>
                      {/* Progress bar to next level */}
                      {levelInfo.nextThreshold && (
                        <div className="w-full h-2 bg-paper border border-ink rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-cobalt transition-all duration-300"
                            style={{ width: `${levelInfo.progress}%` }}
                            role="progressbar"
                            aria-valuenow={gamState.totalLangkah}
                            aria-valuemin={LEVEL_THRESHOLDS[gamState.currentLevel].threshold}
                            aria-valuemax={levelInfo.nextThreshold}
                            aria-label={`Progress ke level ${LEVEL_THRESHOLDS[gamState.currentLevel + 1]?.name}`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Ritme 7 Hari */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-ink/60 font-bold uppercase tracking-wider">
                        RITME 7 HARI — {activeCount}/7
                      </span>
                      <div className="grid grid-cols-7 gap-1.5">
                        {ritme.map((day) => (
                          <div
                            key={day.date}
                            className={`h-6 rounded flex items-center justify-center text-[9px] font-black border-2 border-ink ${
                              day.active
                                ? 'bg-lime text-ink'
                                : 'bg-paper text-ink/30'
                            }`}
                            title={`${day.dayLabel} ${day.date}${day.active ? ' — Aktif' : ''}`}
                          >
                            {day.dayLabel.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Quest Progress (compact) */}
                    <div className="text-[10px] text-ink/60 font-bold uppercase tracking-wider space-y-0.5">
                      <span>QUEST MINGGU INI</span>
                      <div className="flex gap-2 text-ink">
                        <span>✓ {gamState.questProgress.checkinDays}/{WEEKLY_QUEST_REQUIREMENTS.checkinDays} check-in</span>
                        <span>✓ {gamState.questProgress.missionsCompleted}/{WEEKLY_QUEST_REQUIREMENTS.missionsCompleted} misi</span>
                        <span>✓ {gamState.questProgress.journalEntries}/{WEEKLY_QUEST_REQUIREMENTS.journalEntries} jurnal</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

