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
  Check,
} from 'lucide-react';
import {
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
import { PageContainer, Button, Reveal, MoodIcon } from '@/components/ui';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';

export default function DashboardPage() {
  const { ready } = useConsentGuard();
  const [session, setSession] = useState<AnonymousUserSession | null>(null);
  const [todayMission, setTodayMission] = useState<DailyMission | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [isMissionDone, setIsMissionDone] = useState<boolean>(false);
  const [gamState, setGamState] = useState<GamificationStateV1 | null>(null);

  useEffect(() => {
    // Consent is checked by useConsentGuard; never grant it here (H5).
    if (!ready) return;
    // Backfills any missing session fields (e.g. alias) outside render (L9).
    const current = initAnonymousSession();
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
  }, [ready]);

  const ageInfo = session?.ageBracket ? AGE_BRACKET_CONFIGS[session.ageBracket] : null;
  const domainInfo = session?.primaryDomain ? DOMAIN_CONFIGS[session.primaryDomain] : null;
  const occupationInfo = session?.occupation
    ? OCCUPATION_OPTIONS.find((o) => o.id === session.occupation)?.label
    : null;

  const currentDay = session?.currentDay || 1;
  const assessment = session?.assessmentResult;

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="default">
      <div className="space-y-12 sm:space-y-16">
        {/* 1. HEADER / GREETING (Clean editorial layout, STRICT ZERO-PROFILE MANDATE) */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-ink pb-6">
          <div className="space-y-3 text-left">
            <div className="animate-reveal-up flex items-center gap-2">
              <span className="text-xs font-bold text-ink bg-lime px-2.5 py-0.5 rounded border-2 border-ink shadow-hard-sm uppercase tracking-wider">
                100% ANONIM • TANPA AKUN
              </span>
            </div>
            <h1 className="animate-reveal-up [animation-delay:80ms] text-[2rem] sm:text-4xl lg:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05]">
              Gimana keadaanmu hari ini?
            </h1>
            <p className="animate-reveal-up [animation-delay:160ms] text-base sm:text-lg text-[#4A453E] max-w-[38rem] leading-relaxed">
              {domainInfo
                ? `Fokus kita: ${domainInfo.label}: ${domainInfo.description}`
                : 'Tidak perlu banyak. Satu langkah kecil sudah cukup untuk hari ini.'}
            </p>
          </div>

          <div className="animate-reveal-up [animation-delay:160ms] flex flex-wrap items-center gap-2 shrink-0">
            {ageInfo && (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-white text-ink border border-borderSubtle rounded">
                {ageInfo.label}
              </span>
            )}
            {occupationInfo && (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-white text-ink border border-borderSubtle rounded">
                {occupationInfo}
              </span>
            )}
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-lime text-ink border-2 border-ink rounded shadow-hard-sm tabular-nums">
              Hari ke-{currentDay} dari 14
            </span>
          </div>
        </header>

        {/* 2. MAIN COMPOSITION: TODAY'S MISSION (Primary) + CHECK-IN & RHYTHM (Secondary) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* LEFT: TODAY'S MISSION (Dominant Action Hero Card - 8 Cols) */}
          <div className="lg:col-span-8 animate-reveal-up [animation-delay:240ms]">
            <section aria-labelledby="judul-misi" className="h-full flex flex-col justify-between bg-white border-2 border-ink rounded-lg p-6 sm:p-10 gap-8 shadow-hard-lg text-left">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white bg-cobalt px-3 py-1 rounded border-2 border-ink shadow-hard-sm tabular-nums">
                    MISI UTAMA HARI INI • HARI #{currentDay}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-ink font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-cobalt" aria-hidden="true" />
                    <span className="tabular-nums">~{todayMission?.durationMinutes || 5} MENIT</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 id="judul-misi" className="text-[1.75rem] sm:text-[2.5rem] font-bold text-ink tracking-[-0.02em] leading-[1.15]">
                    {todayMission?.title || 'Misi kecil untuk menenangkan diri'}
                  </h2>
                  <p className="text-base text-[#4A453E] leading-relaxed max-w-[38rem]">
                    {todayMission?.summary ||
                      'Ambil jeda sejenak. Beri waktu untuk tubuh dan pikiranmu menenang.'}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-borderSubtle">
                <div className="text-sm text-ink font-medium flex items-center gap-2">
                  {isMissionDone ? (
                    <span role="status" className="inline-flex items-center gap-1.5 text-ink font-semibold bg-lime px-2.5 py-1 rounded border border-ink">
                      <CheckCircle2 className="w-4 h-4 text-ink shrink-0" aria-hidden="true" />
                      Misi hari ini selesai. Terima kasih sudah merawat dirimu.
                    </span>
                  ) : (
                    <span>Langkahnya singkat dan bisa kamu jalani pelan-pelan</span>
                  )}
                </div>

                <Button
                  href="/mission"
                  variant={isMissionDone ? 'outline' : 'primary'}
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                  iconPosition="end"
                  className="shrink-0 w-full sm:w-auto"
                >
                  {isMissionDone ? 'Tinjau kembali langkah misi' : 'MULAI MISI KECIL'}
                </Button>
              </div>
            </section>
          </div>

          {/* RIGHT: CONTEXT WIDGETS (Check-in Status + Weekly Rhythm - 4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4 animate-reveal-up [animation-delay:320ms]">
            {/* Check-in Widget */}
            <section aria-labelledby="judul-checkin" className="bg-white border border-borderSubtle rounded-lg p-5 space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-borderSubtle pb-2">
                <h2 id="judul-checkin" className="text-xs font-bold text-ink uppercase tracking-wider">
                  Check-in Emosi
                </h2>
                <Smile className="w-4 h-4 text-cobalt" aria-hidden="true" />
              </div>

              {todayCheckin ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <MoodIcon mood={todayCheckin.mood} className="w-7 h-7 text-[#151515]" />
                    <span className="text-sm font-bold text-ink capitalize">
                      {todayCheckin.mood.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-[#59544D] tabular-nums">
                    Energi: {todayCheckin.energyLevel}/10 • Tercatat hari ini
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <p className="text-[15px] text-[#4A453E] leading-relaxed">
                    Apa kabar hatimu saat ini? Luangkan satu menit untuk mencatatnya.
                  </p>
                  <Button href="/checkin" variant="outline" size="sm" fullWidth icon={<Smile className="w-3.5 h-3.5" aria-hidden="true" />}>
                    CHECK-IN SEKARANG
                  </Button>
                </div>
              )}
            </section>

            {/* Perjalanan Kecil — Compact Progress Widget */}
            <section aria-labelledby="judul-perjalanan" className="bg-white border border-borderSubtle rounded-lg p-5 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink border-b border-borderSubtle pb-2">
                <h2 id="judul-perjalanan" className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cobalt" aria-hidden="true" />
                  Perjalanan Kecil
                </h2>
                <Link href="/perjalanan" className="text-xs text-cobalt hover:underline">
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
                        <span className="text-2xl font-bold text-ink tracking-[-0.02em] tabular-nums">{gamState.totalLangkah}</span>
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider bg-cobalt px-1.5 py-0.5 rounded border border-ink">
                          {levelInfo.name}
                        </span>
                      </div>
                      <span className="block text-[11px] text-[#59544D] font-bold uppercase tracking-wider">LANGKAH</span>
                      {/* Progress bar to next level */}
                      {levelInfo.nextThreshold && (
                        <div className="w-full h-2 bg-paper border border-ink rounded-sm overflow-hidden">
                          <div
                            className="h-full w-full origin-left bg-cobalt transition-transform duration-700 ease-out-expo"
                            style={{ transform: `scaleX(${levelInfo.progress / 100})` }}
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
                      <span className="block text-[11px] text-[#59544D] font-bold uppercase tracking-wider tabular-nums">
                        AKTIF 7 HARI: {activeCount}/7
                      </span>
                      <div className="grid grid-cols-7 gap-1.5">
                        {ritme.map((day) => (
                          <div
                            key={day.date}
                            className={`h-7 rounded flex items-center justify-center text-[11px] font-bold border-2 ${
                              day.active
                                ? 'bg-lime text-ink border-ink'
                                : 'bg-paper text-[#7A756D] border-borderSubtle'
                            }`}
                            title={`${day.dayLabel} ${day.date}${day.active ? ' (aktif)' : ''}`}
                          >
                            {day.dayLabel.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Quest Progress (compact) */}
                    <div className="space-y-1">
                      <span className="block text-[11px] text-[#59544D] font-bold uppercase tracking-wider">QUEST MINGGU INI</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-medium text-ink tabular-nums">
                        <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />{gamState.questProgress.checkinDays}/{WEEKLY_QUEST_REQUIREMENTS.checkinDays} check-in</span>
                        <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />{gamState.questProgress.missionsCompleted}/{WEEKLY_QUEST_REQUIREMENTS.missionsCompleted} misi</span>
                        <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />{gamState.questProgress.journalEntries}/{WEEKLY_QUEST_REQUIREMENTS.journalEntries} jurnal</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>
          </div>
        </div>

        {/* 3. SECONDARY COMPOSITION: PROGRESS OVERVIEW & SUPPORT TOOLKIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT: Your Progress / Assessment Synthesis (6 Cols) */}
          <Reveal as="section" aria-labelledby="judul-progres" className="lg:col-span-5 space-y-4 text-left">
            <h2 id="judul-progres" className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.01em] leading-[1.25]">
              Perjalananmu sejauh ini
            </h2>

            <div className="bg-white border border-borderSubtle rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink bg-lime px-2.5 py-1 rounded border border-ink uppercase tracking-wider">
                  {assessment?.recommendedPathId ? 'Program 14 Hari Aktif' : 'Baru Mulai'}
                </span>
                {assessment && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-paper border border-borderSubtle rounded">
                    Beban terasa: {{ MILD: 'Ringan', MODERATE: 'Cukup Berat', SEVERE: 'Sangat Berat' }[assessment.severityLevel || 'MILD']}
                  </span>
                )}
              </div>

              <p className="text-[15px] sm:text-base text-[#4A453E] leading-relaxed">
                {assessment?.summaryFeedback ||
                  'Program 14 hari ini menemani hari-harimu lewat langkah kecil yang bisa kamu jalani pelan-pelan.'}
              </p>

              <div className="pt-4 border-t border-borderSubtle flex items-center justify-between">
                <Link
                  href="/report"
                  className="group inline-flex items-center gap-1.5 text-sm font-bold text-cobalt hover:underline"
                >
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  <span>Lihat rangkuman mingguanmu</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-400 ease-spring group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* RIGHT: SUPPORT TOOLKIT (4 Compact Tiles - 6 Cols) */}
          <Reveal as="section" aria-labelledby="judul-teman" delay={80} className="lg:col-span-7 space-y-4 text-left">
            <h2 id="judul-teman" className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.01em] leading-[1.25]">
              Yang bisa menemanimu
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Reveal delay={120} className="h-full">
              <Link href="/journal" className="group block h-full rounded-md">
                <div className="bg-white border-2 border-ink rounded-md p-4 space-y-2 h-full shadow-hard-sm transition-[transform,box-shadow] duration-200 ease-spring group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-hover:shadow-hard group-active:translate-x-[1px] group-active:translate-y-[1px] group-active:shadow-none">
                  <div className="w-8 h-8 rounded bg-cobalt text-white border-2 border-ink flex items-center justify-center" aria-hidden="true">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-ink leading-snug">Jurnal privat lokal</h3>
                  <p className="text-sm text-[#59544D] leading-relaxed">Tuangkan pikiranmu. Tersimpan di perangkatmu dan tidak dikirim ke AI.</p>
                </div>
              </Link>
              </Reveal>

              <Reveal delay={190} className="h-full">
              <Link href="/chat" className="group block h-full rounded-md">
                <div className="bg-white border-2 border-ink rounded-md p-4 space-y-2 h-full shadow-hard-sm transition-[transform,box-shadow] duration-200 ease-spring group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-hover:shadow-hard group-active:translate-x-[1px] group-active:translate-y-[1px] group-active:shadow-none">
                  <div className="w-8 h-8 rounded bg-cobalt text-white border-2 border-ink flex items-center justify-center" aria-hidden="true">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-ink leading-snug">Teman bicara</h3>
                  <p className="text-sm text-[#59544D] leading-relaxed">Cerita apa saja, kami dengarkan.</p>
                </div>
              </Link>
              </Reveal>

              <Reveal delay={260} className="h-full">
              <Link href="/resources" className="group block h-full rounded-md">
                <div className="bg-white border-2 border-ink rounded-md p-4 space-y-2 h-full shadow-hard-sm transition-[transform,box-shadow] duration-200 ease-spring group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-hover:shadow-hard group-active:translate-x-[1px] group-active:translate-y-[1px] group-active:shadow-none">
                  <div className="w-8 h-8 rounded bg-coral text-white border-2 border-ink flex items-center justify-center" aria-hidden="true">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-ink leading-snug">Direktori bantuan</h3>
                  <p className="text-sm text-[#59544D] leading-relaxed">Kontak resmi darurat dan psikolog, kapan pun kamu butuh.</p>
                </div>
              </Link>
              </Reveal>

              <Reveal delay={330} className="h-full">
              <Link href="/forum" className="group block h-full rounded-md">
                <div className="bg-white border-2 border-ink rounded-md p-4 space-y-2 h-full shadow-hard-sm transition-[transform,box-shadow] duration-200 ease-spring group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-hover:shadow-hard group-active:translate-x-[1px] group-active:translate-y-[1px] group-active:shadow-none">
                  <div className="w-8 h-8 rounded bg-lime text-ink border-2 border-ink flex items-center justify-center" aria-hidden="true">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-ink leading-snug">Ruang cerita</h3>
                  <p className="text-sm text-[#59544D] leading-relaxed">Saling menguatkan dengan sesama.</p>
                </div>
              </Link>
              </Reveal>
            </div>
          </Reveal>
        </div>

        {/* 4. TERTIARY UTILITY FOOTER (Recovery key & Crisis safety bar; never animated) */}
        <div className="pt-5 border-t border-borderSubtle flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-semibold text-ink">
          <Link
            href="/recovery"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <Key className="w-4 h-4 text-cobalt" aria-hidden="true" />
            <span>Simpan atau pulihkan sesi dengan kunci pemulihan</span>
          </Link>

          <Link
            href="/crisis"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-bold text-white bg-coral px-3 py-1 rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
            <span>BUTUH BANTUAN SEGERA? KEMENKES 119 EXT 8</span>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

