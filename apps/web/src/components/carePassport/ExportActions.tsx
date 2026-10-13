'use client';

import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import type { CarePassport } from '@dengarin/types';
import { Button } from '@/components/ui';
import { useLanguage } from '@/i18n';
import {
  buildCarePassportExport,
  carePassportExportFileName,
  type CarePassportExportFormat,
} from '@/lib/carePassportExport';
import { MUTED, SectionCard, usePassportText } from './shared';

/** Saves a file through the browser only; no request leaves the device. */
function downloadTextFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ExportActionsProps {
  passport: CarePassport;
  provenanceLabel: string;
  /** Extra user-approved sections (e.g. opening lines) appended to the file. */
  appendix?: (format: CarePassportExportFormat) => string;
}

/**
 * Separate affirmative action after approval (AMD-11). Renders nothing unless
 * the passport is user_approved; the builder refuses too, as a second guard.
 */
export function ExportActions({ passport, provenanceLabel, appendix }: ExportActionsProps) {
  const t = usePassportText().exportActions;
  const { lang } = useLanguage();
  const [done, setDone] = useState<CarePassportExportFormat | null>(null);
  if (passport.reviewStatus !== 'user_approved') return null;

  const save = (format: CarePassportExportFormat) => {
    const base = buildCarePassportExport(passport, { format, provenanceLabel, lang });
    if (!base) return;
    const extra = appendix?.(format).trim();
    const content = extra ? `${base.trimEnd()}\n\n${extra}\n` : base;
    downloadTextFile(carePassportExportFileName(format, new Date(), lang), content, format === 'md' ? 'text/markdown' : 'text/plain');
    setDone(format);
  };

  return (
    <SectionCard as="div" tone="cobalt" elevation="high" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#151515] leading-[1.25]">{t.title}</h2>
        <p className={`text-base leading-relaxed ${MUTED}`}>{t.body}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="primary" size="lg" onClick={() => save('md')} icon={<Download className="w-4 h-4" />} className="sm:flex-1">
          {t.md}
        </Button>
        <Button variant="secondary" size="lg" onClick={() => save('txt')} icon={<FileText className="w-4 h-4" />} className="sm:flex-1">
          {t.txt}
        </Button>
      </div>
      {done && (
        <p role="status" className="text-sm font-bold text-[#151515]">
          {t.done(done)}
        </p>
      )}
    </SectionCard>
  );
}
