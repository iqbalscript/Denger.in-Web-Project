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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#D32F2F] text-white text-sm font-bold border-2 border-ink shadow-hard-sm">
            <Heart className="w-4 h-4 fill-white text-white" aria-hidden="true" />
            <span>Bantuan darurat dan keselamatan</span>
          </div>

          <h1 className="text-[2rem] sm:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.08]">
            Jangan hadapi ini sendirian. <span className="text-[#B3261E]">Hidupmu berharga.</span>
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
            <span className="text-sm font-bold text-white bg-[#D32F2F] px-3 py-1 rounded border-2 border-ink shadow-hard-sm">
              Saluran utama nasional
            </span>
            <span className="text-sm font-bold text-ink bg-lime px-2.5 py-1 rounded border-2 border-ink shadow-hard-sm">
              {primaryContact.cost === 'gratis' ? 'Gratis' : 'Tarif standar'}, {primaryContact.availableHours}
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-[2rem] font-bold text-ink tracking-[-0.02em] leading-[1.15]">
              {primaryContact.name}
            </h2>
            <p className="text-base sm:text-base text-[#4A453E] mt-2 leading-relaxed">
              {primaryContact.description}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <a
              href={toTelHref(primaryContact.phone)}
              className="w-full inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-4 px-6 bg-[#D32F2F] hover:bg-[#B3261E] text-white font-bold text-lg sm:text-xl rounded-md border-2 border-ink shadow-hard transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none min-h-[72px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
            >
              <PhoneCall className="w-7 h-7" aria-hidden="true" />
              <span>Telepon sekarang:</span>
              <span className="tabular-nums">{primaryContact.phone}</span>
            </a>
            {/ext/i.test(primaryContact.phone ?? '') && (
              <p className="text-base text-[#4A453E] font-medium">
                Kalau ekstensi tidak otomatis tersambung, tekan angka <span className="font-bold tabular-nums">8</span> setelah panggilan diangkat.
              </p>
            )}
            {primaryContact.website && (
              <a
                href={primaryContact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[44px] text-base font-bold text-ink underline underline-offset-4 decoration-2 rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt"
              >
                <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
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
                    <span className={`text-sm font-bold px-2 py-0.5 rounded border border-ink ${
                      contact.cost === 'gratis' ? 'bg-lime text-ink' : 'bg-paper text-ink'
                    }`}>
                      {contact.cost === 'gratis' ? 'Gratis' : 'Tarif standar'}
                    </span>
                    <span className="text-sm text-[#59544D] font-semibold tabular-nums">
                      {contact.availableHours}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-ink leading-[1.25] pt-1">
                    {contact.name}
                  </h3>
                  <p className="text-base text-[#59544D] leading-relaxed">
                    {contact.description}
                  </p>
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-[#D8D3C9]">
                  {contact.phone && (
                    <a
                      href={toTelHref(contact.phone)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-cobalt hover:bg-calm-600 text-white text-base font-bold rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                      aria-label={`Telepon ${contact.name}: ${contact.phone}`}
                    >
                      <PhoneCall className="w-5 h-5" aria-hidden="true" />
                      <span>Telepon <span className="tabular-nums">{contact.phone}</span></span>
                    </a>
                  )}

                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/62${contact.whatsapp.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-lime text-ink text-base font-bold rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                      aria-label={`WhatsApp ${contact.name}`}
                    >
                      <MessageCircle className="w-5 h-5" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {contact.website && (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-paper hover:bg-white text-ink text-base font-bold rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                      aria-label={`Buka situs resmi ${contact.name} (tab baru)`}
                    >
                      <ExternalLink className="w-5 h-5" aria-hidden="true" />
                      <span>Situs</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tertiary: Return to Dashboard & Safety Notice */}
        <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#D8D3C9]">
          <div className="flex items-center gap-2 text-base font-medium text-[#59544D]">
            <ShieldAlert className="w-5 h-5 text-[#B3261E] shrink-0" aria-hidden="true" />
            <span>Halaman ini dibuat tanpa AI. Kontak di atas nyata.</span>
          </div>

          <Button
            href="/dashboard"
            variant="outline"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Kembali ke beranda
          </Button>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

