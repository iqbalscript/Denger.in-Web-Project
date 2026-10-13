'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, PhoneCall } from 'lucide-react';
import { Button, PageContainer } from '@/components/ui';
import { useText, type TextBundle } from '@/i18n';

const id = {
  badge: 'Kode 404: halaman tidak ditemukan',
  titleA: 'Jalannya buntu,',
  titleB: 'kamu tidak.',
  body: 'Halaman yang kamu cari mungkin sudah dipindah atau alamatnya salah ketik. Datamu tetap aman di perangkat ini.',
  home: 'Ke halaman depan',
  dashboard: 'Buka beranda',
  helpTitle: 'Sedang butuh bantuan sekarang?',
  helpBody: 'Kalau kamu merasa tidak aman, tidak perlu mencari halaman yang tepat dulu. Hubungi Healing119 (Kemenkes) di 119 ext 8.',
  helpButton: 'Bantuan darurat',
};

const en: typeof id = {
  badge: 'Error 404: page not found',
  titleA: 'The path is a dead end,',
  titleB: 'you are not.',
  body: 'The page you want may have moved, or the address is mistyped. Your data is still safe on this device.',
  home: 'Go to the front page',
  dashboard: 'Open home',
  helpTitle: 'Need help right now?',
  helpBody: 'If you feel unsafe, you do not need to find the right page first. Call Healing119 (Ministry of Health) at 119 ext 8.',
  helpButton: 'Emergency help',
};

const notFoundText: TextBundle<typeof id> = { id, en };

export function NotFoundContent() {
  const t = useText(notFoundText);
  return (
    <PageContainer size="default" className="py-16 sm:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="animate-reveal-up inline-block text-sm font-bold text-[#151515] bg-[#FFD84D] px-2.5 py-1 rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] tabular-nums">
            {t.badge}
          </span>
          <h1 className="animate-reveal-up [animation-delay:80ms] text-[2rem] sm:text-5xl lg:text-[4rem] font-bold text-[#151515] tracking-[-0.03em] leading-[1.05]">
            {t.titleA} <br />
            <span className="text-[#2B51E6]">{t.titleB}</span>
          </h1>
          <p className="animate-reveal-up [animation-delay:160ms] text-lg sm:text-xl text-[#4A453E] max-w-[34rem] font-medium leading-[1.45]">
            {t.body}
          </p>
          <div className="animate-reveal-up [animation-delay:240ms] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Button href="/" variant="primary" size="lg" icon={<ArrowLeft className="w-4 h-4" />}>
              {t.home}
            </Button>
            <Button href="/dashboard" variant="secondary" size="lg" icon={<ArrowRight className="w-4 h-4" />} iconPosition="end">
              {t.dashboard}
            </Button>
          </div>
        </div>

        {/* Crisis panel is never animated or delayed */}
        <aside className="bezel lg:col-span-5 lg:justify-self-end w-full max-w-[388px]">
          <div className="bezel-core p-6 bg-[#FFEBEB] space-y-3">
            <h2 className="text-xl font-bold text-[#151515] leading-[1.25]">{t.helpTitle}</h2>
            <p className="text-base text-[#4A453E] leading-relaxed">{t.helpBody}</p>
            <Button href="/crisis" variant="crisis" size="md" fullWidth icon={<PhoneCall className="w-4 h-4" />}>
              {t.helpButton}
            </Button>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
