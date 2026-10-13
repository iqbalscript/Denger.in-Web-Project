'use client';

import React from 'react';
import Link from 'next/link';
import { PhoneCall, MessageCircle, Heart } from 'lucide-react';
import type { EmergencyContact } from '@dengarin/types';
import { contactText } from '@/i18n/common';
import { useLanguage, useText } from '@/i18n/store';
import { crisisCardText } from '@/i18n/pages/crisisCard';

function dialable(phone?: string): string {
  if (!phone) return '';
  return (phone.split(/\s*ext/i)[0] || '').replace(/[^0-9]/g, '');
}

function waLink(whatsapp: string): string {
  return `https://wa.me/62${whatsapp.replace(/^0/, '').replace(/[^0-9]/g, '')}`;
}

export interface InlineCrisisCardProps {
  contacts: EmergencyContact[];
  onAcknowledge: () => void;
  /** What was paused, e.g. "Catatanmu belum disimpan". Defaults to the localised note. */
  blockedNote?: string;
  className?: string;
}

/**
 * Static, inline crisis card (M6). Never animated, never auto-navigates, and
 * stays on screen until the user presses the acknowledge button. The text
 * the user typed is left untouched.
 */
export function InlineCrisisCard({
  contacts,
  onAcknowledge,
  blockedNote,
  className = '',
}: InlineCrisisCardProps) {
  const { lang } = useLanguage();
  const t = useText(crisisCardText);
  const shown = contacts.slice(0, 3);
  const note = blockedNote ?? t.defaultBlockedNote;

  return (
    <div
      role="alert"
      aria-labelledby="kartu-krisis-judul"
      className={`bg-white border-2 border-ink rounded-lg p-5 sm:p-6 space-y-4 shadow-[4px_4px_0px_#FF5252] text-left ${className}`}
    >
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#D32F2F] text-white text-sm font-bold border-2 border-ink rounded">
          <Heart className="w-3.5 h-3.5" aria-hidden="true" />
          {t.notAlone}
        </span>
        <h2 id="kartu-krisis-judul" className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.01em] leading-[1.2]">
          {t.title}
        </h2>
        <p className="text-base text-[#4A453E] leading-relaxed">
          {note} {t.callToAction}
        </p>
      </div>

      {shown.length > 0 && (
        <ul className="space-y-2.5">
          {shown.map((contact) => {
            const text = contactText(lang, contact.id);
            return (
              <li key={contact.id} className="border-2 border-ink rounded-md p-3 sm:p-4 bg-paper space-y-2">
                <div>
                  <p className="font-bold text-base text-ink leading-snug">{text?.name ?? contact.name}</p>
                  <p className="text-sm text-[#59544D] font-semibold">{text?.hours ?? contact.availableHours}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contact.phone && (
                    <a
                      href={`tel:${dialable(contact.phone)}`}
                      className="inline-flex items-center gap-2 min-h-[48px] px-4 py-2 bg-[#D32F2F] text-white text-base font-bold border-2 border-ink rounded shadow-hard-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                    >
                      <PhoneCall className="w-4 h-4" aria-hidden="true" />
                      <span>{t.call} <span className="tabular-nums">{contact.phone}</span></span>
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a
                      href={waLink(contact.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 min-h-[48px] px-4 py-2 bg-white text-ink text-base font-bold border-2 border-ink rounded shadow-hard-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>{t.whatsapp}</span>
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <Link
          href="/crisis"
          className="inline-flex items-center justify-center min-h-[52px] px-5 py-2.5 bg-[#D32F2F] text-white font-bold text-base border-2 border-ink rounded shadow-hard focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
        >
          {t.openHelp}
        </Link>
        <button
          type="button"
          onClick={onAcknowledge}
          className="inline-flex items-center justify-center min-h-[52px] px-5 py-2.5 bg-white text-ink font-bold text-base border-2 border-ink rounded shadow-hard-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
        >
          {t.acknowledge}
        </button>
      </div>
    </div>
  );
}

/** Short status line shown near a blocked save button. */
export function CrisisBlockedNote({ id }: { id?: string }) {
  const t = useText(crisisCardText);
  return (
    <p id={id} className="text-base font-semibold text-ink border-l-4 border-coral pl-3 leading-relaxed">
      {t.blockedNote}{' '}
      <Link href="/crisis" className="font-bold underline underline-offset-4 decoration-2 decoration-[#B3261E]">
        {t.openHelp}
      </Link>
    </p>
  );
}
