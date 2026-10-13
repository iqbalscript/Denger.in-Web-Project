import type { MoodScore } from '@dengarin/types';
import type { TextBundle } from '../language';

const id = {
  backHome: 'Kembali ke beranda',
  copy: 'Salin laporan',
  copied: 'Tersalin',
  badge: 'Refleksi mingguan',
  titleA: 'Rangkuman & refleksi',
  titleB: 'hari',
  intro: 'Rangkuman ini menunjukkan kemajuan dari langkah-langkah kecilmu. Setiap jeda dan refleksi ada artinya.',
  // Label suasana hati sama dengan halaman check-in (satu hal, satu nama).
  moods: {
    sangat_baik: 'Sangat baik',
    baik: 'Cukup baik',
    netral: 'Biasa saja',
    berat: 'Terasa berat',
    kewalahan: 'Kewalahan',
  } satisfies Record<MoodScore, string>,
  dayNames: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  consistency: 'Keteraturan check-in',
  daysOfSeven: (n: number) => `${n} dari 7 hari`,
  activePercent: (n: number) => `${n}% hari aktif`,
  dailyMission: 'Misi harian',
  dayN: (n: number) => `Hari ke-${n}`,
  missionProgress: 'Kemajuan misi 14 hari',
  ofPlan: 'dari 14 hari rencana',
  journalEntries: 'Catatan jurnal',
  journalCount: (n: number) => `${n} catatan`,
  journalCountLabel: 'Jumlah catatan jurnal',
  storedLocally: 'Tersimpan di perangkat ini',
  trendTitle: 'Suasana hati 7 hari terakhir',
  trendSource: 'Dari check-in harian',
  dayAria: (day: string, mood: string, energy: number) => `${day}: ${mood}, energi ${energy} dari 10`,
  dayAriaEmpty: (day: string) => `${day}: belum ada check-in`,
  dayTitle: (day: string, mood: string, energy: number) => `${day}: ${mood} (Energi: ${energy}/10)`,
  legendHigh: 'Batang tinggi = tenang',
  legendMid: 'Sedang = biasa saja',
  legendLow: 'Pendek = butuh perhatian',
  stressorsTitle: 'Yang paling sering terasa berat',
  times: (n: number) => `${n} kali`,
  observationTitle: 'Yang kami lihat dari minggumu',
  observationFallback: 'Minggu ini kamu terus memberi jeda untuk pikiran dan tubuhmu, dan itu layak dihargai.',
  noteForYou: 'Pesan untukmu:',
  reflectionTitle: 'Refleksi mingguan',
  reflectionReward: '+20 Langkah',
  reflectionQuestion: 'Apa satu hal yang kamu sadari tentang perasaanmu minggu ini?',
  reflectionAria: 'Catatan refleksi mingguan',
  reflectionPlaceholder: 'Tulis refleksimu di sini (minimal 20 huruf)...',
  reflectionBlocked: 'Refleksimu tetap ada di sini dan belum kami simpan.',
  charCount: (n: number) => `${n}/20 huruf minimal`,
  charEnough: 'Cukup, terima kasih sudah menulis',
  saveReflection: 'Simpan refleksi mingguan',
  reflectionSaved: 'Refleksi minggu ini sudah tersimpan',
  reflectionThanks: 'Terima kasih sudah meluangkan waktu untuk melihat kembali minggumu.',
  nextFocusLabel: 'Fokus minggu depan',
  nextFocus: 'Lanjutkan misi harian 5 menit, dan coba latihan napas pelan saat stres muncul.',
  continueToday: 'Lanjut ke hari ini',
  export: (input: {
    date: string; activeDays: number; percent: number; day: number; journals: number;
    mood: string; observation: string; note: string;
  }) => `--- Refleksi mingguan Dengar.in ---
Tanggal: ${input.date}
Keteraturan check-in: ${input.activeDays} dari 7 hari (${input.percent}%)
Misi selesai: hari ke-${input.day}
Catatan jurnal: ${input.journals} catatan
Suasana hati yang dominan: ${input.mood}
Pengamatan: ${input.observation}
Pesan: ${input.note}
----------------------------------`,
};

const en: typeof id = {
  backHome: 'Back to home',
  copy: 'Copy report',
  copied: 'Copied',
  badge: 'Weekly reflection',
  titleA: 'Summary & reflection,',
  titleB: 'days',
  intro: 'This summary shows the progress from your small steps. Every pause and reflection counts.',
  moods: {
    sangat_baik: 'Very good',
    baik: 'Pretty good',
    netral: 'So-so',
    berat: 'Feels heavy',
    kewalahan: 'Overwhelmed',
  },
  dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  consistency: 'Check-in regularity',
  daysOfSeven: (n) => `${n} of 7 days`,
  activePercent: (n) => `${n}% active days`,
  dailyMission: 'Daily mission',
  dayN: (n) => `Day ${n}`,
  missionProgress: '14-day mission progress',
  ofPlan: 'of the 14-day plan',
  journalEntries: 'Journal entries',
  journalCount: (n) => `${n} entries`,
  journalCountLabel: 'Number of journal entries',
  storedLocally: 'Stored on this device',
  trendTitle: 'Mood over the last 7 days',
  trendSource: 'From daily check-ins',
  dayAria: (day, mood, energy) => `${day}: ${mood}, energy ${energy} out of 10`,
  dayAriaEmpty: (day) => `${day}: no check-in yet`,
  dayTitle: (day, mood, energy) => `${day}: ${mood} (Energy: ${energy}/10)`,
  legendHigh: 'Tall bar = calm',
  legendMid: 'Medium = so-so',
  legendLow: 'Short = needs care',
  stressorsTitle: 'What felt heavy most often',
  times: (n) => `${n} times`,
  observationTitle: 'What we noticed about your week',
  observationFallback: 'This week you kept giving your mind and body a pause, and that deserves credit.',
  noteForYou: 'A note for you:',
  reflectionTitle: 'Weekly reflection',
  reflectionReward: '+20 Steps',
  reflectionQuestion: 'What is one thing you noticed about your feelings this week?',
  reflectionAria: 'Weekly reflection note',
  reflectionPlaceholder: 'Write your reflection here (at least 20 characters)...',
  reflectionBlocked: 'Your reflection is still here, and it has not been saved yet.',
  charCount: (n) => `${n}/20 characters minimum`,
  charEnough: 'That is enough, thank you for writing',
  saveReflection: 'Save weekly reflection',
  reflectionSaved: "This week's reflection is saved",
  reflectionThanks: 'Thank you for taking time to look back at your week.',
  nextFocusLabel: 'Focus for next week',
  nextFocus: 'Keep up the 5-minute daily mission, and try slow breathing when stress shows up.',
  continueToday: 'Continue to today',
  export: (input) => `--- Dengar.in weekly reflection ---
Date: ${input.date}
Check-in regularity: ${input.activeDays} of 7 days (${input.percent}%)
Missions done: day ${input.day}
Journal entries: ${input.journals} entries
Dominant mood: ${input.mood}
Observation: ${input.observation}
Note: ${input.note}
----------------------------------`,
};

export const reportText: TextBundle<typeof id> = { id, en };
