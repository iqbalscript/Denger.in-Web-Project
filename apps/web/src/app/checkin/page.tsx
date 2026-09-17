'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import type { MoodScore, DailyCheckin } from '@dengarin/types';
import {
  PageContainer,
  ContentColumn,
  Button,
  Badge,
  Chip,
  Textarea,
} from '@/components/ui';

export default function CheckinPage() {
  const router = useRouter();
  const session = getAnonymousSession();

  const [selectedMood, setSelectedMood] = useState<MoodScore | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [briefNote, setBriefNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<DailyCheckin[]>([]);

  useEffect(() => {
    setHistory(getDailyCheckins());
  }, []);

  const moods: Array<{ id: MoodScore; label: string; emoji: string; sub: string }> = [
    { id: 'sangat_baik', label: 'Sangat Baik', emoji: '😊', sub: 'Bertenaga' },
    { id: 'baik', label: 'Cukup Baik', emoji: '🙂', sub: 'Terkendali' },
    { id: 'netral', label: 'Biasa Saja', emoji: '😐', sub: 'Stabil' },
    { id: 'berat', label: 'Terasa Berat', emoji: '😟', sub: 'Cemas / Lelah' },
    { id: 'kewalahan', label: 'Kewalahan', emoji: '😞', sub: 'Sangat Lelah' },
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
    if (!selectedMood) return;

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

    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-10 text-left">
        <div>
          <Link href="/dashboard" className="inline-block">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <Badge variant="calm" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-calm-700" />
            Check-in Mandiri Harian
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight">
            Bagaimana kabarmu hari ini?
          </h1>
          <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-xl">
            Ambil jeda satu menit untuk mengenali apa yang sedang terjadi di dalam dirimu saat ini.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* PRIMARY: Large Tactile Mood Selector */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-sand-900">
              1. Pilih suasana hatimu saat ini:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {moods.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer focus-visible:outline-calm-700 min-h-[92px] ${
                      isSelected
                        ? 'border-calm-700 bg-calm-50/95 shadow-soft-sm ring-1 ring-calm-700 font-bold -translate-y-0.5'
                        : 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/60 font-medium'
                    }`}
                  >
                    <span className="text-3xl mb-1 select-none" aria-hidden="true">
                      {m.emoji}
                    </span>
                    <span className="text-xs text-sand-900 text-center leading-tight">
                      {m.label}
                    </span>
                    <span className="text-[10px] text-sand-500">{m.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Level Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-sand-900 flex items-center gap-1.5">
                <BatteryMedium className="w-4 h-4 text-calm-700" />
                <span>2. Tingkat Energimu (1–10)</span>
              </label>
              <Badge variant="calm" size="sm">
                Skor: {energyLevel} / 10
              </Badge>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              aria-label="Tingkat energi dari 1 sampai 10"
              className="w-full h-2.5 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-calm-700"
            />
          </div>

          {/* Stressor Chips */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-sand-900">
              3. Sumber tekanan terbesar hari ini (bisa pilih lebih dari satu):
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
            <div className="flex items-center gap-1.5 text-xs text-sand-600">
              <AlertTriangle className="w-3.5 h-3.5 text-calm-700 shrink-0" />
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
              {saved ? 'Check-in Tersimpan!' : 'Simpan Check-in Hari Ini'}
            </Button>
          </div>
        </form>

        {/* History Section: Placed strictly below the active check-in with subtle separation */}
        {history.length > 0 && (
          <div className="pt-8 border-t border-sand-200/80 space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-calm-700" />
              <span>Riwayat Check-in Terakhir ({history.length})</span>
            </h3>

            <div className="space-y-2.5">
              {history.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-white border border-sand-200 shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sand-900 capitalize">
                        {entry.mood.replace('_', ' ')}
                      </span>
                      <Badge variant="calm" size="sm">
                        Energi: {entry.energyLevel}/10
                      </Badge>
                    </div>
                    {entry.stressorTags.length > 0 && (
                      <p className="text-[11px] text-sand-600">
                        Pemicu: {entry.stressorTags.join(', ')}
                      </p>
                    )}
                    {entry.briefNote && (
                      <p className="text-xs text-sand-800 italic">&quot;{entry.briefNote}&quot;</p>
                    )}
                  </div>

                  <span className="text-[11px] text-sand-500 shrink-0">
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
    </PageContainer>
  );
}
