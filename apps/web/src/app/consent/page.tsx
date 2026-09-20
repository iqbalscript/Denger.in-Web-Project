'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Square, ArrowRight, Lock } from 'lucide-react';
import { initAnonymousSession } from '@/lib/storage';
import { PageContainer, SplitLayout, Button, Badge } from '@/components/ui';

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
          <Lock className="w-3.5 h-3.5 mr-1" />
          Persetujuan Layanan &amp; Privasi
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none">
          SEBELUM KITA MULAI.
        </h1>
        <p className="text-sm sm:text-base text-ink/80 leading-relaxed max-w-xl font-medium">
          Dengar.in dibangun di atas privasi mutlak dan transparansi penuh. Kami tidak mengumpulkan data identitasmu, dan kami bukan pengganti penanganan medis darurat.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {/* Principle 1 */}
        <div className="p-4 bg-white border-2 border-ink rounded-md shadow-hard-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-md bg-cobalt text-white flex items-center justify-center shrink-0 border-2 border-ink shadow-hard-sm font-black text-base">
            01
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-ink uppercase tracking-wider">
              1. Privasi Mutlak (Bebas Registrasi)
            </h3>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
              Kami tidak pernah meminta nama lengkap, email, nomor telepon, atau identitas kependudukan. Sesimu diidentifikasi menggunakan kode acak lokal di perambanmu.
            </p>
          </div>
        </div>

        {/* Principle 2 */}
        <div className="p-4 bg-white border-2 border-ink rounded-md shadow-hard-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-md bg-yellow text-ink flex items-center justify-center shrink-0 border-2 border-ink shadow-hard-sm font-black text-base">
            02
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-ink uppercase tracking-wider">
              2. Batasan Layanan Medis &amp; Klinis
            </h3>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
              Dengar.in adalah alat pendamping mandiri, <strong className="text-ink font-bold">BUKAN pengganti psikolog, psikiater, diagnosis klinis, atau resep obat</strong>.
            </p>
          </div>
        </div>

        {/* Principle 3 */}
        <div className="p-4 bg-white border-2 border-ink rounded-md shadow-hard-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-md bg-coral text-white flex items-center justify-center shrink-0 border-2 border-ink shadow-hard-sm font-black text-base">
            03
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-ink uppercase tracking-wider">
              3. Protokol Keselamatan Krisis
            </h3>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
              Jika input teksmu mengindikasikan krisis akut atau pikiran membahayakan diri, sistem langsung menyajikan kontak darurat resmi (Kemenkes Sejiwa 119 ext 8) tanpa campur tangan AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-6 shadow-hard lg:sticky lg:top-24">
      <div className="space-y-1.5 border-b-2 border-ink pb-4">
        <h3 className="font-black text-base text-ink uppercase tracking-wider">Konfirmasi Pemahaman</h3>
        <p className="text-xs text-ink/70 font-medium">Centang kedua pernyataan di bawah untuk memulai sesi anonim.</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={agreedTerms}
          onClick={() => setAgreedTerms(!agreedTerms)}
          className={`flex items-start gap-3.5 text-left w-full cursor-pointer select-none rounded-md p-3 border-2 border-ink transition-all ${
            agreedTerms ? 'bg-cobalt/10 shadow-hard-sm font-bold' : 'bg-paper hover:bg-paper-dark'
          }`}
        >
          {agreedTerms ? (
            <CheckSquare className="w-5 h-5 text-cobalt shrink-0 mt-0.5" />
          ) : (
            <Square className="w-5 h-5 text-ink/40 shrink-0 mt-0.5" />
          )}
          <span className="text-xs sm:text-sm text-ink leading-snug font-medium">
            Saya memahami bahwa identitas saya sepenuhnya anonim dan saya dapat memulihkan sesi menggunakan 12-kata kunci pemulihan.
          </span>
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={agreedDisclaimer}
          onClick={() => setAgreedDisclaimer(!agreedDisclaimer)}
          className={`flex items-start gap-3.5 text-left w-full cursor-pointer select-none rounded-md p-3 border-2 border-ink transition-all ${
            agreedDisclaimer ? 'bg-cobalt/10 shadow-hard-sm font-bold' : 'bg-paper hover:bg-paper-dark'
          }`}
        >
          {agreedDisclaimer ? (
            <CheckSquare className="w-5 h-5 text-cobalt shrink-0 mt-0.5" />
          ) : (
            <Square className="w-5 h-5 text-ink/40 shrink-0 mt-0.5" />
          )}
          <span className="text-xs sm:text-sm text-ink leading-snug font-medium">
            Saya memahami bahwa Dengar.in adalah pendamping mandiri dan bukan layanan penanganan gawat darurat medis atau psikologis.
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
          SAYA SETUJU, LANJUTKAN →
        </Button>
      </div>

      <p className="text-[11px] text-ink/60 text-center leading-tight font-medium">
        Kode pemulihan 12-kata akan dihasilkan secara lokal di akhir proses ini.
      </p>
    </div>
  );

  return (
    <PageContainer size="default">
      <SplitLayout left={leftContent} right={rightContent} ratio="7-5" />
    </PageContainer>
  );
}

