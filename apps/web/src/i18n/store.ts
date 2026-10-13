'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_LANGUAGE,
  LOCALE_TAG,
  languageCookieValue,
  parseLanguageCookie,
  pickText,
  type Language,
  type TextBundle,
} from './language';

/**
 * Penyimpanan bahasa di sisi klien tanpa Provider: satu store modul yang
 * dibaca lewat useSyncExternalStore. Saat hidrasi React memakai snapshot server
 * ('id'); bila cookie bilang 'en', React langsung merender ulang secara sinkron
 * sebelum pengguna sempat berinteraksi.
 */

let current: Language | null = null;
const listeners = new Set<() => void>();

function readInitial(): Language {
  if (typeof document === 'undefined') return DEFAULT_LANGUAGE;
  return parseLanguageCookie(document.cookie);
}

function getSnapshot(): Language {
  if (current === null) current = readInitial();
  return current;
}

function getServerSnapshot(): Language {
  return DEFAULT_LANGUAGE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Mengganti bahasa untuk seluruh aplikasi (cookie + <html lang>). */
export function setLanguage(lang: Language): void {
  if (getSnapshot() === lang) return;
  current = lang;
  try {
    document.cookie = languageCookieValue(lang);
  } catch {
    // Cookie diblokir: pilihan tetap berlaku sampai halaman ditutup.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  for (const listener of listeners) listener();
}

/** Bahasa saat ini di luar React (mis. callback speech recognition). */
export function getLanguage(): Language {
  return getSnapshot();
}

export function useLanguage(): { lang: Language; locale: 'id-ID' | 'en-US'; setLang: (lang: Language) => void } {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setLang = useCallback((next: Language) => setLanguage(next), []);
  return { lang, locale: LOCALE_TAG[lang], setLang };
}

/** Mengambil kamus halaman sesuai bahasa aktif: `const t = useText(chatText)`. */
export function useText<T>(bundle: TextBundle<T>): T {
  const { lang } = useLanguage();
  return pickText(bundle, lang);
}
