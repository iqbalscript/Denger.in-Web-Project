import type { TextBundle } from '../language';

/**
 * Halaman krisis: makna dan semua fakta (nomor, jam, biaya) harus sama persis
 * di kedua bahasa. Hanya kata-katanya yang disederhanakan.
 */
const id = {
  badge: 'Bantuan darurat dan keselamatan',
  titleA: 'Jangan hadapi ini sendirian.',
  titleB: 'Hidupmu berharga.',
  introTeen:
    'Beban yang kamu rasakan sekarang sangat berat, tapi kamu tidak harus memikulnya sendirian. Ada konselor terlatih yang siap mendengarkan dan melindungimu tanpa menghakimi.',
  introAdult:
    'Kami mendengar betapa beratnya situasi yang sedang kamu hadapi. Alur AI dihentikan dulu supaya kamu bisa langsung terhubung dengan bantuan manusia yang siap menemani.',
  primaryBadge: 'Kontak utama nasional',
  callNow: 'Telepon sekarang:',
  extensionHintA: 'Kalau ekstensi tidak tersambung otomatis, tekan angka',
  extensionHintB: 'setelah panggilan diangkat.',
  chatInstead: (host: string) => `Lebih nyaman chat? Buka ${host} untuk WhatsApp`,
  secondaryTitle: 'Kontak bantuan lain yang sudah dicek',
  callLabel: 'Telepon',
  callAria: (name: string, phone: string) => `Telepon ${name}: ${phone}`,
  whatsappAria: (name: string) => `WhatsApp ${name}`,
  websiteAria: (name: string) => `Buka situs resmi ${name} (tab baru)`,
  website: 'Situs',
  noAi: 'Halaman ini dibuat tanpa AI. Kontak di atas nyata.',
  back: 'Kembali ke beranda',
};

const en: typeof id = {
  badge: 'Emergency help and safety',
  titleA: 'Do not face this alone.',
  titleB: 'Your life matters.',
  introTeen:
    'What you are carrying right now is very heavy, but you do not have to carry it alone. Trained counsellors are ready to listen and protect you without judging.',
  introAdult:
    'We hear how hard things are for you right now. The AI flow is paused so you can connect straight away with people who are ready to help.',
  primaryBadge: 'Main national contact',
  callNow: 'Call now:',
  extensionHintA: 'If the extension does not connect automatically, press',
  extensionHintB: 'after the call is answered.',
  chatInstead: (host: string) => `Prefer to chat? Open ${host} for WhatsApp`,
  secondaryTitle: 'Other verified help contacts',
  callLabel: 'Call',
  callAria: (name: string, phone: string) => `Call ${name}: ${phone}`,
  whatsappAria: (name: string) => `WhatsApp ${name}`,
  websiteAria: (name: string) => `Open the official ${name} website (new tab)`,
  website: 'Website',
  noAi: 'This page is made without AI. The contacts above are real.',
  back: 'Back to home',
};

export const crisisText: TextBundle<typeof id> = { id, en };
