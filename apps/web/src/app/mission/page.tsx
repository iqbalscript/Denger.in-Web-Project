'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, ArrowLeft, Sparkles } from 'lucide-react';
import {
  getAnonymousSession,
  getTodayMission,
  completeTodayMission,
  isTodayMissionCompleted,
  getTodayMissionReflection,
} from '@/lib/storage';
import { DOMAIN_CONFIGS } from '@dengarin/config';
import type { DailyMission } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, Input } from '@/components/ui';

export default function MissionPage() {
  const [mission, setMission] = useState<DailyMission | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [domainLabel, setDomainLabel] = useState<string>('Umum');

  useEffect(() => {
    const session = getAnonymousSession();
    const domain = session?.primaryDomain || 'general';
    const activeMission = getTodayMission(domain);
    setMission(activeMission);
    setIsCompleted(isTodayMissionCompleted());
    setReflectionText(getTodayMissionReflection());
    setCurrentDay(session?.currentDay || 1);

    if (DOMAIN_CONFIGS[domain]) {
      setDomainLabel(DOMAIN_CONFIGS[domain].label);
    }
  }, []);

  const handleComplete = () => {
    if (!mission) return;
    completeTodayMission(reflectionText);
    setIsCompleted(true);
  };

  if (!mission) {
    return (
      <PageContainer size="narrow">
        <div className="py-16 text-center text-sm text-ink/70 font-medium">
          Memuat misi harian Anda...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        {/* Top: Breadcrumb / Back */}
        <div>
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            KEMBALI KE DASHBOARD
          </Button>
        </div>

        {/* Center: THE MISSION HERO */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase px-2.5 py-1 bg-lime text-ink border-2 border-ink rounded shadow-hard-sm">
              Misi Hari ke-{currentDay} dari 14
            </span>
            <span className="text-xs font-black uppercase px-2.5 py-1 bg-white text-ink border-2 border-ink rounded shadow-hard-sm">
              Fokus: {domainLabel}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-ink font-bold ml-auto">
              <Clock className="w-3.5 h-3.5 text-cobalt" />
              <span>~{mission.durationMinutes} MENIT</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none">
            {mission.title}
          </h1>

          <p className="text-sm sm:text-base text-ink/80 leading-relaxed max-w-2xl font-medium">
            {mission.summary}
          </p>
        </div>

        {/* Vertical Connected Timeline of Guided Steps */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-ink">
            <Sparkles className="w-4 h-4 text-cobalt" />
            <span>PANDUAN LANGKAH DEMI LANGKAH:</span>
          </div>

          <div className="space-y-4">
            {mission.steps.map((step, idx) => (
              <div key={idx} className="p-5 bg-white border-2 border-ink rounded-lg shadow-hard-sm flex items-start gap-4">
                <div className="w-9 h-9 rounded-md bg-cobalt text-white font-black text-sm flex items-center justify-center border-2 border-ink shadow-hard-sm shrink-0 mt-0.5">
                  0{idx + 1}
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-cobalt">
                    LANGKAH {idx + 1}
                  </span>
                  <p className="text-sm sm:text-base text-ink leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection Input Section */}
        <div className="space-y-3 pt-4 border-t-2 border-ink">
          <Input
            label={`Refleksi Singkat: ${mission.reflectionQuestion}`}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            disabled={isCompleted}
            placeholder="Tuliskan 1 kalimat respon atau perasaanmu setelah menjalani langkah di atas..."
          />
        </div>

        {/* Completion State / Action Button */}
        <div>
          {isCompleted ? (
            <div className="bg-lime border-2 border-ink rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-hard">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-ink shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-ink uppercase tracking-wide">Misi Selesai untuk Hari Ini</h4>
                  <p className="text-xs text-ink/80 leading-relaxed font-medium">
                    Satu tindakan kecil yang nyata telah kamu selesaikan. Istirahatlah dengan tenang.
                  </p>
                </div>
              </div>
              <Button href="/dashboard" variant="primary" size="md" className="shrink-0 w-full sm:w-auto">
                KEMBALI KE DASHBOARD →
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleComplete}
              icon={<CheckCircle2 className="w-5 h-5" />}
            >
              TANDAI SELESAI &amp; SIMPAN REFLEKSI →
            </Button>
          )}
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

