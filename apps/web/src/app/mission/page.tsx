'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { PageContainer, ContentColumn, SoftCard, Button, Badge, Input } from '@/components/ui';

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
        <div className="py-16 text-center text-sm text-sand-600">
          Memuat misi harian Anda...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-10 text-left">
        {/* Top: Breadcrumb / Back */}
        <div>
          <Link href="/dashboard" className="inline-block">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        {/* Center: THE MISSION HERO (Clean editorial focus, not trapped in an extra box) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="calm" size="md">
              Misi Hari ke-{currentDay} dari 14
            </Badge>
            <Badge variant="sand" size="md">
              Fokus: {domainLabel}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-sand-600 font-medium ml-auto">
              <Clock className="w-3.5 h-3.5 text-calm-600" />
              <span>~{mission.durationMinutes} Menit</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight leading-tight">
            {mission.title}
          </h1>

          <p className="text-sm sm:text-base text-sand-700 leading-relaxed max-w-2xl">
            {mission.summary}
          </p>
        </div>

        {/* Vertical Connected Timeline of Guided Steps */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sand-800">
            <Sparkles className="w-4 h-4 text-calm-700" />
            <span>Panduan Langkah Demi Langkah:</span>
          </div>

          <div className="relative pl-8 sm:pl-10 space-y-8 before:absolute before:left-3.5 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-sand-200">
            {mission.steps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Node Circle */}
                <div className="absolute -left-8 sm:-left-10 top-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-calm-700 text-white font-bold text-xs flex items-center justify-center shadow-soft-xs ring-4 ring-sand-50">
                  {idx + 1}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-calm-700">
                    Langkah {idx + 1}
                  </span>
                  <p className="text-sm sm:text-base text-sand-900 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection Input Section */}
        <div className="space-y-3 pt-4 border-t border-sand-200/80">
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
            <SoftCard
              variant="tinted"
              elevation="flat"
              className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-calm-300 shadow-soft-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-calm-700 shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-calm-950">Misi Selesai untuk Hari Ini</h4>
                  <p className="text-xs text-calm-800/80 leading-relaxed">
                    Satu tindakan kecil yang nyata telah kamu selesaikan. Istirahatlah dengan tenang.
                  </p>
                </div>
              </div>
              <Link href="/dashboard" className="shrink-0 w-full sm:w-auto">
                <Button variant="primary" size="md" fullWidth>
                  Kembali ke Dashboard
                </Button>
              </Link>
            </SoftCard>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleComplete}
              icon={<CheckCircle2 className="w-5 h-5" />}
            >
              Tandai Selesai & Simpan Refleksi
            </Button>
          )}
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
