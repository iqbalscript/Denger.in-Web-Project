'use client';

import React from 'react';
import Link from 'next/link';
import { PhoneCall, BookOpenText, CalendarCheck, MessageSquareText, PenLine } from 'lucide-react';
import type { CarePassportProvenance, CarePassportSegmentKind, EvidenceField, EvidenceRef } from '@dengarin/types';
import type { PiiFinding } from '@dengarin/validator';
import { LOCALE_TAG, pickText, useLanguage, useText, type Language } from '@/i18n';
import { carePassportText } from '@/i18n/pages/carePassport';

export const MUTED = 'text-[#59544D]';

/** Kamus Catatan Konsultasi sesuai bahasa aktif. */
export function usePassportText() {
  return useText(carePassportText);
}

export const SEGMENT_KIND_LABELS: Record<CarePassportSegmentKind, string> = carePassportText.id.shared.segmentKinds;

const SEGMENT_ICONS: Record<CarePassportSegmentKind, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  intake: PenLine,
  journal: BookOpenText,
  checkin: CalendarCheck,
  clarification: MessageSquareText,
};

/** "Jurnal • 24 Sep", "Check-in • 2 Okt", "Ceritamu hari ini": the dated source behind one fact. */
export function sourceLabel(ref: Pick<EvidenceRef, 'kind' | 'date'> | undefined, lang: Language = 'id'): string {
  const labels = pickText(carePassportText, lang).shared.segmentKinds;
  const kind: CarePassportSegmentKind = ref?.kind ?? 'intake';
  if (kind === 'intake' || kind === 'clarification') return labels[kind];
  const base = labels[kind];
  if (!ref?.date) return base;
  const [y, m, d] = ref.date.split('-').map(Number);
  if (!y || !m || !d) return base;
  const formatted = new Intl.DateTimeFormat(LOCALE_TAG[lang], { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
  return `${base} • ${formatted}`;
}

/**
 * Source chip (F-A "Bukti Bertanggal"). Dated evidence is cobalt so it stands
 * out from the story; the label is read in full by screen readers.
 */
export function SourceChip({ sourceRef, className = '' }: { sourceRef?: Pick<EvidenceRef, 'kind' | 'date'>; className?: string }) {
  const { lang } = useLanguage();
  const kind: CarePassportSegmentKind = sourceRef?.kind ?? 'intake';
  const Icon = SEGMENT_ICONS[kind];
  const dated = kind === 'journal' || kind === 'checkin';
  return (
    <Tag tone={dated ? 'cobalt' : 'white'} className={className}>
      <Icon className="w-3 h-3" aria-hidden={true} />
      <span>{sourceLabel(sourceRef, lang)}</span>
    </Tag>
  );
}

/**
 * Always-visible path to human help. Rendered outside any Reveal or
 * animate-reveal-up wrapper on purpose (docs/CAREBRIDGE_SAFETY_POLICY.md §8).
 */
export function UrgentHelpLink({ className = '' }: { className?: string }) {
  const t = usePassportText();
  return (
    <Link
      href="/crisis"
      className={`inline-flex items-center gap-2 min-h-[48px] px-4 py-2 rounded-[4px] border-2 border-[#151515] bg-white text-[#151515] font-bold text-base shadow-[2px_2px_0px_#151515] hover:bg-[#FFEBEB] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2 ${className}`}
    >
      <PhoneCall className="w-5 h-5 text-[#B3261E] shrink-0" aria-hidden="true" />
      <span>{t.shared.urgentHelp}</span>
    </Link>
  );
}

export interface SectionCardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  tone?: 'white' | 'paper' | 'cobalt' | 'crisis';
  elevation?: 'flat' | 'low' | 'medium' | 'high';
  as?: 'section' | 'div' | 'article' | 'aside';
}

export function SectionCard({
  children,
  tone = 'white',
  elevation = 'medium',
  as = 'section',
  className = '',
  ...props
}: SectionCardProps) {
  const tones = {
    white: 'bg-white text-[#151515]',
    paper: 'bg-[#FFF8EF] text-[#151515]',
    cobalt: 'bg-[#E6ECFF] text-[#151515]',
    crisis: 'bg-[#FFEBEB] text-[#151515]',
  };
  const shadows = {
    flat: 'shadow-none',
    low: 'shadow-[2px_2px_0px_#151515]',
    medium: 'shadow-[3px_3px_0px_#151515]',
    high: 'shadow-[4px_4px_0px_#151515]',
  };
  return React.createElement(
    as,
    { className: `rounded-[8px] border-2 border-[#151515] p-5 sm:p-6 ${tones[tone]} ${shadows[elevation]} ${className}`, ...props },
    children
  );
}

/** Small label chip (PRD-DESIGN §7.4). Sentence case and >= 13.8px so it stays readable. */
export function Tag({
  children,
  tone = 'paper',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'paper' | 'cobalt' | 'lime' | 'yellow' | 'crisis' | 'white';
  className?: string;
}) {
  const tones = {
    paper: 'bg-[#FFF8EF] text-[#151515]',
    white: 'bg-white text-[#151515]',
    cobalt: 'bg-[#3357EE] text-white',
    lime: 'bg-[#B8F34A] text-[#151515]',
    yellow: 'bg-[#FFD84D] text-[#151515]',
    crisis: 'bg-[#D32F2F] text-white',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border-2 border-[#151515] text-xs font-bold shadow-[1px_1px_0px_#151515] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Honest provenance. "Diproses di AMD" appears only when the accepted draft
 * really came from the AMD provider; other providers are named as such and a
 * rules-only path says so plainly.
 */
export function ProvenanceTag({ provenance }: { provenance: CarePassportProvenance }) {
  const t = usePassportText().shared;
  if (provenance.isAmd) return <Tag tone="cobalt">{t.provenanceAmd}</Tag>;
  if (!provenance.isFallback) return <Tag tone="white">{t.provenanceOther(provenance.providerId)}</Tag>;
  return <Tag tone="paper">{t.provenanceNone}</Tag>;
}

export function provenanceLabel(provenance: CarePassportProvenance, lang: Language = 'id'): string {
  const t = pickText(carePassportText, lang).shared;
  if (provenance.isAmd) return t.provenanceLabelAmd;
  if (!provenance.isFallback) return t.provenanceLabelOther(provenance.providerId);
  return t.provenanceLabelNone;
}

export function findingKey(f: Pick<PiiFinding, 'kind' | 'start' | 'end'>): string {
  return `${f.kind}:${f.start}:${f.end}`;
}

export const PII_KIND_LABELS: Record<PiiFinding['kind'], string> = carePassportText.id.shared.pii;

export function piiKindLabel(kind: PiiFinding['kind'], lang: Language): string {
  return pickText(carePassportText, lang).shared.pii[kind] ?? PII_KIND_LABELS[kind];
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!?"'()]/g, '').trim();
}

/** True when the AI reworded the quoted evidence instead of quoting it verbatim. */
export function isParaphrase(field: EvidenceField): boolean {
  if (field.source !== 'user_input' || !field.sourceQuote || !field.value) return false;
  return normalise(field.value) !== normalise(field.sourceQuote);
}

export function StepHeading({
  step,
  title,
  lede,
  animate = true,
}: {
  step: string;
  title: string;
  lede: React.ReactNode;
  animate?: boolean;
}) {
  return (
    <div className={`space-y-3 ${animate ? 'animate-reveal-up' : ''}`}>
      <Tag tone="cobalt">{step}</Tag>
      <h1 className="text-[1.75rem] sm:text-[2.75rem] font-bold text-[#151515] tracking-[-0.03em] leading-[1.1]">{title}</h1>
      <p className={`text-base sm:text-lg leading-[1.5] max-w-[38rem] ${MUTED}`}>{lede}</p>
    </div>
  );
}
