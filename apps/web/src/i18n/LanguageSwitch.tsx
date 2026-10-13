'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from './language';
import { useLanguage, useText } from './store';
import { commonText } from './common';

const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

/**
 * Pilihan bahasa dua tombol (Bahasa Indonesia / English). Setiap label ditulis
 * dalam bahasanya sendiri dan diberi atribut lang supaya pembaca layar
 * melafalkannya dengan benar. Target sentuh minimal 44px.
 */
export function LanguageSwitch({ className = '', idPrefix = 'bahasa' }: { className?: string; idPrefix?: string }) {
  const { lang, setLang } = useLanguage();
  const t = useText(commonText);
  const legendId = `${idPrefix}-legend`;

  return (
    <fieldset className={className} aria-describedby={`${idPrefix}-hint`}>
      <legend id={legendId} className="text-sm font-bold text-[#151515] mb-2 inline-flex items-center gap-1.5">
        <Languages className="w-4 h-4 shrink-0" aria-hidden="true" />
        {t.language.legend}
      </legend>
      <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby={legendId}>
        {LANGUAGES.map((option) => {
          const active = option === lang;
          return (
            <button
              key={option}
              type="button"
              lang={option}
              aria-pressed={active}
              onClick={() => setLang(option)}
              className={`min-h-[44px] px-3 rounded-[4px] border-2 border-[#151515] text-sm font-bold transition-colors duration-200 ${
                active ? 'bg-[#3357EE] text-white' : 'bg-white text-[#151515] hover:bg-[#FFF8EF]'
              } ${focusRing}`}
            >
              {LANGUAGE_NAMES[option]}
            </button>
          );
        })}
      </div>
      <p id={`${idPrefix}-hint`} className="text-xs text-[#59544D] mt-2">{t.language.hint}</p>
    </fieldset>
  );
}

/**
 * Tombol ringkas 44px untuk pojok kanan atas: menampilkan kode bahasa aktif dan
 * berpindah ke bahasa satunya saat ditekan. Dipakai hanya di lebar layar yang
 * masih punya ruang (lihat komentar anggaran lebar di Navbar).
 */
export function LanguageQuickButton({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const t = useText(commonText);
  const other: Language = lang === 'id' ? 'en' : 'id';

  return (
    <button
      type="button"
      onClick={() => setLang(other)}
      aria-label={`${t.language.change}: ${LANGUAGE_NAMES[lang]}`}
      title={`${t.language.current}: ${LANGUAGE_NAMES[lang]}`}
      className={`inline-flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-2 rounded-[4px] text-sm font-bold uppercase tracking-[0.04em] bg-white text-[#151515] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] hover:bg-[#FFF8EF] transition-[transform,box-shadow,background-color] duration-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] ${focusRing} ${className}`}
    >
      <span aria-hidden="true">{lang}</span>
    </button>
  );
}
