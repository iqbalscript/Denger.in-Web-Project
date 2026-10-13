'use client';

import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import type { LocalEvidenceEntry, SegmentBudget } from '@/lib/carePassportClient';
import { MUTED, SectionCard, SourceChip, Tag } from './shared';

export interface EvidencePickerProps {
  entries: LocalEvidenceEntry[];
  selectedIds: ReadonlySet<string>;
  /** Null while localStorage has not been read yet (first client render). */
  loaded: boolean;
  onToggle: (entry: LocalEvidenceEntry) => void;
  /** Returns false when ticking this entry would exceed the size limit. */
  canSelect: (entry: LocalEvidenceEntry) => boolean;
  budget: SegmentBudget;
  disabled?: boolean;
}

/**
 * F-A "Bukti Bertanggal": dated journal / check-in entries from THIS device,
 * one labelled checkbox each. Nothing is pre-selected; nothing leaves the
 * device until the user submits with the box ticked. The PII badge is a
 * count only, never the matched text.
 */
export function EvidencePicker({ entries, selectedIds, loaded, onToggle, canSelect, budget, disabled = false }: EvidencePickerProps) {
  const selectedCount = entries.filter((e) => selectedIds.has(e.id)).length;
  const headingId = React.useId();
  const helpId = React.useId();

  return (
    <SectionCard as="section" tone="paper" elevation="low" className="space-y-4" aria-labelledby={headingId}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={headingId} className="text-lg font-bold text-[#151515] leading-[1.25]">
            Sertakan bukti dari perangkatmu (opsional)
          </h2>
          <Tag tone="white">
            <Lock className="w-3 h-3" aria-hidden="true" />
            Privat
          </Tag>
        </div>
        <p id={helpId} className={`text-[15px] leading-relaxed ${MUTED}`}>
          Jurnal dan check-in 30 hari terakhir tersimpan di perangkat ini saja. Centang yang mau kamu bawa; setiap fakta di catatan nanti akan ditautkan ke tanggalnya. Yang tidak dicentang tidak pernah dikirim.
        </p>
      </div>

      {!loaded ? (
        <p className={`text-[15px] ${MUTED}`} aria-live="polite">
          Membaca jurnal dan check-in di perangkat ini…
        </p>
      ) : entries.length === 0 ? (
        <p className={`text-[15px] leading-relaxed ${MUTED}`}>
          Belum ada jurnal atau check-in dalam 30 hari terakhir di perangkat ini. Tidak apa-apa, ceritamu saja sudah cukup.
        </p>
      ) : (
        <ul className="space-y-2" aria-describedby={helpId}>
          {entries.map((entry) => {
            const checked = selectedIds.has(entry.id);
            const blocked = !checked && !canSelect(entry);
            const inputId = `evidence-${entry.id.replace(/[^A-Za-z0-9_-]/g, '-')}`;
            return (
              <li key={entry.id}>
                <label
                  htmlFor={inputId}
                  className={`flex items-start gap-3 min-h-[48px] px-3 py-2.5 rounded-[4px] border-2 border-[#151515] cursor-pointer transition-[background-color,box-shadow] duration-150 ${
                    checked ? 'bg-[#E6ECFF] shadow-[2px_2px_0px_#151515]' : 'bg-white hover:bg-[#FFF8EF]'
                  } ${blocked || disabled ? 'opacity-60 cursor-not-allowed' : ''} has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#4169FF]`}
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled || blocked}
                    onChange={() => onToggle(entry)}
                    aria-describedby={blocked ? `${inputId}-blocked` : undefined}
                    className="mt-1 w-5 h-5 shrink-0 accent-[#4169FF] focus-visible:outline-none"
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <SourceChip sourceRef={{ kind: entry.kind, date: entry.date }} />
                      <span className="text-sm font-bold text-[#151515]">{entry.label}</span>
                      {entry.piiCount > 0 && (
                        <Tag tone="yellow">
                          <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                          {entry.piiCount} data pribadi disamarkan
                        </Tag>
                      )}
                    </span>
                    <span className={`block text-[15px] leading-relaxed break-words ${MUTED}`}>{entry.preview}</span>
                    {blocked && (
                      <span id={`${inputId}-blocked`} className="block text-sm font-bold text-[#D93838]">
                        Tidak muat: batas {budget.max} karakter atau {budget.maxCount - 1} entri sudah tercapai.
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <p className={`text-sm leading-relaxed border-t border-[#D8D3C9] pt-3 ${MUTED}`} aria-live="polite">
        {selectedCount === 0
          ? 'Belum ada entri yang dipilih.'
          : `${selectedCount} entri dipilih. Total ${budget.used} dari ${budget.max} karakter.`}{' '}
        Entri yang dipilih ikut diperiksa data pribadinya di langkah berikutnya.
      </p>
    </SectionCard>
  );
}
