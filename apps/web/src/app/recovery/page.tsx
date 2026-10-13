'use client';

import React, { useState, useEffect } from 'react';
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
  generateUUID,
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
import type { AnonymousUserSession, DailyCheckin, JournalEntry, GamificationStateV1 } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, Badge, Textarea, Reveal } from '@/components/ui';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';
import { useLanguage, useText } from '@/i18n';
import { recoveryText } from '@/i18n/pages/recovery';

interface DecryptedBackupPayload {
  session: AnonymousUserSession;
  checkins: DailyCheckin[];
  journals: JournalEntry[];
  gamification?: GamificationStateV1;
  backupAt: string;
}

export default function RecoveryPage() {
  const { ready } = useConsentGuard();
  const t = useText(recoveryText);
  const { locale } = useLanguage();
  const [session, setSession] = useState<AnonymousUserSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Cloud backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupNotice, setBackupNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Hapus permanen memakai konfirmasi di halaman (bukan window.confirm) supaya
  // teksnya besar, bisa dibaca pembaca layar, dan tidak hilang karena salah ketuk.
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    // Consent is checked by useConsentGuard; never grant it here (H5).
    if (!ready) return;
    setSession(initAnonymousSession());

    try {
      const storedLastBackup = localStorage.getItem('dengarin_last_backup');
      if (storedLastBackup) {
        setLastBackupTime(storedLastBackup);
      }
    } catch {
      // ignore
    }
  }, [ready]);

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

      let gamification: GamificationStateV1 | undefined;
      try {
        const storedGamification = localStorage.getItem('dengarin_gamification_v1');
        if (storedGamification) gamification = JSON.parse(storedGamification);
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
        gamification,
        backupAt: new Date().toISOString()
      };

      // Client-side AES-GCM 256 encryption via Web Crypto API
      const encryptedBlob = await encryptSessionData(payload, backupSession.recoveryMnemonic);
      const { backupId, writeKey } = await deriveSyncCredentials(backupSession.recoveryMnemonic);
      const existing = await fetch(`/api/sync?backupId=${encodeURIComponent(backupId)}`, { cache: 'no-store' });
      if (!existing.ok && existing.status !== 404) throw new Error(t.backupReadFailed);
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
        throw new Error(t.backupSendFailed);
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
          ? t.backupSuccessNewKey
          : t.backupSuccess
      });
    } catch (err: any) {
      setBackupNotice({
        type: 'error',
        message: err?.message || t.backupError
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
        message: t.restoreFormat
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

      if (!res.ok && res.status !== 404) throw new Error(t.restoreReadFailed);

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
            // Consent belongs to this device: keep the current record, never
            // import a `consentGiven: true` from the backup (H5).
            const current = getAnonymousSession();
            const restored: AnonymousUserSession = {
              ...payload.session,
              recoveryMnemonic: clean,
              consentGiven: current?.consentGiven === true,
              consentTimestamp: current?.consentGiven === true ? current.consentTimestamp : undefined,
            };
            saveAnonymousSession(restored);
            setSession(restored);
          }
          if (Array.isArray(payload.checkins)) {
            localStorage.setItem('dengarin_checkins', JSON.stringify(payload.checkins));
          }
          if (Array.isArray(payload.journals)) {
            localStorage.setItem('dengarin_journal_entries', JSON.stringify(payload.journals));
          }
          if (payload.gamification && typeof payload.gamification === 'object') {
            localStorage.setItem('dengarin_gamification_v1', JSON.stringify(payload.gamification));
          }

          setRestoreStatus({
            type: 'success',
            message: t.restoreSuccess
          });
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
          return;
        }
      }

      // If no cloud backup was found, restore session locally
      const current = getAnonymousSession();
      const restoredSession: AnonymousUserSession = {
        // UUID v4 per the AnonymousUserSession contract (L5).
        userId: generateUUID(),
        anonymousAlias: current?.anonymousAlias,
        createdAt: new Date().toISOString(),
        recoveryMnemonic: clean,
        consentGiven: current?.consentGiven === true,
        consentTimestamp: current?.consentGiven === true ? current.consentTimestamp : undefined,
        currentDay: 1,
      };
      saveAnonymousSession(restoredSession);
      setSession(restoredSession);
      setRestoreStatus({
        type: 'warning',
        message: t.restoreLocal
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        // Pesan dari lapisan kripto berbahasa Indonesia; di EN pakai teks halaman.
        message: (locale === 'id-ID' && err?.message) || t.restoreError
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleWipe = () => {
    clearAnonymousSession();
    // Clear sensitive React state before replacing this history entry, so a
    // browser back-forward cache cannot redisplay the recovery phrase.
    setSession(null);
    setRestoreInput('');
    setLastBackupTime(null);
    setBackupNotice(null);
    setRestoreStatus(null);
    setConfirmWipe(false);
    window.location.replace('/');
  };

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        <div>
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t.back}
          </Button>
        </div>

        {/* Heading */}
        <div className="animate-reveal-up space-y-3">
          <Badge variant="cobalt" size="md">
            <Key className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            {t.badge}
          </Badge>
          <h1 className="text-[2.25rem] sm:text-5xl font-bold text-[#151515] tracking-[-0.03em] leading-[1.05]">
            {t.title}
          </h1>
          <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-xl">
            {t.intro}
          </p>
        </div>

        {/* 1. PRIMARY: 12-Word Recovery Code */}
        <div className="animate-reveal-up [animation-delay:100ms] p-6 sm:p-8 space-y-6 bg-white border-2 border-[#151515] rounded-[8px] shadow-[4px_4px_0px_#151515]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D3C9] pb-3">
            <h2 className="text-xl font-bold text-[#151515] tracking-[-0.01em]">
              {t.keyTitle}
            </h2>
            <span className="text-sm text-[#59544D] font-semibold flex items-center gap-1">
              <Lock className="w-4 h-4 text-[#3357EE]" aria-hidden="true" /> {t.keyOnlyYou}
            </span>
          </div>

          <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 sm:p-4 rounded-[4px] bg-[#FAFAFA]" aria-label={t.keyListAria}>
            {words.map((w: string, idx: number) => (
              <li
                key={idx}
                style={{ animationDelay: `${180 + idx * 30}ms` }}
                className="animate-reveal-up bg-white px-3 py-2.5 rounded-[4px] border border-[#D8D3C9] flex items-baseline gap-2 font-mono text-base"
              >
                <span className="w-5 shrink-0 text-right text-sm text-[#59544D] font-semibold tabular-nums">{idx + 1}</span>
                <span className="font-bold text-[#151515] tracking-[0.02em] break-all">{w}</span>
              </li>
            ))}
          </ol>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <Button
              variant="primary"
              size="md"
              onClick={handleCopy}
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? t.copied : t.copy}
            </Button>

            <span className="text-base text-[#59544D] font-medium" role="status">
              {copied ? t.copiedNotice : ''}{t.doNotShare}
            </span>
          </div>
        </div>

        {/* 2. E2EE CLOUD BACKUP SECTION */}
        <Reveal as="section" aria-label={t.backupAria} className="p-6 sm:p-7 space-y-5 bg-white border-2 border-[#151515] rounded-[8px] shadow-[4px_4px_0px_#151515]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#151515] tracking-[-0.01em] leading-[1.25] flex items-start gap-2">
                <CloudUpload className="w-5 h-5 text-[#3357EE] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{t.backupTitle}</span>
              </h2>
              <p className="text-base text-[#59544D] leading-relaxed max-w-lg">
                {t.backupBody}
              </p>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleCloudBackup}
              isLoading={isBackingUp}
              icon={<CloudUpload className="w-4 h-4" />}
              className="shrink-0"
            >
              {isBackingUp ? t.backupLoading : t.backupButton}
            </Button>
          </div>

          {backupNotice && (
            <div
              role={backupNotice.type === 'error' ? 'alert' : 'status'}
              className={`p-3.5 rounded-[4px] border-2 border-[#151515] text-base font-semibold flex items-start gap-2.5 ${
                backupNotice.type === 'success'
                  ? 'bg-[#B8F34A] text-[#151515] shadow-[2px_2px_0px_#151515]'
                  : 'bg-[#D32F2F] text-white shadow-[2px_2px_0px_#151515]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">{backupNotice.message}</span>
            </div>
          )}

          {lastBackupTime && (
            <div className="text-base text-[#59544D] font-medium pt-3 border-t border-[#D8D3C9] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3357EE]" aria-hidden="true" />
              <span className="tabular-nums">{t.lastBackup} {new Date(lastBackupTime).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          )}
        </Reveal>

        {/* 3. RESTORE SESSION SECTION */}
        <Reveal as="section" aria-label={t.restoreAria} className="p-6 sm:p-7 space-y-4 bg-white border-2 border-[#151515] rounded-[8px] shadow-[4px_4px_0px_#151515]">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#151515] tracking-[-0.01em] leading-[1.25] flex items-start gap-2">
              <CloudDownload className="w-5 h-5 text-[#3357EE] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{t.restoreTitle}</span>
            </h2>
            <p id="petunjuk-pulihkan" className="text-base text-[#59544D] leading-relaxed">
              {t.restoreHint}
            </p>
          </div>

          <form onSubmit={handleRestore} className="space-y-3">
            <Textarea
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              rows={2}
              placeholder={t.restorePlaceholder}
              aria-label={t.restoreInputAria}
              aria-describedby="petunjuk-pulihkan"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="font-mono text-base tracking-[0.02em]"
              required
            />

            {restoreStatus && (
              <div
                role={restoreStatus.type === 'error' ? 'alert' : 'status'}
                className={`p-3.5 rounded-[4px] border-2 border-[#151515] text-base font-semibold flex items-start gap-2.5 ${
                  restoreStatus.type === 'success'
                    ? 'bg-[#B8F34A] text-[#151515] shadow-[2px_2px_0px_#151515]'
                    : restoreStatus.type === 'warning'
                    ? 'bg-[#FFD84D] text-[#151515] shadow-[2px_2px_0px_#151515]'
                    : 'bg-[#D32F2F] text-white shadow-[2px_2px_0px_#151515]'
                }`}
              >
                {restoreStatus.type === 'success' ? (
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <span className="leading-relaxed">{restoreStatus.message}</span>
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isRestoring || !restoreInput.trim()}
                icon={<RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />}
              >
                {isRestoring ? t.restoreLoading : t.restoreButton}
              </Button>
            </div>
          </form>
        </Reveal>

        {/* 4. DANGER ZONE: Wipe Data */}
        <Reveal as="section" aria-labelledby="judul-hapus-data" className="p-5 sm:p-6 rounded-[8px] bg-white border-2 border-[#D32F2F] shadow-[4px_4px_0px_#D32F2F] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h2 id="judul-hapus-data" className="text-lg font-bold text-[#151515] leading-[1.25] flex items-center gap-1.5">
                <Trash2 className="w-5 h-5 text-[#B3261E]" aria-hidden="true" />
                <span>{t.wipeTitle}</span>
              </h2>
              <p className="text-base text-[#59544D] leading-relaxed">
                {t.wipeBody}
              </p>
            </div>
            {!confirmWipe && (
              <Button
                variant="crisis"
                size="md"
                onClick={() => setConfirmWipe(true)}
                className="shrink-0"
                aria-expanded={confirmWipe}
                aria-controls="konfirmasi-hapus"
              >
                {t.wipeButton}
              </Button>
            )}
          </div>
          {confirmWipe && (
            <div id="konfirmasi-hapus" role="group" aria-labelledby="judul-konfirmasi-hapus" className="p-4 rounded-[6px] bg-[#FFEBEB] border-2 border-[#151515] space-y-3">
              <p id="judul-konfirmasi-hapus" className="text-lg font-bold text-[#151515] leading-snug">
                {t.wipeConfirmTitle}
              </p>
              <p className="text-base text-[#151515] leading-relaxed">
                {t.wipeConfirmBody}
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button variant="crisis" size="md" onClick={handleWipe} icon={<Trash2 className="w-4 h-4" />}>
                  {t.wipeYes}
                </Button>
                <Button variant="outline" size="md" onClick={() => setConfirmWipe(false)}>
                  {t.wipeNo}
                </Button>
              </div>
            </div>
          )}
        </Reveal>
      </ContentColumn>
    </PageContainer>
  );
}
