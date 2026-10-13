'use client';

import React from 'react';
import { commonText, useText } from '@/i18n';

/** Tautan lompat ke konten utama (komponen klien agar teksnya ikut bahasa). */
export function SkipLink() {
  const t = useText(commonText);
  return (
    <a
      href="#konten-utama"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-5 focus:py-3 focus:bg-[#B8F34A] focus:text-[#151515] focus:font-bold focus:text-base focus:border-2 focus:border-[#151515] focus:rounded-[4px] focus:shadow-[3px_3px_0px_#151515]"
    >
      {t.skipToContent}
    </a>
  );
}
