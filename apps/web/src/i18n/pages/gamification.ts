import type { Language, TextBundle } from '../language';

/**
 * Teks Perjalanan Kecil (level, lencana, nama hari). Nama level dan lencana
 * Indonesia tetap di lib/gamification.ts (dipakai tes dan state tersimpan);
 * di sini pemetaan per id/indeks untuk bahasa Inggris.
 */

const id = {
  levels: ['Mulai Pelan', 'Buka Ruang', 'Kenal Diri', 'Jaga Ritme', 'Bertumbuh', 'Tetap Berjalan'],
  badges: {
    'langkah-pertama': { name: 'Langkah Pertama', description: 'Melakukan hal pertama di Dengar.in' },
    'berani-jujur': { name: 'Berani Jujur', description: 'Menulis jurnal untuk pertama kali' },
    'kasih-ruang': { name: 'Kasih Ruang', description: 'Menyelesaikan misi dengan refleksi' },
    'balik-lagi': { name: 'Balik Lagi', description: 'Aktif di 3 hari berbeda' },
    'pelan-pelan': { name: 'Pelan-Pelan', description: 'Aktif di 7 hari berbeda' },
    'kenal-ritme': { name: 'Kenal Ritme', description: 'Menyelesaikan target mingguan pertama' },
    'tetap-tumbuh': { name: 'Tetap Tumbuh', description: 'Mencapai level Jaga Ritme' },
    'banyak-cara': { name: 'Banyak Cara', description: 'Check-in, misi, dan jurnal dalam satu hari' },
  } as Record<string, { name: string; description: string }>,
  /** Index 0 = Minggu, mengikuti Date#getDay(). */
  weekdays: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  langkahUnit: 'langkah',
};

const en: typeof id = {
  levels: ['Slow Start', 'Making Room', 'Knowing Yourself', 'Keeping Rhythm', 'Growing', 'Still Walking'],
  badges: {
    'langkah-pertama': { name: 'First Step', description: 'Did your first thing on Dengar.in' },
    'berani-jujur': { name: 'Brave and Honest', description: 'Wrote your first journal entry' },
    'kasih-ruang': { name: 'Making Space', description: 'Finished a mission with a reflection' },
    'balik-lagi': { name: 'Came Back', description: 'Active on 3 different days' },
    'pelan-pelan': { name: 'Step by Step', description: 'Active on 7 different days' },
    'kenal-ritme': { name: 'Found a Rhythm', description: 'Finished your first weekly target' },
    'tetap-tumbuh': { name: 'Still Growing', description: 'Reached the Keeping Rhythm level' },
    'banyak-cara': { name: 'Many Ways', description: 'Check-in, mission, and journal in one day' },
  },
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  langkahUnit: 'steps',
};

export const gamificationText: TextBundle<typeof id> = { id, en };

export function levelName(index: number, lang: Language, fallback = ''): string {
  return gamificationText[lang].levels[index] ?? gamificationText.id.levels[index] ?? fallback;
}

export function badgeText(badgeId: string, lang: Language): { name: string; description: string } {
  return gamificationText[lang].badges[badgeId] ?? gamificationText.id.badges[badgeId] ?? { name: badgeId, description: '' };
}

export function weekdayLabel(weekday: number, lang: Language): string {
  return gamificationText[lang].weekdays[weekday] ?? gamificationText.id.weekdays[weekday] ?? '';
}
