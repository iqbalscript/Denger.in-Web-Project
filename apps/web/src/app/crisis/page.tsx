'use client';

import React, { useEffect, useState } from 'react';
import { PhoneCall, MessageCircle, ShieldAlert, ArrowLeft, Heart, ExternalLink } from 'lucide-react';
import { getAnonymousSession } from '@/lib/storage';
import { EMERGENCY_CONTACTS, toTelHref } from '@dengarin/config';
import type { AgeBracket } from '@dengarin/types';
import { PageContainer, ContentColumn, Button } from '@/components/ui';

export default function CrisisPage() {
  const [ageBracket, setAgeBracket] = useState<AgeBracket>('18-24');

  useEffect(() => {
    const session = getAnonymousSession();
    if (session?.ageBracket) {
      setAgeBracket(session.ageBracket);
    }
  }, []);

  const isTeen = ageBracket === '15-17';
  const primaryContact = EMERGENCY_CONTACTS.find((c) => c.category === 'national_emergency') || EMERGENCY_CONTACTS[0];
  const secondaryContacts = EMERGENCY_CONTACTS.filter(
    (c) => c.id !== primaryContact.id && c.targetAgeBrackets.includes(ageBracket)
  );

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        {/* Top: Clear Crisis Heading & Calm Explanation */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-coral text-white text-xs font-bold uppercase tracking-wider border-2 border-ink shadow-hard-sm">
            <Heart className="w-3.5 h-3.5 fill-white text-white" aria-hidden="true" />
            <span>RUANG TANGGAP DARURAT &amp; KESELAMATAN</span>
          </div>

          <h1 className="text-[2.25rem] sm:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05]">
            Jangan hadapi ini sendirian. <span className="text-coral">Hidupmu berharga.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-xl font-medium">
            {isTeen
              ? 'Beban yang kamu rasakan saat ini sangat berat, tapi kamu tidak harus memikulnya sendirian. Ada konselor terlatih yang siap mendengarkan dan melindungimu tanpa menghakimi.'
              : 'Kami mendengar betapa beratnya situasi yang sedang kamu hadapi. Proses otomatisasi AI dihentikan sementara agar kamu dapat langsung terhubung dengan bantuan manusia yang siap mendampingi.'}
          </p>
        </div>

        {/* Middle: PRIMARY IMMEDIATE-HELP ACTION (VISUALLY DOMINANT) */}
        <div className="rounded-lg border-2 border-ink bg-white p-6 sm:p-8 shadow-hard-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-coral px-3 py-1 rounded border-2 border-ink shadow-hard-sm">
              SALURAN UTAMA NASIONAL (PRIORITAS)
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-ink bg-lime px-2.5 py-1 rounded border-2 border-ink shadow-hard-sm">
              {primaryContact.cost === 'gratis' ? 'GRATIS' : 'TARIF STANDAR'} • {primaryContact.availableHours}
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-[2rem] font-bold text-ink tracking-[-0.02em] leading-[1.15]">
              {primaryContact.name}
            </h2>
            <p className="text-[15px] sm:text-base text-[#4A453E] mt-2 leading-relaxed">
              {primaryContact.description}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <a
              href={toTelHref(primaryContact.phone)}
              className="w-full inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-4 px-6 bg-coral hover:bg-crisis-dark text-white font-bold text-base sm:text-lg rounded-md border-2 border-ink shadow-hard transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-wider min-h-[64px]"
            >
              <PhoneCall className="w-6 h-6" aria-hidden="true" />
              <span>Telepon sekarang:</span>
              <span className="tabular-nums">{primaryContact.phone}</span>
            </a>
            {/ext/i.test(primaryContact.phone ?? '') && (
              <p className="text-sm text-[#4A453E] font-medium">
                Kalau ekstensi tidak otomatis tersambung, tekan <span className="font-bold tabular-nums">8</span> setelah panggilan diangkat.
              </p>
            )}
            {primaryContact.website && (
              <a
                href={primaryContact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-ink underline underline-offset-2"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Lebih nyaman chat? Buka {primaryContact.website.replace(/^https?:\/\//, '')} untuk WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Secondary: Other Support Options */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.01em] leading-[1.25]">
            Saluran bantuan pendukung terverifikasi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {secondaryContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white border-2 border-ink rounded-lg p-5 space-y-3 flex flex-col justify-between shadow-hard-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-ink ${
                      contact.cost === 'gratis' ? 'bg-lime text-ink' : 'bg-paper text-ink'
                    }`}>
                      {contact.cost === 'gratis' ? 'Gratis' : 'Tarif Standar'}
                    </span>
                    <span className="text-xs text-[#59544D] font-semibold tabular-nums">
                      {contact.availableHours}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-ink leading-[1.25] pt-1">
                    {contact.name}
                  </h3>
                  <p className="text-[15px] text-[#59544D] leading-relaxed">
                    {contact.description}
                  </p>
                </div>

                <div className="pt-3 flex items-center gap-2 border-t border-[#D8D3C9]">
                  {contact.phone && (
                    <a
                      href={toTelHref(contact.phone)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-cobalt hover:bg-calm-600 text-white text-sm font-bold rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px]"
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
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-lime text-ink text-sm font-bold uppercase rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px]"
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
                      className="p-2 bg-paper hover:bg-white text-ink rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] min-w-[48px] flex items-center justify-center"
                      title="Kunjungi Website"
                      aria-label={`Buka website resmi ${contact.name}`}
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tertiary: Return to Dashboard & Safety Notice */}
        <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#D8D3C9]">
          <div className="flex items-center gap-2 text-sm font-medium text-[#59544D]">
            <ShieldAlert className="w-4 h-4 text-coral shrink-0" aria-hidden="true" />
            <span>Filter keselamatan aktif tanpa keterlibatan AI.</span>
          </div>

          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Kembali ke dashboard
          </Button>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

