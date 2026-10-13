'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { AgeBracket, CarePassportResult, CarePassportSegment } from '@dengarin/types';
import type { CarePassportPiiFinding, CarePassportPreviewSegment, CarePassportResponse } from '@/lib/api/carePassportHandler';
import { PageContainer } from '@/components/ui';
import { ConsentStep } from '@/components/carePassport/ConsentStep';
import { IntakeStep } from '@/components/carePassport/IntakeStep';
import { RedactionPreview } from '@/components/carePassport/RedactionPreview';
import { ResultSkeleton } from '@/components/carePassport/ResultSkeleton';
import { ImmediateHelp } from '@/components/carePassport/ImmediateHelp';
import { ClarificationStep } from '@/components/carePassport/ClarificationStep';
import { ManualNote } from '@/components/carePassport/ManualNote';
import { PassportReview } from '@/components/carePassport/PassportReview';
import { MUTED, SectionCard, StepHeading, UrgentHelpLink } from '@/components/carePassport/shared';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';
import { CARE_PASSPORT_MAX_CLARIFICATION_ROUNDS } from '@/lib/carePassportLimits';
import {
  buildSegments,
  canSelectEntry,
  loadLocalEvidence,
  recordCarePassportMetric,
  segmentBudget,
  type LocalEvidenceEntry,
} from '@/lib/carePassportClient';

/**
 * /care-passport (AMD-10 + F-A "Bukti Bertanggal")
 *
 * The story, the selected journal / check-in entries and the draft live in
 * component state only. Local entries are READ from this device's storage to
 * offer them; they are sent only when the user ticks them and submits. The
 * only thing written locally is a numbers-only metrics row (no text). The only
 * way data leaves the device otherwise is the explicit download in ExportActions.
 */

type Step =
  | { name: 'consent' }
  | { name: 'minor' }
  | { name: 'intake' }
  | { name: 'preview'; segments: CarePassportPreviewSegment[] }
  | { name: 'loading' }
  | { name: 'result'; result: CarePassportResult; forceReview?: boolean }
  | { name: 'manual'; reason: 'declined' | 'unavailable'; result: CarePassportResult };

type ApiEnvelope = { ok: true; data: CarePassportResponse } | { ok: false; error?: string };

const NETWORK_ERROR = 'Koneksi terputus atau server tidak menjawab. Ceritamu masih ada di sini; coba lagi sebentar lagi.';
const MINOR_BRACKET: AgeBracket = '15-17';

const DECLINED_RESULT: CarePassportResult = {
  state: 'PROVIDER_UNAVAILABLE',
  provenance: { providerId: 'none', isAmd: false, isFallback: true },
  droppedClaims: 0,
  warnings: ['ai_consent_declined'],
};

async function callApi(path: string, body: Record<string, unknown>): Promise<ApiEnvelope> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as ApiEnvelope | null;
  if (!json) return { ok: false, error: NETWORK_ERROR };
  return json;
}

export default function CarePassportPage() {
  // App-level consent first; the separate AI opt-in (aiConsent) still applies on top.
  const { ready, session } = useConsentGuard();
  const [step, setStep] = useState<Step>({ name: 'consent' });
  const [aiConsent, setAiConsent] = useState(false);
  const [text, setText] = useState('');
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [entries, setEntries] = useState<LocalEvidenceEntry[]>([]);
  const [evidenceLoaded, setEvidenceLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** Ids of SOFT findings the user chose to keep visible; everything else is redacted. */
  const [kept, setKept] = useState<Set<string>>(new Set());
  const [ageBracket, setAgeBracket] = useState<AgeBracket | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Remounts the review when a fresh result arrives so its draft state resets.
  const [resultVersion, setResultVersion] = useState(0);
  const startedAtRef = useRef<number>(0);

  // Local-only reads: the picker's candidates and the age bracket. Done in an
  // effect so SSR never touches storage.
  useEffect(() => {
    if (!ready) return;
    if (session?.ageBracket) setAgeBracket(session.ageBracket);
    if (session?.ageBracket === MINOR_BRACKET) setStep({ name: 'minor' });
    setEntries(loadLocalEvidence());
    setEvidenceLoaded(true);
  }, [ready, session]);

  const selected = useMemo(() => entries.filter((e) => selectedIds.has(e.id)), [entries, selectedIds]);
  const segments = useMemo(() => buildSegments({ story: text, selected, clarifications }), [text, selected, clarifications]);
  const budget = useMemo(() => segmentBudget(segments), [segments]);
  const rawTexts = useMemo(() => new Map(segments.map((s) => [s.id, s.text] as const)), [segments]);

  const restart = useCallback(() => {
    setStep({ name: 'consent' });
    setAiConsent(false);
    setText('');
    setClarifications([]);
    setSelectedIds(new Set());
    setKept(new Set());
    setError(null);
    setBusy(false);
  }, []);

  const requestBase = useCallback(
    (segs: CarePassportSegment[]): Record<string, unknown> => ({
      segments: segs,
      ...(ageBracket ? { ageBracket } : {}),
    }),
    [ageBracket]
  );

  const recordMetric = useCallback(
    (stage: 'generated' | 'approved', result: CarePassportResult, segs: CarePassportSegment[], rounds: number) => {
      recordCarePassportMetric({
        stage,
        startedAt: startedAtRef.current,
        ...(stage === 'approved' ? { approvedAt: Date.now() } : {}),
        rounds,
        providerId: result.provenance.providerId,
        isAmd: result.provenance.isAmd,
        latencyMs: result.provenance.latencyMs,
        segmentsCount: segs.length,
        evidenceCount: segs.filter((s) => s.kind === 'journal' || s.kind === 'checkin').length,
        droppedClaims: result.droppedClaims,
        completenessKnown: result.completeness?.known,
        completenessTotal: result.completeness?.total,
      });
    },
    []
  );

  const showResult = useCallback(
    (result: CarePassportResult, segs: CarePassportSegment[], rounds: number) => {
      setResultVersion((v) => v + 1);
      if (result.passport) recordMetric('generated', result, segs, rounds);
      if (result.state === 'PROVIDER_UNAVAILABLE') {
        setStep({ name: 'manual', reason: 'unavailable', result });
      } else if (result.state === 'NEEDS_CLARIFICATION' && rounds >= CARE_PASSPORT_MAX_CLARIFICATION_ROUNDS) {
        // Rounds exhausted: show what is known, as-is. Nothing is invented.
        setStep({ name: 'result', result, forceReview: true });
      } else {
        setStep({ name: 'result', result });
      }
    },
    [recordMetric]
  );

  /** Deterministic preview: crisis gate on all raw segments + PII findings per segment, no AI. */
  const runPreview = useCallback(
    async (segs: CarePassportSegment[], rounds: number) => {
      setBusy(true);
      setError(null);
      try {
        const res = await callApi('/api/care-passport/preview', { ...requestBase(segs), mode: 'preview' });
        if (!res.ok) {
          setError(res.error ?? NETWORK_ERROR);
          return null;
        }
        if (res.data.kind === 'result') {
          showResult(res.data.result, segs, rounds);
          return null;
        }
        const preview = res.data.segments;
        // Earlier "keep visible" choices survive only while the server still finds that exact soft span.
        const stillValid = new Set(preview.flatMap((s) => s.findings).filter((f) => f.canKeep).map((f) => f.id));
        setKept((prev) => new Set([...prev].filter((id) => stillValid.has(id))));
        return preview;
      } catch {
        setError(NETWORK_ERROR);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [requestBase, showResult]
  );

  const runGenerate = useCallback(
    async (segs: CarePassportSegment[], keptIds: ReadonlySet<string>, rounds: number) => {
      const previous = step;
      setStep({ name: 'loading' });
      setError(null);
      try {
        const res = await callApi('/api/care-passport', {
          ...requestBase(segs),
          keepSoftPii: [...keptIds],
          aiConsent,
          mode: 'generate',
        });
        if (!res.ok) {
          setError(res.error ?? NETWORK_ERROR);
          setStep(previous.name === 'loading' ? { name: 'intake' } : previous);
          return;
        }
        if (res.data.kind === 'result') showResult(res.data.result, segs, rounds);
        else setStep({ name: 'preview', segments: res.data.segments });
      } catch {
        setError(NETWORK_ERROR);
        setStep(previous.name === 'loading' ? { name: 'intake' } : previous);
      }
    },
    [aiConsent, requestBase, showResult, step]
  );

  const handleIntakeSubmit = async () => {
    const preview = await runPreview(segments, clarifications.length);
    if (preview) setStep({ name: 'preview', segments: preview });
  };

  const handleClarification = async (answer: string) => {
    const nextClarifications = [...clarifications, answer];
    setClarifications(nextClarifications);
    const segs = buildSegments({ story: text, selected, clarifications: nextClarifications });
    const rounds = nextClarifications.length;
    const preview = await runPreview(segs, rounds);
    if (!preview) return;
    const newSegment = preview.find((s) => s.id === `clarification:${rounds}`);
    if (newSegment && newSegment.findings.length > 0) {
      setStep({ name: 'preview', segments: preview });
    } else {
      await runGenerate(segs, kept, rounds);
    }
  };

  const handleSkipClarification = () => {
    if (step.name === 'result') setStep({ ...step, forceReview: true });
  };

  const toggleEntry = (entry: LocalEvidenceEntry) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entry.id)) {
        next.delete(entry.id);
      } else if (canSelectEntry({ story: text, selected, clarifications }, entry)) {
        next.add(entry.id);
      }
      return next;
    });

  const toggleKept = (finding: CarePassportPiiFinding) =>
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(finding.id)) next.delete(finding.id);
      else if (finding.canKeep) next.add(finding.id);
      return next;
    });

  const evidenceProps = {
    entries,
    selectedIds,
    loaded: evidenceLoaded,
    onToggle: toggleEntry,
    canSelect: (entry: LocalEvidenceEntry) => canSelectEntry({ story: text, selected, clarifications }, entry),
    budget,
  };

  let content: React.ReactNode;
  switch (step.name) {
    case 'minor':
      content = (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <StepHeading
              step="Catatan Konsultasi"
              title="Bagian ini untuk pengguna 18 tahun ke atas."
              lede="Bagian lain Dengar.in tetap bisa kamu pakai. Kalau kamu butuh teman bicara sekarang, bantuan tersedia kapan saja."
              animate={false}
            />
            <UrgentHelpLink className="shrink-0" />
          </div>
          <SectionCard as="div" tone="paper" elevation="low" className="space-y-2">
            <p className={`text-[15px] leading-relaxed ${MUTED}`}>
              <Link href="/resources" className="font-bold text-[#151515] underline underline-offset-4 decoration-2 hover:text-[#4169FF]">
                Lihat jalur bantuan
              </Link>{' '}
              atau{' '}
              <Link href="/dashboard" className="font-bold text-[#151515] underline underline-offset-4 decoration-2 hover:text-[#4169FF]">
                kembali ke beranda
              </Link>
              .
            </p>
          </SectionCard>
        </div>
      );
      break;
    case 'consent':
      content = (
        <ConsentStep
          onAccept={() => { setAiConsent(true); startedAtRef.current = Date.now(); setStep({ name: 'intake' }); }}
          onDecline={() => { setAiConsent(false); startedAtRef.current = Date.now(); setStep({ name: 'manual', reason: 'declined', result: DECLINED_RESULT }); }}
        />
      );
      break;
    case 'intake':
      content = (
        <IntakeStep
          text={text}
          onChange={setText}
          onSubmit={handleIntakeSubmit}
          onBack={() => setStep({ name: 'consent' })}
          busy={busy}
          error={error}
          evidence={evidenceProps}
        />
      );
      break;
    case 'preview':
      content = (
        <RedactionPreview
          rawTexts={rawTexts}
          segments={step.segments}
          kept={kept}
          onToggle={toggleKept}
          onSubmit={() => runGenerate(segments, kept, clarifications.length)}
          onBack={() => { setError(null); setStep({ name: 'intake' }); }}
          busy={busy}
          error={error}
        />
      );
      break;
    case 'loading':
      content = <ResultSkeleton />;
      break;
    case 'manual':
      content = (
        <ManualNote
          key={resultVersion}
          reason={step.reason}
          provenance={step.result.provenance}
          warnings={step.result.warnings}
          onRetry={step.reason === 'unavailable' && aiConsent ? () => runGenerate(segments, kept, clarifications.length) : undefined}
          onBack={restart}
          busy={busy}
          error={error}
        />
      );
      break;
    case 'result': {
      const { result } = step;
      const rounds = clarifications.length;
      if (result.state === 'IMMEDIATE_HELP_SCREEN') {
        content = <ImmediateHelp contacts={result.emergencyContacts ?? []} onRestart={restart} />;
      } else if (result.state === 'NEEDS_CLARIFICATION' && !step.forceReview && rounds < CARE_PASSPORT_MAX_CLARIFICATION_ROUNDS) {
        content = (
          <ClarificationStep
            key={resultVersion}
            question={result.clarificationQuestion ?? 'Boleh ceritakan sedikit lebih jelas, hal apa yang paling ingin kamu bicarakan saat konsultasi nanti?'}
            provenance={result.provenance}
            remainingChars={budget.remaining}
            round={rounds + 1}
            maxRounds={CARE_PASSPORT_MAX_CLARIFICATION_ROUNDS}
            onAnswer={handleClarification}
            onSkip={handleSkipClarification}
            onBack={() => { setError(null); setStep({ name: 'intake' }); }}
            busy={busy}
            error={error}
          />
        );
      } else if (result.passport) {
        content = (
          <PassportReview
            key={resultVersion}
            result={result}
            passport={result.passport}
            onRestart={restart}
            onApprove={() => recordMetric('approved', result, segments, rounds)}
            roundsExhausted={result.state === 'NEEDS_CLARIFICATION'}
          />
        );
      } else {
        // Defensive: a non-crisis state without a passport is treated as unavailable, never invented.
        content = (
          <ManualNote
            key={resultVersion}
            reason="unavailable"
            provenance={result.provenance}
            warnings={result.warnings}
            onRetry={aiConsent ? () => runGenerate(segments, kept, clarifications.length) : undefined}
            onBack={restart}
            busy={busy}
            error={error}
          />
        );
      }
      break;
    }
  }

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="default" className="sm:py-16 lg:py-20 pb-24 lg:pb-20">
      {content}
    </PageContainer>
  );
}
