'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ArrowLeft,
  ArrowRight,
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
  Target,
  Sprout,
} from 'lucide-react';
import {
  PageContainer,
  Button,
  Badge,
  ProgressBar,
  CelebrationToast,
  Textarea,
  Reveal,
} from '@/components/ui';
import { getDailyCheckins } from '@/lib/storage';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { useCrisisGuard } from '@/lib/useCrisisGuard';
import { InlineCrisisCard, CrisisBlockedNote } from '@/components/InlineCrisisCard';
import { ConsentPending } from '@/components/ConsentPending';
import { awardLangkah, loadGamificationState } from '@/lib/gamification';
import { getLocalDateOfTimestamp, getLocalDateString, getLocalWeekId } from '@/lib/calendar';
import type { DailyCheckin, MoodScore, WeeklyReportSummary, CelebrationData } from '@dengarin/types';

const MOOD_META: Record<MoodScore, { label: string; icon: React.ReactNode; color: string; score: number }> = {
  sangat_baik: { label: 'Sangat Baik', icon: <Smile className="w-4 h-4 text-ink" aria-hidden="true" />, color: 'bg-lime text-ink border-2 border-ink shadow-hard-sm', score: 5 },
  baik: { label: 'Baik', icon: <Smile className="w-4 h-4 text-white" aria-hidden="true" />, color: 'bg-cobalt text-white border-2 border-ink shadow-hard-sm', score: 4 },
  netral: { label: 'Netral', icon: <Meh className="w-4 h-4 text-ink" aria-hidden="true" />, color: 'bg-yellow text-ink border-2 border-ink shadow-hard-sm', score: 3 },
  berat: { label: 'Cukup Berat', icon: <Frown className="w-4 h-4 text-ink" aria-hidden="true" />, color: 'bg-tangerine text-ink border-2 border-ink shadow-hard-sm', score: 2 },
  kewalahan: { label: 'Kewalahan', icon: <Frown className="w-4 h-4 text-white" aria-hidden="true" />, color: 'bg-[#D32F2F] text-white border-2 border-ink shadow-hard-sm', score: 1 }
};

interface DaySlot {
  dateStr: string;
  dayLabel: string;
  checkin?: DailyCheckin;
}

export default function ReportPage() {
  const { ready, session } = useConsentGuard();
  const crisis = useCrisisGuard(session?.ageBracket);
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
    if (!ready) return;
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
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    // 1. Read real local data
    const localCheckins = getDailyCheckins();
    setCheckins(localCheckins);

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
      const dateStr = getLocalDateString(d);
      const dayLabel = `${dayNames[d.getDay()]} (${d.getDate()})`;
      const match = localCheckins.find((c) => getLocalDateOfTimestamp(c.timestamp) === dateStr);
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
            // Only moods are needed for the summary; private notes stay on the device.
            checkins: localCheckins.map((checkin) => ({ ...checkin, briefNote: undefined })),
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
  }, [ready, session]);

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

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="default">
      <div className="mx-auto w-full max-w-5xl space-y-10 sm:space-y-12 text-left">
        <div className="flex items-center justify-between gap-3 animate-reveal-up">
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Kembali ke beranda
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            onClick={handleCopySummary}
            disabled={!summary}
          >
            {copied ? 'Tersalin' : 'Salin laporan'}
          </Button>
        </div>

        {/* 1. Headline Summary */}
        <div className="space-y-4 max-w-2xl animate-reveal-up [animation-delay:80ms]">
          <Badge variant="calm" size="md">
            <BarChart3 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Laporan mingguan
          </Badge>
          <h1 className="text-[2.25rem] sm:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05]">
            Rangkuman &amp; refleksi <span className="tabular-nums">7</span> hari
          </h1>
          <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-xl">
            Rangkuman berkala membantu melihat progres nyata langkah-langkah kecilmu, membuktikan bahwa setiap jeda dan refleksi memiliki arti.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* 2. Primary Progress Visualization Cards */}
        <div className="lg:col-span-4 lg:order-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 animate-reveal-up [animation-delay:240ms]">
          <div className="bg-white border border-[#D8D3C9] rounded-lg p-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm text-[#59544D] font-bold">
              <span>Keteraturan check-in</span>
              <Calendar className="w-4 h-4 text-cobalt" aria-hidden="true" />
            </div>
            <p className="text-[1.75rem] font-bold text-ink tracking-[-0.02em] leading-none tabular-nums">{activeDaysCount} dari 7 hari</p>
            <ProgressBar value={consistencyPercent} max={100} label="Keteraturan check-in" className="[&>div:first-child]:sr-only" />
            <span className="text-sm text-[#2B51E6] font-semibold block tabular-nums">{consistencyPercent}% hari aktif</span>
          </div>

          <div className="bg-white border border-[#D8D3C9] rounded-lg p-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm text-[#59544D] font-bold">
              <span>Misi harian</span>
              <Target className="w-4 h-4 text-cobalt" aria-hidden="true" />
            </div>
            <p className="text-[1.75rem] font-bold text-ink tracking-[-0.02em] leading-none tabular-nums">Hari ke-{currentDay}</p>
            <ProgressBar value={Math.min(100, Math.round((currentDay / 14) * 100))} max={100} label="Kemajuan misi 14 hari" className="[&>div:first-child]:sr-only" />
            <span className="text-sm text-[#2B51E6] font-semibold block tabular-nums">dari 14 hari rencana</span>
          </div>

          <div className="bg-white border border-[#D8D3C9] rounded-lg p-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm text-[#59544D] font-bold">
              <span>Catatan jurnal</span>
              <BookOpen className="w-4 h-4 text-cobalt" aria-hidden="true" />
            </div>
            <p className="text-[1.75rem] font-bold text-ink tracking-[-0.02em] leading-none tabular-nums">{journalCount} catatan</p>
            <ProgressBar value={Math.min(100, journalCount * 25)} max={100} label="Jumlah catatan jurnal" className="[&>div:first-child]:sr-only" />
            <span className="text-sm text-[#2B51E6] font-semibold block tabular-nums">Tersimpan di perangkat ini</span>
          </div>
        </div>

        {/* 3. 7-Day Mood Trend Visualization Chart */}
        <div className="lg:col-span-8 lg:order-1 animate-reveal-up [animation-delay:160ms] bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-5 shadow-hard-sm text-left">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D3C9] pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cobalt" aria-hidden="true" />
              <span>Tren suasana hati 7 hari terakhir</span>
            </h2>
            <span className="text-sm text-[#59544D] font-bold">Dari check-in harian</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {last7Days.map((slot, idx) => {
              const checkin = slot.checkin;
              const meta = checkin ? MOOD_META[checkin.mood] : null;
              const heightPercent = meta ? meta.score * 20 : 10;

              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className="h-36 sm:h-44 w-full bg-paper rounded-md flex flex-col justify-end p-1.5 border border-[#D8D3C9] relative group"
                    role="img"
                    aria-label={checkin ? `${slot.dayLabel}: ${meta?.label}, energi ${checkin.energyLevel} dari 10` : `${slot.dayLabel}: belum ada check-in`}
                  >
                    {checkin ? (
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded flex items-center justify-center ${meta?.color || 'bg-cobalt'}`}
                        title={`${slot.dayLabel}: ${meta?.label} (Energi: ${checkin.energyLevel}/10)`}
                      >
                        {meta?.icon}
                      </div>
                    ) : (
                      <div className="h-4 w-full rounded border border-dashed border-[#C5BFB4]" aria-hidden="true" />
                    )}
                  </div>

                  <span className="text-sm text-ink font-semibold" aria-hidden="true">
                    {slot.dayLabel.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-[#D8D3C9] text-sm text-[#59544D] font-semibold">
            <span className="flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-cobalt" aria-hidden="true" /> Batang tinggi = tenang
            </span>
            <span className="flex items-center gap-1.5">
              <Meh className="w-4 h-4 text-ink" aria-hidden="true" /> Sedang = biasa saja
            </span>
            <span className="flex items-center gap-1.5">
              <Frown className="w-4 h-4 text-[#B3261E]" aria-hidden="true" /> Pendek = butuh perhatian
            </span>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* 4. Top Stressors Observed */}
        {topStressors.length > 0 && (
          <Reveal delay={70} className="lg:col-span-5 lg:order-2 bg-white border border-[#D8D3C9] rounded-lg p-6 sm:p-7 space-y-4 text-left">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25] flex items-center gap-2">
              <Zap className="w-4 h-4 text-cobalt" aria-hidden="true" />
              <span>Yang paling sering terasa berat</span>
            </h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {topStressors.map(([tag, count]) => (
                <div
                  key={tag}
                  className="px-3 py-1.5 rounded bg-paper border border-[#D8D3C9] text-sm font-semibold text-ink flex items-center gap-2"
                >
                  <span>{tag}</span>
                  <span className="text-sm bg-yellow border border-ink px-1.5 py-0.5 rounded font-bold tabular-nums">
                    {count} kali
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* 5. Qualitative Synthesis & Encouragement */}
        <Reveal
          className={`${topStressors.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} lg:order-1 bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-4 shadow-hard-sm text-left`}
          aria-busy={loading}
        >
          <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cobalt" aria-hidden="true" />
            <span>Yang kami lihat dari minggumu</span>
          </h2>

          {loading ? (
            <div className="animate-pulse space-y-3" aria-hidden="true">
              <div className="h-4 bg-[#F5ECE0] rounded w-11/12"></div>
              <div className="h-4 bg-[#F5ECE0] rounded w-3/4"></div>
              <div className="h-16 bg-[#F5ECE0] rounded-md w-full mt-4"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-base text-ink leading-relaxed">
                {summary?.keyObservation ||
                  'Minggu ini kamu terus berusaha memberi ruang jeda untuk pikiran dan tubuhmu, dan itu layak dihargai.'}
              </p>
              <p className="text-base sm:text-base text-ink leading-relaxed font-medium bg-[#FFF4CC] p-4 rounded-md border-l-4 border-yellow">
                <Sprout className="inline w-4 h-4 mr-1 align-[-3px] text-[#151515]" aria-hidden="true" /><strong className="font-bold">Pesan untukmu:</strong> {summary?.encouragementNote}
              </p>
            </div>
          )}
        </Reveal>
        </div>

        {/* Weekly Reflection Action — explicit reflection action per Section 1 */}
        {!loading && !reflectionMarked && (
          <Reveal className="max-w-3xl bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-5 shadow-hard-sm text-left">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25] flex flex-wrap items-center gap-2">
                <BookOpen className="w-4 h-4 text-cobalt" aria-hidden="true" />
                <span>Refleksi mingguan</span>
                <span className="text-sm font-bold bg-yellow border border-ink px-1.5 py-0.5 rounded tabular-nums">+20 Langkah</span>
              </h2>
              <p id="petunjuk-refleksi" className="text-base text-[#59544D] leading-relaxed">
                Apa satu hal yang paling kamu sadari atau pelajari tentang dinamika emosimu selama sepekan terakhir?
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (weeklyReflectionText.trim().length < 20) return;

                // Crisis screening before any save or award: keep text, block save (M6).
                if (!crisis.allowSubmit(weeklyReflectionText)) return;

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

                  // Live crisis check: inline card, no navigation (M6).
                  crisis.checkText(text);
                }}
                rows={3}
                aria-label="Catatan refleksi mingguan"
                aria-describedby="petunjuk-refleksi hitungan-refleksi"
                placeholder="Tuliskan catatan refleksimu di sini (minimal 20 karakter)..."
              />
              {crisis.cardVisible && (
                <InlineCrisisCard
                  contacts={crisis.contacts}
                  onAcknowledge={crisis.acknowledge}
                  blockedNote="Refleksimu tetap ada di sini dan belum kami simpan."
                />
              )}
              {crisis.isCrisis && <CrisisBlockedNote id="refleksi-krisis-catatan" />}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span id="hitungan-refleksi" className="text-sm text-[#59544D] font-semibold tabular-nums" aria-live="polite">
                  {weeklyReflectionText.trim().length < 20 ? (
                    `${weeklyReflectionText.trim().length}/20 karakter minimal`
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />
                      Cukup, terima kasih sudah menulis
                    </span>
                  )}
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={weeklyReflectionText.trim().length < 20 || crisis.isCrisis}
                  aria-describedby={crisis.isCrisis ? 'refleksi-krisis-catatan' : undefined}
                  iconPosition="end"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Simpan refleksi mingguan
                </Button>
              </div>
            </form>
          </Reveal>
        )}

        {reflectionMarked && (
          <div role="status" className="animate-reveal-up max-w-3xl bg-lime border-2 border-ink rounded-lg p-5 sm:p-6 shadow-hard-sm text-left space-y-2">
            <div className="flex items-center gap-2 text-base font-bold text-ink">
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>Refleksi minggu ini telah tersimpan</span>
            </div>
            {savedWeeklyReflection && (
              <p className="text-base text-ink italic bg-white p-3 rounded border border-ink">
                &quot;{savedWeeklyReflection}&quot;
              </p>
            )}
            <p className="text-base text-ink">
              Terima kasih sudah meluangkan waktu untuk melihat kembali minggumu.
            </p>
          </div>
        )}

        {/* 6. Next Focus */}
        <Reveal className="rounded-lg border-2 border-ink bg-lime p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-hard text-left">
          <div className="space-y-1.5 max-w-md">
            <span className="text-sm font-bold text-ink">
              Fokus minggu depan
            </span>
            <p className="text-base sm:text-lg font-bold text-ink leading-[1.35]">
              Lanjutkan misi harian 5 menit, dan coba latihan napas pelan saat stres muncul.
            </p>
          </div>

          <Button
            href="/dashboard"
            variant="secondary"
            size="md"
            iconPosition="end"
            icon={<ArrowRight className="w-4 h-4" />}
            className="shrink-0 w-full sm:w-auto"
          >
            Lanjut ke hari ini
          </Button>
        </Reveal>
      </div>

      <CelebrationToast celebration={celebration} onDismiss={() => setCelebration(null)} />
    </PageContainer>
  );
}

