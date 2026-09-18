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
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-dark text-white font-bold text-xs shadow-soft-lg hover:bg-black transition-all active:scale-95 focus-visible:outline-crisis touch-target-base ${className}`}
      >
        <LogOut className="w-4 h-4 text-crisis" />
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-sand-300/80 bg-white/80 hover:bg-crisis hover:text-white hover:border-crisis text-sand-800 transition-all duration-150 focus-visible:outline-crisis shadow-soft-xs ${className}`}
    >
      <LogOut className="w-3.5 h-3.5 text-crisis group-hover:text-white shrink-0" />
      <span>Keluar Cepat <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.2 bg-sand-100 rounded border border-sand-300">ESC</kbd></span>
    </button>
  );
}
