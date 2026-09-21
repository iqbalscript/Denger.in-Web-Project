'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import {
  PageContainer,
  ContentColumn,
  Button,
  Badge,
  ProgressBar,
  CelebrationToast,
  Textarea,
} from '@/components/ui';
import { getDailyCheckins, getAnonymousSession } from '@/lib/storage';
import { awardLangkah, loadGamificationState } from '@/lib/gamification';
import { getLocalWeekId } from '@/lib/calendar';
import type { DailyCheckin, MoodScore, WeeklyReportSummary, CelebrationData } from '@dengarin/types';

const MOOD_META: Record<MoodScore, { label: string; icon: React.ReactNode; color: string; score: number }> = {
  sangat_baik: { label: 'Sangat Baik', icon: <Smile className="w-4 h-4 text-ink" />, color: 'bg-lime text-ink border-2 border-ink shadow-hard-sm', score: 5 },
  baik: { label: 'Baik', icon: <Smile className="w-4 h-4 text-white" />, color: 'bg-cobalt text-white border-2 border-ink shadow-hard-sm', score: 4 },
  netral: { label: 'Netral', icon: <Meh className="w-4 h-4 text-ink" />, color: 'bg-yellow text-ink border-2 border-ink shadow-hard-sm', score: 3 },
  berat: { label: 'Cukup Berat', icon: <Frown className="w-4 h-4 text-white" />, color: 'bg-tangerine text-white border-2 border-ink shadow-hard-sm', score: 2 },
  kewalahan: { label: 'Kewalahan', icon: <Frown className="w-4 h-4 text-white" />, color: 'bg-coral text-white border-2 border-ink shadow-hard-sm', score: 1 }
};

interface DaySlot {
  dateStr: string;
  dayLabel: string;
  checkin?: DailyCheckin;
}

export default function ReportPage() {
  const router = useRouter();
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [summary, setSummary] = useState<WeeklyReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [last7Days, setLast7Days] = useState<DaySlot[]>([]);
  const [reflectionMarked, setReflectionMarked] = useState(false);
  const [weeklyReflectionText, setWeeklyReflectionText] = useState('');
  const [savedWeeklyReflection, setSavedWeeklyReflection] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  // Check if weekly reflection was already marked for this week
  useEffect(() => {
    const weekId = getLocalWeekId();
    const state = loadGamificationState();
    if (state.eventLedger.some(e => e.id === `weekly_reflection:${weekId}`)) {
      setReflectionMarked(true);
    }
    try {
      const storedNote = localStorage.getItem(`dengarin_weekly_reflection_${weekId}`);
      if (storedNote) setSavedWeeklyReflection(storedNote);
    } catch {
      // ignore
    }
  }, []);

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
          const summaryData = data?.data?.summary ?? data?.summary;
          if (summaryData) {
            setSummary(summaryData);
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
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            KEMBALI KE DASHBOARD
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopySummary}
          >
            {copied ? 'TERSALIN!' : 'SALIN LAPORAN'}
          </Button>
        </div>

        {/* 1. Headline Summary */}
        <div className="space-y-2">
          <Badge variant="calm" size="md">
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Laporan Kemajuan Mingguan (Follow-Up)
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none">
            SINTESIS EVALUASI &amp; REFLEKSI 7 HARI
          </h1>
          <p className="text-xs sm:text-sm text-ink/80 leading-relaxed max-w-xl font-medium">
            Sintesis berkala membantu melihat progres nyata langkah-langkah kecilmu, membuktikan bahwa setiap jeda dan refleksi memiliki arti.
          </p>
        </div>

        {/* 2. Primary Progress Visualization Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-ink rounded-lg p-5 space-y-2.5 shadow-hard-sm text-left">
            <div className="flex items-center justify-between text-xs text-ink/70 font-bold uppercase tracking-wide">
              <span>Konsistensi Evaluasi</span>
              <Calendar className="w-3.5 h-3.5 text-cobalt" />
            </div>
            <p className="text-2xl font-black text-ink">{activeDaysCount} / 7 Hari</p>
            <ProgressBar value={consistencyPercent} max={100} />
            <span className="text-[11px] text-cobalt font-black uppercase tracking-wider block">{consistencyPercent}% Rutinitas Terjaga</span>
          </div>

          <div className="bg-white border-2 border-ink rounded-lg p-5 space-y-2.5 shadow-hard-sm text-left">
            <div className="flex items-center justify-between text-xs text-ink/70 font-bold uppercase tracking-wide">
              <span>Jalur Misi Harian</span>
              <Target className="w-3.5 h-3.5 text-cobalt" />
            </div>
            <p className="text-2xl font-black text-ink">Hari ke-{currentDay}</p>
            <ProgressBar value={Math.min(100, Math.round((currentDay / 14) * 100))} max={100} />
            <span className="text-[11px] text-cobalt font-black uppercase tracking-wider block">dari 14 Hari Rencana</span>
          </div>

          <div className="bg-white border-2 border-ink rounded-lg p-5 space-y-2.5 shadow-hard-sm text-left">
            <div className="flex items-center justify-between text-xs text-ink/70 font-bold uppercase tracking-wide">
              <span>Refleksi Jurnal</span>
              <BookOpen className="w-3.5 h-3.5 text-cobalt" />
            </div>
            <p className="text-2xl font-black text-ink">{journalCount} Catatan</p>
            <ProgressBar value={Math.min(100, journalCount * 25)} max={100} />
            <span className="text-[11px] text-cobalt font-black uppercase tracking-wider block">Tersimpan lokal di peramban</span>
          </div>
        </div>

        {/* 3. 7-Day Mood Trend Visualization Chart */}
        <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-7 space-y-4 shadow-hard-sm text-left">
          <div className="flex items-center justify-between border-b-2 border-ink pb-3">
            <h3 className="text-sm font-black text-ink uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cobalt" />
              <span>Grafik Tren Suasana Hati 7 Hari Terakhir</span>
            </h3>
            <span className="text-[11px] text-ink/60 font-bold uppercase tracking-wider">Check-in Harian</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {last7Days.map((slot, idx) => {
              const checkin = slot.checkin;
              const meta = checkin ? MOOD_META[checkin.mood] : null;
              const heightPercent = meta ? meta.score * 20 : 10;

              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="h-28 w-full bg-paper rounded-md flex flex-col justify-end p-1.5 border-2 border-ink relative group">
                    {checkin ? (
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded flex items-center justify-center transition-all ${meta?.color || 'bg-cobalt'}`}
                        title={`${slot.dayLabel}: ${meta?.label} (Energi: ${checkin.energyLevel}/10)`}
                      >
                        {meta?.icon}
                      </div>
                    ) : (
                      <div className="h-4 w-full rounded border border-dashed border-ink/40 flex items-center justify-center text-[10px] text-ink/40 font-bold">
                        -
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] sm:text-[11px] text-ink font-bold uppercase">
                    {slot.dayLabel.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t-2 border-ink text-[11px] text-ink font-bold uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-cobalt" /> Positif / Tenang
            </span>
            <span className="flex items-center gap-1.5">
              <Meh className="w-3.5 h-3.5 text-ink" /> Netral
            </span>
            <span className="flex items-center gap-1.5">
              <Frown className="w-3.5 h-3.5 text-coral" /> Butuh Perhatian
            </span>
          </div>
        </div>

        {/* 4. Top Stressors Observed */}
        {topStressors.length > 0 && (
          <div className="bg-white border-2 border-ink rounded-lg p-6 space-y-3 shadow-hard-sm text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
                <Zap className="w-4 h-4 text-cobalt" />
                <span>PEMICU BEBAN PALING SERING MUNCUL:</span>
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {topStressors.map(([tag, count]) => (
                <div
                  key={tag}
                  className="px-3 py-1.5 rounded-md bg-paper border-2 border-ink text-xs font-bold text-ink flex items-center gap-1.5 shadow-hard-sm"
                >
                  <span>{tag}</span>
                  <span className="text-[10px] bg-yellow border border-ink px-1.5 py-0.5 rounded font-black font-mono">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Qualitative Synthesis & Encouragement */}
        <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-4 shadow-hard-sm text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cobalt" />
            <span>PENGAMATAN &amp; SINTESIS POLA:</span>
          </h3>

          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-paper rounded w-3/4"></div>
              <div className="h-4 bg-paper rounded w-1/2"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">
                {summary?.keyObservation ||
                  'Evaluasi mingguanmu menunjukkan upaya berkelanjutan untuk memberi ruang jeda bagi pikiran dan tubuh.'}
              </p>
              <p className="text-xs sm:text-sm text-ink leading-relaxed font-bold bg-yellow/20 p-4 rounded-md border-2 border-ink shadow-hard-sm">
                🌱 <strong>PESAN PENGUAT:</strong> {summary?.encouragementNote}
              </p>
            </div>
          )}
        </div>

        {/* Weekly Reflection Action — explicit reflection action per Section 1 */}
        {!loading && !reflectionMarked && (
          <div className="bg-white border-2 border-ink rounded-lg p-6 space-y-4 shadow-hard-sm text-left">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cobalt" />
                <span>REFLEKSI PEKANAN MANDIRI (+20 LANGKAH)</span>
              </h3>
              <p className="text-xs text-ink/70 font-medium leading-relaxed">
                Apa satu hal yang paling kamu sadari atau pelajari tentang dinamika emosimu selama sepekan terakhir?
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (weeklyReflectionText.trim().length < 20) return;

                // Crisis screening before any save or award
                const session = getAnonymousSession();
                const check = evaluateCrisisInput(weeklyReflectionText, session?.ageBracket || '18-24');
                if (check.isCrisis) {
                  router.push('/crisis');
                  return;
                }

                const weekId = getLocalWeekId();
                const cleanNote = weeklyReflectionText.trim();
                localStorage.setItem(`dengarin_weekly_reflection_${weekId}`, cleanNote);
                setSavedWeeklyReflection(cleanNote);

                const res = awardLangkah('weekly_reflection', `weekly_reflection:${weekId}`);
                if (res) setCelebration(res);
                setReflectionMarked(true);
              }}
              className="space-y-3"
            >
              <Textarea
                value={weeklyReflectionText}
                onChange={(e) => {
                  const text = e.target.value;
                  setWeeklyReflectionText(text);

                  // Live crisis check
                  const session = getAnonymousSession();
                  const check = evaluateCrisisInput(text, session?.ageBracket || '18-24');
                  if (check.isCrisis) {
                    router.push('/crisis');
                  }
                }}
                rows={3}
                placeholder="Tuliskan catatan refleksimu di sini (minimal 20 karakter)..."
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-[10px] text-ink/60 font-bold uppercase tracking-wider">
                  {weeklyReflectionText.trim().length < 20
                    ? `${weeklyReflectionText.trim().length}/20 karakter minimal`
                    : '✓ Syarat refleksi terpenuhi'}
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={weeklyReflectionText.trim().length < 20}
                  className="w-full sm:w-auto"
                >
                  SIMPAN REFLEKSI PEKANAN →
                </Button>
              </div>
            </form>
          </div>
        )}

        {reflectionMarked && (
          <div className="bg-lime border-2 border-ink rounded-lg p-5 shadow-hard-sm text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-ink uppercase tracking-wider">
              <Check className="w-4 h-4" />
              <span>REFLEKSI MINGGU INI TELAH TERSIMPAN</span>
            </div>
            {savedWeeklyReflection && (
              <p className="text-xs text-ink/90 italic font-medium bg-white/70 p-3 rounded border border-ink/20">
                &quot;{savedWeeklyReflection}&quot;
              </p>
            )}
            <p className="text-[11px] text-ink/80 font-medium">
              Terima kasih sudah meluangkan waktu untuk mengevaluasi diri secara bermakna.
            </p>
          </div>
        )}

        {/* 6. Next Focus */}
        <div className="rounded-lg border-2 border-ink bg-lime p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-hard text-left">
          <div className="text-xs space-y-1 max-w-md">
            <span className="text-[11px] font-black uppercase tracking-wider text-ink">
              FOKUS MINGGU DEPAN:
            </span>
            <p className="text-sm font-black text-ink uppercase tracking-wide">
              Mempertahankan ritme misi harian 5 menit &amp; latihan relaksasi pernapasan saat pemicu stres muncul.
            </p>
          </div>

          <Button href="/dashboard" variant="primary" size="md" className="shrink-0 w-full sm:w-auto">
            LANJUT KE HARI INI →
          </Button>
        </div>
      </ContentColumn>

      <CelebrationToast celebration={celebration} onDismiss={() => setCelebration(null)} />
    </PageContainer>
  );
}

