'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Pencil, Trash2, Plus, Undo2, HeartHandshake, X, RotateCcw } from 'lucide-react';
import type { CarePassport, CarePassportResult, EvidenceField } from '@dengarin/types';
import { computeCompleteness } from '@dengarin/validator';
import { Button } from '@/components/ui';
import { useLanguage } from '@/i18n';
import { EXPORT_SECTION_LABELS, exportSectionLabels } from '@/lib/carePassportExport';
import { ExportActions } from './ExportActions';
import { OpeningLines, openingLinesExportText, type OpeningLinesSelection } from './OpeningLines';
import { MUTED, ProvenanceTag, SectionCard, SourceChip, StepHeading, Tag, UrgentHelpLink, isParaphrase, provenanceLabel, sourceLabel, usePassportText } from './shared';

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

/**
 * The server writes `unknowns` with the Indonesian section labels, so clearing
 * an unknown always matches on the Indonesian label regardless of UI language.
 */
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
  const t = usePassportText().review;
  const { lang } = useLanguage();
  const labels = exportSectionLabels(lang);
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
        <StepHeading step={t.step} title={approved ? t.titleApproved : t.titlePending} lede={t.lede} />
        <UrgentHelpLink className="shrink-0" />
      </div>

      {humanSupport && (
        <SectionCard as="aside" tone="cobalt" elevation="medium" className="space-y-2" aria-label={t.humanAria}>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#3357EE]" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">{t.humanTitle}</h2>
          </div>
          <p className={`text-base leading-relaxed ${MUTED}`}>
            {t.humanBody}{' '}
            <Link href="/resources" className="font-bold text-[#151515] underline underline-offset-4 decoration-2 hover:text-[#3357EE]">
              {t.humanLink}
            </Link>
            .
          </p>
        </SectionCard>
      )}

      <div className="flex flex-wrap items-center gap-2 animate-reveal-up [animation-delay:80ms]">
        <ProvenanceTag provenance={result.provenance} />
        {approved ? <Tag tone="lime">{t.approved}</Tag> : <Tag tone={pending > 0 ? 'yellow' : 'paper'}>{pending > 0 ? t.pending(pending) : t.ready}</Tag>}
        {result.droppedClaims > 0 && <span className={`text-sm ${MUTED}`}>{t.dropped(result.droppedClaims)}</span>}
      </div>

      <SectionCard as="div" tone="white" elevation="low" className="space-y-1 animate-reveal-up [animation-delay:100ms]" aria-live="polite">
        <p className="text-base font-bold text-[#151515]">{t.completeness(completeness.known, completeness.total)}</p>
        <p className={`text-base leading-relaxed ${MUTED}`}>
          {datedSources > 0 ? t.datedSources(datedSources) : t.countNote}
          {roundsExhausted && t.roundsExhausted}
        </p>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-6 animate-reveal-up [animation-delay:140ms]">
          {(['concerns', 'dailyImpact'] as ListSection[]).map((section) => (
            <ListCard key={section} title={labels[section]} items={draft[section]} locked={approved} {...listHandlers(section)} />
          ))}
          <DurationCard field={draft.duration} locked={approved} {...durationHandlers} />
          <ListCard title={labels.relevantContext} items={draft.relevantContext} locked={approved} {...listHandlers('relevantContext')} />
          <QuestionsCard questions={draft.questionsForProfessional} locked={approved} onChange={setQuestions} />
        </div>

        <div className="lg:col-span-4 space-y-6 animate-reveal-up [animation-delay:220ms]">
          <SectionCard as="div" tone="paper" elevation="low" className="space-y-3">
            <h2 className="text-base font-bold text-[#151515]">{t.unknownTitle}</h2>
            {draft.unknowns.length === 0 ? (
              <p className={`text-base leading-relaxed ${MUTED}`}>{t.unknownEmpty}</p>
            ) : (
              <ul className="space-y-2">
                {draft.unknowns.map((u) => (
                  <li key={u} className="flex items-start justify-between gap-2 text-base leading-relaxed text-[#151515]">
                    <span lang="id">{u}</span>
                    {!approved && (
                      <button
                        type="button"
                        onClick={() => dismissUnknown(u)}
                        className="shrink-0 inline-flex items-center gap-1 min-h-[44px] px-2.5 rounded-[4px] border-2 border-[#151515] bg-white text-sm font-bold hover:bg-[#FFF8EF] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
                        aria-label={t.dismissAria(u)}
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                        <span>{t.dismiss}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className={`text-sm leading-relaxed border-t border-[#D8D3C9] pt-3 ${MUTED}`}>{t.unknownNote}</p>
          </SectionCard>

          <SectionCard as="div" elevation="low" className="space-y-2">
            <h2 className="text-base font-bold text-[#151515]">{t.importantTitle}</h2>
            <p className={`text-base leading-relaxed ${MUTED}`} lang="id">{draft.disclaimer}</p>
          </SectionCard>

          {approved ? (
            <>
              {/* F-B: grounded opening sentences per destination; user edits flow into the export */}
              <OpeningLines passport={draft} aiConsent onLinesChange={setOpeningLines} />
              <ExportActions
                passport={draft}
                provenanceLabel={provenanceLabel(result.provenance, lang)}
                appendix={(format) => (openingLines ? openingLinesExportText(openingLines, format, lang) : '')}
              />
              <Button variant="outline" size="md" onClick={reopen} icon={<Undo2 className="w-4 h-4" />} fullWidth>
                {t.editAgain}
              </Button>
            </>
          ) : (
            <SectionCard as="div" elevation="high" className="space-y-3">
              <h2 className="text-base font-bold text-[#151515]">{t.approveTitle}</h2>
              <p className={`text-base leading-relaxed ${MUTED}`}>{pending > 0 ? t.approvePending(pending) : t.approveReady}</p>
              <Button variant="primary" size="lg" fullWidth disabled={pending > 0} onClick={approve} icon={<Check className="w-4 h-4" />}>
                {t.approveButton}
              </Button>
            </SectionCard>
          )}

          {confirmRestart ? (
            <div role="group" aria-label={t.confirmAria} className="p-4 rounded-[6px] bg-[#FFEBEB] border-2 border-[#151515] space-y-3">
              <p className="text-base font-bold text-[#151515] leading-snug">{t.confirmTitle}</p>
              <p className={`text-base leading-relaxed ${MUTED}`}>{t.confirmBody}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="crisis" size="sm" onClick={onRestart} icon={<RotateCcw className="w-4 h-4" />}>
                  {t.confirmYes}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmRestart(false)}>
                  {t.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmRestart(true)} className={`inline-flex items-center min-h-[44px] text-base font-bold underline underline-offset-4 decoration-2 hover:text-[#3357EE] rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] ${MUTED}`}>
              {t.restart}
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
  const t = usePassportText().review;
  const { lang } = useLanguage();
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
        {field.needsReview && !locked && <Tag tone="yellow">{paraphrase ? t.paraphraseTag : t.needsCheck}</Tag>}
        {field.source === 'user_confirmed' && <Tag tone="lime">{t.confirmedTag}</Tag>}
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="sr-only" htmlFor={`edit-${field.sourceQuote ?? field.value ?? 'x'}`}>
            {t.editPoint}
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
              {t.save}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setValue(field.value ?? ''); }}>
              {t.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-base font-bold text-[#151515] leading-[1.45]">{field.value}</p>
      )}

      {field.sourceQuote && field.source === 'user_input' && (
        <blockquote className={`text-base leading-relaxed border-l-2 border-[#3357EE] pl-3 ${MUTED}`}>
          <span className="block text-sm font-bold text-[#2B51E6]">
            {field.sourceRef && field.sourceRef.kind !== 'intake' ? t.fromSource(sourceLabel(field.sourceRef, lang)) : t.fromStory}
          </span>
          &ldquo;{field.sourceQuote}&rdquo;
          {paraphrase && <span className="block text-sm mt-1">{t.paraphraseNote}</span>}
        </blockquote>
      )}

      {!locked && !editing && (
        <div className="flex flex-wrap gap-2 pt-1">
          {field.needsReview && (
            <Button variant="secondary" size="sm" onClick={onConfirm} icon={<Check className="w-3.5 h-3.5" />}>
              {t.correct}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} icon={<Pencil className="w-3.5 h-3.5" />}>
            {t.edit}
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} icon={<Trash2 className="w-3.5 h-3.5" />} aria-label={t.removeAria(field.value ?? '')}>
            {t.remove}
          </Button>
        </div>
      )}
    </li>
  );
}

function AddRow({ label, onAdd }: { label: string; onAdd: (value: string) => void }) {
  const t = usePassportText().review;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputId = React.useId();
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
        {t.add}
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
          {t.save}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setOpen(false); setValue(''); }}>
          {t.cancel}
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
  const t = usePassportText().review;
  return (
    <SectionCard className="space-y-4">
      <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">{title}</h2>
      {items.length === 0 ? (
        <p className={`text-base leading-relaxed ${MUTED}`}>{t.emptyList}</p>
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
      {!locked && <AddRow label={t.newPoint} onAdd={add} />}
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
  const t = usePassportText().review;
  const { lang } = useLanguage();
  return (
    <SectionCard className="space-y-4">
      <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">{exportSectionLabels(lang).duration}</h2>
      {field.value ? (
        <ul>
          <EvidenceItem field={field} locked={locked} onConfirm={confirm} onEdit={edit} onRemove={remove} />
        </ul>
      ) : (
        <p className={`text-base leading-relaxed ${MUTED}`}>{t.notMentioned}</p>
      )}
      {!locked && !field.value && <AddRow label={t.sinceWhen} onAdd={edit} />}
    </SectionCard>
  );
}

function QuestionsCard({ questions, locked, onChange }: { questions: string[]; locked: boolean; onChange: (q: string[]) => void }) {
  const t = usePassportText().review;
  const { lang } = useLanguage();
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
        <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">{exportSectionLabels(lang).questionsForProfessional}</h2>
        <p className={`text-sm leading-relaxed ${MUTED}`}>{t.questionsHint}</p>
      </div>
      {questions.length === 0 ? (
        <p className={`text-base leading-relaxed ${MUTED}`}>{t.noQuestions}</p>
      ) : (
        <ol className="space-y-3 list-decimal pl-5">
          {questions.map((q, i) => (
            <li key={`${i}-${q}`} className="text-base text-[#151515] leading-[1.45] space-y-2">
              {editingIndex === i ? (
                <div className="space-y-2">
                  <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={2} className={INLINE_INPUT} aria-label={t.editQuestion} autoFocus />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={saveEdit} disabled={!value.trim()}>{t.save}</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingIndex(null)}>{t.cancel}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="font-medium">{q}</span>
                  {!locked && (
                    <span className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(i)} icon={<Pencil className="w-3.5 h-3.5" />}>{t.edit}</Button>
                      <Button variant="ghost" size="sm" onClick={() => onChange(questions.filter((_, idx) => idx !== i))} icon={<Trash2 className="w-3.5 h-3.5" />}>{t.remove}</Button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      {!locked && <AddRow label={t.newQuestion} onAdd={(q) => onChange([...questions, q])} />}
    </SectionCard>
  );
}
