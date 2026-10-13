import React from 'react';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, PhoneCall } from 'lucide-react';
import { Button, PageContainer } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan | Dengar.in',
};

export default function NotFound() {
  return (
    <PageContainer size="default" className="py-16 sm:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="animate-reveal-up inline-block text-xs font-bold uppercase tracking-[0.05em] text-[#151515] bg-[#FFD84D] px-2.5 py-1 rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] tabular-nums">
            404 • Halaman tidak ditemukan
          </span>
          <h1 className="animate-reveal-up [animation-delay:80ms] text-[2.5rem] sm:text-5xl lg:text-[4rem] font-bold text-[#151515] tracking-[-0.03em] leading-[1.02] uppercase">
            Jalannya buntu, <br />
            <span className="text-[#4169FF]">kamu tidak.</span>
          </h1>
          <p className="animate-reveal-up [animation-delay:160ms] text-lg sm:text-xl text-[#4A453E] max-w-[34rem] font-medium leading-[1.45]">
            Halaman yang kamu cari mungkin sudah dipindah atau alamatnya kurang tepat. Datamu tetap aman di perangkat ini.
          </p>
          <div className="animate-reveal-up [animation-delay:240ms] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Button href="/" variant="primary" size="lg" icon={<ArrowLeft className="w-4 h-4" />} className="uppercase tracking-wide">
              Kembali ke beranda
            </Button>
            <Button href="/dashboard" variant="secondary" size="lg" icon={<ArrowRight className="w-4 h-4" />} iconPosition="end" className="uppercase tracking-wide">
              Buka hari ini
            </Button>
          </div>
        </div>

        {/* Crisis panel is never animated or delayed */}
        <aside className="lg:col-span-5 lg:justify-self-end w-full max-w-[380px] p-6 rounded-[8px] bg-[#FFEBEB] border-2 border-[#151515] shadow-[4px_4px_0px_#151515] space-y-3">
          <h2 className="text-xl font-bold text-[#151515] leading-[1.25]">Sedang butuh bantuan sekarang?</h2>
          <p className="text-[15px] text-[#4A453E] leading-relaxed">
            Kalau kamu merasa tidak aman, kamu tidak perlu mencari halaman yang tepat dulu. Hubungi Healing119 (Kemenkes) di 119 ext 8.
          </p>
          <Button href="/crisis" variant="crisis" size="md" fullWidth icon={<PhoneCall className="w-4 h-4" />}>
            Bantuan Darurat
          </Button>
        </aside>
      </div>
    </PageContainer>
  );
}
