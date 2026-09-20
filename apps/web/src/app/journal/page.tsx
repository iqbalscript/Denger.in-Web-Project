'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, ArrowLeft, Lock, Calendar } from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { getAnonymousSession } from '@/lib/storage';
import type { JournalEntry } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, Input, Textarea } from '@/components/ui';

export default function JournalPage() {
  const session = getAnonymousSession();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
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
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    // Live safety filter
    const check = evaluateCrisisInput(text, session?.ageBracket || '18-24');
    if (check.isCrisis) {
      window.location.href = '/crisis';
    }
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

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

    setTitle('');
    setContent('');
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dengarin_journal_entries', JSON.stringify(updated));
    }
  };

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-6 text-left">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-block">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              KEMBALI KE DASHBOARD
            </Button>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 bg-yellow border-2 border-ink rounded shadow-hard-sm text-ink">
            <Lock className="w-3.5 h-3.5 text-ink" />
            <span>Tersimpan Lokal di Peramban</span>
          </span>
        </div>

        {/* Header */}
        <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-hard">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none">
              TULIS AJA.
            </h1>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed max-w-xl font-medium">
              Gak perlu dirapiin dulu. Tulisanmu tidak dikirim ke server maupun disimpan di model AI.
            </p>
          </div>

          {!isCreating && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreating(true)}
              icon={<Plus className="w-4 h-4" />}
              className="shrink-0"
            >
              TULIS JURNAL BARU
            </Button>
          )}
        </div>

        {/* Form when creating */}
        {isCreating && (
          <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-4 shadow-hard">
            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                <h3 className="text-sm font-black text-ink uppercase tracking-wider">Catatan Refleksi Baru</h3>
                <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                  Batal
                </Button>
              </div>

              <Input
                label="Judul (Opsional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pikiran kusut sepulang kantor..."
              />

              <Textarea
                label="Isi Tulisan"
                value={content}
                onChange={handleContentChange}
                rows={6}
                placeholder="Keluarkan unek-unekmu secara bebas dan jujur..."
                required
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  SIMPAN DI BROWSER →
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* List of Entries */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-ink">
            DAFTAR CATATAN TERSIMPAN ({entries.length})
          </h2>

          {entries.length === 0 ? (
            <div className="bg-white border-2 border-ink rounded-lg p-8 text-center space-y-2 shadow-hard-sm">
              <BookOpen className="w-8 h-8 text-ink/40 mx-auto" />
              <p className="text-xs sm:text-sm text-ink/70 font-medium">
                Belum ada tulisan tersimpan. Mulai tuliskan refleksi pertamamu hari ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white border-2 border-ink rounded-lg p-5 space-y-2.5 shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black text-sm sm:text-base text-ink uppercase tracking-wide">{entry.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink/60 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-ink hover:text-white hover:bg-coral p-1 rounded border border-ink shadow-hard-sm transition-all focus-visible:outline-ink"
                        title="Hapus catatan"
                        aria-label={`Hapus catatan ${entry.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-ink/90 whitespace-pre-wrap leading-relaxed font-medium">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

