'use client';

import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';

interface QuickExitButtonProps {
  className?: string;
  variant?: 'navbar' | 'floating' | 'inline';
}

/**
 * Quick Exit ("Keluar Cepat") Control
 * Provides immediate safe browser redirection on click or when the user presses ESC on desktop.
 * Honest & Transparent: Does not make false claims regarding browser history deletion.
 */
export function QuickExitButton({ className = '', variant = 'navbar' }: QuickExitButtonProps) {
  const executeQuickExit = () => {
    // Safe browser replacement: neutral search engine page
    if (typeof window !== 'undefined') {
      window.location.replace('https://www.google.com');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for Escape key to quickly exit sensitive view
      if (e.key === 'Escape') {
        executeQuickExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={executeQuickExit}
        title="Keluar Cepat (Tekan ESC untuk segera mengalihkan ke halaman netral)"
        aria-label="Keluar Cepat (Tekan ESC)"
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#151515] text-white font-bold text-xs border-2 border-[#151515] shadow-[3px_3px_0px_#FF5252] hover:bg-[#FF5252] hover:border-[#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5252] touch-target-base ${className}`}
      >
        <LogOut className="w-4 h-4 text-[#FF5252]" />
        <span>Keluar Cepat (ESC)</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={executeQuickExit}
      title="Keluar Cepat: Segera alihkan peramban ke halaman netral (atau tekan ESC)"
      aria-label="Keluar Cepat (Tekan ESC)"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-bold border-2 border-[#151515] bg-white hover:bg-[#FF5252] hover:text-white text-[#151515] shadow-[2px_2px_0px_#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5252] ${className}`}
    >
      <LogOut className="w-3.5 h-3.5 text-[#FF5252] group-hover:text-white shrink-0" />
      <span>Keluar Cepat <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.5 bg-[#FFF8EF] rounded-[2px] border border-[#151515]">ESC</kbd></span>
    </button>
  );
}
