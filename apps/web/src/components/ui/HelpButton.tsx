import React from 'react';
import Link from 'next/link';
import { PhoneCall } from 'lucide-react';

export interface HelpButtonProps {
  variant?: 'compact' | 'full' | 'outline';
  className?: string;
}

export function HelpButton({
  variant = 'compact',
  className = '',
}: HelpButtonProps) {
  if (variant === 'compact') {
    return (
      <Link
        href="/crisis"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5252] text-white hover:bg-[#e03d3d] font-bold text-xs sm:text-sm rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5252] ${className}`}
        aria-label="Akses Bantuan Krisis Cepat"
      >
        <PhoneCall className="w-3.5 h-3.5 text-white shrink-0" />
        <span>Bantuan Krisis</span>
      </Link>
    );
  }

  if (variant === 'outline') {
    return (
      <Link
        href="/crisis"
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-[#FF5252] text-[#FF5252] hover:bg-[#FF5252] hover:text-white font-bold text-sm rounded-[4px] shadow-[2px_2px_0px_#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5252] ${className}`}
        aria-label="Akses Bantuan Krisis Cepat"
      >
        <PhoneCall className="w-4 h-4 shrink-0" />
        <span>Akses Bantuan Krisis</span>
      </Link>
    );
  }

  return (
    <Link
      href="/crisis"
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FF5252] text-white hover:bg-[#e03d3d] font-bold text-sm sm:text-base rounded-[4px] border-2 border-[#151515] shadow-[3px_3px_0px_#151515] transition-all duration-120 active:translate-x-[2px] active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF5252] ${className}`}
      aria-label="Akses Bantuan Krisis Cepat dan Darurat"
    >
      <PhoneCall className="w-4 h-4 text-white shrink-0" />
      <span>Butuh Bantuan Mendesak? Klik di Sini</span>
    </Link>
  );
}
