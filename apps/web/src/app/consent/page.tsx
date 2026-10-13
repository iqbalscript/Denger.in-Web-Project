'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Square, ArrowRight, Lock } from 'lucide-react';
import { grantConsent } from '@/lib/storage';
import { sanitizeNextPath } from '@/lib/consent';
import { PageContainer, SplitLayout, Button, Badge } from '@/components/ui';

const PRINCIPLES = [
  {
    number: '01',
    tone: 'bg-cobalt text-white',
    title: 'Privasimu kami jaga (tanpa registrasi)',
    body: 'Kami tidak pernah meminta nama lengkap, email, nomor telepon, atau identitas kependudukan. Sesimu hanya dikenali lewat kode acak di peramban perangkatmu.',
  },
  {
    number: '02',
    tone: 'bg-yellow text-ink',
    title: 'Yang bisa & tidak bisa kami lakukan',
    body: (
      <>
        Dengar.in menemanimu berefleksi dan mengambil langkah kecil, tetapi{' '}
        <strong className="text-ink font-bold">BUKAN pengganti psikolog, psikiater, diagnosis klinis, atau resep obat</strong>.
      </>
    ),
  },
  {
    number: '03',
    tone: 'bg-[#D32F2F] text-white',
    title: 'Kamu tidak sendirian saat krisis',
    body: 'Jika tulisanmu menunjukkan kamu sedang dalam krisis atau berpikir untuk menyakiti diri, kami langsung menampilkan kontak darurat resmi (Healing119 Kemenkes, 119 ext 8) tanpa campur tangan AI.',
  },
  {
    number: '04',
    tone: 'bg-lime text-ink',
    title: 'Ke mana tulisanmu pergi',
    body: (
      <ul className="space-y-2 list-disc pl-5 marker:text-ink">
        <li>
          <strong className="text-ink font-bold">Jurnal, check-in, dan misi</strong> tersimpan di perangkatmu dan tidak dikirim ke AI.
        </li>
        <li>
          <strong className="text-ink font-bold">Pesan di Ngobrol dan Ruang Ngobrol</strong> dikirim ke penyedia AI pihak ketiga
          supaya bisa dibalas: DeepSeek, Google Gemini (cadangan), dan OpenRouter (pemeriksa jawaban). Server mereka bisa
          berada di luar Indonesia, dan layanan gratis tertentu bisa memakai data untuk melatih model. Jadi, jangan tulis
          nama, alamat, atau hal yang bisa mengenalimu.
        </li>
        <li>
          <strong className="text-ink font-bold">Mode suara</strong> memakai fitur pengenal suara peramban (di Chrome
          diproses Google), dan suara balasannya dibuat oleh Google Gemini.
        </li>
        <li>
          <strong className="text-ink font-bold">Care Passport</strong> hanya berjalan kalau kamu menyetujuinya lagi di
          halamannya sendiri. Ringkasannya diproses model milik tim Dengar.in di server AMD, bukan penyedia AI di atas.
        </li>
        <li>
          <strong className="text-ink font-bold">Ruang Cerita</strong> menyimpan cerita yang kamu bagikan di server kami
          supaya bisa dibaca orang lain secara anonim.
        </li>
        <li>
          <strong className="text-ink font-bold">Cadangan cloud</strong> hanya dibuat kalau kamu memintanya, dan sudah
          dienkripsi di perangkatmu sebelum dikirim.
        </li>
        <li>
          {/* True while the chat AI-response cache stays off by default (lib/api/aiCache.ts, AI_RESPONSE_CACHE). */}
          <strong className="text-ink font-bold">Obrolanmu dan balasan AI</strong> tidak disimpan di server Dengar.in.
          Penyimpanan di sisi penyedia AI mengikuti aturan mereka masing-masing.
        </li>
      </ul>
    ),
  },
];

export default function ConsentPage() {
  const router = useRouter();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);

  const canProceed = agreedTerms && agreedDisclaimer;

  const handleStart = () => {
    if (!canProceed) return;
    grantConsent();
    // Return to the page that asked for consent (internal paths only).
    const next = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next')
      : null;
    router.push(sanitizeNextPath(next));
  };

  const leftContent = (
    <div className="space-y-6">
      <div className="space-y-3 animate-reveal-up">
        <Badge variant="calm" size="md">
          <Lock className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
          Persetujuan layanan dan privasi
        </Badge>
        <h1 className="text-[2rem] sm:text-5xl lg:text-[3.5rem] font-bold text-ink tracking-[-0.03em] leading-[1.05]">
          Sebelum kita mulai.
        </h1>
        <p className="text-lg sm:text-xl text-[#4A453E] leading-[1.45] max-w-[34rem] font-medium">
          Kami ingin kamu merasa aman sejak langkah pertama. Dengar.in tidak meminta identitasmu, dan kami jujur soal batasnya: kami pendamping, bukan pengganti penanganan medis darurat.
        </p>
      </div>

      <ol className="space-y-6 pt-2">
        {PRINCIPLES.map((item, index) => (
          <li
            key={item.number}
            style={{ animationDelay: `${160 + index * 80}ms` }}
            className="animate-reveal-up flex items-start gap-4 border-t-2 border-ink pt-5"
          >
            <span
              className={`w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 border-2 border-ink font-bold text-base tabular-nums ${item.tone}`}
              aria-hidden="true"
            >
              {item.number}
            </span>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25]">{item.title}</h2>
              <div className="text-base sm:text-base text-[#4A453E] leading-relaxed">{item.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );

  const rightContent = (
    <div className="animate-reveal-up [animation-delay:120ms] bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-6 shadow-hard-lg lg:sticky lg:top-24">
      <div className="space-y-1.5 border-b border-[#D8D3C9] pb-4">
        <h2 id="judul-persetujuan" className="font-bold text-xl text-ink tracking-[-0.01em] leading-[1.25]">Dua hal untuk dicentang</h2>
        <p className="text-base text-[#59544D] leading-relaxed">Ketuk kotaknya untuk mencentang. Setelah keduanya tercentang, tombol Lanjutkan akan aktif.</p>
      </div>

      <div className="space-y-3" role="group" aria-labelledby="judul-persetujuan">
        <button
          type="button"
          role="checkbox"
          aria-checked={agreedTerms}
          onClick={() => setAgreedTerms(!agreedTerms)}
          className={`flex items-start gap-3.5 text-left w-full cursor-pointer select-none rounded-md p-4 border-2 border-ink transition-[transform,box-shadow,background-color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2 ${
            agreedTerms
              ? 'bg-[#E6ECFF] shadow-hard-sm'
              : 'bg-paper hover:bg-[#F7F0E6] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-sm active:translate-x-0 active:translate-y-0 active:shadow-none'
          }`}
        >
          {agreedTerms ? (
            <CheckSquare className="w-7 h-7 text-cobalt shrink-0" aria-hidden="true" />
          ) : (
            <Square className="w-7 h-7 text-[#59544D] shrink-0" aria-hidden="true" />
          )}
          <span className="text-base text-ink leading-snug font-medium">
            Saya paham identitas saya anonim, pesan obrolan saya diproses penyedia AI pihak ketiga seperti dijelaskan di poin 04, dan saya bisa memulihkan sesi saya dengan kunci pemulihan 12 bagian.
          </span>
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={agreedDisclaimer}
          onClick={() => setAgreedDisclaimer(!agreedDisclaimer)}
          className={`flex items-start gap-3.5 text-left w-full cursor-pointer select-none rounded-md p-4 border-2 border-ink transition-[transform,box-shadow,background-color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2 ${
            agreedDisclaimer
              ? 'bg-[#E6ECFF] shadow-hard-sm'
              : 'bg-paper hover:bg-[#F7F0E6] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-sm active:translate-x-0 active:translate-y-0 active:shadow-none'
          }`}
        >
          {agreedDisclaimer ? (
            <CheckSquare className="w-7 h-7 text-cobalt shrink-0" aria-hidden="true" />
          ) : (
            <Square className="w-7 h-7 text-[#59544D] shrink-0" aria-hidden="true" />
          )}
          <span className="text-base text-ink leading-snug font-medium">
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
          iconPosition="end"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Saya setuju, lanjutkan
        </Button>
        {!canProceed && (
          <p className="text-sm text-[#59544D] text-center leading-relaxed pt-2" aria-live="polite">
            Centang dua kotak di atas untuk mengaktifkan tombol ini.
          </p>
        )}
      </div>

      <p className="text-sm text-[#59544D] text-center leading-relaxed">
        Kunci pemulihan 12 bagian akan dibuat secara lokal di akhir proses ini.
      </p>
    </div>
  );

  return (
    <PageContainer size="default" className="sm:py-16 lg:py-20">
      <SplitLayout left={leftContent} right={rightContent} ratio="7-5" />
    </PageContainer>
  );
}

