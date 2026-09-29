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
  /** Nomor tahap utama (1–3), atau null untuk pesan "masih menunggu". */
  step: 1 | 2 | 3 | null;
}

export const CHAT_PROGRESS_TOTAL_STEPS = 3;

export const CHAT_PROGRESS_STAGES: readonly ChatProgressStage[] = [
  { afterMs: 0, label: 'Memahami ceritamu...', step: 1 },
  { afterMs: 2_500, label: 'Menyiapkan respons...', step: 2 },
  { afterMs: 7_000, label: 'Memeriksa keamanan respons...', step: 3 },
  { afterMs: 15_000, label: 'Masih dikerjakan, sebentar lagi ya...', step: null },
  { afterMs: 28_000, label: 'Lebih lama dari biasanya. Kamu bisa tunggu sebentar lagi, atau kirim ulang nanti.', step: null },
];

/** Tahap yang berlaku pada waktu berjalan tertentu. */
export function chatProgressStageAt(elapsedMs: number): ChatProgressStage {
  let current = CHAT_PROGRESS_STAGES[0];
  for (const stage of CHAT_PROGRESS_STAGES) {
    if (elapsedMs >= stage.afterMs) current = stage;
  }
  return current;
}
