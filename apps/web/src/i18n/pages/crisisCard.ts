import type { TextBundle } from '@/i18n/language';

/**
 * Teks kartu krisis sebaris (InlineCrisisCard, CrisisBlockedNote). Makna
 * keselamatan harus tetap sama persis di kedua bahasa.
 */
const id = {
  notAlone: 'Kamu tidak sendirian',
  title: 'Sepertinya kamu sedang sangat berat. Ada orang yang siap mendengarkan sekarang.',
  defaultBlockedNote: 'Tulisanmu tetap ada di sini dan belum kami simpan.',
  callToAction: 'Kalau kamu dalam bahaya, hubungi salah satu kontak ini. Gratis dan rahasia.',
  call: 'Telepon',
  whatsapp: 'WhatsApp',
  openHelp: 'Buka halaman bantuan',
  acknowledge: 'Aku sudah membaca ini',
  blockedNote: 'Belum bisa disimpan karena tulisan ini menyebut hal yang membahayakan dirimu. Tulisanmu tetap aman di sini.',
};

const en: typeof id = {
  notAlone: 'You are not alone',
  title: 'It sounds like things are very heavy right now. Someone is ready to listen.',
  defaultBlockedNote: 'Your text is still here and we have not saved it.',
  callToAction: 'If you are in danger, contact one of these. Free and confidential.',
  call: 'Call',
  whatsapp: 'WhatsApp',
  openHelp: 'Open the help page',
  acknowledge: 'I have read this',
  blockedNote: 'This could not be saved because the text mentions something that could harm you. Your text is still safe here.',
};

export const crisisCardText: TextBundle<typeof id> = { id, en };
