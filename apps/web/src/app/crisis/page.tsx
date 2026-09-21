'use client';

import React, { useEffect, useState } from 'react';
import { PhoneCall, MessageCircle, ShieldAlert, ArrowLeft, Heart, ExternalLink } from 'lucide-react';
import { getAnonymousSession } from '@/lib/storage';
import { EMERGENCY_CONTACTS } from '@dengarin/config';
import type { AgeBracket } from '@dengarin/types';
import { PageContainer, ContentColumn, Button } from '@/components/ui';

function getDialableTel(phone?: string): string {
  if (!phone) return '';
  const baseNumber = phone.split(/\s*ext/i)[0] || '';
  return baseNumber.replace(/[^0-9]/g, '');
}

export default function CrisisPage() {
  const [ageBracket, setAgeBracket] = useState<AgeBracket>('18-24');

  useEffect(() => {
    const session = getAnonymousSession();
    if (session?.ageBracket) {
      setAgeBracket(session.ageBracket);
    }
  }, []);

  const isTeen = ageBracket === '15-17';
  const primaryContact = EMERGENCY_CONTACTS.find((c) => c.id === 'kemenkes-sejiwa' || c.id === 'kemenkes_119') || EMERGENCY_CONTACTS[0];
  const secondaryContacts = EMERGENCY_CONTACTS.filter(
    (c) => c.id !== primaryContact.id && c.targetAgeBrackets.includes(ageBracket)
  );

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        {/* Top: Clear Crisis Heading & Calm Explanation */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-coral text-white text-xs font-black uppercase tracking-wider border-2 border-ink shadow-hard-sm">
            <Heart className="w-3.5 h-3.5 fill-white text-white" />
            <span>RUANG TANGGAP DARURAT &amp; KESELAMATAN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none">
            JANGAN HADAPI INI SENDIRIAN. HIDUPMU BERHARGA.
          </h1>

          <p className="text-sm sm:text-base text-ink/90 leading-relaxed max-w-xl font-medium">
            {isTeen
              ? 'Beban yang kamu rasakan saat ini sangat berat, tapi kamu tidak harus memikulnya sendirian. Ada konselor terlatih yang siap mendengarkan dan melindungimu tanpa menghakimi.'
              : 'Kami mendengar betapa beratnya situasi yang sedang kamu hadapi. Proses otomatisasi AI dihentikan sementara agar kamu dapat langsung terhubung dengan bantuan manusia yang siap mendampingi.'}
          </p>
        </div>

        {/* Middle: PRIMARY IMMEDIATE-HELP ACTION (VISUALLY DOMINANT) */}
        <div className="rounded-lg border-2 border-ink bg-white p-6 sm:p-8 shadow-hard-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-white bg-coral px-3 py-1 rounded border-2 border-ink shadow-hard-sm">
              SALURAN UTAMA NASIONAL (PRIORITAS)
            </span>
            <span className="text-xs font-black uppercase text-ink bg-lime px-2.5 py-1 rounded border-2 border-ink shadow-hard-sm">
              BEBAS PULSA • 24 JAM
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight uppercase">
              {primaryContact.name}
            </h2>
            <p className="text-xs sm:text-sm text-ink/80 mt-1 leading-relaxed font-medium">
              {primaryContact.description}
            </p>
          </div>

          <div className="pt-2">
            <a
              href={`tel:${getDialableTel(primaryContact.phone)}`}
              className="w-full inline-flex items-center justify-center gap-3 py-4 px-6 bg-coral hover:bg-coral-dark text-white font-black text-base sm:text-lg rounded-md border-2 border-ink shadow-hard transition-all focus-visible:outline-ink active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-wider min-h-[56px]"
            >
              <PhoneCall className="w-6 h-6" />
              <span>TELEPON SEKARANG: {primaryContact.phone}</span>
            </a>
          </div>
        </div>

        {/* Secondary: Other Support Options */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-ink">
            SALURAN BANTUAN PENDUKUNG TERVERIFIKASI:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {secondaryContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white border-2 border-ink rounded-lg p-5 space-y-3 flex flex-col justify-between shadow-hard-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-ink ${
                      contact.cost === 'gratis' ? 'bg-lime text-ink' : 'bg-paper text-ink'
                    }`}>
                      {contact.cost === 'gratis' ? 'Bebas Pulsa' : 'Tarif Standar'}
                    </span>
                    <span className="text-[11px] text-ink/60 font-bold uppercase tracking-wide">
                      {contact.availableHours}
                    </span>
                  </div>

                  <h4 className="font-black text-sm sm:text-base text-ink uppercase tracking-wide leading-snug">
                    {contact.name}
                  </h4>
                  <p className="text-xs text-ink/80 leading-relaxed font-medium">
                    {contact.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2 border-t-2 border-ink">
                  {contact.phone && (
                    <a
                      href={`tel:${getDialableTel(contact.phone)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-cobalt hover:bg-cobalt-dark text-white text-xs font-black uppercase rounded border-2 border-ink shadow-hard-sm transition-all min-h-[44px]"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{contact.phone}</span>
                    </a>
                  )}

                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/62${contact.whatsapp.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-lime text-ink text-xs font-black uppercase rounded border-2 border-ink shadow-hard-sm transition-all min-h-[44px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WA</span>
                    </a>
                  )}

                  {contact.website && (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-paper hover:bg-paper-dark text-ink rounded border-2 border-ink shadow-hard-sm transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Kunjungi Website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tertiary: Return to Dashboard & Safety Notice */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-ink">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <ShieldAlert className="w-4 h-4 text-coral shrink-0" />
            <span>Filter keselamatan aktif tanpa keterlibatan AI.</span>
          </div>

          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            KEMBALI KE DASHBOARD
          </Button>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

