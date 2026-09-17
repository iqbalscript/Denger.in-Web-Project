'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckSquare, Square, ArrowRight, AlertCircle, Lock } from 'lucide-react';
import { initAnonymousSession } from '@/lib/storage';
import { PageContainer, SplitLayout, SoftCard, Button, Badge } from '@/components/ui';

export default function ConsentPage() {
  const router = useRouter();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);

  const canProceed = agreedTerms && agreedDisclaimer;

  const handleStart = () => {
    if (!canProceed) return;
    initAnonymousSession(true);
    router.push('/onboarding');
  };

  const leftContent = (
    <div className="space-y-6">
      <div className="space-y-3">
        <Badge variant="calm" size="md">
          <Lock className="w-3.5 h-3.5 mr-1 text-calm-700" />
          Persetujuan Layanan & Privasi
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight leading-tight">
          Sebelum Melangkah Lebih Jauh.
        </h1>
        <p className="text-sm sm:text-base text-sand-700 leading-relaxed max-w-xl">
          Kami menjunjung tinggi transparansi dan keamanan emosionalmu. Di bawah ini adalah komitmen
          privasi serta batasan operasional platform Dengar.in.
        </p>
      </div>

      <div className="space-y-5 pt-2">
        {/* Principle 1 */}
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-calm-100 text-calm-800 flex items-center justify-center shrink-0 mt-0.5 shadow-soft-xs">
            <ShieldCheck className="w-4 h-4 text-calm-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-sand-900">1. Privasi Mutlak (Bebas Registrasi)</h3>
            <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
              Kami tidak pernah meminta nama lengkap, alamat email, nomor telepon, atau data
              identitas kependudukan. Sesi Anda diidentifikasi secara anonim menggunakan kode acak
              (UUID) yang tersimpan di peramban Anda.
            </p>
          </div>
        </div>

        {/* Principle 2 */}
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-warm-100 text-warm-700 flex items-center justify-center shrink-0 mt-0.5 shadow-soft-xs">
            <AlertCircle className="w-4 h-4 text-warm-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-sand-900">2. Batasan Layanan Medis & Psikologis</h3>
            <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
              Dengar.in adalah alat pendamping mandiri,{' '}
              <strong className="text-sand-900 font-semibold">
                BUKAN pengganti psikolog, psikiater, diagnosis klinis, atau resep obat
              </strong>
              . Platform ini juga tidak menyediakan nasihat investasi finansial atau hukum.
            </p>
          </div>
        </div>

        {/* Principle 3 */}
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-crisis flex items-center justify-center shrink-0 mt-0.5 shadow-soft-xs">
            <AlertCircle className="w-4 h-4 text-crisis" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-sand-900">3. Protokol Keselamatan Krisis</h3>
            <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
              Jika input teks Anda mengindikasikan krisis akut atau pikiran membahayakan diri, sistem
              secara otomatis menyajikan kontak bantuan darurat resmi (seperti Kemenkes 119 ext 8) tanpa
              perantara bot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <SoftCard variant="white" elevation="medium" className="p-6 sm:p-8 space-y-6 lg:sticky lg:top-24">
      <div className="space-y-1.5 border-b border-sand-200 pb-4">
        <h3 className="font-bold text-base text-sand-900">Konfirmasi Pemahaman</h3>
        <p className="text-xs text-sand-600">Centang kedua pernyataan di bawah untuk memulai sesi anonim.</p>
      </div>

      <div className="space-y-3.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={agreedTerms}
          onClick={() => setAgreedTerms(!agreedTerms)}
          className="flex items-start gap-3 text-left w-full cursor-pointer select-none rounded-xl p-2.5 -ml-2.5 hover:bg-sand-50 transition-colors focus-visible:outline-calm-700"
        >
          {agreedTerms ? (
            <CheckSquare className="w-5 h-5 text-calm-700 shrink-0 mt-0.5" />
          ) : (
            <Square className="w-5 h-5 text-sand-400 shrink-0 mt-0.5" />
          )}
          <span className="text-xs sm:text-sm text-sand-800 leading-snug">
            Saya memahami bahwa identitas saya sepenuhnya anonim dan saya dapat memulihkan sesi menggunakan 12-kata kode pemulihan.
          </span>
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={agreedDisclaimer}
          onClick={() => setAgreedDisclaimer(!agreedDisclaimer)}
          className="flex items-start gap-3 text-left w-full cursor-pointer select-none rounded-xl p-2.5 -ml-2.5 hover:bg-sand-50 transition-colors focus-visible:outline-calm-700"
        >
          {agreedDisclaimer ? (
            <CheckSquare className="w-5 h-5 text-calm-700 shrink-0 mt-0.5" />
          ) : (
            <Square className="w-5 h-5 text-sand-400 shrink-0 mt-0.5" />
          )}
          <span className="text-xs sm:text-sm text-sand-800 leading-snug">
            Saya memahami bahwa Dengar.in adalah pendamping mandiri dan bukan layanan penanganan gawat darurat medis.
          </span>
        </button>
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canProceed}
          onClick={handleStart}
          icon={<ArrowRight className="w-4 h-4" />}
          className="flex-row-reverse"
        >
          Lanjutkan ke Pengenalan Konteks
        </Button>
      </div>

      <p className="text-[11px] text-sand-500 text-center leading-tight">
        Kode pemulihan 12-kata akan dihasilkan secara lokal di akhir proses ini.
      </p>
    </SoftCard>
  );

  return (
    <PageContainer size="default">
      <SplitLayout left={leftContent} right={rightContent} ratio="7-5" />
    </PageContainer>
  );
}
