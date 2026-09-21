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
  generateRecoveryMnemonic,
  getDailyCheckins,
} from '@/lib/storage';
import {
  hashMnemonic,
  isModernRecoveryPhrase,
  deriveSyncCredentials,
  signBackupUpdate,
  encryptSessionData,
  decryptSessionData,
  normalizeMnemonic
} from '@/lib/crypto/e2ee';
import type { AnonymousUserSession, DailyCheckin, JournalEntry } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, Badge, Textarea } from '@/components/ui';

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

      // A legacy phrase remains valid for reading its old backup, but its hash
      // cannot prove write ownership. Rotate only when creating a new backup.
      const backupSession = isModernRecoveryPhrase(session.recoveryMnemonic)
        ? session : { ...session, recoveryMnemonic: generateRecoveryMnemonic() };
      const payload: DecryptedBackupPayload = {
        session: backupSession,
        checkins,
        journals,
        backupAt: new Date().toISOString()
      };

      // Client-side AES-GCM 256 encryption via Web Crypto API
      const encryptedBlob = await encryptSessionData(payload, backupSession.recoveryMnemonic);
      const { backupId, writeKey } = await deriveSyncCredentials(backupSession.recoveryMnemonic);
      const existing = await fetch(`/api/sync?backupId=${encodeURIComponent(backupId)}`, { cache: 'no-store' });
      if (!existing.ok && existing.status !== 404) throw new Error('Gagal membaca versi cadangan.');
      const expectedVersion = existing.ok ? (await existing.json()).data.record.version as number : 0;
      const writeProof = await signBackupUpdate(writeKey, backupId, expectedVersion, encryptedBlob);

      // Send opaque ciphertext to server
      const res = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId, encryptedBlob, expectedVersion, writeProof,
          ...(expectedVersion === 0 ? { writeKey } : {})
        })
      });

      if (!res.ok) {
        throw new Error('Gagal mengirim paket cadangan ke server.');
      }

      if (backupSession !== session) {
        saveAnonymousSession(backupSession);
        setSession(backupSession);
      }

      const nowStr = new Date().toISOString();
      setLastBackupTime(nowStr);
      localStorage.setItem('dengarin_last_backup', nowStr);
      setBackupNotice({
        type: 'success',
        message: backupSession !== session
          ? 'Cadangan baru berhasil dibuat. Kunci pemulihan telah diperbarui; salin dan simpan 12 kelompok baru yang ditampilkan di atas.'
          : 'Data sesi, check-in, dan jurnal berhasil dienkripsi dan dicadangkan ke cloud secara aman (Zero-Knowledge).'
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
      const modern = isModernRecoveryPhrase(clean);
      const lookup = modern
        ? `backupId=${encodeURIComponent((await deriveSyncCredentials(clean)).backupId)}`
        : `mnemonicHash=${encodeURIComponent(await hashMnemonic(clean))}`;
      const res = await fetch(`/api/sync?${lookup}`, { cache: 'no-store' });

      if (!res.ok && res.status !== 404) throw new Error('Gagal membaca cadangan cloud.');

      if (res.ok) {
        const data = await res.json();
        if (data.data?.record?.encryptedBlob) {
          // Decrypt client-side using Web Crypto API
          const payload = await decryptSessionData<DecryptedBackupPayload>(
            data.data.record.encryptedBlob,
            clean
          );

          // Restore to localStorage
          if (payload.session) {
            const restored = { ...payload.session, recoveryMnemonic: clean };
            saveAnonymousSession(restored);
            setSession(restored);
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
        'Apakah Anda yakin ingin menghapus seluruh data anonim yang tersimpan lokal di peramban ini? Tindakan ini tidak dapat dibatalkan. Cadangan cloud terenkripsi dan kunci yang pernah disalin ke clipboard tidak dihapus.'
      )
    ) {
      clearAnonymousSession();
      // Clear sensitive React state before replacing this history entry, so a
      // browser back-forward cache cannot redisplay the recovery phrase.
      setSession(null);
      setRestoreInput('');
      setLastBackupTime(null);
      setBackupNotice(null);
      setRestoreStatus(null);
      window.location.replace('/');
    }
  };

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        <div>
          <Link href="/dashboard" className="inline-block">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <Badge variant="cobalt" size="md">
            <Key className="w-3.5 h-3.5 mr-1" />
            Utilitas Cadangan Anonim & E2EE Sync
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#151515] tracking-tight">
            Kunci Akses Sesi Pribadimu
          </h1>
          <p className="text-xs sm:text-sm text-[#59544D] leading-relaxed max-w-xl font-medium">
            Dengar.in tidak menyimpan email atau nomor telepon. Simpan 12 bagian kunci ini untuk mencadangkan dan memulihkan seluruh progresmu secara mandiri.
          </p>
        </div>

        {/* 1. PRIMARY: 12-Word Recovery Code */}
        <div className="p-6 sm:p-8 space-y-6 bg-white border-2 border-[#151515] rounded-[6px] shadow-[4px_4px_0px_#151515]">
          <div className="flex items-center justify-between border-b-2 border-[#151515] pb-3">
            <span className="text-xs font-black text-[#151515] uppercase tracking-wider">
              12 Bagian Kunci Rahasia
            </span>
            <span className="text-xs text-[#59544D] font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#4169FF]" /> Kunci Enkripsi Sisi Klien
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 rounded-[4px] bg-[#FFF8EF] border-2 border-[#151515]">
            {words.map((w: string, idx: number) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] flex items-center gap-2 font-mono text-xs sm:text-sm"
              >
                <span className="text-[10px] text-[#8A857D] font-bold font-sans">{idx + 1}.</span>
                <span className="font-bold text-[#151515]">{w}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <Button
              variant="primary"
              size="md"
              onClick={handleCopy}
              icon={copied ? <Check className="w-4 h-4 text-[#B8F34A]" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Tersalin ke Clipboard!' : 'Salin 12 Bagian'}
            </Button>

            <span className="text-xs text-[#59544D] font-bold italic">
              * Jangan bagikan kata-kata ini kepada siapa pun.
            </span>
          </div>
        </div>

        {/* 2. E2EE CLOUD BACKUP SECTION */}
        <div className="p-6 sm:p-7 space-y-5 bg-white border-2 border-[#151515] rounded-[6px] shadow-[4px_4px_0px_#151515]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-[#151515] flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-[#4169FF]" />
                <span>Cadangkan ke Cloud Terenkripsi (Zero-Knowledge E2EE)</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#59544D] leading-relaxed max-w-lg font-medium">
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
              className={`p-3.5 rounded-[4px] border-2 border-[#151515] text-xs font-bold flex items-start gap-2.5 ${
                backupNotice.type === 'success'
                  ? 'bg-[#B8F34A] text-[#151515] shadow-[2px_2px_0px_#151515]'
                  : 'bg-[#FF5252] text-white shadow-[2px_2px_0px_#151515]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{backupNotice.message}</span>
            </div>
          )}

          {lastBackupTime && (
            <div className="text-xs text-[#59544D] font-bold pt-2 border-t-2 border-[#151515]/10 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#4169FF]" />
              <span>Terakhir dicadangkan: {new Date(lastBackupTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          )}
        </div>

        {/* 3. RESTORE SESSION SECTION */}
        <div className="p-6 sm:p-7 space-y-4 bg-white border-2 border-[#151515] rounded-[6px] shadow-[4px_4px_0px_#151515]">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#151515] flex items-center gap-2">
              <CloudDownload className="w-4 h-4 text-[#4169FF]" />
              <span>Pulihkan Sesi di Perangkat Baru</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#59544D] leading-relaxed font-medium">
              Masukkan 12 bagian kunci (atau 12 kata lama) untuk mendekripsi cadangan cloud.
            </p>
          </div>

          <form onSubmit={handleRestore} className="space-y-3">
            <Textarea
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              rows={2}
              placeholder="Ketik 12 bagian kunci dipisahkan spasi"
              className="font-mono text-xs sm:text-sm"
              required
            />

            {restoreStatus && (
              <div
                className={`p-3.5 rounded-[4px] border-2 border-[#151515] text-xs font-bold flex items-start gap-2.5 ${
                  restoreStatus.type === 'success'
                    ? 'bg-[#B8F34A] text-[#151515] shadow-[2px_2px_0px_#151515]'
                    : restoreStatus.type === 'warning'
                    ? 'bg-[#FFD84D] text-[#151515] shadow-[2px_2px_0px_#151515]'
                    : 'bg-[#FF5252] text-white shadow-[2px_2px_0px_#151515]'
                }`}
              >
                {restoreStatus.type === 'success' ? (
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{restoreStatus.message}</span>
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
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
        <div className="p-5 sm:p-6 rounded-[6px] bg-white border-2 border-[#FF5252] shadow-[4px_4px_0px_#FF5252] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-extrabold text-[#FF5252] flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-[#FF5252]" />
              <span>Zona Bahaya: Bersihkan Data Lokal</span>
            </h4>
            <p className="text-xs text-[#59544D] leading-relaxed font-medium">
              Menghapus seluruh data anonim yang tersimpan lokal di browser ini, termasuk jurnal, riwayat, refleksi misi, dan metadata cadangan. Cadangan cloud dan kunci yang pernah disalin ke clipboard tidak dihapus.
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
      </ContentColumn>
    </PageContainer>
  );
}
