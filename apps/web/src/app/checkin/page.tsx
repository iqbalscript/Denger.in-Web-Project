'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BatteryMedium,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { saveDailyCheckin, getDailyCheckins } from '@/lib/storage';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { useCrisisGuard } from '@/lib/useCrisisGuard';
import { InlineCrisisCard, CrisisBlockedNote } from '@/components/InlineCrisisCard';
import { ConsentPending } from '@/components/ConsentPending';
import type { MoodScore, DailyCheckin, CelebrationData } from '@dengarin/types';
import {
  PageContainer,
  ContentColumn,
  Button,
  Badge,
  Chip,
  Textarea,
  CelebrationToast,
  Reveal,
  MoodIcon,
} from '@/components/ui';
import { awardLangkah } from '@/lib/gamification';
import { getLocalDateString } from '@/lib/calendar';

export default function CheckinPage() {
  const router = useRouter();
  const { ready, session } = useConsentGuard();
  const crisis = useCrisisGuard(session?.ageBracket);

  const [selectedMood, setSelectedMood] = useState<MoodScore | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [briefNote, setBriefNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<DailyCheckin[]>([]);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    setHistory(getDailyCheckins());
  }, [ready]);

  const moods: Array<{ id: MoodScore; label: string; sub: string; activeClass: string }> = [
    { id: 'sangat_baik', label: 'Sangat Baik', sub: 'Bertenaga', activeClass: 'bg-lime text-ink' },
    { id: 'baik', label: 'Cukup Baik', sub: 'Oke', activeClass: 'bg-cobalt text-white' },
    { id: 'netral', label: 'Biasa Saja', sub: 'Lumayan', activeClass: 'bg-yellow text-ink' },
    { id: 'berat', label: 'Terasa Berat', sub: 'Cemas / Lelah', activeClass: 'bg-tangerine text-white' },
    { id: 'kewalahan', label: 'Kewalahan', sub: 'Sangat Lelah', activeClass: 'bg-coral text-white' },
  ];

  const tags = [
    'Tugas Sekolah / Kuliah',
    'Beban Kerja Kantor',
    'Finansial & Tagihan',
    'Kurang Tidur / Lelah',
    'Konflik Pasangan / Teman',
    'Dinamika Keluarga',
    'Merasa Kesepian',
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBriefNote(text);

    // Live safety filter (ZERO AI): inline crisis card, no navigation (M6).
    crisis.checkText(text);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood || saved || isSubmittingRef.current) return;

    // Safety check on note: keep the text, block the save.
    if (!crisis.allowSubmit(briefNote)) return;
    isSubmittingRef.current = true;

    const newCheckin: DailyCheckin = {
      id: Date.now().toString(),
      userId: session?.userId || 'anon-user',
      timestamp: new Date().toISOString(),
      mood: selectedMood,
      energyLevel,
      stressorTags: selectedTags,
      briefNote: briefNote.trim() || undefined,
    };

    saveDailyCheckin(newCheckin);
    setHistory((prev) => [newCheckin, ...prev]);
    setSaved(true);

    // Gamification: award daily check-in Langkah (idempotent per local day)
    const localDate = getLocalDateString();
    const result = awardLangkah('daily_checkin', `checkin:${localDate}`, localDate);
    if (result) {
      setCelebration(result);
    }

    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-10 text-left">
        <div className="animate-reveal-up">
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            KEMBALI KE DASHBOARD
          </Button>
        </div>

        {/* Heading */}
        <div className="space-y-4 animate-reveal-up [animation-delay:80ms]">
          <Badge variant="yellow" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Check-in Mandiri Harian
          </Badge>
          <h1 className="text-[2rem] sm:text-4xl lg:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05]">
            Gimana keadaanmu hari ini?
          </h1>
          <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-[36rem]">
            Ambil jeda satu menit untuk menyapa dirimu sendiri. Apa pun jawabannya, semuanya boleh.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-10 animate-reveal-up [animation-delay:160ms]">
          {/* PRIMARY: Large Tactile Mood Selector */}
          <div className="space-y-3" role="group" aria-labelledby="label-mood">
            <p id="label-mood" className="text-lg font-bold text-ink leading-snug">
              1. Lagi terasa seperti apa?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {moods.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    aria-pressed={isSelected}
                    className={`p-4 rounded-md border-2 border-ink flex flex-col items-center justify-center gap-1 transition-[transform,box-shadow,background-color] duration-200 ease-spring cursor-pointer min-h-[104px] last:col-span-2 sm:last:col-span-1 ${
                      isSelected
                        ? `${m.activeClass} shadow-hard font-bold -translate-x-[1px] -translate-y-[1px]`
                        : 'bg-white hover:bg-paper font-semibold shadow-hard-sm text-ink hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                    }`}
                  >
                    <MoodIcon mood={m.id} className="w-8 h-8 mb-1.5" />
                    <span className="text-sm text-center leading-tight">
                      {m.label}
                    </span>
                    <span className="text-xs font-medium">{m.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Level Slider */}
          <div className="space-y-4 p-5 sm:p-6 bg-white border border-borderSubtle rounded-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="tingkat-energi" className="text-lg font-bold text-ink leading-snug flex items-center gap-2">
                <BatteryMedium className="w-5 h-5 text-ink" aria-hidden="true" />
                <span>2. Tingkat energimu (1–10)</span>
              </label>
              <span aria-live="polite" className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-yellow border-2 border-ink rounded shadow-hard-sm tabular-nums">
                SKOR: {energyLevel} / 10
              </span>
            </div>
            <input
              id="tingkat-energi"
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              aria-label="Tingkat energi dari 1 sampai 10"
              className="w-full h-3 bg-paper border-2 border-ink rounded appearance-none cursor-pointer accent-ink"
            />
          </div>

          {/* Stressor Chips */}
          <div className="space-y-3" role="group" aria-labelledby="label-beban">
            <p id="label-beban" className="text-lg font-bold text-ink leading-snug">
              3. Ada yang terasa membebani hari ini?{' '}
              <span className="text-sm font-medium text-[#59544D]">(boleh dilewati)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    selected={isSelected}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={isSelected}
                    size="sm"
                  >
                    {tag}
                  </Chip>
                );
              })}
            </div>
          </div>

          {/* Brief Note with safety warning */}
          <div className="space-y-2">
            <Textarea
              label="4. Catatan Singkat (Opsional)"
              value={briefNote}
              onChange={handleNoteChange}
              rows={2}
              placeholder="Kalau mau, ceritakan sedikit apa yang ada di pikiranmu..."
            />
            {crisis.cardVisible && (
              <InlineCrisisCard
                contacts={crisis.contacts}
                onAcknowledge={crisis.acknowledge}
                blockedNote="Catatanmu tetap ada di sini dan check-in belum kami simpan."
              />
            )}
            {crisis.isCrisis && <CrisisBlockedNote id="checkin-krisis-catatan" />}
            <div className="p-3 rounded-md bg-[#FFF4CC] flex items-center gap-2 text-sm text-ink">
              <AlertTriangle className="w-4 h-4 text-ink shrink-0" aria-hidden="true" />
              <span>Catatanmu tersimpan anonim di peramban perangkatmu.</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2" role="status">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!selectedMood || saved || crisis.isCrisis}
              aria-describedby={crisis.isCrisis ? 'checkin-krisis-catatan' : undefined}
              iconPosition={saved ? 'start' : 'end'}
              icon={saved ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <ArrowRight className="w-4 h-4" />}
            >
              {saved ? 'TERSIMPAN. TERIMA KASIH SUDAH MENYAPA DIRIMU' : 'SIMPAN CHECK-IN HARI INI'}
            </Button>
          </div>
        </form>

        {/* History Section */}
        {history.length > 0 && (
          <section aria-labelledby="judul-riwayat" className="pt-10 border-t-2 border-ink space-y-5">
            <h2 id="judul-riwayat" className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.01em] leading-[1.25] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-ink" aria-hidden="true" />
              <span>Riwayat check-in terakhir <span className="text-[#59544D] font-medium tabular-nums">({history.length})</span></span>
            </h2>

            <div className="space-y-3">
              {history.slice(0, 4).map((entry, index) => (
                <Reveal
                  key={entry.id}
                  delay={index * 70}
                  className="p-4 rounded-md bg-white border border-borderSubtle flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink capitalize">
                        {entry.mood.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-paper border border-borderSubtle rounded tabular-nums">
                        Energi: {entry.energyLevel}/10
                      </span>
                    </div>
                    {entry.stressorTags.length > 0 && (
                      <p className="text-sm text-[#59544D]">
                        Yang terasa berat: {entry.stressorTags.join(', ')}
                      </p>
                    )}
                    {entry.briefNote && (
                      <p className="text-[15px] text-ink italic leading-relaxed">&quot;{entry.briefNote}&quot;</p>
                    )}
                  </div>

                  <span className="text-xs text-[#59544D] font-medium shrink-0 tabular-nums">
                    {new Date(entry.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </ContentColumn>

      <CelebrationToast celebration={celebration} onDismiss={() => setCelebration(null)} />
    </PageContainer>
  );
}

