import type { TextBundle } from './language';

/**
 * Teks bersama (navigasi, footer, akses cepat, tombol umum). Teks per halaman
 * ada di ./pages/*.ts. Pola: `id` ditulis dulu, `en` bertipe `typeof id`.
 */

const id = {
  skipToContent: 'Langsung ke konten utama',
  brand: 'Dengar.in',
  anonymous: '100% anonim',
  loading: 'Memuat...',
  preparingRoom: 'Menyiapkan ruangmu...',
  back: 'Kembali',
  cancel: 'Batal',
  close: 'Tutup',
  save: 'Simpan',
  next: 'Lanjut',
  done: 'Selesai',
  thisPage: 'Halaman ini',

  nav: {
    main: 'Navigasi utama',
    bottom: 'Navigasi bawah',
    mobileMenu: 'Menu seluler',
    brandHome: 'Dengar.in, ke halaman depan',
    chat: 'Ngobrol',
    chatMenu: 'Pilih cara ngobrol',
    chatMenuClose: 'Tutup pilihan cara ngobrol',
    chatWrite: 'Tulis',
    chatWriteHint: 'Ngobrol lewat pesan teks',
    chatVoice: 'Suara',
    chatVoiceHint: 'Ngobrol dengan berbicara langsung',
    chatWriteFull: 'Ngobrol: tulis pesan',
    chatVoiceFull: 'Ngobrol: pakai suara',
    home: 'Beranda',
    mission: 'Misi',
    checkin: 'Check-in',
    journal: 'Jurnal',
    forum: 'Ruang Cerita',
    carePassport: 'Catatan Konsultasi',
    resources: 'Bantuan & Kontak Resmi',
    help: 'Bantuan',
    helpFull: 'Bantuan dan kontak resmi',
    emergency: 'Darurat',
    emergencyFull: 'Bantuan darurat',
    emergencyAria: 'Bantuan darurat: hubungi layanan krisis',
    emergencyMobile: 'Hubungi bantuan darurat (119 ext 8)',
    journey: 'Perjalanan Kecil',
    report: 'Refleksi Mingguan',
    recovery: 'Simpan / Pulihkan Sesi (kunci 12 bagian)',
    wipe: 'Hapus Data di Perangkat Ini',
    pickPage: 'Pilih halaman yang ingin dibuka',
    menu: 'Menu',
    openMenu: 'Buka menu lengkap',
    closeMenu: 'Tutup menu lengkap',
  },

  quickExit: {
    label: 'Keluar Cepat',
    labelEsc: 'Keluar Cepat (Esc)',
    title: 'Keluar Cepat: langsung pindah ke halaman netral (atau tekan tombol Esc)',
    aria: 'Keluar Cepat, pindah ke halaman netral (tekan Esc)',
  },

  language: {
    legend: 'Bahasa / Language',
    hint: 'Teks aplikasi ikut bahasa ini. Nomor darurat tetap nomor Indonesia.',
    change: 'Ganti bahasa / Change language',
    current: 'Bahasa saat ini',
  },

  a11y: {
    button: 'Akses cepat',
    buttonAria: 'Akses cepat: pilih bahasa, atur ukuran teks, kontras, dan animasi',
    title: 'Akses cepat',
    subtitle: 'Atur tampilan sesuai kenyamananmu.',
    close: 'Tutup akses cepat',
    textSize: 'Ukuran teks',
    sizes: { normal: 'Biasa', large: 'Besar', larger: 'Lebih besar', largest: 'Sangat besar' },
    contrast: 'Kontras tinggi',
    contrastHint: 'Teks abu-abu jadi hitam pekat',
    underline: 'Garis bawah tautan',
    underlineHint: 'Tautan lebih mudah dikenali',
    spacing: 'Jarak baca lega',
    spacingHint: 'Jarak huruf dan baris lebih longgar',
    reduceMotion: 'Hentikan animasi',
    reduceMotionHint: 'Tanpa gerakan dan efek muncul',
    reset: 'Kembalikan ke tampilan awal',
    storedLocally: 'Disimpan di perangkat ini saja.',
  },

  footer: {
    tagline:
      'Teman cerita anonim yang mendengarkan tanpa menghakimi. Menemanimu memahami beban pikiran (sekolah, kampus, kerja, uang) dan mengambil langkah kecil yang aman.',
    noSignup: 'Tanpa daftar akun, tanpa email, tanpa nomor HP.',
    links: 'Akses mandiri',
    emergency: 'Kontak darurat',
    recoveryKey: 'Kunci Pemulihan (12 Bagian)',
    legalTitle: 'Batasan medis dan hukum:',
    legalA: 'Dengar.in adalah pendamping mandiri,',
    legalB: 'bukan pengganti psikolog, psikiater, layanan darurat, atau penasihat keuangan/hukum berizin',
    legalC:
      '. Dengar.in tidak memberi diagnosis atau resep obat. Jika kamu dalam bahaya mendesak atau punya pikiran untuk mengakhiri hidup, segera hubungi',
    legalLink: 'Healing119 di 119 ext 8',
    legalD: 'atau datang ke puskesmas, klinik, atau rumah sakit terdekat.',
    copyright: '© 2026 Dengar.in',
    credit: 'Website by Kata Justin Nama Timnya Gokil Udah (Telkom University Surabaya)',
  },

  /**
   * Nomor darurat tetap nomor Indonesia di kedua bahasa; yang berubah hanya
   * nama lembaga dan penjelasannya (dicocokkan lewat id kontak di
   * packages/config). Jam layanan dan biaya mengikuti sumber resmi yang sama.
   */
  contacts: {
    'healing119-kemenkes': {
      name: 'Healing119 (Kemenkes)',
      short: 'Healing119 (Kemenkes)',
      hours: 'Pagi sampai malam',
      description: 'Hotline kesehatan jiwa dan pencegahan bunuh diri dari Kementerian Kesehatan. Tanpa perlu menyebut nama. Chat WhatsApp lewat healing119.id.',
    },
    'lisa-helpline': {
      name: 'LISA Helpline (Bali Bersama Bisa Foundation)',
      short: 'LISA Helpline (WhatsApp)',
      hours: 'Sesi online terjadwal, bisa masuk daftar tunggu (ID / EN)',
      description: 'Dukungan emosional dan pencegahan bunuh diri lewat WhatsApp oleh pendengar terlatih, dalam bahasa Indonesia atau Inggris.',
    },
    'yayasan-pulih': {
      name: 'Yayasan Pulih',
      short: 'Yayasan Pulih',
      hours: 'Hari dan jam kerja',
      description: 'Lembaga nirlaba untuk pemulihan trauma, kekerasan, dan konseling.',
    },
    'tepsa-kemensos': {
      name: 'TePSA Kemensos (Telepon Pelayanan Sosial Anak)',
      short: 'TePSA Kemensos (anak, 15-17 th)',
      hours: 'Jam layanan: tanyakan saat menelepon',
      description: 'Layanan telepon khusus anak dan remaja di bawah 18 tahun dari Kementerian Sosial: konseling, pengaduan, tanggap darurat, dan rujukan.',
    },
    'kpai-pengaduan': {
      name: 'KPAI (Komisi Perlindungan Anak Indonesia)',
      short: 'KPAI',
      hours: 'Jam layanan: tanyakan saat menghubungi',
      description: 'Saluran pengaduan resmi untuk perlindungan anak di bawah 18 tahun.',
    },
    'satgas-pasti-ojk': {
      name: 'Kontak OJK 157 (Pengaduan Pinjol Ilegal & Teror Finansial)',
      short: 'Kontak OJK (pinjol ilegal)',
      hours: 'Telepon 24 jam setiap hari; WA Senin-Minggu 07.45-16.50 WIB',
      description: 'Saluran resmi OJK untuk pengaduan teror penagihan, pinjol ilegal, dan penipuan keuangan.',
    },
  },
  cost: { gratis: 'Gratis', tarif_standar: 'Tarif telepon biasa' },

  /** Disclaimer yang tampil di UI (artinya sama dengan CLINICAL_DISCLAIMER di packages/config). */
  disclaimer:
    'Dengar.in adalah pendamping mandiri berbasis AI dan BUKAN pengganti psikolog, psikiater, diagnosis medis, atau layanan darurat. Jika kamu dalam bahaya mendesak, segera hubungi 119 ext 8.',

  notFound: {
    title: 'Halaman tidak ditemukan',
    body: 'Tautan ini mungkin salah ketik atau halamannya sudah dipindah.',
    home: 'Ke halaman depan',
  },
};

const en: typeof id = {
  skipToContent: 'Skip to main content',
  brand: 'Dengar.in',
  anonymous: '100% anonymous',
  loading: 'Loading...',
  preparingRoom: 'Getting your space ready...',
  back: 'Back',
  cancel: 'Cancel',
  close: 'Close',
  save: 'Save',
  next: 'Next',
  done: 'Done',
  thisPage: 'This page',

  nav: {
    main: 'Main navigation',
    bottom: 'Bottom navigation',
    mobileMenu: 'Mobile menu',
    brandHome: 'Dengar.in, go to the front page',
    chat: 'Talk',
    chatMenu: 'Choose how to talk',
    chatMenuClose: 'Close the talk options',
    chatWrite: 'Type',
    chatWriteHint: 'Talk by typing messages',
    chatVoice: 'Voice',
    chatVoiceHint: 'Talk by speaking out loud',
    chatWriteFull: 'Talk: type a message',
    chatVoiceFull: 'Talk: use your voice',
    home: 'Home',
    mission: 'Mission',
    checkin: 'Check-in',
    journal: 'Journal',
    forum: 'Story Room',
    carePassport: 'Consultation Notes',
    resources: 'Help & Official Contacts',
    help: 'Help',
    helpFull: 'Help and official contacts',
    emergency: 'Emergency',
    emergencyFull: 'Emergency help',
    emergencyAria: 'Emergency help: contact a crisis line',
    emergencyMobile: 'Call emergency help (119 ext 8)',
    journey: 'Small Journey',
    report: 'Weekly Reflection',
    recovery: 'Save / Restore Session (12-part key)',
    wipe: 'Delete Data on This Device',
    pickPage: 'Choose a page to open',
    menu: 'Menu',
    openMenu: 'Open full menu',
    closeMenu: 'Close full menu',
  },

  quickExit: {
    label: 'Quick Exit',
    labelEsc: 'Quick Exit (Esc)',
    title: 'Quick Exit: jump to a neutral page right away (or press Esc)',
    aria: 'Quick Exit, go to a neutral page (press Esc)',
  },

  language: {
    legend: 'Bahasa / Language',
    hint: 'The app text follows this language. Emergency numbers stay Indonesian.',
    change: 'Ganti bahasa / Change language',
    current: 'Current language',
  },

  a11y: {
    button: 'Quick access',
    buttonAria: 'Quick access: choose language, set text size, contrast, and animation',
    title: 'Quick access',
    subtitle: 'Set the display the way you like it.',
    close: 'Close quick access',
    textSize: 'Text size',
    sizes: { normal: 'Normal', large: 'Large', larger: 'Larger', largest: 'Largest' },
    contrast: 'High contrast',
    contrastHint: 'Grey text becomes solid black',
    underline: 'Underline links',
    underlineHint: 'Links are easier to spot',
    spacing: 'Roomy reading',
    spacingHint: 'Looser letter and line spacing',
    reduceMotion: 'Stop animation',
    reduceMotionHint: 'No movement or reveal effects',
    reset: 'Reset to default display',
    storedLocally: 'Stored on this device only.',
  },

  footer: {
    tagline:
      'An anonymous listening companion that never judges. It helps you understand what is weighing on you (school, campus, work, money) and take small, safe steps.',
    noSignup: 'No sign-up, no email, no phone number.',
    links: 'Self-help',
    emergency: 'Emergency contacts',
    recoveryKey: 'Recovery Key (12 Parts)',
    legalTitle: 'Medical and legal limits:',
    legalA: 'Dengar.in is a self-help companion,',
    legalB: 'not a replacement for a psychologist, psychiatrist, emergency service, or licensed financial/legal adviser',
    legalC:
      '. Dengar.in does not give diagnoses or prescriptions. If you are in immediate danger or thinking about ending your life, call',
    legalLink: 'Healing119 at 119 ext 8',
    legalD: 'or go to the nearest hospital or community health centre (puskesmas).',
    copyright: '© 2026 Dengar.in',
    credit: 'Website by Kata Justin Nama Timnya Gokil Udah (Telkom University Surabaya)',
  },

  contacts: {
    'healing119-kemenkes': {
      name: 'Healing119 (Ministry of Health)',
      short: 'Healing119 (Ministry of Health)',
      hours: 'Morning to night',
      description: 'The Indonesian Ministry of Health mental-health and suicide-prevention hotline. No need to give your name. WhatsApp chat via healing119.id.',
    },
    'lisa-helpline': {
      name: 'LISA Helpline (Bali Bersama Bisa Foundation)',
      short: 'LISA Helpline (WhatsApp)',
      hours: 'Scheduled online sessions, there may be a waiting list (ID / EN)',
      description: 'Emotional support and suicide prevention over WhatsApp from trained listeners, in Indonesian or English.',
    },
    'yayasan-pulih': {
      name: 'Yayasan Pulih',
      short: 'Yayasan Pulih',
      hours: 'Working days and hours',
      description: 'A non-profit for trauma recovery, violence support, and counselling.',
    },
    'tepsa-kemensos': {
      name: 'TePSA (Ministry of Social Affairs child helpline)',
      short: 'TePSA (children, 15-17)',
      hours: 'Service hours: ask when you call',
      description: 'A phone line for children and teens under 18 from the Ministry of Social Affairs: counselling, complaints, emergency response, and referrals.',
    },
    'kpai-pengaduan': {
      name: 'KPAI (Indonesian Child Protection Commission)',
      short: 'KPAI',
      hours: 'Service hours: ask when you get in touch',
      description: 'The official complaint line for the protection of children under 18.',
    },
    'satgas-pasti-ojk': {
      name: 'OJK Contact 157 (illegal online loans and debt harassment)',
      short: 'OJK Contact (illegal online loans)',
      hours: 'Phone 24 hours every day; WhatsApp Mon-Sun 07.45-16.50 WIB',
      description: 'The official OJK (financial regulator) line for reporting debt-collector harassment, illegal online loans, and financial scams.',
    },
  },
  cost: { gratis: 'Free', tarif_standar: 'Standard call rates' },

  disclaimer:
    'Dengar.in is an AI-based self-help companion and NOT a replacement for a psychologist, psychiatrist, medical diagnosis, or emergency service. If you are in immediate danger, call 119 ext 8 right away.',

  notFound: {
    title: 'Page not found',
    body: 'The link may be mistyped, or the page has moved.',
    home: 'Go to the front page',
  },
};

export const commonText: TextBundle<typeof id> = { id, en };

export type ContactTextId = keyof typeof id.contacts;

/** Teks kontak darurat sesuai bahasa; id yang tidak dikenal kembali ke data config. */
export function contactText(lang: 'id' | 'en', contactId: string) {
  const table = commonText[lang].contacts as Record<string, (typeof id.contacts)[ContactTextId] | undefined>;
  return table[contactId];
}
