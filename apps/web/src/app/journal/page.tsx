'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, ArrowLeft, Lock, Calendar } from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { getAnonymousSession } from '@/lib/storage';
import type { JournalEntry } from '@dengarin/types';
import { PageContainer, ContentColumn, SoftCard, Button, Badge, Input, Textarea } from '@/components/ui';

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
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Kembali ke Dashboard
          </Button>
        </Link>

        <Badge variant="calm" size="sm" className="gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-calm-700" />
          <span>Tersimpan Lokal di Peramban</span>
        </Badge>
      </div>

      {/* Header */}
      <SoftCard
        variant="white"
        elevation="medium"
        className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
            Jurnal Privat Tanpa Jejak
          </h1>
          <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-xl">
            Tuliskan apa pun yang mengganjal di hatimu. Tulisanmu tidak dikirim ke server maupun disimpan di model AI.
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
            Tulis Jurnal Baru
          </Button>
        )}
      </SoftCard>

      {/* Form when creating */}
      {isCreating && (
        <SoftCard variant="white" elevation="medium" className="p-6 sm:p-8 space-y-4">
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <h3 className="text-sm font-bold text-sand-900">Catatan Refleksi Baru</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
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
                Simpan di Browser
              </Button>
            </div>
          </form>
        </SoftCard>
      )}

      {/* List of Entries */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-sand-900">
          Daftar Catatan Tersimpan ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <SoftCard variant="white" elevation="low" className="p-8 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-calm-600/60 mx-auto" />
            <p className="text-xs sm:text-sm text-sand-600">
              Belum ada tulisan tersimpan. Mulai tuliskan refleksi pertamamu hari ini.
            </p>
          </SoftCard>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <SoftCard
                key={entry.id}
                variant="white"
                elevation="low"
                hoverEffect
                className="p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-sm sm:text-base text-sand-900">{entry.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-sand-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors focus-visible:outline-crisis"
                      title="Hapus catatan"
                      aria-label={`Hapus catatan ${entry.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-sand-800 whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </p>
              </SoftCard>
            ))}
          </div>
        )}
      </div>
      </ContentColumn>
    </PageContainer>
  );
}
