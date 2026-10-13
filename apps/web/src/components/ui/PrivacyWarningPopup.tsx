'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ShieldAlert, X, CheckCircle2, Heart } from 'lucide-react';
import { useText } from '@/i18n/store';
import { uiText } from '@/i18n/pages/ui';

const STORAGE_KEY = 'dengarin_privacy_warning_dismissed';

export function PrivacyWarningPopup() {
  const t = useText(uiText).privacy;
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Move focus into the dialog when it opens and give it back when it closes.
  useEffect(() => {
    if (!isVisible) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    return () => returnFocusRef.current?.focus?.();
  }, [isVisible]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
          // Penyimpanan diblokir (mode privat): popup cukup ditutup untuk sesi ini.
        }
      }
    }, 300);
  };

  // Tab tetap di dalam dialog. Escape menutup dialog ini (standar yang
  // diharapkan pengguna); preventDefault membuat Keluar Cepat (QuickExitButton)
  // mengabaikannya, jadi menutup peringatan tidak melempar orang ke luar situs.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      handleDismiss();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let dismissed: string | null = null;
      try {
        dismissed = localStorage.getItem(STORAGE_KEY);
      } catch {
        dismissed = null;
      }
      if (!dismissed) {
        // Small delay so the page loads first, then popup appears with animation
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-[#151515]/60 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Popup modal */}
      <div
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="privacy-warning-title"
        aria-describedby="privacy-warning-desc"
        className={`fixed inset-0 z-[61] flex items-center justify-center p-3 sm:p-4 transition-[opacity,transform] duration-300 ${
          isClosing
            ? 'opacity-0 scale-95'
            : 'opacity-100 scale-100'
        }`}
      >
        <div className="bezel w-full max-w-md max-h-[calc(100dvh-1.5rem)] flex">
        <div className="bezel-core relative w-full min-h-0 overflow-y-auto bg-white">
          {/* Warning accent bar */}
          <div className="h-2 w-full bg-[#FFD84D]" aria-hidden="true" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 inline-flex items-center justify-center w-11 h-11 rounded-[4px] border-2 border-[#151515] bg-white hover:bg-[#FFF8EF] shadow-[2px_2px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] transition-all duration-120 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
            aria-label={t.close}
          >
            <X className="w-5 h-5 text-[#151515]" aria-hidden="true" />
          </button>

          <div className="p-5 sm:p-8 space-y-5">
            {/* Icon + Title */}
            <div className="flex items-start gap-3 pr-12">
              <div className="shrink-0 w-11 h-11 rounded-[4px] bg-[#FFD84D] border-2 border-[#151515] flex items-center justify-center shadow-[2px_2px_0px_#151515]" aria-hidden="true">
                <ShieldAlert className="w-5 h-5 text-[#151515]" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2
                  id="privacy-warning-title"
                  className="text-xl sm:text-2xl font-bold text-[#151515] tracking-[-0.01em] leading-[1.2]"
                >
                  {t.title}
                </h2>
                <p className="text-sm font-bold text-[#A3480B]">
                  {t.subtitle}
                </p>
              </div>
            </div>

            {/* Warning message */}
            <div
              id="privacy-warning-desc"
              className="space-y-3 text-base text-[#151515] leading-relaxed font-medium"
            >
              <p>
                {t.introA} <strong className="font-bold">{t.introAnon}</strong>{t.introB}
              </p>

              {/* Warning list */}
              <ul className="space-y-2.5 list-none p-0 m-0">
                <li className="flex items-start gap-2.5 p-3 bg-[#FFEBEB] border-2 border-[#151515] rounded-[4px]">
                  <AlertTriangle className="w-5 h-5 text-[#B3261E] shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-base leading-relaxed">
                    <strong className="font-bold">{t.rule1Strong}</strong>{t.rule1}
                  </p>
                </li>

                <li className="flex items-start gap-2.5 p-3 bg-[#FFEBEB] border-2 border-[#151515] rounded-[4px]">
                  <AlertTriangle className="w-5 h-5 text-[#B3261E] shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-base leading-relaxed">
                    <strong className="font-bold">{t.rule2Strong}</strong>
                  </p>
                </li>

                <li className="flex items-start gap-2.5 p-3 bg-[#F1FCDD] border-2 border-[#151515] rounded-[4px]">
                  <CheckCircle2 className="w-5 h-5 text-[#151515] shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-base leading-relaxed">
                    <strong className="font-bold">{t.rule3Strong}</strong>{t.rule3}
                  </p>
                </li>
              </ul>

              <p className="text-sm text-[#59544D] leading-relaxed">
                {t.footer}{' '}
                <Heart className="inline w-4 h-4 text-[#FF8A3D] align-[-2px]" fill="currentColor" aria-hidden="true" />
              </p>
            </div>

            {/* Dismiss button */}
            <button
              ref={confirmRef}
              type="button"
              onClick={handleDismiss}
              className="w-full min-h-[52px] py-3 px-4 bg-[#3357EE] text-white border-2 border-[#151515] rounded-[4px] font-bold text-base shadow-[3px_3px_0px_#151515] hover:shadow-[4px_4px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-120 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2 cursor-pointer"
            >
              {t.confirm}
            </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
