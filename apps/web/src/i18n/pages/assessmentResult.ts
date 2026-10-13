import type { TextBundle } from '../language';
import { assessmentText } from './assessment';

const id = {
  loading: 'Memuat saran untukmu...',
  badge: 'Saran dukungan (bukan diagnosis)',
  title: 'Ini yang bisa menemanimu',
  lede: 'Terima kasih sudah menjawab dengan jujur. Dari ceritamu, dukungan berikut mungkin bisa membantumu merasa lebih tenang dan aman:',
  severity: {
    MILD: 'Beban terasa: ringan',
    MODERATE: 'Beban terasa: cukup berat',
    SEVERE: 'Beban terasa: sangat berat',
  },
  notDiagnosis: 'Bukan diagnosis',
  pathway: {
    MILD: 'Jalur mandiri',
    MODERATE: 'Jalur ditemani dan kelola emosi',
    SEVERE: 'Jalur bantuan profesional dan segera',
  },
  spacesTitle: 'Dukungan yang mungkin cocok untukmu',
  nextTitle: 'Langkah kecil yang bisa kamu pilih',
  homeTitle: 'Masuk ke beranda',
  homeBody: 'Mulai misi kecil harian 3-7 menit yang sesuai kemampuanmu.',
  homeLink: 'Buka beranda',
  helpTitle: 'Daftar bantuan resmi',
  helpBody: 'Kontak resmi Healing119 (Kemenkes) 119 ext 8, LISA Helpline, dan layanan konseling, kapan pun kamu ingin bicara dengan manusia.',
  helpLink: 'Lihat kontak bantuan',
  journalTitle: 'Jurnal pribadi',
  journalBody: 'Tulis perasaanmu sebebasnya. Tersimpan di perangkat ini dan tidak dikirim ke server mana pun.',
  journalLink: 'Mulai menulis',
  disclaimerTitle: 'Bukan diagnosis',
  disclaimerA: 'Hasil ini adalah panduan awal mandiri dan',
  disclaimerStrong: 'bukan diagnosis medis',
  disclaimerB: '(seperti depresi, gangguan kecemasan, atau PTSD). Layanan ini tidak mengklaim keakuratan psikometrik atau klinis. Kalau kamu butuh diagnosis resmi, temui psikolog atau psikiater berizin.',
  toHome: 'Lanjut ke beranda',
};

const en: typeof id = {
  loading: 'Loading your suggestions...',
  badge: 'Support suggestions (not a diagnosis)',
  title: 'Here is what can support you',
  lede: 'Thank you for answering honestly. Based on what you shared, the support below may help you feel steadier and safer:',
  severity: {
    MILD: 'The weight feels: light',
    MODERATE: 'The weight feels: quite heavy',
    SEVERE: 'The weight feels: very heavy',
  },
  notDiagnosis: 'Not a diagnosis',
  pathway: {
    MILD: 'Self-guided path',
    MODERATE: 'Supported path with emotion management',
    SEVERE: 'Professional help and immediate support path',
  },
  spacesTitle: 'Support that may fit you',
  nextTitle: 'Small steps you can choose',
  homeTitle: 'Go to home',
  homeBody: 'Start a small 3-7 minute daily mission that fits what you can do.',
  homeLink: 'Open home',
  helpTitle: 'Official help directory',
  helpBody: 'Official contacts: Healing119 (Ministry of Health) 119 ext 8, LISA Helpline, and counselling services, whenever you want to talk to a human.',
  helpLink: 'See help contacts',
  journalTitle: 'Private journal',
  journalBody: 'Write your feelings freely. Stored on this device and never sent to any server.',
  journalLink: 'Start writing',
  disclaimerTitle: 'Not a diagnosis',
  disclaimerA: 'This result is an initial self-help guide and',
  disclaimerStrong: 'not a medical diagnosis',
  disclaimerB: '(such as depression, an anxiety disorder, or PTSD). This service makes no claim of psychometric or clinical accuracy. If you need a formal diagnosis, see a licensed psychologist or psychiatrist.',
  toHome: 'Continue to home',
};

export const assessmentResultText: TextBundle<typeof id> = { id, en };

/** Rangkuman hasil sesuai tingkat beban dan bahasa (dipakai juga oleh dashboard bila mau). */
export function assessmentSummaryText(severity: 'MILD' | 'MODERATE' | 'SEVERE', lang: 'id' | 'en') {
  const text = assessmentText[lang] ?? assessmentText.id;
  return { summary: text.summary[severity], spaces: text.spaces[severity] };
}
