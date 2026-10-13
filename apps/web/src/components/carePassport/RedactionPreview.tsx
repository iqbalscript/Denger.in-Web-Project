'use client';

import React from 'react';
import { ArrowLeft, Send, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import type { CarePassportPiiFinding, CarePassportPreviewSegment } from '@/lib/api/carePassportHandler';
import { Button } from '@/components/ui';
import { useLanguage } from '@/i18n';
import { MUTED, SectionCard, SourceChip, StepHeading, Tag, UrgentHelpLink, piiKindLabel, usePassportText } from './shared';

export interface RedactionPreviewProps {
  /** Raw segment texts by id, exactly as they will be sent before redaction. */
  rawTexts: ReadonlyMap<string, string>;
  /** Server findings per segment. */
  segments: CarePassportPreviewSegment[];
  /** Ids of SOFT findings the user chose to keep visible. Hard kinds are locked. */
  kept: ReadonlySet<string>;
  onToggle: (finding: CarePassportPiiFinding) => void;
  onSubmit: () => void;
  onBack: () => void;
  busy: boolean;
  error: string | null;
}

/** Client-side mirror of the server replacement, for display only. The server re-redacts on submit. */
function renderPreview(text: string, findings: CarePassportPiiFinding[], kept: ReadonlySet<string>): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  findings.forEach((f, index) => {
    if (f.start < cursor) return;
    if (f.start > cursor) nodes.push(<React.Fragment key={`t${index}`}>{text.slice(cursor, f.start)}</React.Fragment>);
    const visible = f.canKeep && kept.has(f.id);
    nodes.push(
      <mark
        key={`m${index}`}
        className={`px-1 rounded-[3px] border font-bold ${visible ? 'bg-[#FFF2D6] border-[#FF8A3D] text-[#151515]' : 'bg-[#FFD84D] border-[#151515] text-[#151515]'}`}
      >
        {visible ? f.match : f.replacement}
      </mark>
    );
    cursor = f.end;
  });
  if (cursor < text.length) nodes.push(<React.Fragment key="tail">{text.slice(cursor)}</React.Fragment>);
  return nodes;
}

/**
 * Step 3: exactly what will be sent, segment by segment (story first, then
 * each selected dated entry). Hard identifiers are always replaced and shown
 * locked; only address / name hints can be left visible, per finding.
 */
export function RedactionPreview({ rawTexts, segments, kept, onToggle, onSubmit, onBack, busy, error }: RedactionPreviewProps) {
  const text = usePassportText();
  const t = text.redaction;
  const { lang } = useLanguage();
  const allFindings = segments.flatMap((s) => s.findings);
  const visibleCount = allFindings.filter((f) => f.canKeep && kept.has(f.id)).length;
  const redactedCount = allFindings.length - visibleCount;
  const evidenceCount = segments.filter((s) => s.kind === 'journal' || s.kind === 'checkin').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <StepHeading step={t.step} title={t.title} lede={allFindings.length === 0 ? t.ledeNone(evidenceCount > 0) : t.ledeFound} />
        <UrgentHelpLink className="shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 space-y-4 animate-reveal-up [animation-delay:120ms]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#151515]">{t.willRead(segments.length)}</h2>
            <Tag tone="lime">
              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
              {t.redactedCount(redactedCount)}
            </Tag>
          </div>

          <ol className="space-y-4" aria-label={t.listLabel}>
            {segments.map((segment) => (
              <li key={segment.id}>
                <SectionCard as="article" elevation="low" className="space-y-3" aria-label={t.segmentLabel(text.shared.segmentKinds[segment.kind])}>
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceChip sourceRef={{ kind: segment.kind, date: segment.date }} />
                    {segment.findings.length > 0 && (
                      <span className={`text-sm ${MUTED}`}>{t.detected(segment.findings.length)}</span>
                    )}
                  </div>
                  <p className="text-base leading-[1.6] text-[#151515] whitespace-pre-wrap break-words">
                    {renderPreview(rawTexts.get(segment.id) ?? '', segment.findings, kept)}
                  </p>
                </SectionCard>
              </li>
            ))}
          </ol>

          {error && (
            <p role="alert" className="text-sm font-bold text-[#B3261E] border-2 border-[#FF5252] bg-[#FFEBEB] rounded-[4px] px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onSubmit}
              isLoading={busy}
              iconPosition="end"
              icon={<Send className="w-4 h-4" />}
              className="sm:flex-1"
            >
              {t.submit}
            </Button>
            <Button variant="outline" size="lg" onClick={onBack} disabled={busy} icon={<ArrowLeft className="w-4 h-4" />}>
              {t.back}
            </Button>
          </div>
          <p className={`text-sm leading-relaxed ${MUTED}`}>{t.note}</p>
        </div>

        <div className="lg:col-span-5 space-y-4 animate-reveal-up [animation-delay:200ms]">
          <SectionCard as="div" tone="paper" elevation="low" className="space-y-3">
            <h2 className="text-base font-bold text-[#151515]">{t.detectedTitle(allFindings.length)}</h2>
            {allFindings.length === 0 ? (
              <p className={`text-base leading-relaxed ${MUTED}`}>{t.nothing}</p>
            ) : (
              <ul className="space-y-2">
                {segments.flatMap((segment) =>
                  segment.findings.map((f) => {
                    const visible = f.canKeep && kept.has(f.id);
                    const where =
                      segment.kind === 'intake'
                        ? t.where.story
                        : segment.kind === 'clarification'
                          ? t.where.answer
                          : `${segment.kind === 'journal' ? t.where.journal : t.where.checkin} ${segment.date ?? ''}`.trim();
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          aria-pressed={!visible}
                          aria-disabled={!f.canKeep || undefined}
                          onClick={() => f.canKeep && onToggle(f)}
                          title={f.canKeep ? undefined : t.alwaysTitle}
                          className={`w-full flex items-center justify-between gap-3 text-left min-h-[48px] px-3 py-2 rounded-[4px] border-2 border-[#151515] transition-[transform,box-shadow,background-color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2 ${
                            !f.canKeep ? 'bg-[#F1ECE3] cursor-not-allowed shadow-none' : visible ? 'bg-[#FFF2D6] shadow-none' : 'bg-white shadow-[2px_2px_0px_#151515]'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-[#59544D]">
                              {piiKindLabel(f.kind, lang)} · {where}
                            </span>
                            <span className="block text-base font-bold text-[#151515] truncate">{f.match}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-bold shrink-0">
                            {!f.canKeep ? (
                              <>
                                <Lock className="w-4 h-4" aria-hidden="true" />
                                {t.always}
                              </>
                            ) : visible ? (
                              <>
                                <Eye className="w-4 h-4" aria-hidden="true" />
                                {t.kept}
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                                {t.redacted}
                              </>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </SectionCard>

          <SectionCard as="div" tone="white" elevation="low" className="space-y-2">
            <h2 className="text-base font-bold text-[#151515]">{t.missedTitle}</h2>
            <p className={`text-base leading-relaxed ${MUTED}`}>{t.missedBody}</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
