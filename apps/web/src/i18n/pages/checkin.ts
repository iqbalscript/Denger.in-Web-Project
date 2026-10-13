import type { MoodScore } from '@dengarin/types';
import type { TextBundle } from '../language';

const id = {
  backHome: 'Kembali ke beranda',
  badge: 'Check-in harian',
  title: 'Gimana keadaanmu hari ini?',
  intro: 'Ambil jeda satu menit untuk menyapa dirimu sendiri. Apa pun jawabannya, semuanya boleh.',
  moodQuestion: '1. Lagi terasa seperti apa?',
  moods: {
    sangat_baik: { label: 'Sangat baik', sub: 'Bertenaga' },
    baik: { label: 'Cukup baik', sub: 'Oke' },
    netral: { label: 'Biasa saja', sub: 'Lumayan' },
    berat: { label: 'Terasa berat', sub: 'Cemas atau lelah' },
    kewalahan: { label: 'Kewalahan', sub: 'Sangat lelah' },
  } satisfies Record<MoodScore, { label: string; sub: string }>,
  energyLabel: '2. Tingkat energimu (1-10)',
  energyValue: (n: number) => `Energi: ${n} dari 10`,
  energyValueText: (n: number) => `${n} dari 10`,
  energyLow: '1 = sangat lelah',
  energyHigh: '10 = sangat bertenaga',
  stressorQuestion: '3. Ada yang terasa membebani hari ini?',
  stressorHint: '(boleh dilewati, bisa pilih lebih dari satu)',
  tags: [
    'Tugas sekolah / kuliah',
    'Beban kerja',
    'Uang dan tagihan',
    'Kurang tidur / lelah',
    'Konflik pasangan / teman',
    'Urusan keluarga',
    'Merasa kesepian',
  ],
  noteLabel: '4. Catatan singkat (boleh dikosongkan)',
  notePlaceholder: 'Kalau mau, ceritakan sedikit apa yang ada di pikiranmu...',
  blockedNote: 'Catatanmu tetap ada di sini dan check-in belum kami simpan.',
  storedLocally: 'Catatanmu tersimpan di perangkat ini saja.',
  pickMoodFirst: 'Pilih dulu perasaanmu di nomor 1, lalu tombol simpan akan aktif.',
  save: 'Simpan check-in hari ini',
  saved: 'Tersimpan. Terima kasih sudah menyapa dirimu',
  savedStatus: 'Check-in tersimpan. Kembali ke beranda.',
  historyTitle: 'Riwayat check-in terakhir',
  historyEnergy: (n: number) => `Energi ${n}/10`,
  historyStressors: (tags: string) => `Yang terasa berat: ${tags}`,
};

const en: typeof id = {
  backHome: 'Back to home',
  badge: 'Daily check-in',
  title: 'How are you doing today?',
  intro: 'Take one minute to say hello to yourself. Whatever the answer is, it is okay.',
  moodQuestion: '1. How does it feel right now?',
  moods: {
    sangat_baik: { label: 'Very good', sub: 'Energised' },
    baik: { label: 'Pretty good', sub: 'Okay' },
    netral: { label: 'So-so', sub: 'Fine' },
    berat: { label: 'Feels heavy', sub: 'Anxious or tired' },
    kewalahan: { label: 'Overwhelmed', sub: 'Very tired' },
  },
  energyLabel: '2. Your energy level (1-10)',
  energyValue: (n) => `Energy: ${n} out of 10`,
  energyValueText: (n) => `${n} out of 10`,
  energyLow: '1 = very tired',
  energyHigh: '10 = full of energy',
  stressorQuestion: '3. Is anything weighing on you today?',
  stressorHint: '(optional, you can pick more than one)',
  tags: [
    'School / college work',
    'Workload',
    'Money and bills',
    'Lack of sleep / tired',
    'Conflict with partner / friends',
    'Family matters',
    'Feeling lonely',
  ],
  noteLabel: '4. Short note (optional)',
  notePlaceholder: 'If you like, share a little of what is on your mind...',
  blockedNote: 'Your note is still here, and the check-in has not been saved yet.',
  storedLocally: 'Your note is stored on this device only.',
  pickMoodFirst: 'Pick how you feel in question 1 first, then the save button turns on.',
  save: "Save today's check-in",
  saved: 'Saved. Thank you for checking in with yourself',
  savedStatus: 'Check-in saved. Going back to home.',
  historyTitle: 'Recent check-ins',
  historyEnergy: (n) => `Energy ${n}/10`,
  historyStressors: (tags) => `What felt heavy: ${tags}`,
};

export const checkinText: TextBundle<typeof id> = { id, en };

/** Label suasana hati untuk riwayat; nilai lama yang tidak dikenal ditampilkan apa adanya. */
export function moodLabel(text: typeof id, mood: string): string {
  return (text.moods as Record<string, { label: string } | undefined>)[mood]?.label ?? mood.replace('_', ' ');
}
