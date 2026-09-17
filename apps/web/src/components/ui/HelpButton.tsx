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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-crisis-dark hover:bg-red-100 font-semibold text-xs sm:text-sm rounded-full transition-all border border-red-200/80 shadow-soft-xs focus-visible:outline-2 focus-visible:outline-crisis ${className}`}
        aria-label="Akses Bantuan Krisis Cepat"
      >
        <PhoneCall className="w-3.5 h-3.5 text-crisis shrink-0" />
        <span>Bantuan Krisis</span>
      </Link>
    );
  }

  if (variant === 'outline') {
    return (
      <Link
        href="/crisis"
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-crisis hover:bg-red-50 font-medium text-sm rounded-xl transition-all shadow-soft-xs focus-visible:outline-2 focus-visible:outline-crisis ${className}`}
        aria-label="Akses Bantuan Krisis Cepat"
      >
        <PhoneCall className="w-4 h-4 text-crisis shrink-0" />
        <span>Akses Bantuan Krisis</span>
      </Link>
    );
  }

  return (
    <Link
      href="/crisis"
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 bg-crisis text-white hover:bg-crisis-dark font-semibold text-sm sm:text-base rounded-2xl transition-all shadow-soft-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crisis active:scale-[0.98] ${className}`}
      aria-label="Akses Bantuan Krisis Cepat dan Darurat"
    >
      <PhoneCall className="w-4 h-4 text-white shrink-0" />
      <span>Butuh Bantuan Mendesak? Klik di Sini</span>
    </Link>
  );
}
