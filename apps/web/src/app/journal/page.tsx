'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Trash2, ArrowLeft, ArrowRight, Lock, Calendar } from 'lucide-react';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { useCrisisGuard } from '@/lib/useCrisisGuard';
import { InlineCrisisCard, CrisisBlockedNote } from '@/components/InlineCrisisCard';
import { ConsentPending } from '@/components/ConsentPending';
import type { JournalEntry, CelebrationData } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, Input, Textarea, CelebrationToast, Reveal } from '@/components/ui';
import { awardLangkah, isJournalEligibleForReward, loadGamificationState } from '@/lib/gamification';
import { getLocalDateString } from '@/lib/calendar';

export default function JournalPage() {
  const { ready, session } = useConsentGuard();
  const crisis = useCrisisGuard(session?.ageBracket);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dengarin_journal_entries');
      if (stored) {
        try {
          setEntries(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [ready]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    // Live safety filter: shows the inline crisis card, never navigates (M6).
    crisis.checkText(`${title}\n${text}`);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmittingRef.current) return;

    // Safety filter check before saving: keep the text, block the save.
    if (!crisis.allowSubmit(`${title}\n${content}`)) return;

    isSubmittingRef.current = true;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      userId: session?.userId || 'anon-user',
      createdAt: new Date().toISOString(),
      title: title.trim() || 'Refleksi Harian',
      content: content.trim(),
      tags: ['refleksi-mandiri'],
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dengarin_journal_entries', JSON.stringify(updated));
    }

    // Gamification: award journal Langkah (idempotent, capped at 2/day, min 20 chars)
    const gamState = loadGamificationState();
    const localDate = getLocalDateString();
    if (isJournalEligibleForReward(content, gamState, localDate)) {
      const res = awardLangkah('journal_entry', `journal:${newEntry.id}`, localDate);
      if (res) setCelebration(res);
    }

    setTitle('');
    setContent('');
    setIsCreating(false);
    isSubmittingRef.current = false;
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dengarin_journal_entries', JSON.stringify(updated));
    }
  };

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        <div className="flex items-center justify-between gap-3 animate-reveal-up">
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            KEMBALI KE DASHBOARD
          </Button>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-tangerine border-2 border-ink rounded shadow-hard-sm text-ink">
            <Lock className="w-3.5 h-3.5 text-ink" aria-hidden="true" />
            <span>Tersimpan Lokal di Peramban</span>
          </span>
        </div>

        {/* Header */}
        <header className="pt-2 pb-8 border-b-2 border-ink animate-reveal-up [animation-delay:80ms] flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
          <div className="space-y-3">
            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[4rem] font-bold text-ink tracking-[-0.03em] leading-[1.02] uppercase">
              Tulis <span className="underline decoration-tangerine decoration-[6px] underline-offset-[6px]">aja.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-[34rem]">
              Gak perlu rapi, gak perlu benar. Tulis apa adanya. Tulisanmu tidak dikirim ke AI. Tulisan ini tersimpan di perangkatmu, dan hanya ikut ke server kalau kamu sendiri membuat cadangan terenkripsi.
            </p>
          </div>

          {!isCreating && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreating(true)}
              icon={<Plus className="w-4 h-4" aria-hidden="true" />}
              className="shrink-0"
            >
              TULIS JURNAL BARU
            </Button>
          )}
        </header>

        {/* Form when creating */}
        {isCreating && (
          <section aria-labelledby="judul-catatan-baru" className="animate-reveal-up bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-4 shadow-[4px_4px_0px_#FF8A3D]">
            <form onSubmit={handleSaveEntry} className="space-y-5">
              <div className="flex items-center justify-between border-b border-borderSubtle pb-3">
                <h2 id="judul-catatan-baru" className="text-xl font-bold text-ink tracking-[-0.01em]">Catatan refleksi baru</h2>
                <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                  Batal
                </Button>
              </div>

              <Input
                label="Judul (Opsional)"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  crisis.checkText(`${e.target.value}\n${content}`);
                }}
                placeholder="Contoh: Pikiran kusut sepulang kantor..."
              />

              <Textarea
                label="Isi Tulisan"
                value={content}
                onChange={handleContentChange}
                rows={6}
                placeholder="Keluarkan keluh kesahmu di sini. Tidak ada yang menilai..."
                required
                className="min-h-[240px] text-base leading-[1.6]"
              />

              {crisis.cardVisible && (
                <InlineCrisisCard contacts={crisis.contacts} onAcknowledge={crisis.acknowledge} />
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={crisis.isCrisis}
                  aria-describedby={crisis.isCrisis ? 'jurnal-krisis-catatan' : undefined}
                  iconPosition="end"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  SIMPAN DI BROWSER
                </Button>
              </div>
              {crisis.isCrisis && <CrisisBlockedNote id="jurnal-krisis-catatan" />}
            </form>
          </section>
        )}

        {/* List of Entries */}
        <section aria-labelledby="judul-daftar" className="space-y-5 animate-reveal-up [animation-delay:160ms]">
          <h2 id="judul-daftar" className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.01em] leading-[1.25]">
            Catatan tersimpan <span className="text-[#59544D] font-medium tabular-nums">({entries.length})</span>
          </h2>

          {entries.length === 0 ? (
            <div className="border-2 border-dashed border-borderSubtle rounded-lg px-6 py-10 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-md bg-tangerine border-2 border-ink flex items-center justify-center" aria-hidden="true">
                <BookOpen className="w-6 h-6 text-ink" />
              </div>
              <p className="text-base text-[#4A453E] leading-relaxed max-w-[28rem]">
                Belum ada tulisan di sini, dan itu tidak apa-apa. Kapan pun kamu siap, satu kalimat saja sudah cukup.
              </p>
              {!isCreating && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  icon={<Plus className="w-4 h-4" aria-hidden="true" />}
                >
                  TULIS KALIMAT PERTAMA
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-4">
              {entries.map((entry, index) => (
                <Reveal
                  as="li"
                  key={entry.id}
                  delay={Math.min(index, 5) * 70}
                  className="bg-white border border-borderSubtle border-l-4 border-l-tangerine rounded-lg p-5 sm:p-6 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-lg text-ink leading-snug">{entry.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#59544D] font-medium flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-ink rounded border-2 border-transparent hover:border-ink hover:text-white hover:bg-coral active:translate-x-[1px] active:translate-y-[1px] transition-[transform,background-color,border-color,color] duration-200 ease-spring"
                        title="Hapus catatan"
                        aria-label={`Hapus catatan ${entry.title}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[15px] sm:text-base text-ink whitespace-pre-wrap leading-[1.6] max-w-[65ch]">
                    {entry.content}
                  </p>
                </Reveal>
              ))}
            </ul>
          )}
        </section>
      </ContentColumn>

      <CelebrationToast celebration={celebration} onDismiss={() => setCelebration(null)} />
    </PageContainer>
  );
}

