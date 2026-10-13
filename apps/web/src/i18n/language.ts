/**
 * Bahasa antarmuka (ID bawaan, EN opsional). Berkas ini bebas React supaya bisa
 * dipakai dari lib/ (speech, storage) dan dari skrip <head>.
 *
 * Pilihan disimpan di cookie `dengarin-lang` (bukan localStorage dengan prefiks
 * `dengarin_`, supaya tidak ikut terhapus saat data anonim dihapus). Cookie
 * dibaca di sisi klien saja: membaca cookie di layout server membuat semua
 * rute dinamis dan merusak cache halaman statis (lihat tests/redis).
 */

export type Language = 'id' | 'en';

export const LANGUAGES: readonly Language[] = ['id', 'en'] as const;
export const DEFAULT_LANGUAGE: Language = 'id';
export const LANGUAGE_COOKIE = 'dengarin-lang';
const LANGUAGE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Kode BCP-47 untuk SpeechRecognition / SpeechSynthesis / Intl. */
export const LOCALE_TAG: Record<Language, 'id-ID' | 'en-US'> = { id: 'id-ID', en: 'en-US' };

/** Nama bahasa dalam bahasanya sendiri (untuk tombol pilihan bahasa). */
export const LANGUAGE_NAMES: Record<Language, string> = { id: 'Bahasa Indonesia', en: 'English' };

export function isLanguage(value: unknown): value is Language {
  return value === 'id' || value === 'en';
}

const COOKIE_PATTERN = new RegExp(`(?:^|;\\s*)${LANGUAGE_COOKIE}=(id|en)(?:;|$)`);

/** Membaca bahasa dari string `document.cookie` (atau header Cookie). */
export function parseLanguageCookie(cookieString: string | undefined | null): Language {
  const match = cookieString?.match(COOKIE_PATTERN);
  return match && isLanguage(match[1]) ? match[1] : DEFAULT_LANGUAGE;
}

export function languageCookieValue(lang: Language): string {
  return `${LANGUAGE_COOKIE}=${lang}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/**
 * Dijalankan di <head> sebelum render: atribut lang <html> langsung benar
 * (pembaca layar memakai pelafalan yang tepat) tanpa menunggu hidrasi.
 */
export const LANGUAGE_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${LANGUAGE_COOKIE}=(id|en)(?:;|$)/);if(m&&m[1]!=='id')document.documentElement.lang=m[1];}catch(e){}})();`;

/** Kamus teks: `en` wajib bertipe sama persis dengan `id` (kunci hilang = gagal typecheck). */
export type TextBundle<T> = { readonly id: T; readonly en: T };

export function pickText<T>(bundle: TextBundle<T>, lang: Language): T {
  return bundle[lang] ?? bundle.id;
}
