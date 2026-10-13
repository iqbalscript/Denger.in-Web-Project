import type { TextBundle } from '../language';

const id = {
  backHome: 'Kembali ke beranda',
  deviceOnly: 'Hanya tersimpan di perangkat ini',
  titleA: 'Tulis',
  titleB: 'aja.',
  intro:
    'Gak perlu rapi, gak perlu benar. Tulis apa adanya. Tulisanmu tidak dikirim ke AI. Tulisan ini tersimpan di perangkat ini, dan hanya ikut ke server kalau kamu sendiri menyimpan salinan terenkripsi.',
  newEntry: 'Tulis catatan baru',
  newEntryTitle: 'Catatan baru',
  close: 'Tutup',
  titleLabel: 'Judul (boleh dikosongkan)',
  titlePlaceholder: 'Contoh: Pikiran kusut sepulang kantor...',
  contentLabel: 'Isi tulisan',
  contentPlaceholder: 'Keluarkan keluh kesahmu di sini. Tidak ada yang menilai...',
  cancel: 'Batal',
  save: 'Simpan di perangkat ini',
  defaultTitle: 'Catatan harian',
  listTitle: 'Catatan tersimpan',
  empty: 'Belum ada tulisan di sini, dan itu tidak apa-apa. Kapan pun kamu siap, satu kalimat saja sudah cukup.',
  writeFirst: 'Tulis kalimat pertama',
  delete: 'Hapus',
  deleteAria: (title: string) => `Hapus catatan ${title}`,
  confirmGroup: 'Konfirmasi hapus catatan',
  confirmText: 'Hapus catatan ini? Tidak bisa dikembalikan.',
  confirmYes: 'Ya, hapus',
};

const en: typeof id = {
  backHome: 'Back to home',
  deviceOnly: 'Stored on this device only',
  titleA: 'Just',
  titleB: 'write.',
  intro:
    'No need to be neat or correct. Write it as it is. Your writing is not sent to the AI. It stays on this device, and only goes to the server if you save an encrypted copy yourself.',
  newEntry: 'Write a new entry',
  newEntryTitle: 'New entry',
  close: 'Close',
  titleLabel: 'Title (optional)',
  titlePlaceholder: 'Example: Tangled thoughts after work...',
  contentLabel: 'Your writing',
  contentPlaceholder: 'Let it all out here. Nobody is judging...',
  cancel: 'Cancel',
  save: 'Save on this device',
  defaultTitle: 'Daily entry',
  listTitle: 'Saved entries',
  empty: 'Nothing written here yet, and that is okay. Whenever you are ready, one sentence is enough.',
  writeFirst: 'Write the first sentence',
  delete: 'Delete',
  deleteAria: (title) => `Delete entry ${title}`,
  confirmGroup: 'Confirm entry deletion',
  confirmText: 'Delete this entry? This cannot be undone.',
  confirmYes: 'Yes, delete',
};

export const journalText: TextBundle<typeof id> = { id, en };
