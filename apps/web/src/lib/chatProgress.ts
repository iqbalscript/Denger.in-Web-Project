import type { Language } from '../i18n/language.ts';

/**
 * Progress semantik untuk balasan chat.
 *
 * /api/chat adalah SATU request yang bisa memanggil dua provider AI berurutan
 * (Tier 1 lalu Tier 2) sebelum jawabannya divalidasi, jadi bisa makan belasan
 * detik. Indikator "mengetik" saja terasa seperti aplikasinya hang. Server tidak
 * mengirim progress sungguhan (bukan streaming), maka tahapnya mengikuti urutan
 * kerja server dan pindah berdasarkan waktu berjalan. Urutan itu sama dengan
 * pipeline aslinya: crisis gate -> AI -> validasi respons.
 */
export interface ChatProgressStage {
  /** Muncul setelah sekian milidetik sejak pesan dikirim. */
  afterMs: number;
  label: string;
  /** Nomor tahap utama (1-3), atau null untuk pesan "masih menunggu". */
  step: 1 | 2 | 3 | null;
}

export const CHAT_PROGRESS_TOTAL_STEPS = 3;

export const CHAT_PROGRESS_STAGES: readonly ChatProgressStage[] = [
  { afterMs: 0, label: 'Memahami ceritamu...', step: 1 },
  { afterMs: 2_500, label: 'Menyiapkan balasan...', step: 2 },
  { afterMs: 7_000, label: 'Mengecek keamanan balasan...', step: 3 },
  { afterMs: 15_000, label: 'Masih dikerjakan, sebentar lagi ya...', step: null },
  { afterMs: 28_000, label: 'Lebih lama dari biasanya. Kamu bisa tunggu sebentar lagi, atau kirim ulang nanti.', step: null },
];

/** Tahap yang sama dengan label Inggris (waktu dan nomor tahap identik). */
export const CHAT_PROGRESS_STAGES_EN: readonly ChatProgressStage[] = [
  { afterMs: 0, label: 'Reading your message...', step: 1 },
  { afterMs: 2_500, label: 'Preparing a reply...', step: 2 },
  { afterMs: 7_000, label: 'Checking the reply is safe...', step: 3 },
  { afterMs: 15_000, label: 'Still working on it, almost there...', step: null },
  { afterMs: 28_000, label: 'Taking longer than usual. You can wait a bit more, or send again later.', step: null },
];

/** Tahap yang berlaku pada waktu berjalan tertentu. */
export function chatProgressStageAt(elapsedMs: number, lang: Language = 'id'): ChatProgressStage {
  const stages = lang === 'en' ? CHAT_PROGRESS_STAGES_EN : CHAT_PROGRESS_STAGES;
  let current = stages[0];
  for (const stage of stages) {
    if (elapsedMs >= stage.afterMs) current = stage;
  }
  return current;
}
