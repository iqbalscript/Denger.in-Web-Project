'use client';

import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import type { CarePassport } from '@dengarin/types';
import { Button } from '@/components/ui';
import {
  buildCarePassportExport,
  carePassportExportFileName,
  type CarePassportExportFormat,
} from '@/lib/carePassportExport';
import { MUTED, SectionCard } from './shared';

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
  const [done, setDone] = useState<CarePassportExportFormat | null>(null);
  if (passport.reviewStatus !== 'user_approved') return null;

  const save = (format: CarePassportExportFormat) => {
    const base = buildCarePassportExport(passport, { format, provenanceLabel });
    if (!base) return;
    const extra = appendix?.(format).trim();
    const content = extra ? `${base.trimEnd()}\n\n${extra}\n` : base;
    downloadTextFile(carePassportExportFileName(format), content, format === 'md' ? 'text/markdown' : 'text/plain');
    setDone(format);
  };

  return (
    <SectionCard as="div" tone="cobalt" elevation="high" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#151515] leading-[1.25]">Simpan ke perangkatmu</h2>
        <p className={`text-[15px] leading-relaxed ${MUTED}`}>
          File berisi hanya poin yang kamu setujui, pertanyaanmu, dan catatan penting. Tanpa kutipan mentah, tanpa nama model. Tidak dikirim ke mana pun.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="primary" size="lg" onClick={() => save('md')} icon={<Download className="w-4 h-4" />} className="sm:flex-1">
          Unduh sebagai .md
        </Button>
        <Button variant="secondary" size="lg" onClick={() => save('txt')} icon={<FileText className="w-4 h-4" />} className="sm:flex-1">
          Unduh sebagai .txt
        </Button>
      </div>
      {done && (
        <p role="status" className="text-sm font-bold text-[#151515]">
          Tersimpan sebagai .{done}. Kalau halaman ini ditutup, catatannya tetap ada di file itu.
        </p>
      )}
    </SectionCard>
  );
}
