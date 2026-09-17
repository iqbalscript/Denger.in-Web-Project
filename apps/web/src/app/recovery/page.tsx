'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Key, Copy, Check, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import {
  getAnonymousSession,
  saveAnonymousSession,
  clearAnonymousSession,
  initAnonymousSession,
} from '@/lib/storage';
import type { AnonymousUserSession } from '@dengarin/types';
import { PageContainer, ContentColumn, SoftCard, Button, Badge, Textarea } from '@/components/ui';

export default function RecoveryPage() {
  const [session, setSession] = useState<AnonymousUserSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  useEffect(() => {
    let s = getAnonymousSession();
    if (!s) {
      s = initAnonymousSession(true);
    }
    setSession(s);
  }, []);

  const words = session?.recoveryMnemonic ? session.recoveryMnemonic.split(' ') : [];

  const handleCopy = () => {
    if (session?.recoveryMnemonic && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(session.recoveryMnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = restoreInput.trim().toLowerCase();
    const parts = clean.split(/\s+/);
    if (parts.length !== 12) {
      setRestoreStatus('Format salah: Harus terdiri tepat dari 12 kata dipisahkan spasi.');
      return;
    }

    const restoredSession = {
      userId: `restored-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      recoveryMnemonic: clean,
      consentGiven: true,
    };
    saveAnonymousSession(restoredSession);
    setSession(restoredSession);
    setRestoreStatus('Sesi berhasil dipulihkan! Mengarahkan ke Dashboard...');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const handleWipe = () => {
    if (
      confirm(
        'Apakah Anda yakin ingin menghapus seluruh data anonim di peramban ini? Tindakan ini tidak dapat dibatalkan.'
      )
    ) {
      clearAnonymousSession();
      window.location.href = '/';
    }
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
            <Key className="w-3.5 h-3.5 mr-1 text-calm-700" />
            Utilitas Cadangan Anonim
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight">
            Kunci Akses Sesi Pribadimu
          </h1>
          <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-xl">
            Dengar.in tidak menyimpan email atau password. Simpan 12 kata ini jika Anda ingin melanjutkan misi dan jurnal Anda di perangkat lain.
          </p>
        </div>

        {/* 1. PRIMARY: 12-Word Recovery Code */}
        <SoftCard variant="white" elevation="medium" className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sand-900 uppercase tracking-wider">
              12 Kata Kunci Rahasia
            </span>
            <span className="text-xs text-sand-500 font-medium">Bebas Akun Cloud</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-sand-50 border border-sand-200 font-mono text-xs">
            {words.map((w: string, idx: number) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-xl border border-sand-200/90 flex items-center gap-1.5 shadow-soft-xs"
              >
                <span className="text-[10px] text-sand-400 font-sans">{idx + 1}.</span>
                <span className="font-bold text-sand-900">{w}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Tersalin ke Clipboard!' : 'Salin 12 Kata'}
            </Button>

            <span className="text-[11px] text-sand-600 italic">
              * Jangan bagikan kata-kata ini kepada siapa pun.
            </span>
          </div>
        </SoftCard>

        {/* 2. SECONDARY: Restore Session */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-sand-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-calm-700" />
              <span>Pulihkan Sesi di Perangkat Baru</span>
            </h3>
            <p className="text-xs text-sand-600 leading-relaxed">
              Punya 12 kata kunci dari sesi sebelumnya? Tempelkan di sini untuk memulihkan progresmu.
            </p>
          </div>

          <form onSubmit={handleRestore} className="space-y-3">
            <Textarea
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              rows={2}
              placeholder="Ketik 12 kata dipisahkan spasi..."
              className="font-mono text-xs sm:text-sm"
            />

            {restoreStatus && (
              <p className="text-xs font-semibold text-calm-800">{restoreStatus}</p>
            )}

            <div>
              <Button type="submit" variant="secondary" size="sm">
                Pulihkan Sesi Anonim
              </Button>
            </div>
          </form>
        </div>

        {/* 3. DANGER ZONE: Wipe Data (Clear separation at the bottom) */}
        <div className="pt-8 border-t border-sand-200/80">
          <div className="p-4 sm:p-5 rounded-2xl bg-red-50/70 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-crisis-dark flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-crisis" />
                <span>Zona Bahaya: Bersihkan Data Lokal</span>
              </h4>
              <p className="text-xs text-red-900/80 leading-relaxed">
                Menghapus seluruh identitas anonim, jurnal, dan riwayat check-in dari browser ini.
              </p>
            </div>
            <Button
              variant="crisis"
              size="sm"
              onClick={handleWipe}
              className="shrink-0"
            >
              Hapus Permanen
            </Button>
          </div>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
