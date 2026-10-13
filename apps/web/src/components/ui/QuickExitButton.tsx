'use client';

import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';

interface QuickExitButtonProps {
  className?: string;
  variant?: 'navbar' | 'floating' | 'inline';
}

/**
 * Escape adalah pintu keluar darurat di seluruh aplikasi. Supaya tidak
 * mengejutkan pengguna yang hanya ingin menutup jendela/menu, Escape yang
 * sudah ditangani oleh dialog (preventDefault) atau ditekan dari dalam
 * dialog modal tidak mengalihkan halaman.
 */
function shouldIgnoreEscape(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing) return true;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('[aria-modal="true"], [role="dialog"], [role="alertdialog"]'));
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
      if (e.key === 'Escape' && !shouldIgnoreEscape(e)) {
        executeQuickExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={executeQuickExit}
        title="Keluar Cepat: segera pindah ke halaman netral (atau tekan tombol Esc)"
        aria-label="Keluar Cepat, pindah ke halaman netral (tekan Esc)"
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 min-h-[48px] rounded-[4px] bg-[#151515] text-white font-bold text-sm border-2 border-[#151515] shadow-[3px_3px_0px_#FF5252] hover:bg-[#D32F2F] hover:border-[#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] ${focusRing} ${className}`}
      >
        <LogOut className="w-[18px] h-[18px] text-[#FF8A3D]" aria-hidden="true" />
        <span>Keluar Cepat (Esc)</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={executeQuickExit}
      title="Keluar Cepat: segera pindah ke halaman netral (atau tekan tombol Esc)"
      aria-label="Keluar Cepat, pindah ke halaman netral (tekan Esc)"
      className={`group inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] rounded-[4px] text-sm font-bold border-2 border-[#151515] bg-white hover:bg-[#D32F2F] hover:text-white text-[#151515] shadow-[2px_2px_0px_#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap ${focusRing} ${className}`}
    >
      <LogOut className="w-[18px] h-[18px] text-[#B3261E] group-hover:text-white shrink-0 transition-colors duration-120" aria-hidden="true" />
      <span>Keluar Cepat <kbd className="hidden sm:inline-block text-xs font-mono px-1 py-0.5 bg-[#FFF8EF] text-[#151515] rounded-[2px] border border-[#151515] ml-0.5 group-hover:bg-white">Esc</kbd></span>
    </button>
  );
}
