'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneCall, MessageCircle, ShieldAlert, ArrowLeft, Heart, ExternalLink } from 'lucide-react';
import { getAnonymousSession } from '@/lib/storage';
import { EMERGENCY_CONTACTS } from '@dengarin/config';
import type { AgeBracket } from '@dengarin/types';
import { PageContainer, ContentColumn, SoftCard, Button, Badge } from '@/components/ui';

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-crisis-dark text-xs font-bold border border-red-200">
            <Heart className="w-3.5 h-3.5 fill-crisis text-crisis" />
            <span>Ruang Tanggap Darurat & Keselamatan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-red-950 tracking-tight leading-tight">
            Kamu Tidak Sendirian. Hidupmu Berharga.
          </h1>

          <p className="text-sm sm:text-base text-red-900/90 leading-relaxed max-w-xl">
            {isTeen
              ? 'Beban yang kamu rasakan saat ini sangat berat, tapi kamu tidak harus memikulnya sendirian. Ada konselor terlatih yang siap mendengarkan dan melindungimu tanpa menghakimi.'
              : 'Kami mendengar betapa beratnya situasi yang sedang kamu hadapi. Proses otomatisasi AI dihentikan sementara agar kamu dapat langsung terhubung dengan bantuan manusia yang siap mendampingi.'}
          </p>
        </div>

        {/* Middle: PRIMARY IMMEDIATE-HELP ACTION (VISUALLY DOMINANT) */}
        <div className="rounded-3xl border-2 border-crisis bg-white p-6 sm:p-8 shadow-soft-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-crisis px-3 py-1 rounded-full">
              Saluran Utama Nasional (Prioritas)
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Bebas Pulsa • 24 Jam
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-sand-900 tracking-tight">
              {primaryContact.name}
            </h2>
            <p className="text-xs sm:text-sm text-sand-700 mt-1 leading-relaxed">
              {primaryContact.description}
            </p>
          </div>

          <div className="pt-2">
            <a
              href={`tel:${primaryContact.phone?.replace(/[^0-9]/g, '')}`}
              className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 bg-crisis hover:bg-crisis-dark text-white font-bold text-base rounded-2xl shadow-soft-sm transition-all focus-visible:outline-crisis active:scale-[0.98]"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Telepon Sekarang: {primaryContact.phone}</span>
            </a>
          </div>
        </div>

        {/* Secondary: Other Support Options */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sand-900">
            Saluran Bantuan Pendukung Terverifikasi:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {secondaryContacts.map((contact) => (
              <SoftCard
                key={contact.id}
                variant="white"
                elevation="low"
                className="p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={contact.cost === 'gratis' ? 'calm' : 'sand'} size="sm">
                      {contact.cost === 'gratis' ? 'Bebas Pulsa' : 'Tarif Standar'}
                    </Badge>
                    <span className="text-[11px] text-sand-500 font-medium">
                      {contact.availableHours}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm sm:text-base text-sand-900 leading-snug">
                    {contact.name}
                  </h4>
                  <p className="text-xs text-sand-600 leading-relaxed">
                    {contact.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-calm-700 hover:bg-calm-800 text-white text-xs font-semibold rounded-xl transition-colors min-h-[40px]"
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
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors min-h-[40px]"
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
                      className="p-2 bg-sand-100 hover:bg-sand-200 text-sand-800 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Kunjungi Website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </SoftCard>
            ))}
          </div>
        </div>

        {/* Tertiary: Return to Dashboard & Safety Notice */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-sand-200/80">
          <div className="flex items-center gap-2 text-xs text-sand-600">
            <ShieldAlert className="w-4 h-4 text-calm-700 shrink-0" />
            <span>Filter keselamatan aktif tanpa keterlibatan AI.</span>
          </div>

          <Link href="/dashboard">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
