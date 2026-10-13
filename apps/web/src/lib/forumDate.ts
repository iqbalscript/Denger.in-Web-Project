import type { Language } from '../i18n/language.ts';

const MONTHS: Record<Language, readonly string[]> = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Tanggal cerita/balasan untuk tampilan forum.
 *
 * `local = false` memakai UTC: hasilnya sama di server dan browser, jadi aman untuk
 * render pertama (SSR) tanpa hydration mismatch. `local = true` memakai zona waktu
 * perangkat pengguna; panggil setelah komponen ter-mount di browser.
 * `lang` hanya mengganti singkatan bulan (bawaan Indonesia).
 */
export function formatForumDate(value: string, local = false, lang: Language = 'id'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = local ? date.getDate() : date.getUTCDate();
  const month = local ? date.getMonth() : date.getUTCMonth();
  return `${day} ${(MONTHS[lang] ?? MONTHS.id)[month]}`;
}

/** "29 Sep, 16:55" pada zona waktu perangkat; "29 Sep, 09:55 UTC" bila `local` false. */
export function formatForumDateTime(value: string, local = false, lang: Language = 'id'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = local ? date.getHours() : date.getUTCHours();
  const minutes = local ? date.getMinutes() : date.getUTCMinutes();
  return `${formatForumDate(value, local, lang)}, ${pad(hours)}:${pad(minutes)}${local ? '' : ' UTC'}`;
}
