'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BatteryMedium,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { getAnonymousSession, saveDailyCheckin, getDailyCheckins } from '@/lib/storage';
import type { MoodScore, DailyCheckin, CelebrationData } from '@dengarin/types';
import {
  PageContainer,
  ContentColumn,
  Button,
  Badge,
  Chip,
  Textarea,
  CelebrationToast,
} from '@/components/ui';
import { awardLangkah } from '@/lib/gamification';
import { getLocalDateString } from '@/lib/calendar';

export default function CheckinPage() {
  const router = useRouter();
  const session = getAnonymousSession();

  const [selectedMood, setSelectedMood] = useState<MoodScore | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [briefNote, setBriefNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<DailyCheckin[]>([]);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setHistory(getDailyCheckins());
  }, []);

  const moods: Array<{ id: MoodScore; label: string; emoji: string; sub: string; activeClass: string }> = [
    { id: 'sangat_baik', label: 'Sangat Baik', emoji: '😊', sub: 'Bertenaga', activeClass: 'bg-lime text-ink' },
    { id: 'baik', label: 'Cukup Baik', emoji: '🙂', sub: 'Terkendali', activeClass: 'bg-cobalt text-white' },
    { id: 'netral', label: 'Biasa Saja', emoji: '😐', sub: 'Stabil', activeClass: 'bg-yellow text-ink' },
    { id: 'berat', label: 'Terasa Berat', emoji: '😟', sub: 'Cemas / Lelah', activeClass: 'bg-tangerine text-white' },
    { id: 'kewalahan', label: 'Kewalahan', emoji: '😞', sub: 'Sangat Lelah', activeClass: 'bg-coral text-white' },
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

    // Live safety filter (ZERO AI)
    const check = evaluateCrisisInput(text, session?.ageBracket || '18-24');
    if (check.isCrisis) {
      router.push('/crisis');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood || saved || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Safety check on note
    if (briefNote.trim()) {
      const check = evaluateCrisisInput(briefNote, session?.ageBracket || '18-24');
      if (check.isCrisis) {
        router.push('/crisis');
        return;
      }
    }

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

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
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

        {/* Heading */}
        <div className="space-y-2">
          <Badge variant="calm" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Check-in Mandiri Harian
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none">
            GIMANA KEADAANMU HARI INI?
          </h1>
          <p className="text-xs sm:text-sm text-ink/80 leading-relaxed max-w-xl font-medium">
            Ambil jeda satu menit untuk mengenali apa yang sedang terjadi di dalam dirimu saat ini.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* PRIMARY: Large Tactile Mood Selector */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-ink">
              1. PILIH SUASANA HATIMU SAAT INI:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {moods.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`p-4 rounded-md border-2 border-ink flex flex-col items-center justify-center gap-1 transition-all cursor-pointer focus-visible:outline-ink min-h-[96px] last:col-span-2 sm:last:col-span-1 ${
                      isSelected
                        ? `${m.activeClass} shadow-hard font-black translate-x-[1px] translate-y-[1px]`
                        : 'bg-white hover:bg-paper font-bold shadow-hard-sm text-ink'
                    }`}
                  >
                    <span className="text-3xl mb-1 select-none" aria-hidden="true">
                      {m.emoji}
                    </span>
                    <span className="text-xs text-center leading-tight uppercase tracking-wide">
                      {m.label}
                    </span>
                    <span className="text-[10px] opacity-80">{m.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Level Slider */}
          <div className="space-y-3 p-4 bg-white border-2 border-ink rounded-md shadow-hard-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                <BatteryMedium className="w-4 h-4 text-cobalt" />
                <span>2. TINGKAT ENERGIMU (1–10)</span>
              </label>
              <span className="text-xs font-black uppercase px-2.5 py-1 bg-yellow border border-ink rounded shadow-hard-sm">
                SKOR: {energyLevel} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              aria-label="Tingkat energi dari 1 sampai 10"
              className="w-full h-3 bg-paper border-2 border-ink rounded appearance-none cursor-pointer accent-cobalt"
            />
          </div>

          {/* Stressor Chips */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-ink">
              3. SUMBER TEKANAN TERBESAR HARI INI (OPSIONAL):
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    selected={isSelected}
                    onClick={() => toggleTag(tag)}
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
              placeholder="Ceritakan sedikit apa yang ada di pikiranmu..."
            />
            <div className="p-3 rounded-md bg-yellow/20 border-2 border-ink shadow-hard-sm flex items-center gap-2 text-xs text-ink font-medium">
              <AlertTriangle className="w-4 h-4 text-ink shrink-0" />
              <span>Privasi aman dan tersimpan anonim di peramban Anda.</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!selectedMood || saved}
              icon={saved ? <CheckCircle2 className="w-5 h-5" /> : undefined}
            >
              {saved ? 'CHECK-IN TERSIMPAN!' : 'SIMPAN CHECK-IN HARI INI →'}
            </Button>
          </div>
        </form>

        {/* History Section */}
        {history.length > 0 && (
          <div className="pt-8 border-t-2 border-ink space-y-4">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cobalt" />
              <span>RIWAYAT CHECK-IN TERAKHIR ({history.length})</span>
            </h3>

            <div className="space-y-2.5">
              {history.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-md bg-white border-2 border-ink shadow-hard-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-ink uppercase tracking-wide">
                        {entry.mood.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-paper border border-ink rounded">
                        Energi: {entry.energyLevel}/10
                      </span>
                    </div>
                    {entry.stressorTags.length > 0 && (
                      <p className="text-[11px] text-ink/70 font-medium">
                        Pemicu: {entry.stressorTags.join(', ')}
                      </p>
                    )}
                    {entry.briefNote && (
                      <p className="text-xs text-ink italic font-medium">&quot;{entry.briefNote}&quot;</p>
                    )}
                  </div>

                  <span className="text-[11px] text-ink/60 font-bold shrink-0">
                    {new Date(entry.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ContentColumn>

      <CelebrationToast celebration={celebration} onDismiss={() => setCelebration(null)} />
    </PageContainer>
  );
}

