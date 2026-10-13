'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Footprints,
  Award,
  Trophy,
  Calendar,
  Target,
  Star,
  Lock,
  Sun,
  Zap,
  PenLine,
  MessageCircle,
  ClipboardList,
  Sparkles,
  Check,
  Circle,
} from 'lucide-react';
import {
  loadGamificationState,
  getCurrentLevelInfo,
  getRitme,
  LEVEL_THRESHOLDS,
  BADGE_DEFINITIONS,
  WEEKLY_QUEST_REQUIREMENTS,
  WEEKLY_QUEST_REWARD,
  LANGKAH_AMOUNTS,
} from '@/lib/gamification';
import type { GamificationStateV1 } from '@dengarin/types';
import { loadWellbeingTimeline, type WellbeingTimeline as TimelineData } from '@/lib/wellbeingTimeline';
import { PageContainer, Button, WellbeingTimeline, Reveal } from '@/components/ui';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';

export default function PerjalananPage() {
  const { ready } = useConsentGuard();
  const [gamState, setGamState] = useState<GamificationStateV1 | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);

  useEffect(() => {
    if (!ready) return;
    setGamState(loadGamificationState());
    setTimeline(loadWellbeingTimeline());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dengarin_gamification_v1' || e.key === null) {
        setGamState(loadGamificationState());
      }
      setTimeline(loadWellbeingTimeline());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [ready]);

  if (!ready) return <ConsentPending />;
  if (!gamState) return null;

  const levelInfo = getCurrentLevelInfo(gamState);
  const ritme = getRitme();
  const activeCount = ritme.filter(d => d.active).length;

  return (
    <PageContainer size="default">
      <div className="mx-auto w-full max-w-5xl space-y-10 sm:space-y-12 text-left">
        {/* Header */}
        <div className="space-y-5 max-w-2xl">
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Kembali ke dashboard
          </Button>

          <div className="space-y-4 animate-reveal-up [animation-delay:80ms]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cobalt text-white border-2 border-ink text-xs font-bold uppercase tracking-wider shadow-hard-sm">
              <Footprints className="w-3.5 h-3.5" aria-hidden="true" />
              PERJALANAN KECIL
            </div>
            <h1 className="text-[2.25rem] sm:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05]">
              Setiap langkah berarti
            </h1>
            <p className="text-base sm:text-lg text-[#4A453E] max-w-xl leading-relaxed">
              Langkah kecilmu tercatat di sini. Bukan tentang jadi sempurna, ini tentang tetap berjalan. Tiap check-in, misi, atau jurnal memberimu Langkah, yaitu poin kecil sebagai tanda kamu merawat diri.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Level & Langkah Overview */}
        <div className="lg:col-span-7 animate-reveal-up [animation-delay:160ms] bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-5 shadow-hard text-left">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[2.5rem] sm:text-5xl font-bold text-ink tracking-[-0.03em] leading-none tabular-nums">{gamState.totalLangkah}</span>
              <p className="text-xs text-[#59544D] font-bold uppercase tracking-wider pt-1">Total Langkah</p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider bg-cobalt px-2.5 py-1 rounded border-2 border-ink inline-block">
                Level {gamState.currentLevel}: {levelInfo.name}
              </span>
            </div>
          </div>

          {/* Progress bar to next level */}
          {levelInfo.nextThreshold ? (
            <div className="space-y-1">
              <div className="w-full h-3 bg-paper border-2 border-ink rounded overflow-hidden">
                <div
                  className="h-full w-full origin-left bg-cobalt transition-transform duration-700 ease-out-expo"
                  style={{ transform: `scaleX(${Math.min(Math.max(levelInfo.progress, 0), 100) / 100})` }}
                  role="progressbar"
                  aria-valuenow={gamState.totalLangkah}
                  aria-valuemin={LEVEL_THRESHOLDS[gamState.currentLevel].threshold}
                  aria-valuemax={levelInfo.nextThreshold}
                  aria-label={`Progress ke level berikutnya`}
                />
              </div>
              <div className="flex justify-between text-xs text-[#59544D] font-semibold tabular-nums">
                <span>{LEVEL_THRESHOLDS[gamState.currentLevel].threshold}</span>
                <span>{levelInfo.nextThreshold} → {LEVEL_THRESHOLDS[gamState.currentLevel + 1]?.name}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-cobalt font-bold">
              <Sparkles className="inline w-4 h-4 mr-1 align-[-2px]" aria-hidden="true" />Level tertinggi tercapai
            </p>
          )}

          {/* Level Milestones */}
          <ol className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t border-[#D8D3C9]" aria-label="Tingkatan level">
            {LEVEL_THRESHOLDS.map((lvl, i) => (
              <li
                key={i}
                className={`p-2.5 rounded text-center ${
                  i <= gamState.currentLevel
                    ? 'bg-lime text-ink border-2 border-ink'
                    : 'bg-paper text-[#7A756D] border border-[#D8D3C9]'
                }`}
              >
                <span className="text-xs font-bold block">{lvl.name}</span>
                <span className="text-[11px] font-medium tabular-nums">{lvl.threshold} Langkah</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-5 space-y-6 lg:space-y-8">
        {/* Ritme 7 Hari */}
        <div className="animate-reveal-up [animation-delay:240ms] bg-white border border-[#D8D3C9] rounded-lg p-6 space-y-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D3C9] pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cobalt" aria-hidden="true" />
              Hari aktif (7 hari terakhir)
            </h2>
            <span className="text-sm font-bold text-cobalt tabular-nums">{activeCount}/7 aktif</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {ritme.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full h-10 rounded flex items-center justify-center text-xs font-bold ${
                    day.active
                      ? 'bg-lime text-ink border-2 border-ink'
                      : 'bg-paper text-[#9E988D] border border-[#D8D3C9]'
                  }`}
                  title={`${day.dayLabel} ${day.date}${day.active ? ' (aktif)' : ''}`}
                  role="img"
                  aria-label={`${day.dayLabel} ${day.date}: ${day.active ? 'aktif' : 'tidak aktif'}`}
                >
                  <span aria-hidden="true">{day.active ? '●' : '○'}</span>
                </div>
                <span className="text-[11px] font-semibold text-[#59544D]" aria-hidden="true">{day.dayLabel}</span>
              </div>
            ))}
          </div>
        </div>


        {/* Weekly Quest */}
        <Reveal className="bg-white border border-[#D8D3C9] rounded-lg p-6 space-y-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D3C9] pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25] flex items-center gap-2">
              <Target className="w-4 h-4 text-cobalt" aria-hidden="true" />
              Quest minggu ini
            </h2>
            <span className="text-xs font-bold bg-yellow px-2 py-0.5 rounded border border-ink uppercase tracking-wider tabular-nums">
              +{WEEKLY_QUEST_REWARD} LANGKAH
            </span>
          </div>

          {gamState.completedQuestWeekIds.includes(gamState.activeQuestWeekId) ? (
            <div className="bg-lime border-2 border-ink rounded p-4 text-center shadow-hard-sm">
              <p className="text-base font-bold text-ink">
                <Check className="inline w-5 h-5 mr-1 align-[-4px]" strokeWidth={3} aria-hidden="true" />Quest minggu ini selesai. Kamu hebat.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <QuestRow
                label="CHECK-IN"
                current={gamState.questProgress.checkinDays}
                target={WEEKLY_QUEST_REQUIREMENTS.checkinDays}
                suffix="hari"
              />
              <QuestRow
                label="MISI"
                current={gamState.questProgress.missionsCompleted}
                target={WEEKLY_QUEST_REQUIREMENTS.missionsCompleted}
                suffix="selesai"
              />
              <QuestRow
                label="JURNAL"
                current={gamState.questProgress.journalEntries}
                target={WEEKLY_QUEST_REQUIREMENTS.journalEntries}
                suffix="ditulis"
              />
            </div>
          )}

          {gamState.completedQuestWeekIds.length > 0 && (
            <p className="text-sm text-[#59544D] font-medium pt-3 border-t border-[#D8D3C9] tabular-nums">
              Total quest selesai: {gamState.completedQuestWeekIds.length} minggu
            </p>
          )}
        </Reveal>
        </div>
        </div>

        {/* Personal Well-being Timeline (14 hari) */}
        {timeline && (
          <Reveal>
            <WellbeingTimeline timeline={timeline} />
          </Reveal>
        )}

        {/* Jejak / Badges */}
        <Reveal className="bg-white border border-[#D8D3C9] rounded-lg p-6 sm:p-8 space-y-5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D3C9] pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25] flex items-center gap-2">
              <Award className="w-4 h-4 text-cobalt" aria-hidden="true" />
              Badge kamu
            </h2>
            <span className="text-sm font-bold text-[#59544D] tabular-nums">
              {gamState.unlockedBadgeIds.length}/{BADGE_DEFINITIONS.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="list">
            {BADGE_DEFINITIONS.map((badge, index) => {
              const unlocked = gamState.unlockedBadgeIds.includes(badge.id);
              return (
                <Reveal
                  key={badge.id}
                  delay={Math.min(index, 5) * 70}
                  role="listitem"
                  aria-label={`${badge.name}: ${unlocked ? 'Terbuka' : 'Terkunci'}. ${badge.description}`}
                  className={`p-3 rounded text-center space-y-1.5 ${
                    unlocked
                      ? 'bg-yellow text-ink border-2 border-ink shadow-hard-sm'
                      : 'bg-paper text-[#7A756D] border border-[#D8D3C9]'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {unlocked ? (
                      <Star className="w-5 h-5 text-ink fill-ink" aria-hidden="true" />
                    ) : (
                      <Lock className="w-5 h-5 text-[#9E988D]" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-sm font-bold leading-tight">
                    {badge.name}
                  </p>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block ${
                    unlocked ? 'bg-lime text-ink border-ink' : 'bg-white text-[#7A756D] border-[#D8D3C9]'
                  }`} aria-hidden="true">
                    {unlocked ? 'Terbuka' : 'Terkunci'}
                  </span>
                  <p className="text-xs leading-snug" aria-hidden="true">
                    {badge.description}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </Reveal>

        {/* Langkah Reference (informational only — does not expose cap) */}
        <Reveal className="border-t-2 border-ink pt-6 space-y-4 text-left">
          <h2 className="text-lg font-bold text-ink leading-[1.25] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-cobalt" aria-hidden="true" />
            Cara mengumpulkan Langkah
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[15px] text-ink tabular-nums">
            {[
              { Icon: Sun, label: 'Check-in harian', amount: LANGKAH_AMOUNTS.daily_checkin },
              { Icon: Zap, label: 'Misi selesai', amount: LANGKAH_AMOUNTS.mission_complete },
              { Icon: PenLine, label: 'Jurnal', amount: LANGKAH_AMOUNTS.journal_entry },
              { Icon: MessageCircle, label: 'Refleksi misi', amount: LANGKAH_AMOUNTS.mission_reflection },
              { Icon: ClipboardList, label: 'Refleksi mingguan', amount: LANGKAH_AMOUNTS.weekly_reflection },
              { Icon: Trophy, label: 'Quest mingguan', amount: WEEKLY_QUEST_REWARD },
            ].map(({ Icon, label, amount }) => (
              <span key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 shrink-0 text-cobalt" aria-hidden="true" />
                {label}: +{amount}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Back to dashboard */}
        <div className="pt-2 text-center">
          <Button
            href="/dashboard"
            variant="primary"
            size="md"
            iconPosition="end"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            KEMBALI KE HARI INI
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

function QuestRow({ label, current, target, suffix }: {
  label: string;
  current: number;
  target: number;
  suffix: string;
}) {
  const done = current >= target;
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded ${done ? 'bg-lime border-2 border-ink' : 'bg-paper border border-[#D8D3C9]'}`}>
      <span className="text-xs font-bold text-ink uppercase tracking-wider">
        {done ? (
          <Check className="inline w-3.5 h-3.5 mr-1 align-[-2px]" strokeWidth={3} aria-hidden="true" />
        ) : (
          <Circle className="inline w-3.5 h-3.5 mr-1 align-[-2px]" aria-hidden="true" />
        )}
        {label}
      </span>
      <span className="text-sm font-semibold text-ink tabular-nums">
        {current}/{target} {suffix}
      </span>
    </div>
  );
}
