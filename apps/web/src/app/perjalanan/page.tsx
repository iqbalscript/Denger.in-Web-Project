'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Footprints,
  Award,
  Trophy,
  Calendar,
  Target,
  Star,
  Lock,
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
import { PageContainer, ContentColumn, Button } from '@/components/ui';

export default function PerjalananPage() {
  const [gamState, setGamState] = useState<GamificationStateV1 | null>(null);

  useEffect(() => {
    setGamState(loadGamificationState());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dengarin_gamification_v1' || e.key === null) {
        setGamState(loadGamificationState());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!gamState) return null;

  const levelInfo = getCurrentLevelInfo(gamState);
  const ritme = getRitme();
  const activeCount = ritme.filter(d => d.active).length;

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        {/* Header */}
        <div className="space-y-4">
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            KEMBALI KE DASHBOARD
          </Button>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cobalt text-white border-2 border-ink text-xs font-black uppercase tracking-wider shadow-hard-sm">
              <Footprints className="w-3.5 h-3.5" />
              PERJALANAN KECIL
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight uppercase leading-none">
              SETIAP LANGKAH BERARTI
            </h1>
            <p className="text-xs sm:text-sm text-ink/80 max-w-xl font-medium leading-relaxed">
              Langkah kecilmu tercatat di sini. Bukan tentang jadi sempurna — ini tentang tetap berjalan.
            </p>
          </div>
        </div>

        {/* Level & Langkah Overview */}
        <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-4 shadow-hard text-left">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-3xl sm:text-4xl font-black text-ink">{gamState.totalLangkah}</span>
              <p className="text-xs text-ink/60 font-bold uppercase tracking-wider">TOTAL LANGKAH</p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-xs font-black text-cobalt uppercase bg-cobalt/10 px-2.5 py-1 rounded border border-cobalt/30 inline-block">
                Level {gamState.currentLevel}: {levelInfo.name}
              </span>
            </div>
          </div>

          {/* Progress bar to next level */}
          {levelInfo.nextThreshold ? (
            <div className="space-y-1">
              <div className="w-full h-3 bg-paper border-2 border-ink rounded overflow-hidden">
                <div
                  className="h-full bg-cobalt transition-all duration-500"
                  style={{ width: `${levelInfo.progress}%` }}
                  role="progressbar"
                  aria-valuenow={gamState.totalLangkah}
                  aria-valuemin={LEVEL_THRESHOLDS[gamState.currentLevel].threshold}
                  aria-valuemax={levelInfo.nextThreshold}
                  aria-label={`Progress ke level berikutnya`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-ink/60 font-bold uppercase">
                <span>{LEVEL_THRESHOLDS[gamState.currentLevel].threshold}</span>
                <span>{levelInfo.nextThreshold} → {LEVEL_THRESHOLDS[gamState.currentLevel + 1]?.name}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-cobalt font-black uppercase tracking-wider">
              ✦ LEVEL TERTINGGI TERCAPAI
            </p>
          )}

          {/* Level Milestones */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t-2 border-ink">
            {LEVEL_THRESHOLDS.map((lvl, i) => (
              <div
                key={i}
                className={`p-2 rounded border-2 border-ink text-center ${
                  i <= gamState.currentLevel
                    ? 'bg-lime text-ink shadow-hard-sm'
                    : 'bg-paper text-ink/40'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider block">{lvl.name}</span>
                <span className="text-[9px] font-bold">{lvl.threshold} Langkah</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ritme 7 Hari */}
        <div className="bg-white border-2 border-ink rounded-lg p-6 space-y-3 shadow-hard-sm text-left">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cobalt" />
              RITME 7 HARI TERAKHIR
            </h2>
            <span className="text-xs font-black text-cobalt">{activeCount}/7 AKTIF</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {ritme.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full h-10 rounded flex items-center justify-center text-xs font-black border-2 border-ink transition-all ${
                    day.active
                      ? 'bg-lime text-ink shadow-hard-sm'
                      : 'bg-paper text-ink/30'
                  }`}
                  title={`${day.dayLabel} ${day.date}${day.active ? ' — Aktif' : ''}`}
                >
                  {day.active ? '●' : '○'}
                </div>
                <span className="text-[9px] font-bold text-ink/60 uppercase">{day.dayLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Quest */}
        <div className="bg-white border-2 border-ink rounded-lg p-6 space-y-4 shadow-hard-sm text-left">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
              <Target className="w-4 h-4 text-cobalt" />
              QUEST MINGGU INI
            </h2>
            <span className="text-xs font-black bg-yellow px-2 py-0.5 rounded border border-ink uppercase">
              +{WEEKLY_QUEST_REWARD} LANGKAH
            </span>
          </div>

          {gamState.completedQuestWeekIds.includes(gamState.activeQuestWeekId) ? (
            <div className="bg-lime border-2 border-ink rounded p-4 text-center shadow-hard-sm">
              <p className="text-xs font-black text-ink uppercase tracking-wider">
                ✓ QUEST MINGGU INI SELESAI! KAMU HEBAT.
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
            <p className="text-[10px] text-ink/60 font-bold uppercase tracking-wider pt-2 border-t border-ink/20">
              Total quest selesai: {gamState.completedQuestWeekIds.length} minggu
            </p>
          )}
        </div>

        {/* Jejak / Badges */}
        <div className="bg-white border-2 border-ink rounded-lg p-6 space-y-4 shadow-hard-sm text-left">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
              <Award className="w-4 h-4 text-cobalt" />
              JEJAK PERJALANAN
            </h2>
            <span className="text-xs font-black text-ink/60">
              {gamState.unlockedBadgeIds.length}/{BADGE_DEFINITIONS.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BADGE_DEFINITIONS.map((badge) => {
              const unlocked = gamState.unlockedBadgeIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  role="listitem"
                  aria-label={`${badge.name} — ${unlocked ? 'Terbuka' : 'Terkunci'}. ${badge.description}`}
                  className={`p-3 rounded border-2 border-ink text-center space-y-1.5 transition-all ${
                    unlocked
                      ? 'bg-yellow text-ink shadow-hard-sm'
                      : 'bg-paper text-ink/50'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {unlocked ? (
                      <Star className="w-5 h-5 text-ink fill-ink" />
                    ) : (
                      <Lock className="w-5 h-5 text-ink/40" />
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider leading-tight">
                    {badge.name}
                  </p>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border inline-block ${
                    unlocked ? 'bg-lime text-ink border-ink' : 'bg-paper text-ink/40 border-ink/30'
                  }`}>
                    {unlocked ? '✓ TERBUKA' : '🔒 TERKUNCI'}
                  </span>
                  <p className="text-[9px] font-medium leading-tight opacity-80">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Langkah Reference (informational only — does not expose cap) */}
        <div className="bg-paper border-2 border-ink rounded-lg p-5 space-y-2 shadow-hard-sm text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-cobalt" />
            CARA MENGUMPULKAN LANGKAH
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-ink">
            <span>☀ Check-in harian: +{LANGKAH_AMOUNTS.daily_checkin}</span>
            <span>⚡ Misi selesai: +{LANGKAH_AMOUNTS.mission_complete}</span>
            <span>✍ Jurnal: +{LANGKAH_AMOUNTS.journal_entry}</span>
            <span>💭 Refleksi misi: +{LANGKAH_AMOUNTS.mission_reflection}</span>
            <span>📋 Refleksi mingguan: +{LANGKAH_AMOUNTS.weekly_reflection}</span>
            <span>🏆 Quest mingguan: +{WEEKLY_QUEST_REWARD}</span>
          </div>
        </div>

        {/* Back to dashboard */}
        <div className="pt-4 border-t-2 border-ink text-center">
          <Button href="/dashboard" variant="primary" size="md">
            KEMBALI KE HARI INI →
          </Button>
        </div>
      </ContentColumn>
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
    <div className={`flex items-center justify-between p-2 rounded border-2 border-ink ${done ? 'bg-lime' : 'bg-paper'}`}>
      <span className="text-[11px] font-black text-ink uppercase tracking-wider">
        {done ? '✓' : '○'} {label}
      </span>
      <span className="text-[11px] font-bold text-ink">
        {current}/{target} {suffix}
      </span>
    </div>
  );
}
