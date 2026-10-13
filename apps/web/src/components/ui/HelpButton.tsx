'use client';

import React from 'react';
import { useText } from '@/i18n/store';
import { uiText } from '@/i18n/pages/ui';
import Link from 'next/link';
import { PhoneCall } from 'lucide-react';

export interface HelpButtonProps {
  variant?: 'compact' | 'full' | 'outline';
  className?: string;
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

export function HelpButton({
  variant = 'compact',
  className = '',
}: HelpButtonProps) {
  const t = useText(uiText).helpButton;
  if (variant === 'compact') {
    return (
      <Link
        href="/crisis"
        className={`inline-flex items-center gap-2 px-3.5 min-h-[44px] bg-[#D32F2F] text-white font-bold text-sm rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] transition-all duration-120 hover:bg-[#B3261E] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] ${focusRing} ${className}`}
      >
        <PhoneCall className="w-[18px] h-[18px] text-white shrink-0" aria-hidden="true" />
        <span>{t.compact}</span>
      </Link>
    );
  }

  if (variant === 'outline') {
    return (
      <Link
        href="/crisis"
        className={`inline-flex items-center justify-center gap-2 px-4 min-h-[48px] bg-white border-2 border-[#D32F2F] text-[#B3261E] hover:bg-[#D32F2F] hover:text-white font-bold text-base rounded-[4px] shadow-[2px_2px_0px_#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] ${focusRing} ${className}`}
      >
        <PhoneCall className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
        <span>{t.outline}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/crisis"
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[52px] bg-[#D32F2F] text-white font-bold text-base sm:text-lg rounded-[4px] border-2 border-[#151515] shadow-[3px_3px_0px_#151515] transition-all duration-120 hover:bg-[#B3261E] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515] ${focusRing} ${className}`}
    >
      <PhoneCall className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
      <span>{t.full}</span>
    </Link>
  );
}
