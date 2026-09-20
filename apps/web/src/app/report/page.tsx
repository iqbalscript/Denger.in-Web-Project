'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Calendar,
  Smile,
  Meh,
  Frown,
  Copy,
  Check,
  Zap,
  BookOpen,
  Target
} from 'lucide-react';
import {
  PageContainer,
  ContentColumn,
  SoftCard,
  Button,
  Badge,
  ProgressBar
} from '@/components/ui';
import { getDailyCheckins, getAnonymousSession } from '@/lib/storage';
import type { DailyCheckin, MoodScore, WeeklyReportSummary } from '@dengarin/types';

const MOOD_META: Record<MoodScore, { label: string; icon: React.ReactNode; color: string; score: number }> = {
  sangat_baik: { label: 'Sangat Baik', icon: <Smile className="w-4 h-4 text-emerald-600" />, color: 'bg-emerald-100 text-emerald-800 border-emerald-300', score: 5 },
  baik: { label: 'Baik', icon: <Smile className="w-4 h-4 text-teal-600" />, color: 'bg-teal-100 text-teal-800 border-teal-300', score: 4 },
  netral: { label: 'Netral', icon: <Meh className="w-4 h-4 text-sand-600" />, color: 'bg-sand-100 text-sand-800 border-sand-300', score: 3 },
  berat: { label: 'Cukup Berat', icon: <Frown className="w-4 h-4 text-amber-600" />, color: 'bg-amber-100 text-amber-800 border-amber-300', score: 2 },
  kewalahan: { label: 'Kewalahan', icon: <Frown className="w-4 h-4 text-red-600" />, color: 'bg-red-100 text-red-800 border-red-300', score: 1 }
};

interface DaySlot {
  dateStr: string;
  dayLabel: string;
  checkin?: DailyCheckin;
}

export default function ReportPage() {
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [summary, setSummary] = useState<WeeklyReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [last7Days, setLast7Days] = useState<DaySlot[]>([]);

  useEffect(() => {
    // 1. Read real local data
    const localCheckins = getDailyCheckins();
    setCheckins(localCheckins);

    const session = getAnonymousSession();
    if (session?.currentDay) {
      setCurrentDay(session.currentDay);
    }

    try {
      const storedJournals = localStorage.getItem('dengarin_journal_entries');
      if (storedJournals) {
        setJournalCount(JSON.parse(storedJournals).length);
      }
    } catch {
      // ignore
    }

    // 2. Generate 7-day slot array
    const slots: DaySlot[] = [];
    const today = new Date();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = `${dayNames[d.getDay()]} (${d.getDate()})`;
      const match = localCheckins.find((c) => c.timestamp.slice(0, 10) === dateStr);
      slots.push({ dateStr, dayLabel, checkin: match });
    }
    setLast7Days(slots);

    // 3. Call synthesis API
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const completedMissions = Array.from({ length: session?.currentDay || 1 }).map((_, i) => ({
          day: i + 1,
          domain: session?.primaryDomain || 'general',
          title: `Misi Hari ke-${i + 1}`,
          instruction: '',
          durationMinutes: 5,
          completed: true
        }));

        const res = await fetch('/api/report/weekly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkins: localCheckins,
            missions: completedMissions
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            setSummary(data.summary);
          }
        }
      } catch (err) {
        console.error('Failed to fetch summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  // Compute stressor tag frequency
  const stressorCounts: Record<string, number> = {};
  checkins.forEach((c) => {
    c.stressorTags?.forEach((tag: string) => {
      stressorCounts[tag] = (stressorCounts[tag] || 0) + 1;
    });
  });
  const topStressors = Object.entries(stressorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Consistency calculations
  const totalDays = 7;
  const activeDaysCount = last7Days.filter((s) => s.checkin).length;
  const consistencyPercent = Math.min(100, Math.round((activeDaysCount / totalDays) * 100));

  const handleCopySummary = () => {
    if (!summary) return;
    const text = `--- LAPORAN MINGGUAN DENGAR.IN ---
Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
Konsistensi Check-in: ${activeDaysCount} dari 7 hari (${consistencyPercent}%)
Misi Selesai: Hari ke-${currentDay}
Catatan Jurnal: ${journalCount} refleksi
Kecenderungan Suasana: ${summary.dominantMood}
Pengamatan: ${summary.keyObservation}
Catatan: ${summary.encouragementNote}
----------------------------------`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-block">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Kembali ke Dashboard
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopySummary}
          >
            {copied ? 'Tersalin!' : 'Salin Laporan'}
          </Button>
        </div>

        {/* 1. Headline Summary */}
        <div className="space-y-2">
          <Badge variant="calm" size="md">
            <BarChart3 className="w-3.5 h-3.5 mr-1 text-calm-700" />
            Laporan Kemajuan Mingguan (Follow-Up)
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight">
            Sintesis Evaluasi & Refleksi 7 Hari
          </h1>
          <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-xl">
            Sintesis berkala membantu melihat progres nyata langkah-langkah kecilmu, membuktikan bahwa setiap jeda dan refleksi memiliki arti.
          </p>
        </div>

        {/* 2. Primary Progress Visualization Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SoftCard variant="white" elevation="low" className="p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-sand-600">
              <span className="font-semibold">Konsistensi Evaluasi</span>
              <Calendar className="w-3.5 h-3.5 text-sand-400" />
            </div>
            <p className="text-2xl font-black text-sand-900">{activeDaysCount} / 7 Hari</p>
            <ProgressBar value={consistencyPercent} max={100} />
            <span className="text-[11px] text-calm-700 font-bold block">{consistencyPercent}% Rutinitas Terjaga</span>
          </SoftCard>

          <SoftCard variant="white" elevation="low" className="p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-sand-600">
              <span className="font-semibold">Jalur Misi Harian</span>
              <Target className="w-3.5 h-3.5 text-sand-400" />
            </div>
            <p className="text-2xl font-black text-sand-900">Hari ke-{currentDay}</p>
            <ProgressBar value={Math.min(100, Math.round((currentDay / 14) * 100))} max={100} />
            <span className="text-[11px] text-calm-700 font-bold block">dari 14 Hari Rencana</span>
          </SoftCard>

          <SoftCard variant="white" elevation="low" className="p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-sand-600">
              <span className="font-semibold">Refleksi Jurnal</span>
              <BookOpen className="w-3.5 h-3.5 text-sand-400" />
            </div>
            <p className="text-2xl font-black text-sand-900">{journalCount} Catatan</p>
            <ProgressBar value={Math.min(100, journalCount * 25)} max={100} />
            <span className="text-[11px] text-calm-700 font-bold block">Tersimpan lokal di peramban</span>
          </SoftCard>
        </div>

        {/* 3. 7-Day Mood Trend Visualization Chart */}
        <SoftCard variant="white" elevation="low" className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-sand-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-calm-700" />
              <span>Grafik Tren Suasana Hati 7 Hari Terakhir</span>
            </h3>
            <span className="text-[11px] text-sand-500">Berdasarkan Check-in Harian</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {last7Days.map((slot, idx) => {
              const checkin = slot.checkin;
              const meta = checkin ? MOOD_META[checkin.mood] : null;
              const heightPercent = meta ? meta.score * 20 : 10;

              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="h-28 w-full bg-sand-50 rounded-2xl flex flex-col justify-end p-1.5 border border-sand-100 relative group">
                    {checkin ? (
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-xl flex items-center justify-center transition-all ${meta?.color || 'bg-calm-200'}`}
                        title={`${slot.dayLabel}: ${meta?.label} (Energi: ${checkin.energyLevel}/10)`}
                      >
                        {meta?.icon}
                      </div>
                    ) : (
                      <div className="h-4 w-full rounded-lg border border-dashed border-sand-300 flex items-center justify-center text-[10px] text-sand-400">
                        -
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] sm:text-[11px] text-sand-600 font-medium">
                    {slot.dayLabel.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-sand-100 text-[11px] text-sand-600">
            <span className="flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-emerald-600" /> Positif / Tenang
            </span>
            <span className="flex items-center gap-1.5">
              <Meh className="w-3.5 h-3.5 text-sand-600" /> Netral
            </span>
            <span className="flex items-center gap-1.5">
              <Frown className="w-3.5 h-3.5 text-amber-600" /> Butuh Perhatian
            </span>
          </div>
        </SoftCard>

        {/* 4. Top Stressors Observed */}
        {topStressors.length > 0 && (
          <SoftCard variant="white" elevation="low" className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sand-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Pemicu Beban Paling Sering Muncul:</span>
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {topStressors.map(([tag, count]) => (
                <div
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-sand-100 border border-sand-200 text-xs font-semibold text-sand-800 flex items-center gap-1.5"
                >
                  <span>{tag}</span>
                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full text-sand-500 font-mono">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          </SoftCard>
        )}

        {/* 5. Qualitative Synthesis & Encouragement */}
        <SoftCard variant="white" elevation="low" className="p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sand-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-calm-700" />
            <span>Pengamatan & Sintesis Pola:</span>
          </h3>

          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-sand-100 rounded w-3/4"></div>
              <div className="h-4 bg-sand-100 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-sand-800 leading-relaxed">
                {summary?.keyObservation ||
                  'Evaluasi mingguanmu menunjukkan upaya berkelanjutan untuk memberi ruang jeda bagi pikiran dan tubuh.'}
              </p>
              <p className="text-xs sm:text-sm text-calm-800 leading-relaxed font-medium bg-calm-50/90 p-4 rounded-2xl border border-calm-200/80">
                🌱 <strong>Pesan Penguat:</strong> {summary?.encouragementNote}
              </p>
            </div>
          )}
        </SoftCard>

        {/* 6. Next Focus */}
        <div className="rounded-2xl border border-calm-200/90 bg-calm-50/80 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs space-y-1 max-w-md text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-calm-800">
              Fokus Minggu Depan:
            </span>
            <p className="text-sm font-bold text-calm-950">
              Mempertahankan ritme misi harian 5 menit & latihan relaksasi pernapasan saat pemicu stres muncul.
            </p>
          </div>

          <Link href="/dashboard" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" fullWidth>
              Lanjut ke Hari Ini
            </Button>
          </Link>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
