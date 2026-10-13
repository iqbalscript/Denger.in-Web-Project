'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Pencil, Trash2, Plus, Undo2, HeartHandshake, X, RotateCcw } from 'lucide-react';
import type { CarePassport, CarePassportResult, EvidenceField } from '@dengarin/types';
import { computeCompleteness } from '@dengarin/validator';
import { Button } from '@/components/ui';
import { EXPORT_SECTION_LABELS } from '@/lib/carePassportExport';
import { ExportActions } from './ExportActions';
import { OpeningLines, openingLinesExportText, type OpeningLinesSelection } from './OpeningLines';
import { MUTED, ProvenanceTag, SectionCard, SourceChip, StepHeading, Tag, UrgentHelpLink, isParaphrase, provenanceLabel, sourceLabel } from './shared';

type ListSection = 'concerns' | 'dailyImpact' | 'relevantContext';

export interface PassportReviewProps {
  result: CarePassportResult;
  passport: CarePassport;
  onRestart: () => void;
  /** Called once when the user approves (metrics: numbers only). */
  onApprove?: () => void;
  /** Shown when the clarification rounds ran out and the review is displayed as-is. */
  roundsExhausted?: boolean;
}

const UNKNOWN_BY_SECTION: Record<ListSection | 'duration', string> = {
  concerns: EXPORT_SECTION_LABELS.concerns,
  dailyImpact: EXPORT_SECTION_LABELS.dailyImpact,
  duration: EXPORT_SECTION_LABELS.duration,
  relevantContext: EXPORT_SECTION_LABELS.relevantContext,
};

const confirmed = (value: string): EvidenceField => ({ value, source: 'user_confirmed', needsReview: false });

function countNeedsReview(p: CarePassport): number {
  return [...p.concerns, ...p.dailyImpact, ...p.relevantContext, p.duration].filter((f) => f.needsReview).length;
}

const INLINE_INPUT =
  'w-full px-3 py-2.5 bg-white border-2 border-[#151515] rounded-[4px] text-base leading-[1.5] font-medium text-[#151515] shadow-[2px_2px_0px_#151515] focus:outline-none focus:shadow-[3px_3px_0px_#3357EE]';

/**
 * READY_FOR_USER_REVIEW and HUMAN_SUPPORT_RECOMMENDED. The passport is the
 * user's: every fact can be confirmed, rewritten or removed. Rewritten or
 * added facts become `user_confirmed`; approval flips reviewStatus.
 */
export function PassportReview({ result, passport: initial, onRestart, onApprove, roundsExhausted = false }: PassportReviewProps) {
  const [draft, setDraft] = useState<CarePassport>(initial);
  const approved = draft.reviewStatus === 'user_approved';
  const [openingLines, setOpeningLines] = useState<OpeningLinesSelection | null>(null);
  // "Mulai dari awal" menghapus seluruh draf, jadi minta konfirmasi di tempat.
  const [confirmRestart, setConfirmRestart] = useState(false);
  const pending = useMemo(() => countNeedsReview(draft), [draft]);
  const humanSupport = result.state === 'HUMAN_SUPPORT_RECOMMENDED';
  const completeness = useMemo(() => computeCompleteness(draft), [draft]);
  const datedSources = useMemo(() => {
    const refs = [...draft.concerns, ...draft.dailyImpact, ...draft.relevantContext, draft.duration]
      .map((f) => f.sourceRef)
      .filter((r): r is NonNullable<typeof r> => !!r && (r.kind === 'journal' || r.kind === 'checkin'));
    return new Set(refs.map((r) => r.segmentId)).size;
  }, [draft]);

  const update = (fn: (p: CarePassport) => CarePassport) => setDraft((p) => (p.reviewStatus === 'user_approved' ? p : fn(p)));

  const clearUnknown = (p: CarePassport, label: string): CarePassport => ({ ...p, unknowns: p.unknowns.filter((u) => u !== label) });

  const setList = (section: ListSection, items: EvidenceField[]) =>
    update((p) => {
      const next = { ...p, [section]: items };
      return items.length > 0 ? clearUnknown(next, UNKNOWN_BY_SECTION[section]) : next;
    });

  const listHandlers = (section: ListSection) => ({
    confirm: (i: number) => setList(section, draft[section].map((f, idx) => (idx === i ? { ...f, needsReview: false } : f))),
    edit: (i: number, value: string) => setList(section, draft[section].map((f, idx) => (idx === i ? confirmed(value) : f))),
    remove: (i: number) => setList(section, draft[section].filter((_, idx) => idx !== i)),
    add: (value: string) => setList(section, [...draft[section], confirmed(value)]),
  });

  const durationHandlers = {
    confirm: () => update((p) => ({ ...p, duration: { ...p.duration, needsReview: false } })),
    edit: (value: string) => update((p) => clearUnknown({ ...p, duration: confirmed(value) }, UNKNOWN_BY_SECTION.duration)),
    remove: () => update((p) => ({ ...p, duration: { value: null, source: 'unknown', needsReview: false } })),
  };

  const setQuestions = (questions: string[]) => update((p) => ({ ...p, questionsForProfessional: questions }));
  const dismissUnknown = (label: string) => update((p) => clearUnknown(p, label));
  const approve = () => {
    setDraft((p) => ({ ...p, reviewStatus: 'user_approved' }));
    onApprove?.();
  };
  const reopen = () => setDraft((p) => ({ ...p, reviewStatus: 'user_pending' }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <StepHeading
          step="Langkah 4 dari 4"
          title={approved ? 'Catatan ini sudah kamu setujui.' : 'Tinjau, koreksi, lalu setujui.'}
          lede="Setiap poin di bawah mengutip ceritamu sendiri. Kalau ada yang kurang pas, ubah atau hapus. Kalau sudah benar, tandai. Tidak ada yang final sebelum kamu menyetujuinya."
        />
        <UrgentHelpLink className="shrink-0" />
      </div>

      {humanSupport && (
        <SectionCard as="aside" tone="cobalt" elevation="medium" className="space-y-2" aria-label="Saran berbicara dengan profesional">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#3357EE]" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">Sepertinya ini layak dibicarakan dengan seseorang yang terlatih.</h2>
          </div>
          <p className={`text-base leading-relaxed ${MUTED}`}>
            Ini bukan penilaian dan bukan diagnosis, hanya saran. Catatan di bawah tetap milikmu dan bisa kamu bawa saat bertemu profesional.{' '}
            <Link href="/resources" className="font-bold text-[#151515] underline underline-offset-4 decoration-2 hover:text-[#3357EE]">
              Lihat pilihan layanan dan bantuan
            </Link>
            .
          </p>
        </SectionCard>
      )}

      <div className="flex flex-wrap items-center gap-2 animate-reveal-up [animation-delay:80ms]">
        <ProvenanceTag provenance={result.provenance} />
        {approved ? <Tag tone="lime">Disetujui</Tag> : <Tag tone={pending > 0 ? 'yellow' : 'paper'}>{pending > 0 ? `${pending} perlu dicek` : 'Siap disetujui'}</Tag>}
        {result.droppedClaims > 0 && (
          <span className={`text-sm ${MUTED}`}>
            {result.droppedClaims} klaim tanpa kutipan dibuang otomatis.
          </span>
        )}
      </div>

      <SectionCard as="div" tone="white" elevation="low" className="space-y-1 animate-reveal-up [animation-delay:100ms]" aria-live="polite">
        <p className="text-base font-bold text-[#151515]">
          Kelengkapan: {completeness.known} dari {completeness.total} hal{completeness.total > 3 ? '' : ' utama'} diketahui.
        </p>
        <p className={`text-base leading-relaxed ${MUTED}`}>
          {datedSources > 0
            ? `${datedSources} entri bertanggal dari perangkatmu ikut menjadi bukti. Setiap poin di bawah menyebut sumbernya.`
            : 'Ini hitungan, bukan skor. Yang belum diketahui ditulis apa adanya; kamu bisa menambahkannya sendiri.'}
          {roundsExhausted && ' Pertanyaan lanjutan sudah habis, jadi catatan ditampilkan apa adanya.'}
        </p>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-6 animate-reveal-up [animation-delay:140ms]">
          {(['concerns', 'dailyImpact'] as ListSection[]).map((section) => (
            <ListCard key={section} title={UNKNOWN_BY_SECTION[section]} items={draft[section]} locked={approved} {...listHandlers(section)} />
          ))}
          <DurationCard field={draft.duration} locked={approved} {...durationHandlers} />
          <ListCard title={UNKNOWN_BY_SECTION.relevantContext} items={draft.relevantContext} locked={approved} {...listHandlers('relevantContext')} />
          <QuestionsCard questions={draft.questionsForProfessional} locked={approved} onChange={setQuestions} />
        </div>

        <div className="lg:col-span-4 space-y-6 animate-reveal-up [animation-delay:220ms]">
          <SectionCard as="div" tone="paper" elevation="low" className="space-y-3">
            <h2 className="text-base font-bold text-[#151515]">Belum diketahui</h2>
            {draft.unknowns.length === 0 ? (
              <p className={`text-base leading-relaxed ${MUTED}`}>Tidak ada yang tertinggal. Kalau ada yang ingin ditambah, pakai tombol tambah di tiap bagian.</p>
            ) : (
              <ul className="space-y-2">
                {draft.unknowns.map((u) => (
                  <li key={u} className="flex items-start justify-between gap-2 text-base leading-relaxed text-[#151515]">
                    <span>{u}</span>
                    {!approved && (
                      <button
                        type="button"
                        onClick={() => dismissUnknown(u)}
                        className="shrink-0 inline-flex items-center gap-1 min-h-[44px] px-2.5 rounded-[4px] border-2 border-[#151515] bg-white text-sm font-bold hover:bg-[#FFF8EF] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
                        aria-label={`Abaikan: ${u}`}
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                        <span>Abaikan</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className={`text-sm leading-relaxed border-t border-[#D8D3C9] pt-3 ${MUTED}`}>
              Tidak harus diisi sekarang. Profesional biasanya menanyakannya langsung.
            </p>
          </SectionCard>

          <SectionCard as="div" elevation="low" className="space-y-2">
            <h2 className="text-base font-bold text-[#151515]">Catatan penting</h2>
            <p className={`text-base leading-relaxed ${MUTED}`}>{draft.disclaimer}</p>
          </SectionCard>

          {approved ? (
            <>
              {/* F-B: grounded opening sentences per destination; user edits flow into the export */}
              <OpeningLines passport={draft} aiConsent onLinesChange={setOpeningLines} />
              <ExportActions
                passport={draft}
                provenanceLabel={provenanceLabel(result.provenance)}
                appendix={(format) => (openingLines ? openingLinesExportText(openingLines, format) : '')}
              />
              <Button variant="outline" size="md" onClick={reopen} icon={<Undo2 className="w-4 h-4" />} fullWidth>
                Ubah lagi
              </Button>
            </>
          ) : (
            <SectionCard as="div" elevation="high" className="space-y-3">
              <h2 className="text-base font-bold text-[#151515]">Setujui catatan</h2>
              <p className={`text-base leading-relaxed ${MUTED}`}>
                {pending > 0
                  ? `Masih ada ${pending} poin bertanda "perlu dicek". Tandai benar, ubah, atau hapus dulu.`
                  : 'Semua poin sudah kamu periksa. Setelah disetujui, catatan bisa diunduh ke perangkatmu.'}
              </p>
              <Button variant="primary" size="lg" fullWidth disabled={pending > 0} onClick={approve} icon={<Check className="w-4 h-4" />}>
                Saya setuju dengan catatan ini
              </Button>
            </SectionCard>
          )}

          {confirmRestart ? (
            <div role="group" aria-label="Konfirmasi mulai dari awal" className="p-4 rounded-[6px] bg-[#FFEBEB] border-2 border-[#151515] space-y-3">
              <p className="text-base font-bold text-[#151515] leading-snug">Hapus catatan ini dan mulai dari awal?</p>
              <p className={`text-base leading-relaxed ${MUTED}`}>Draf yang belum kamu unduh akan hilang.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="crisis" size="sm" onClick={onRestart} icon={<RotateCcw className="w-4 h-4" />}>
                  Ya, mulai dari awal
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmRestart(false)}>
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmRestart(true)} className={`inline-flex items-center min-h-[44px] text-base font-bold underline underline-offset-4 decoration-2 hover:text-[#3357EE] rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] ${MUTED}`}>
              Mulai dari awal dan hapus catatan ini
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────

function EvidenceItem({
  field,
  locked,
  onConfirm,
  onEdit,
  onRemove,
}: {
  field: EvidenceField;
  locked: boolean;
  onConfirm: () => void;
  onEdit: (value: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(field.value ?? '');
  const paraphrase = isParaphrase(field);

  const save = () => {
    const next = value.trim();
    if (!next) return;
    onEdit(next);
    setEditing(false);
  };

  return (
    <li className={`space-y-2 border-t border-[#D8D3C9] pt-4 first:border-t-0 first:pt-0 ${field.needsReview && !locked ? 'pl-3 border-l-4 border-l-[#FFD84D]' : ''}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {field.source === 'user_input' && <SourceChip sourceRef={field.sourceRef} />}
        {field.needsReview && !locked && <Tag tone="yellow">{paraphrase ? 'Periksa: parafrase' : 'Perlu dicek'}</Tag>}
        {field.source === 'user_confirmed' && <Tag tone="lime">Kamu konfirmasi</Tag>}
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="sr-only" htmlFor={`edit-${field.sourceQuote ?? field.value ?? 'x'}`}>
            Ubah poin
          </label>
          <textarea
            id={`edit-${field.sourceQuote ?? field.value ?? 'x'}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            className={INLINE_INPUT}
            autoFocus
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={save} disabled={!value.trim()}>
              Simpan
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setValue(field.value ?? ''); }}>
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-base font-bold text-[#151515] leading-[1.45]">{field.value}</p>
      )}

      {field.sourceQuote && field.source === 'user_input' && (
        <blockquote className={`text-base leading-relaxed border-l-2 border-[#3357EE] pl-3 ${MUTED}`}>
          <span className="block text-sm font-bold text-[#2B51E6]">
            {field.sourceRef && field.sourceRef.kind !== 'intake' ? `Dari ${sourceLabel(field.sourceRef)}` : 'Dari ceritamu'}
          </span>
          &ldquo;{field.sourceQuote}&rdquo;
          {paraphrase && <span className="block text-sm mt-1">Kalimat di atas dirapikan oleh AI. Yang asli adalah kutipan ini.</span>}
        </blockquote>
      )}

      {!locked && !editing && (
        <div className="flex flex-wrap gap-2 pt-1">
          {field.needsReview && (
            <Button variant="secondary" size="sm" onClick={onConfirm} icon={<Check className="w-3.5 h-3.5" />}>
              Benar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} icon={<Pencil className="w-3.5 h-3.5" />}>
            Ubah
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} icon={<Trash2 className="w-3.5 h-3.5" />} aria-label={`Hapus: ${field.value ?? ''}`}>
            Hapus
          </Button>
        </div>
      )}
    </li>
  );
}

function AddRow({ label, onAdd }: { label: string; onAdd: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputId = React.useId();
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
        Tambah
      </Button>
    );
  }
  const submit = () => {
    const next = value.trim();
    if (!next) return;
    onAdd(next);
    setValue('');
    setOpen(false);
  };
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-base font-bold text-[#151515]">
        {label}
      </label>
      <textarea id={inputId} value={value} onChange={(e) => setValue(e.target.value)} rows={2} className={INLINE_INPUT} autoFocus />
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={submit} disabled={!value.trim()}>
          Simpan
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setOpen(false); setValue(''); }}>
          Batal
        </Button>
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  locked,
  confirm,
  edit,
  remove,
  add,
}: {
  title: string;
  items: EvidenceField[];
  locked: boolean;
  confirm: (i: number) => void;
  edit: (i: number, value: string) => void;
  remove: (i: number) => void;
  add: (value: string) => void;
}) {
  return (
    <SectionCard className="space-y-4">
      <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">{title}</h2>
      {items.length === 0 ? (
        <p className={`text-base leading-relaxed ${MUTED}`}>Belum ada. Tidak masalah kalau memang tidak ada yang ingin ditulis.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((field, i) => (
            <EvidenceItem
              key={`${i}-${field.source}-${field.value}`}
              field={field}
              locked={locked}
              onConfirm={() => confirm(i)}
              onEdit={(value) => edit(i, value)}
              onRemove={() => remove(i)}
            />
          ))}
        </ul>
      )}
      {!locked && <AddRow label="Poin baru" onAdd={add} />}
    </SectionCard>
  );
}

function DurationCard({
  field,
  locked,
  confirm,
  edit,
  remove,
}: {
  field: EvidenceField;
  locked: boolean;
  confirm: () => void;
  edit: (value: string) => void;
  remove: () => void;
}) {
  return (
    <SectionCard className="space-y-4">
      <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">{UNKNOWN_BY_SECTION.duration}</h2>
      {field.value ? (
        <ul>
          <EvidenceItem field={field} locked={locked} onConfirm={confirm} onEdit={edit} onRemove={remove} />
        </ul>
      ) : (
        <p className={`text-base leading-relaxed ${MUTED}`}>Belum disebutkan di ceritamu.</p>
      )}
      {!locked && !field.value && <AddRow label="Sejak kapan" onAdd={edit} />}
    </SectionCard>
  );
}

function QuestionsCard({ questions, locked, onChange }: { questions: string[]; locked: boolean; onChange: (q: string[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [value, setValue] = useState('');

  const startEdit = (i: number) => { setEditingIndex(i); setValue(questions[i]); };
  const saveEdit = () => {
    if (editingIndex === null || !value.trim()) return;
    onChange(questions.map((q, i) => (i === editingIndex ? value.trim() : q)));
    setEditingIndex(null);
  };

  return (
    <SectionCard className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">{EXPORT_SECTION_LABELS.questionsForProfessional}</h2>
        <p className={`text-sm leading-relaxed ${MUTED}`}>Usulan pertanyaan. Ganti dengan kata-katamu sendiri kalau perlu.</p>
      </div>
      {questions.length === 0 ? (
        <p className={`text-base leading-relaxed ${MUTED}`}>Belum ada pertanyaan.</p>
      ) : (
        <ol className="space-y-3 list-decimal pl-5">
          {questions.map((q, i) => (
            <li key={`${i}-${q}`} className="text-base text-[#151515] leading-[1.45] space-y-2">
              {editingIndex === i ? (
                <div className="space-y-2">
                  <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={2} className={INLINE_INPUT} aria-label="Ubah pertanyaan" autoFocus />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={saveEdit} disabled={!value.trim()}>Simpan</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingIndex(null)}>Batal</Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="font-medium">{q}</span>
                  {!locked && (
                    <span className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(i)} icon={<Pencil className="w-3.5 h-3.5" />}>Ubah</Button>
                      <Button variant="ghost" size="sm" onClick={() => onChange(questions.filter((_, idx) => idx !== i))} icon={<Trash2 className="w-3.5 h-3.5" />}>Hapus</Button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      {!locked && <AddRow label="Pertanyaan baru" onAdd={(q) => onChange([...questions, q])} />}
    </SectionCard>
  );
}
