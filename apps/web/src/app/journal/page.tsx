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
  // Hapus memerlukan konfirmasi di tempat supaya catatan tidak hilang karena salah ketuk.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
    setPendingDeleteId(null);
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
            Kembali ke beranda
          </Button>

          <span className="inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 bg-tangerine border-2 border-ink rounded shadow-hard-sm text-ink">
            <Lock className="w-4 h-4 text-ink" aria-hidden="true" />
            <span>Hanya tersimpan di perangkat ini</span>
          </span>
        </div>

        {/* Header */}
        <header className="pt-2 pb-8 border-b-2 border-ink animate-reveal-up [animation-delay:80ms] flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
          <div className="space-y-3">
            <h1 className="text-[2.25rem] sm:text-5xl lg:text-[4rem] font-bold text-ink tracking-[-0.03em] leading-[1.05]">
              Tulis <span className="underline decoration-tangerine decoration-[6px] underline-offset-[6px]">aja.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-[34rem]">
              Gak perlu rapi, gak perlu benar. Tulis apa adanya. Tulisanmu tidak dikirim ke AI. Tulisan ini tersimpan di perangkatmu, dan hanya ikut ke server kalau kamu sendiri membuat cadangan terenkripsi.
            </p>
          </div>

          {!isCreating && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsCreating(true)}
              icon={<Plus className="w-5 h-5" aria-hidden="true" />}
              className="shrink-0 w-full sm:w-auto"
            >
              Tulis catatan baru
            </Button>
          )}
        </header>

        {/* Form when creating */}
        {isCreating && (
          <section aria-labelledby="judul-catatan-baru" className="animate-reveal-up bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-4 shadow-[4px_4px_0px_#FF8A3D]">
            <form onSubmit={handleSaveEntry} className="space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-borderSubtle pb-3">
                <h2 id="judul-catatan-baru" className="text-xl font-bold text-ink tracking-[-0.01em]">Catatan baru</h2>
                <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                  Tutup
                </Button>
              </div>

              <Input
                label="Judul (boleh dikosongkan)"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  crisis.checkText(`${e.target.value}\n${content}`);
                }}
                placeholder="Contoh: Pikiran kusut sepulang kantor..."
              />

              <Textarea
                label="Isi tulisan"
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

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
                <Button variant="outline" size="md" onClick={() => setIsCreating(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={crisis.isCrisis || !content.trim()}
                  aria-describedby={crisis.isCrisis ? 'jurnal-krisis-catatan' : undefined}
                  iconPosition="end"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Simpan di perangkat ini
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
                  size="md"
                  onClick={() => setIsCreating(true)}
                  icon={<Plus className="w-4 h-4" aria-hidden="true" />}
                >
                  Tulis kalimat pertama
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-lg text-ink leading-snug">{entry.title}</h3>
                      <span className="text-sm text-[#59544D] font-medium flex items-center gap-1 tabular-nums">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {pendingDeleteId !== entry.id && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(entry.id)}
                        className="inline-flex items-center gap-1.5 px-3 min-h-[44px] text-sm font-bold text-ink rounded border-2 border-[#D8D3C9] bg-white hover:border-ink hover:text-white hover:bg-[#D32F2F] active:translate-x-[1px] active:translate-y-[1px] transition-[transform,background-color,border-color,color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                        aria-label={`Hapus catatan ${entry.title}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  {pendingDeleteId === entry.id && (
                    <div role="group" aria-label="Konfirmasi hapus catatan" className="flex flex-wrap items-center gap-2 p-3 rounded-md bg-[#FFEBEB] border-2 border-ink text-base font-semibold text-ink">
                      <span>Hapus catatan ini? Tidak bisa dikembalikan.</span>
                      <Button variant="crisis" size="sm" onClick={() => handleDelete(entry.id)}>
                        Ya, hapus
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPendingDeleteId(null)}>
                        Batal
                      </Button>
                    </div>
                  )}
                  <p className="text-base text-ink whitespace-pre-wrap leading-[1.6] max-w-[65ch]">
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

