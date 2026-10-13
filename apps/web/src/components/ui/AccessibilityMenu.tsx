'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Accessibility, Check, RotateCcw, X } from 'lucide-react';

/**
 * Akses cepat mandiri: pengguna mengatur sendiri ukuran teks, kontras, garis
 * bawah tautan, jarak baca, dan animasi. Pilihan disimpan di perangkat ini saja
 * dan diterapkan sebelum halaman tampil oleh ACCESSIBILITY_INIT_SCRIPT.
 */

export const ACCESSIBILITY_STORAGE_KEY = 'dengarin:aksesibilitas';

const TEXT_SCALES = [
  { value: 100, label: 'Biasa', sample: 'text-sm' },
  { value: 112.5, label: 'Besar', sample: 'text-base' },
  { value: 125, label: 'Lebih besar', sample: 'text-lg' },
  { value: 140, label: 'Sangat besar', sample: 'text-xl' },
] as const;

type Settings = {
  textScale: number;
  contrast: boolean;
  underline: boolean;
  spacing: boolean;
  reduceMotion: boolean;
};

const DEFAULTS: Settings = {
  textScale: 100,
  contrast: false,
  underline: false,
  spacing: false,
  reduceMotion: false,
};

const TOGGLES: { key: Exclude<keyof Settings, 'textScale'>; label: string; hint: string; className: string }[] = [
  { key: 'contrast', label: 'Kontras tinggi', hint: 'Teks abu-abu jadi hitam pekat', className: 'a11y-contrast' },
  { key: 'underline', label: 'Garis bawah tautan', hint: 'Tautan lebih mudah dikenali', className: 'a11y-underline' },
  { key: 'spacing', label: 'Jarak baca lega', hint: 'Jarak huruf dan baris lebih longgar', className: 'a11y-spacing' },
  { key: 'reduceMotion', label: 'Hentikan animasi', hint: 'Tanpa gerakan dan efek muncul', className: 'a11y-reduce-motion' },
];

// Dijalankan di <head> sebelum render agar tidak ada kedipan ukuran/warna.
export const ACCESSIBILITY_INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('${ACCESSIBILITY_STORAGE_KEY}')||'null');if(!s)return;var r=document.documentElement;if(s.textScale&&s.textScale!==100)r.style.fontSize=s.textScale+'%';${TOGGLES.map(
  (t) => `if(s.${t.key})r.classList.add('${t.className}');`
).join('')}}catch(e){}})();`;

function applySettings(settings: Settings) {
  const root = document.documentElement;
  root.style.fontSize = settings.textScale === 100 ? '' : `${settings.textScale}%`;
  for (const toggle of TOGGLES) {
    root.classList.toggle(toggle.className, settings[toggle.key]);
  }
}

function readSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function writeSettings(settings: Settings) {
  try {
    window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Mode privat atau penyimpanan diblokir: pengaturan tetap berlaku sampai halaman ditutup.
  }
}

export function AccessibilityMenu({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(readSettings());
  }, []);

  const update = useCallback((next: Settings) => {
    setSettings(next);
    applySettings(next);
    writeSettings(next);
  }, []);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  // Escape hanya menutup panel ini, tidak memicu Keluar Cepat.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  };

  const isCustomised = JSON.stringify(settings) !== JSON.stringify(DEFAULTS);
  const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

  return (
    <div ref={wrapperRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="panel-aksesibilitas"
        aria-label="Akses cepat: atur ukuran teks, kontras, dan animasi"
        className={`relative inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 rounded-[4px] text-sm font-bold border-2 border-[#151515] shadow-[2px_2px_0px_#151515] transition-[transform,box-shadow,background-color] duration-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] ${
          open ? 'bg-[#FFD84D] text-[#151515]' : 'bg-white text-[#151515] hover:bg-[#FFD84D]/40'
        } ${focusRing}`}
      >
        <Accessibility className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span className="hidden 2xl:inline">Akses cepat</span>
        {isCustomised && (
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#3357EE] border-2 border-white" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id="panel-aksesibilitas"
          role="dialog"
          aria-modal="false"
          aria-labelledby="judul-aksesibilitas"
          className="fixed left-3 right-3 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[22rem] z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain bg-white border-2 border-[#151515] rounded-[6px] shadow-[4px_4px_0px_#151515] p-4 space-y-4 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="judul-aksesibilitas" className="text-base font-bold text-[#151515]">
                Akses cepat
              </h2>
              <p className="text-sm text-[#59544D]">Atur tampilan sesuai kenyamananmu.</p>
            </div>
            <button
              type="button"
              onClick={() => close(true)}
              className={`shrink-0 inline-flex items-center justify-center w-11 h-11 -mr-2 -mt-2 rounded-[4px] text-[#151515] hover:bg-[#151515]/5 ${focusRing}`}
              aria-label="Tutup akses cepat"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <fieldset>
            <legend className="text-sm font-bold text-[#151515] mb-2">Ukuran teks</legend>
            <div className="grid grid-cols-2 gap-2">
              {TEXT_SCALES.map((scale) => {
                const active = settings.textScale === scale.value;
                return (
                  <button
                    key={scale.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ ...settings, textScale: scale.value })}
                    className={`flex items-center justify-between gap-2 min-h-[44px] px-3 rounded-[4px] border-2 border-[#151515] font-bold transition-colors duration-200 ${
                      active ? 'bg-[#3357EE] text-white' : 'bg-white text-[#151515] hover:bg-[#FFF8EF]'
                    } ${focusRing}`}
                  >
                    <span className="text-sm">{scale.label}</span>
                    <span className={`${scale.sample} leading-none`} aria-hidden="true">Aa</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <ul className="space-y-2">
            {TOGGLES.map((toggle) => {
              const active = settings[toggle.key];
              return (
                <li key={toggle.key}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => update({ ...settings, [toggle.key]: !active })}
                    className={`w-full flex items-center gap-3 min-h-[52px] px-3 py-2 rounded-[4px] border-2 text-left transition-colors duration-200 ${
                      active ? 'border-[#151515] bg-[#B8F34A]/50' : 'border-[#D8D3C9] bg-white hover:border-[#151515]'
                    } ${focusRing}`}
                  >
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-[#151515]">{toggle.label}</span>
                      <span className="block text-xs text-[#59544D]">{toggle.hint}</span>
                    </span>
                    <span
                      className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-[4px] border-2 border-[#151515] ${
                        active ? 'bg-[#151515] text-white' : 'bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {active && <Check className="w-4 h-4" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => update(DEFAULTS)}
            disabled={!isCustomised}
            className={`w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-[4px] text-sm font-bold border-2 border-[#151515] bg-white text-[#151515] hover:bg-[#FFF8EF] disabled:border-[#D8D3C9] disabled:text-[#7A756D] disabled:cursor-not-allowed ${focusRing}`}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Kembalikan ke tampilan awal
          </button>

          <p className="text-xs text-[#59544D]">Disimpan di perangkat ini saja.</p>
        </div>
      )}
    </div>
  );
}
