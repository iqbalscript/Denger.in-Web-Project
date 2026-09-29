'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, X, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'dengarin_privacy_warning_dismissed';

export function PrivacyWarningPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Small delay so the page loads first, then popup appears with animation
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Popup modal */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="privacy-warning-title"
        aria-describedby="privacy-warning-desc"
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
          isClosing
            ? 'opacity-0 scale-95'
            : 'opacity-100 scale-100'
        }`}
      >
        <div className="relative w-full max-w-md bg-white border-2 border-[#151515] rounded-lg shadow-[6px_6px_0px_#151515] overflow-hidden">
          {/* Warning accent bar */}
          <div className="h-2 w-full bg-[#FFD84D]" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded border-2 border-[#151515] bg-white hover:bg-[#FFF8EF] shadow-[2px_2px_0px_#151515] hover:shadow-[1px_1px_0px_#151515] hover:translate-x-[1px] hover:translate-y-[1px] transition-all focus-visible:outline-[#4169FF]"
            aria-label="Tutup peringatan"
          >
            <X className="w-4 h-4 text-[#151515]" />
          </button>

          <div className="p-6 sm:p-8 space-y-5">
            {/* Icon + Title */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-11 h-11 rounded-[4px] bg-[#FFD84D] border-2 border-[#151515] flex items-center justify-center shadow-[2px_2px_0px_#151515]">
                <ShieldAlert className="w-5.5 h-5.5 text-[#151515]" />
              </div>
              <div className="space-y-1">
                <h2
                  id="privacy-warning-title"
                  className="text-lg sm:text-xl font-extrabold text-[#151515] uppercase tracking-tight leading-tight"
                >
                  ⚠️ Peringatan Privasi
                </h2>
                <p className="text-xs font-bold text-[#FF8A3D] uppercase tracking-wider">
                  Demi keamananmu sendiri
                </p>
              </div>
            </div>

            {/* Warning message */}
            <div
              id="privacy-warning-desc"
              className="space-y-3 text-sm text-[#151515] leading-relaxed font-medium"
            >
              <p>
                Dengar.in adalah ruang <strong className="font-extrabold">anonim</strong>. Untuk menjaga keamanan dan kenyamananmu:
              </p>

              {/* Warning list */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-3 bg-[#FFEBEB] border-2 border-[#151515] rounded-[4px] shadow-[2px_2px_0px_#151515]">
                  <AlertTriangle className="w-4 h-4 text-[#FF5252] shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    <strong className="font-extrabold uppercase">Jangan gunakan nama asli</strong> — baik namamu sendiri, teman, keluarga, guru, dosen, atau siapa pun.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-[#FFEBEB] border-2 border-[#151515] rounded-[4px] shadow-[2px_2px_0px_#151515]">
                  <AlertTriangle className="w-4 h-4 text-[#FF5252] shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    <strong className="font-extrabold uppercase">Jangan ceritakan detail berlebihan</strong> — hindari menyebutkan alamat, nama sekolah/kampus/kantor, nomor telepon, atau info pribadi lainnya.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-[#E8F5E9] border-2 border-[#151515] rounded-[4px] shadow-[2px_2px_0px_#151515]">
                  <CheckCircle2 className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    <strong className="font-extrabold uppercase">Cukup ceritakan perasaanmu</strong> — fokus pada apa yang kamu rasakan, bukan detail spesifik tentang orang atau tempat.
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#59544D] italic">
                Ini demi melindungi identitasmu dan orang-orang di sekitarmu. Cerita tetap bisa disampaikan tanpa harus menyebutkan siapa dan di mana. 💛
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 bg-[#4169FF] text-white border-2 border-[#151515] rounded-[4px] font-extrabold text-sm uppercase tracking-wider shadow-[3px_3px_0px_#151515] hover:shadow-[4px_4px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] transition-all focus-visible:outline-[#4169FF] cursor-pointer"
            >
              Saya Mengerti, Lanjutkan →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
