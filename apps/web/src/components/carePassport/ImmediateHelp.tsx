import React from 'react';
import Link from 'next/link';
import { PhoneCall, MessageCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import type { EmergencyContact } from '@dengarin/types';
import { Button } from '@/components/ui';

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
 */
export function ImmediateHelp({ contacts, onRestart }: ImmediateHelpProps) {
  const [primary, ...others] = contacts;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#FF5252] text-white text-xs font-bold uppercase tracking-wider border-2 border-[#151515] shadow-[2px_2px_0px_#151515]">
          <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
          Bantuan segera
        </span>
        <h1 className="text-[2rem] sm:text-[2.75rem] font-bold text-[#151515] tracking-[-0.03em] leading-[1.05]">
          Kita berhenti di sini dulu. <span className="text-[#FF5252]">Kamu penting.</span>
        </h1>
        <p className="text-base sm:text-lg leading-[1.5] max-w-[38rem] text-[#4A453E] font-medium">
          Dari yang kamu tulis, sepertinya kamu butuh orang yang bisa diajak bicara sekarang, bukan catatan. Proses AI dihentikan. Kontak di bawah ini nyata dan siap menerima teleponmu.
        </p>
      </div>

      {primary && (
        <div className="rounded-[8px] border-2 border-[#151515] bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#151515] space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#FF5252] px-3 py-1 rounded-[4px] border-2 border-[#151515]">
              Saluran utama
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#151515] bg-[#B8F34A] px-2.5 py-1 rounded-[4px] border-2 border-[#151515]">
              {primary.cost === 'gratis' ? 'Gratis' : 'Tarif standar'} / {primary.availableHours}
            </span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-[2rem] font-bold text-[#151515] tracking-[-0.02em] leading-[1.15]">{primary.name}</h2>
            <p className="text-[15px] sm:text-base text-[#4A453E] mt-2 leading-relaxed">{primary.description}</p>
          </div>
          {primary.phone && (
            <a
              href={`tel:${dialable(primary.phone)}`}
              className="w-full inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-4 px-6 bg-[#FF5252] hover:bg-[#D93838] text-white font-bold text-base sm:text-lg rounded-[6px] border-2 border-[#151515] shadow-[3px_3px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-wider min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF]"
            >
              <PhoneCall className="w-6 h-6" aria-hidden="true" />
              <span>Telepon sekarang:</span>
              <span className="tabular-nums">{primary.phone}</span>
            </a>
          )}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#151515] leading-[1.25]">Saluran lain yang bisa dihubungi</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {others.map((contact) => (
              <li key={contact.id} className="bg-white border-2 border-[#151515] rounded-[8px] p-5 shadow-[2px_2px_0px_#151515] flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#59544D] tabular-nums">{contact.availableHours}</span>
                  <h3 className="font-bold text-lg text-[#151515] leading-[1.25]">{contact.name}</h3>
                  <p className="text-[15px] text-[#59544D] leading-relaxed">{contact.description}</p>
                </div>
                <div className="flex items-center gap-2 border-t border-[#D8D3C9] pt-3">
                  {contact.phone && (
                    <a
                      href={`tel:${dialable(contact.phone)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#4169FF] text-white text-sm font-bold rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515]"
                      aria-label={`Telepon ${contact.name}: ${contact.phone}`}
                    >
                      <PhoneCall className="w-4 h-4" aria-hidden="true" />
                      <span className="tabular-nums">{contact.phone}</span>
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/62${contact.whatsapp.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-[#B8F34A] text-[#151515] text-sm font-bold rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px]"
                      aria-label={`WhatsApp ${contact.name}`}
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>WA</span>
                    </a>
                  )}
                  {contact.website && (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 bg-[#FFF8EF] text-[#151515] rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] min-w-[48px]"
                      aria-label={`Buka situs ${contact.name}`}
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#D8D3C9] pt-5">
        <Link href="/crisis" className="text-[15px] font-bold text-[#151515] underline underline-offset-4 decoration-2 hover:text-[#FF5252]">
          Buka halaman bantuan darurat lengkap
        </Link>
        <Button variant="outline" size="sm" onClick={onRestart}>
          Mulai catatan dari awal
        </Button>
      </div>
    </div>
  );
}
