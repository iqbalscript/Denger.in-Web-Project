'use client';

import React from 'react';
import Link from 'next/link';
import { PhoneCall, MessageCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import type { EmergencyContact } from '@dengarin/types';
import { Button } from '@/components/ui';
import { contactText, useLanguage } from '@/i18n';
import { usePassportText } from './shared';

// "119 ext 8" dials as "119,8" (pause, then the extension), audit L4.
function dialable(phone?: string): string {
  if (!phone) return '';
  const [base = '', ext = ''] = phone.split(/\s*ext\.?\s*/i);
  const extDigits = ext.replace(/[^0-9]/g, '');
  return base.replace(/[^0-9]/g, '') + (extDigits ? `,${extDigits}` : '');
}

export interface ImmediateHelpProps {
  contacts: EmergencyContact[];
  onRestart: () => void;
}

/**
 * IMMEDIATE_HELP_SCREEN. No AI content, no entrance animation, no delay:
 * this renders synchronously with real contacts from the crisis engine.
 * Numbers come from the engine unchanged; only names/descriptions follow the
 * interface language (contactText), falling back to the engine's Indonesian.
 */
export function ImmediateHelp({ contacts, onRestart }: ImmediateHelpProps) {
  const t = usePassportText().immediate;
  const { lang } = useLanguage();
  const describe = (contact: EmergencyContact) => {
    const text = contactText(lang, contact.id);
    return {
      name: text?.name ?? contact.name,
      description: text?.description ?? contact.description,
      hours: text?.hours ?? contact.availableHours,
    };
  };
  const [primary, ...others] = contacts;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#D32F2F] text-white text-sm font-bold border-2 border-[#151515] shadow-[2px_2px_0px_#151515]">
          <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
          {t.badge}
        </span>
        <h1 className="text-[2rem] sm:text-[2.75rem] font-bold text-[#151515] tracking-[-0.03em] leading-[1.08]">
          {t.titleA} <span className="text-[#B3261E]">{t.titleB}</span>
        </h1>
        <p className="text-base sm:text-lg leading-[1.5] max-w-[38rem] text-[#4A453E] font-medium">{t.lede}</p>
      </div>

      {primary && (
        <div className="rounded-[8px] border-2 border-[#151515] bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#151515] space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-white bg-[#D32F2F] px-3 py-1 rounded-[4px] border-2 border-[#151515]">
              {t.primary}
            </span>
            <span className="text-sm font-bold text-[#151515] bg-[#B8F34A] px-2.5 py-1 rounded-[4px] border-2 border-[#151515]">
              {primary.cost === 'gratis' ? t.free : t.standard} / {describe(primary).hours}
            </span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-[2rem] font-bold text-[#151515] tracking-[-0.02em] leading-[1.15]">{describe(primary).name}</h2>
            <p className="text-base sm:text-base text-[#4A453E] mt-2 leading-relaxed">{describe(primary).description}</p>
          </div>
          {primary.phone && (
            <a
              href={`tel:${dialable(primary.phone)}`}
              className="w-full inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-4 px-6 bg-[#D32F2F] hover:bg-[#B3261E] text-white font-bold text-lg sm:text-xl rounded-[6px] border-2 border-[#151515] shadow-[3px_3px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none min-h-[72px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
            >
              <PhoneCall className="w-6 h-6" aria-hidden="true" />
              <span>{t.callNow}</span>
              <span className="tabular-nums">{primary.phone}</span>
            </a>
          )}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#151515] leading-[1.25]">{t.othersTitle}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {others.map((contact) => {
              const text = describe(contact);
              return (
                <li key={contact.id} className="bg-white border-2 border-[#151515] rounded-[8px] p-5 shadow-[2px_2px_0px_#151515] flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-[#59544D] tabular-nums">{text.hours}</span>
                    <h3 className="font-bold text-lg text-[#151515] leading-[1.25]">{text.name}</h3>
                    <p className="text-base text-[#59544D] leading-relaxed">{text.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-[#D8D3C9] pt-3">
                    {contact.phone && (
                      <a
                        href={`tel:${dialable(contact.phone)}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#3357EE] text-white text-base font-bold rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#151515] focus-visible:ring-offset-2"
                        aria-label={t.callAria(text.name, contact.phone)}
                      >
                        <PhoneCall className="w-5 h-5" aria-hidden="true" />
                        <span>{t.call} <span className="tabular-nums">{contact.phone}</span></span>
                      </a>
                    )}
                    {contact.whatsapp && (
                      <a
                        href={`https://wa.me/62${contact.whatsapp.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#B8F34A] text-[#151515] text-base font-bold rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
                        aria-label={t.whatsappAria(text.name)}
                      >
                        <MessageCircle className="w-5 h-5" aria-hidden="true" />
                        <span>{t.whatsapp}</span>
                      </a>
                    )}
                    {contact.website && (
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#FAFAFA] text-[#151515] text-base font-bold rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
                        aria-label={t.siteAria(text.name)}
                      >
                        <ExternalLink className="w-5 h-5" aria-hidden="true" />
                        <span>{t.site}</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#D8D3C9] pt-5">
        <Link href="/crisis" className="inline-flex items-center min-h-[44px] text-base font-bold text-[#151515] underline underline-offset-4 decoration-2 hover:text-[#B3261E] rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE]">
          {t.fullPage}
        </Link>
        <Button variant="outline" size="md" onClick={onRestart}>
          {t.restart}
        </Button>
      </div>
    </div>
  );
}
