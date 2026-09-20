'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Key,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  Trash2,
  CloudUpload,
  CloudDownload,
  ShieldCheck,
  Lock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  getAnonymousSession,
  saveAnonymousSession,
  clearAnonymousSession,
  initAnonymousSession,
  getDailyCheckins,
} from '@/lib/storage';
import {
  hashMnemonic,
  encryptSessionData,
  decryptSessionData,
  normalizeMnemonic
} from '@/lib/crypto/e2ee';
import type { AnonymousUserSession, DailyCheckin, JournalEntry } from '@dengarin/types';
import { PageContainer, ContentColumn, SoftCard, Button, Badge, Textarea } from '@/components/ui';

interface DecryptedBackupPayload {
  session: AnonymousUserSession;
  checkins: DailyCheckin[];
  journals: JournalEntry[];
  backupAt: string;
}

export default function RecoveryPage() {
  const [session, setSession] = useState<AnonymousUserSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Cloud backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupNotice, setBackupNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let s = getAnonymousSession();
    if (!s) {
      s = initAnonymousSession(true);
    }
    setSession(s);

    try {
      const storedLastBackup = localStorage.getItem('dengarin_last_backup');
      if (storedLastBackup) {
        setLastBackupTime(storedLastBackup);
      }
    } catch {
      // ignore
    }
  }, []);

  const words = session?.recoveryMnemonic ? session.recoveryMnemonic.split(' ') : [];

  const handleCopy = () => {
    if (session?.recoveryMnemonic && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(session.recoveryMnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1. Zero-Knowledge Cloud Backup (E2EE)
  const handleCloudBackup = async () => {
    if (!session?.recoveryMnemonic) return;
    setIsBackingUp(true);
    setBackupNotice(null);

    try {
      // Gather local data
      const checkins = getDailyCheckins();
      let journals: JournalEntry[] = [];
      try {
        const storedJournals = localStorage.getItem('dengarin_journal_entries');
        if (storedJournals) journals = JSON.parse(storedJournals);
      } catch {
        // ignore
      }

      const payload: DecryptedBackupPayload = {
        session,
        checkins,
        journals,
        backupAt: new Date().toISOString()
      };

      // Client-side AES-GCM 256 encryption via Web Crypto API
      const encryptedBlob = await encryptSessionData(payload, session.recoveryMnemonic);
      const mnemonicHash = await hashMnemonic(session.recoveryMnemonic);

      // Send opaque ciphertext to server
      const res = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mnemonicHash,
          encryptedBlob
        })
      });

      if (!res.ok) {
        throw new Error('Gagal mengirim paket cadangan ke server.');
      }

      const nowStr = new Date().toISOString();
      setLastBackupTime(nowStr);
      localStorage.setItem('dengarin_last_backup', nowStr);
      setBackupNotice({
        type: 'success',
        message: 'Data sesi, check-in, dan jurnal berhasil dienkripsi dan dicadangkan ke cloud secara aman (Zero-Knowledge).'
      });
    } catch (err: any) {
      setBackupNotice({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat mengenkripsi dan mencadangkan data.'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // 2. Zero-Knowledge Cloud Restore (E2EE)
  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeMnemonic(restoreInput);
    const parts = clean.split(/\s+/);
    if (parts.length !== 12) {
      setRestoreStatus({
        type: 'error',
        message: 'Format salah: Kunci harus terdiri tepat dari 12 kata dipisahkan spasi.'
      });
      return;
    }

    setIsRestoring(true);
    setRestoreStatus(null);

    try {
      // 1. Compute hash to look up cloud record
      const mnemonicHash = await hashMnemonic(clean);
      const res = await fetch(`/api/sync?mnemonicHash=${encodeURIComponent(mnemonicHash)}`);

      if (res.ok) {
        const data = await res.json();
        if (data.record?.encryptedBlob) {
          // Decrypt client-side using Web Crypto API
          const payload = await decryptSessionData<DecryptedBackupPayload>(
            data.record.encryptedBlob,
            clean
          );

          // Restore to localStorage
          if (payload.session) {
            saveAnonymousSession(payload.session);
            setSession(payload.session);
          }
          if (Array.isArray(payload.checkins)) {
            localStorage.setItem('dengarin_checkins', JSON.stringify(payload.checkins));
          }
          if (Array.isArray(payload.journals)) {
            localStorage.setItem('dengarin_journal_entries', JSON.stringify(payload.journals));
          }

          setRestoreStatus({
            type: 'success',
            message: 'Seluruh riwayat check-in, jurnal, dan sesi berhasil didekripsi & dipulihkan dari cloud! Mengarahkan ke Dashboard...'
          });
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
          return;
        }
      }

      // If no cloud backup was found, restore session locally
      const restoredSession: AnonymousUserSession = {
        userId: `restored-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        recoveryMnemonic: clean,
        consentGiven: true,
      };
      saveAnonymousSession(restoredSession);
      setSession(restoredSession);
      setRestoreStatus({
        type: 'warning',
        message: 'Sesi dipulihkan secara lokal (tidak ditemukan cadangan cloud untuk 12 kata ini). Mengarahkan ke Dashboard...'
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        message: err?.message || 'Gagal memulihkan sesi. Pastikan 12 kata kunci sesuai.'
      });
    } finally {
      setIsRestoring(false);
    }
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
            Utilitas Cadangan Anonim & E2EE Sync
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight">
            Kunci Akses Sesi Pribadimu
          </h1>
          <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-xl">
            Dengar.in tidak menyimpan email atau nomor telepon. Simpan 12 kata ini sebagai kunci kriptografis untuk mencadangkan dan memulihkan seluruh progresmu.
          </p>
        </div>

        {/* 1. PRIMARY: 12-Word Recovery Code */}
        <SoftCard variant="white" elevation="medium" className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sand-900 uppercase tracking-wider">
              12 Kata Kunci Rahasia
            </span>
            <span className="text-xs text-sand-500 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-calm-700" /> Kunci Enkripsi Sisi Klien
            </span>
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

        {/* 2. E2EE CLOUD BACKUP SECTION */}
        <SoftCard variant="white" elevation="low" className="p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-sand-900 flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-calm-700" />
                <span>Cadangkan ke Cloud Terenkripsi (Zero-Knowledge E2EE)</span>
              </h3>
              <p className="text-xs text-sand-600 leading-relaxed max-w-lg">
                Data check-in dan jurnalmu dienkripsi menggunakan AES-GCM 256-bit langsung di peramban sebelum dikirim. Server tidak pernah memiliki kunci dekripsi.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCloudBackup}
              disabled={isBackingUp}
              icon={<CloudUpload className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              {isBackingUp ? 'Mengenkripsi...' : 'Cadangkan Sekarang'}
            </Button>
          </div>

          {backupNotice && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                backupNotice.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{backupNotice.message}</span>
            </div>
          )}

          {lastBackupTime && (
            <div className="text-[11px] text-sand-500 pt-1 border-t border-sand-100 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-calm-700" />
              <span>Terakhir dicadangkan: {new Date(lastBackupTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          )}
        </SoftCard>

        {/* 3. RESTORE SESSION SECTION */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-sand-900 flex items-center gap-2">
              <CloudDownload className="w-4 h-4 text-calm-700" />
              <span>Pulihkan Sesi di Perangkat Baru</span>
            </h3>
            <p className="text-xs text-sand-600 leading-relaxed">
              Masukkan 12 kata kunci untuk mendekripsi dan memulihkan seluruh data riwayatmu dari cadangan cloud.
            </p>
          </div>

          <form onSubmit={handleRestore} className="space-y-3">
            <Textarea
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              rows={2}
              placeholder="Ketik 12 kata dipisahkan spasi (contoh: samudra lentera harmoni...)"
              className="font-mono text-xs sm:text-sm"
              required
            />

            {restoreStatus && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                  restoreStatus.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : restoreStatus.type === 'warning'
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}
              >
                {restoreStatus.type === 'success' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{restoreStatus.message}</span>
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={isRestoring || !restoreInput.trim()}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />}
              >
                {isRestoring ? 'Mendekripsi & Memulihkan...' : 'Dekripsi & Pulihkan Sesi'}
              </Button>
            </div>
          </form>
        </div>

        {/* 4. DANGER ZONE: Wipe Data */}
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
