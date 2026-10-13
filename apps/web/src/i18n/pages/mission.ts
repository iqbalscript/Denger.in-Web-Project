import type { TextBundle } from '../language';

const id = {
  preparing: 'Menyiapkan misi kecilmu...',
  backHome: 'Kembali ke beranda',
  dayOf: (day: number) => `Misi hari ke-${day} dari 14`,
  focus: (label: string) => `Fokus: ${label}`,
  duration: (minutes: number) => `Sekitar ${minutes} menit`,
  stepsTitle: 'Lakukan pelan-pelan, satu per satu',
  stepLabel: (n: number) => `Tahap ${n}`,
  reflectionLabel: (question: string) => `Refleksi singkat (boleh dikosongkan): ${question}`,
  reflectionPlaceholder: 'Kalau mau, tulis satu kalimat tentang apa yang kamu rasakan setelahnya...',
  blockedNote: 'Refleksimu tetap ada di sini dan misi belum kami tandai selesai.',
  doneTitle: 'Misi selesai untuk hari ini',
  doneBody: 'Kamu sudah melakukan satu hal kecil untuk dirimu hari ini, dan itu berarti. Sekarang, silakan istirahat.',
  complete: 'Tandai selesai dan simpan',
};

const en: typeof id = {
  preparing: 'Getting your small mission ready...',
  backHome: 'Back to home',
  dayOf: (day) => `Mission day ${day} of 14`,
  focus: (label) => `Focus: ${label}`,
  duration: (minutes) => `About ${minutes} minutes`,
  stepsTitle: 'Take it slowly, one at a time',
  stepLabel: (n) => `Step ${n}`,
  reflectionLabel: (question) => `Short reflection (optional): ${question}`,
  reflectionPlaceholder: 'If you like, write one sentence about how you feel afterwards...',
  blockedNote: 'Your reflection is still here, and the mission has not been marked done yet.',
  doneTitle: "Today's mission is done",
  doneBody: 'You did one small thing for yourself today, and that matters. Now, go and rest.',
  complete: 'Mark as done and save',
};

export const missionText: TextBundle<typeof id> = { id, en };
