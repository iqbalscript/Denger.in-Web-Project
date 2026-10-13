'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, PhoneCall, RotateCcw } from 'lucide-react';
import type { CarePassport, CarePassportProvenance } from '@dengarin/types';
import { HELP_DESTINATIONS, type HelpDestination, type HelpDestinationId } from '@dengarin/config';
import type { OpeningLinesResult } from '@dengarin/orchestrator';
import { Button, Chip } from '@/components/ui';
import { LOCALE_TAG, contactText, pickText, useLanguage, type Language } from '@/i18n';
import { carePassportText } from '@/i18n/pages/carePassport';
import { localizedHelpDestination } from '@/i18n/pages/helpDestinations';
import { MUTED, ProvenanceTag, SectionCard, Tag, usePassportText } from './shared';

/**
 * OPENING LINES PANEL (F-B "Kalimat Pembuka per Tujuan")
 *
 * Self-contained: pick a destination, the panel calls
 * POST /api/care-passport/opening with the approved passport, shows 2-3
 * editable first-person sentences (AI-drafted and grounded, or a fixed
 * template labelled "tanpa AI"), and a static source-cited checklist for that
 * destination. Nothing is stored; the parent may receive the edited lines
 * through `onLinesChange` to include them in the local export.
 *
 * The sentences themselves are always Indonesian (they are for services in
 * Indonesia); the panel chrome and the checklist follow the UI language.
 */

export interface OpeningLinesSelection {
  destinationId: HelpDestinationId;
  destinationLabel: string;
  /** The sentences as the user last edited them. */
  lines: string[];
  provenance: CarePassportProvenance;
  /** Date the destination checklist was last checked against its sources. */
  verifiedOn: string;
}

export interface OpeningLinesProps {
  passport: CarePassport;
  /** Initial value of the AI toggle; the user can change it inside the panel. */
  aiConsent?: boolean;
  /** Called whenever the edited lines change; null when nothing is selected. */
  onLinesChange?: (selection: OpeningLinesSelection | null) => void;
}

type ApiEnvelope = { ok: true; data: OpeningLinesResult } | { ok: false; error?: string };

type Status = 'idle' | 'loading' | 'ready' | 'error';

const LINE_INPUT =
  'w-full px-3.5 py-3 bg-white border-2 border-[#151515] rounded-[4px] text-base leading-[1.5] font-medium text-[#151515] shadow-[2px_2px_0px_#151515] focus:outline-none focus:shadow-[3px_3px_0px_#3357EE] resize-y min-h-[72px]';

function basedOnLabel(ids: string[], labels: Record<string, string>): string {
  const names = [...new Set(ids.map((id) => labels[id.split(':')[0]]).filter(Boolean))];
  return names.join(', ');
}

function formatDate(iso: string, lang: Language): string {
  const date = new Date(`${iso}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE_TAG[lang], { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(date);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Plain-text block for the local export. Pure; no browser APIs. */
export function openingLinesExportText(selection: OpeningLinesSelection, format: 'md' | 'txt', lang: Language = 'id'): string {
  const t = pickText(carePassportText, lang).opening;
  const lines = selection.lines.map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  const heading = t.exportHeading(selection.destinationLabel);
  const how = selection.provenance.isAmd
    ? t.exportHowAmd
    : selection.provenance.isFallback
      ? t.exportHowFallback
      : t.exportHowOther(selection.provenance.providerId);
  return [format === 'md' ? `## ${heading}` : heading, ...lines.map((l, i) => `${i + 1}. ${l}`), how, ''].join('\n');
}

function LinesSkeleton() {
  const t = usePassportText().opening;
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-[4px] border-2 border-[#D8D3C9] bg-white p-4 space-y-2">
          <div className={`h-4 bg-[#E7E1D6] rounded-[3px] animate-pulse ${i === 1 ? 'w-5/6' : 'w-2/3'}`} aria-hidden="true" />
          <div className="h-4 w-1/3 bg-[#E7E1D6] rounded-[3px] animate-pulse" aria-hidden="true" />
        </div>
      ))}
      <p className="text-base font-bold text-[#151515]">{t.skeleton}</p>
    </div>
  );
}

function ImmediateHelpBlock({ result }: { result: OpeningLinesResult }) {
  const t = usePassportText().opening;
  const { lang } = useLanguage();
  // Static on purpose: no animation, no AI text (docs/CAREBRIDGE_SAFETY_POLICY.md §2).
  return (
    <SectionCard as="aside" tone="crisis" elevation="medium" className="space-y-4" aria-label={t.immediateAria}>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-[#151515] leading-[1.25]">{t.immediateTitle}</h3>
        <p className="text-base leading-relaxed text-[#151515]">{t.immediateBody}</p>
      </div>
      <ul className="space-y-2">
        {(result.emergencyContacts ?? []).slice(0, 3).map((c) => {
          const text = contactText(lang, c.id);
          return (
            <li key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-[4px] border-2 border-[#151515] bg-white px-3.5 py-3">
              <div className="min-w-0">
                <p className="font-bold text-base text-[#151515]">{text?.name ?? c.name}</p>
                <p className={`text-sm ${MUTED}`}>{text?.hours ?? c.availableHours}</p>
              </div>
              {c.phone && (
                <a
                  href={`tel:${c.phone.replace(/\s*ext\.?\s*/i, ',').replace(/[^\d+,]/g, '')}`}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-[4px] border-2 border-[#151515] bg-[#D32F2F] text-white font-bold text-sm shadow-[3px_3px_0px_#151515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
                >
                  <PhoneCall className="w-4 h-4" aria-hidden="true" />
                  {c.phone}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <Link href="/crisis" className="inline-flex items-center min-h-[44px] font-bold text-base text-[#151515] underline underline-offset-4 decoration-2 rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE]">
        {t.openHelp}
      </Link>
    </SectionCard>
  );
}

function Checklist({ destination }: { destination: HelpDestination }) {
  const t = usePassportText().opening;
  const { lang } = useLanguage();
  const local = localizedHelpDestination(destination, lang);
  const sourceIndex = new Map(local.sources.map((s, i) => [s.id, i + 1]));
  return (
    <SectionCard as="section" tone="paper" elevation="low" className="space-y-4" aria-labelledby="opening-checklist-title">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="white">{t.notAi}</Tag>
          <Tag tone="paper">{t.checked(formatDate(destination.verifiedOn, lang))}</Tag>
        </div>
        <h3 id="opening-checklist-title" className="text-lg font-bold text-[#151515] leading-[1.25]">
          {t.checklistTitle(local.label)}
        </h3>
      </div>
      <ul className="space-y-2.5">
        {local.checklist.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-base leading-relaxed text-[#151515]">
            <span className="mt-[7px] w-2.5 h-2.5 shrink-0 rounded-[2px] border-2 border-[#151515] bg-[#3357EE]" aria-hidden="true" />
            <span>
              {item.text}
              {item.sourceIds.length > 0 && (
                <span className={`ml-1 text-sm ${MUTED}`}>
                  [{item.sourceIds.map((id) => sourceIndex.get(id)).filter(Boolean).join(', ')}]
                </span>
              )}
              {item.unverified && (
                <Tag tone="yellow" className="ml-2 align-middle">
                  {t.generalAdvice}
                </Tag>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className={`text-base leading-relaxed ${MUTED}`}>{local.caveat}</p>
      <div className="space-y-1.5 border-t-2 border-[#D8D3C9] pt-3">
        <p className="text-sm font-bold text-[#151515]">{t.sources}</p>
        <ol className="space-y-1">
          {local.sources.map((s, i) => (
            <li key={s.id} className={`text-sm leading-relaxed ${MUTED}`}>
              [{i + 1}]{' '}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 min-h-[44px] font-bold text-[#151515] underline underline-offset-4 decoration-2 hover:text-[#3357EE] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] rounded-[2px]"
              >
                {s.label}
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              {s.kind === 'media' && t.media}
              {s.kind === 'guide' && t.guide}
            </li>
          ))}
        </ol>
      </div>
    </SectionCard>
  );
}

export function OpeningLines({ passport, aiConsent: initialConsent = false, onLinesChange }: OpeningLinesProps) {
  const t = usePassportText().opening;
  const { lang } = useLanguage();
  const [destinationId, setDestinationId] = useState<HelpDestinationId | null>(null);
  const [aiConsent, setAiConsent] = useState(initialConsent);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<OpeningLinesResult | null>(null);
  const [edited, setEdited] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | 'all' | null>(null);
  const [attempt, setAttempt] = useState(0);

  const passportRef = useRef(passport);
  passportRef.current = passport;
  const onChangeRef = useRef(onLinesChange);
  onChangeRef.current = onLinesChange;
  const requestId = useRef(0);

  const destination = destinationId ? HELP_DESTINATIONS.find((d) => d.id === destinationId) ?? null : null;
  const localDestination = destination ? localizedHelpDestination(destination, lang) : null;
  const approved = passport.reviewStatus === 'user_approved';

  useEffect(() => {
    if (!destinationId || !approved) return;
    const id = ++requestId.current;
    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    setCopied(null);

    (async () => {
      let envelope: ApiEnvelope | null = null;
      try {
        const response = await fetch('/api/care-passport/opening', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passport: passportRef.current, destination: destinationId, aiConsent }),
          signal: controller.signal,
        });
        envelope = (await response.json().catch(() => null)) as ApiEnvelope | null;
      } catch {
        envelope = null;
      }
      if (id !== requestId.current) return;
      if (!envelope) {
        setStatus('error');
        setError(pickText(carePassportText, lang).opening.networkError);
        return;
      }
      if (!envelope.ok) {
        setStatus('error');
        setError(envelope.error ?? pickText(carePassportText, lang).opening.networkError);
        return;
      }
      setResult(envelope.data);
      setEdited(envelope.data.lines.map((l) => l.text));
      setStatus('ready');
    })();

    return () => controller.abort();
    // `lang` only affects the fallback error text; it must not refetch.
  }, [destinationId, aiConsent, approved, attempt]);

  useEffect(() => {
    const notify = onChangeRef.current;
    if (!notify) return;
    if (!destination || !result || status !== 'ready' || result.state === 'IMMEDIATE_HELP_SCREEN') {
      notify(null);
      return;
    }
    notify({
      destinationId: destination.id,
      destinationLabel: localizedHelpDestination(destination, lang).label,
      lines: edited,
      provenance: result.provenance,
      verifiedOn: destination.verifiedOn,
    });
  }, [destination, result, edited, status, lang]);

  const copyLine = useCallback(async (index: number | 'all') => {
    const text = index === 'all' ? edited.map((l) => l.trim()).filter(Boolean).join(' ') : edited[index] ?? '';
    if (!text.trim()) return;
    const ok = await copyToClipboard(text);
    setCopied(ok ? index : null);
    if (ok) window.setTimeout(() => setCopied((c) => (c === index ? null : c)), 2000);
  }, [edited]);

  if (!approved) return null;

  const note = result
    ? result.state === 'FALLBACK_TEMPLATE'
      ? result.warnings.includes('ai_consent_declined') ? t.noteDeclined : t.noteFallback
      : result.droppedLines > 0 ? t.noteDropped(result.droppedLines) : null
    : null;

  return (
    <SectionCard as="section" tone="white" elevation="high" className="space-y-6" aria-labelledby="opening-lines-title">
      <div className="space-y-2">
        <Tag tone="cobalt">{t.tag}</Tag>
        <h2 id="opening-lines-title" className="text-xl sm:text-2xl font-bold text-[#151515] leading-[1.25]">
          {t.title}
        </h2>
        <p className={`text-base sm:text-base leading-relaxed ${MUTED}`}>{t.lede}</p>
        {lang !== 'id' && <p className={`text-sm leading-relaxed ${MUTED}`}>{t.languageNote}</p>}
      </div>

      <div role="group" aria-label={t.pickDestination} className="flex flex-wrap gap-2">
        {HELP_DESTINATIONS.map((d) => (
          <Chip key={d.id} variant="cobalt" selected={destinationId === d.id} onClick={() => setDestinationId(d.id)}>
            {localizedHelpDestination(d, lang).label}
          </Chip>
        ))}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={aiConsent}
          onChange={(e) => setAiConsent(e.target.checked)}
          className="mt-0.5 w-6 h-6 shrink-0 accent-[#3357EE] border-2 border-[#151515] rounded-[3px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
        />
        <span className="text-base leading-relaxed text-[#151515]">{t.aiConsent}</span>
      </label>

      {localDestination && (
        <p className={`text-base leading-relaxed ${MUTED}`}>{localDestination.description}</p>
      )}

      {!destination && (
        <p className={`text-base ${MUTED}`}>{t.noDestination}</p>
      )}

      {destination && status === 'loading' && <LinesSkeleton />}

      {destination && status === 'error' && (
        <div role="alert" className="rounded-[4px] border-2 border-[#151515] bg-[#FFF8EF] p-4 space-y-3">
          <p className="text-base leading-relaxed text-[#151515]">{error}</p>
          <Button variant="secondary" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={() => setAttempt((a) => a + 1)}>
            {t.retry}
          </Button>
        </div>
      )}

      {destination && status === 'ready' && result && result.state === 'IMMEDIATE_HELP_SCREEN' && <ImmediateHelpBlock result={result} />}

      {destination && localDestination && status === 'ready' && result && result.state !== 'IMMEDIATE_HELP_SCREEN' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ProvenanceTag provenance={result.provenance} />
            <Tag tone="paper">{t.forLabel(localDestination.label)}</Tag>
            {typeof result.provenance.latencyMs === 'number' && result.provenance.isAmd && (
              <span className={`text-sm ${MUTED}`}>
                {t.seconds((result.provenance.latencyMs / 1000).toFixed(1).replace('.', lang === 'id' ? ',' : '.'))}
              </span>
            )}
          </div>
          {note && <p className={`text-base leading-relaxed ${MUTED}`}>{note}</p>}

          <ol className="space-y-3">
            {edited.map((text, i) => {
              const basedOn = result.lines[i]?.basedOn ?? [];
              const from = basedOnLabel(basedOn, t.basedOn);
              return (
                <li key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`opening-line-${i}`} className="text-base font-bold text-[#151515]">
                      {t.line(i + 1)}
                    </label>
                    <button
                      type="button"
                      onClick={() => copyLine(i)}
                      aria-label={t.copyLineAria(i + 1)}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[4px] border-2 border-[#151515] bg-white text-sm font-bold text-[#151515] shadow-[2px_2px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
                    >
                      {copied === i ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                      {copied === i ? t.copied : t.copy}
                    </button>
                  </div>
                  <textarea
                    id={`opening-line-${i}`}
                    value={text}
                    rows={2}
                    maxLength={300}
                    lang="id"
                    onChange={(e) => setEdited((prev) => prev.map((l, idx) => (idx === i ? e.target.value : l)))}
                    className={LINE_INPUT}
                  />
                  {from && <p className={`text-sm ${MUTED}`}>{t.from(from)}</p>}
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" onClick={() => copyLine('all')} icon={copied === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} className="sm:flex-1">
              {copied === 'all' ? t.allCopied : t.copyAll}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setAttempt((a) => a + 1)} icon={<RotateCcw className="w-4 h-4" />} className="sm:flex-1">
              {t.regenerate}
            </Button>
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {copied === 'all' ? t.allCopiedStatus : typeof copied === 'number' ? t.lineCopied(copied + 1) : ''}
          </p>
          <p className={`text-sm leading-relaxed ${MUTED}`}>{t.disclaimer}</p>
        </div>
      )}

      {destination && status !== 'loading' && !(status === 'ready' && result?.state === 'IMMEDIATE_HELP_SCREEN') && (
        <Checklist destination={destination} />
      )}
    </SectionCard>
  );
}
