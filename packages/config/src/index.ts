import type { 
  AgeBracket, 
  AssessmentQuestion, 
  DailyMission, 
  EmergencyContact, 
  InterventionDomain, 
  WhitelistedAIAction 
} from '@dengarin/types';

/**
 * Verified Indonesian Emergency Contacts & Helplines
 * Grounded in national services, verified non-profit crisis centers, and age-specific protections.
 */
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'kemenkes-sejiwa',
    name: 'Kemenkes Sejiwa (Kementerian Kesehatan RI)',
    category: 'national_emergency',
    phone: '119 ext 8',
    website: 'https://sejiwa.kemkes.go.id',
    availableHours: '24 Jam / 7 Hari',
    cost: 'gratis',
    description: 'Layanan konsultasi kesehatan jiwa resmi Kemenkes RI untuk kondisi krisis dan tekanan mental darurat.',
    targetAgeBrackets: ['15-17', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'lisa-helpline',
    name: 'Lisa Helpline (Love Inside Suicide Awareness)',
    category: 'crisis_hotline',
    phone: '021-3777-5472',
    whatsapp: '0811-381-5472',
    website: 'https://lisahelpline.org',
    availableHours: '24 Jam / 7 Hari (Bilingual ID / EN)',
    cost: 'tarif_standar',
    description: 'Layanan pencegahan bunuh diri dan pendampingan krisis emosional dengan konselor terlatih.',
    targetAgeBrackets: ['15-17', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'yayasan-pulih',
    name: 'Yayasan Pulih',
    category: 'crisis_hotline',
    phone: '021-788-42580',
    whatsapp: '0811-8436-633',
    website: 'https://yayasanpulih.org',
    availableHours: 'Senin–Jumat (09:00–17:00 WIB)',
    cost: 'tarif_standar',
    description: 'Lembaga nirlaba pemulihan trauma, penanganan kekerasan psikososial, dan konseling.',
    targetAgeBrackets: ['18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'kpai-teencare',
    name: 'KPAI & Teencare (Telepon Pelayanan Sosial Anak)',
    category: 'teen_protection',
    phone: '1500-771',
    whatsapp: '0811-177-2273',
    website: 'https://www.kpai.go.id',
    availableHours: 'Senin–Minggu (24 Jam)',
    cost: 'gratis',
    description: 'Layanan pendampingan khusus anak dan remaja (usia di bawah 18 tahun) untuk perlindungan dan kesehatan mental anak.',
    targetAgeBrackets: ['15-17'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'satgas-pasti-ojk',
    name: 'Satgas PASTI / OJK (Pengaduan Pinjol Ilegal & Teror Finansial)',
    category: 'financial_advocacy',
    phone: '157',
    whatsapp: '081-157-157-157',
    website: 'https://konsumen.ojk.go.id',
    availableHours: 'Senin–Jumat (08:00–17:00 WIB)',
    cost: 'gratis',
    description: 'Saluran resmi pengaduan teror penagihan, pinjaman online ilegal, dan penipuan keuangan yang memicu kecemasan finansial.',
    targetAgeBrackets: ['18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  }
];

/**
 * Whitelist of permitted AI actions.
 * Any action not in this list will be rejected by services/validator.
 */
export const WHITELISTED_ACTIONS: readonly WhitelistedAIAction[] = [
  'chat',
  'suggest_mission',
  'open_journal_prompt',
  'suggest_forum',
  'adjust_path',
  'show_help_directory'
] as const;

/**
 * Age Bracket Definitions
 */
export const AGE_BRACKET_CONFIGS: Record<AgeBracket, { label: string; subtext: string; highProtection: boolean }> = {
  '15-17': {
    label: '15–17 Tahun',
    subtext: 'Pelajar SMA / SMK / Sederajat',
    highProtection: true
  },
  '18-24': {
    label: '18–24 Tahun',
    subtext: 'Mahasiswa, Fresh Graduate, Pencari Kerja Awal',
    highProtection: false
  },
  '25-34': {
    label: '25–34 Tahun',
    subtext: 'Pekerja Profesional, Wirausaha, Generasi Sandwich',
    highProtection: false
  },
  '35-54': {
    label: '35–54 Tahun',
    subtext: 'Pekerja, Wirausaha, Tanggung Jawab Rumah Tangga',
    highProtection: false
  }
};

/**
 * Life Context Domains
 */
export const DOMAIN_CONFIGS: Record<InterventionDomain, { label: string; description: string; icon: string }> = {
  school: {
    label: 'Sekolah & Ujian',
    description: 'Tekanan belajar SMA/SMK, ujian nasional/masuk PTN, atau konflik sebaya.',
    icon: 'GraduationCap'
  },
  campus: {
    label: 'Dunia Kampus',
    description: 'Beban tugas, skripsi, adaptasi merantau, atau keraguan jurusan.',
    icon: 'BookOpen'
  },
  work: {
    label: 'Beban Pekerjaan',
    description: 'Burnout, konflik atasan/rekan kerja, beban target, atau kecemasan karir.',
    icon: 'Briefcase'
  },
  finance: {
    label: 'Tekanan Finansial',
    description: 'Kecemasan hutang, teror pinjol, beban generasi sandwich, atau biaya hidup.',
    icon: 'Coins'
  },
  relationship: {
    label: 'Hubungan & Percintaan',
    description: 'Patah hati, putus hubungan, konflik pasangan, atau kesepian.',
    icon: 'HeartHandshake'
  },
  family: {
    label: 'Dinamika Keluarga',
    description: 'Ekspektasi orang tua, konflik internal keluarga, atau beban pengasuhan.',
    icon: 'Home'
  },
  loneliness: {
    label: 'Kesepian & Isolasi',
    description: 'Merasa tidak punya teman bicara atau terasing dari lingkungan sosial.',
    icon: 'Compass'
  },
  general: {
    label: 'Beban Pikiran Umum',
    description: 'Merasa kewalahan namun belum yakin penyebab spesifiknya.',
    icon: 'Sparkles'
  }
};

/**
 * Mandatory Clinical & Legal Disclaimer
 */
export const CLINICAL_DISCLAIMER = 
  'Dengar.in adalah pendamping mandiri berbasis kecerdasan buatan dan BUKAN pengganti psikolog, psikiater, diagnosis medis, atau layanan darurat. Jika Anda berada dalam situasi bahaya mendesak, segera hubungi 119 ext 8.';

/**
 * Occupation & Context options for Onboarding
 */
export const OCCUPATION_OPTIONS = [
  { id: 'pelajar', label: 'Pelajar (SMA / SMK / Sederajat)' },
  { id: 'mahasiswa', label: 'Mahasiswa / Mahasiswi Perguruan Tinggi' },
  { id: 'pekerja_kantor', label: 'Pekerja Profesional / Karyawan Swasta / BUMN' },
  { id: 'wirausaha', label: 'Wirausaha / Pemilik Usaha / Pedagang' },
  { id: 'pencari_kerja', label: 'Pencari Kerja / Fresh Graduate' },
  { id: 'freelancer', label: 'Pekerja Lepas (Freelancer) / Sektor Kreatif' },
  { id: 'rumah_tangga', label: 'Ibu / Bapak Rumah Tangga' },
  { id: 'lainnya', label: 'Lainnya / Memilih Tidak Menyebutkan' }
] as const;

/**
 * Generic Contextual Assessment Questions (Instrument-Agnostic)
 * NOT a clinical diagnostic tool; designed to measure non-clinical distress & context load.
 */
export const GENERIC_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1-strain',
    text: 'Dalam 7 hari terakhir, seberapa sering Anda merasa beban pikiran terasa memberatkan dan menguras energi Anda?',
    category: 'emotional',
    scaleType: 'likert_4',
    options: [
      { value: 0, label: 'Tidak Pernah' },
      { value: 1, label: 'Kadang-kadang' },
      { value: 2, label: 'Cukup Sering' },
      { value: 3, label: 'Hampir Setiap Waktu' }
    ]
  },
  {
    id: 'q2-impact',
    text: 'Seberapa besar masalah yang sedang dihadapi (akademik, kerja, finansial, atau relasi) mengganggu konsentrasi harian Anda?',
    category: 'context_impact',
    scaleType: 'likert_4',
    options: [
      { value: 0, label: 'Sama Sekali Tidak Mengganggu' },
      { value: 1, label: 'Sedikit Mengganggu' },
      { value: 2, label: 'Cukup Mengganggu Fokus' },
      { value: 3, label: 'Sangat Mengganggu Aktivitas Harian' }
    ]
  },
  {
    id: 'q3-rest',
    text: 'Apakah pikiran yang berkecamuk membuat Anda sulit tidur nyenyak atau merasa lelah saat bangun pagi?',
    category: 'daily_functioning',
    scaleType: 'likert_4',
    options: [
      { value: 0, label: 'Tidur Cukup Nyenyak' },
      { value: 1, label: 'Kadang Terbangun / Gelisah' },
      { value: 2, label: 'Sering Sulit Tidur' },
      { value: 3, label: 'Sangat Sulit Istirahat / Insomnia Berat' }
    ]
  },
  {
    id: 'q4-agency',
    text: 'Bagaimana perasaan Anda mengenai harapan atau kemampuan Anda untuk mengurai situasi ini selangkah demi selangkah?',
    category: 'resilience',
    scaleType: 'likert_4',
    options: [
      { value: 0, label: 'Masih Merasa Mampu Mengatasinya' },
      { value: 1, label: 'Cukup Ragu-ragu Namun Masih Berusaha' },
      { value: 2, label: 'Merasa Sangat Lelah & Sulit Melihat Solusi' },
      { value: 3, label: 'Merasa Benar-benar Buntu & Sendirian' }
    ]
  }
];

/**
 * Domain-Specific Daily Mission Blueprints
 * Action-oriented, non-clinical micro-interventions (3-7 mins)
 */
export const DOMAIN_MISSION_TEMPLATES: Record<InterventionDomain, DailyMission> = {
  school: {
    id: 'mission-school-1',
    domain: 'school',
    title: 'Manajemen Ritme Belajar & Pernapasan Kotak',
    summary: 'Menenangkan kecemasan sebelum menghadapi ujian atau tumpukan tugas sekolah.',
    durationMinutes: 5,
    steps: [
      'Tutup buku atau layar sejenak, rilekskan bahu dan rahangmu.',
      'Tarik napas perlahan 4 detik, tahan 4 detik, hembuskan 4 detik, tahan 4 detik (ulangi 3 kali).',
      'Pilih TEPAT SATU tugas kecil yang paling mendesak hari ini. Abaikan sisanya untuk 25 menit ke depan.'
    ],
    reflectionQuestion: 'Apa satu tugas kecil yang akan kamu selesaikan pertama kali setelah ini?',
    completed: false
  },
  campus: {
    id: 'mission-campus-1',
    domain: 'campus',
    title: 'Dekonstruksi Beban Skripsi & Tugas Kuliah',
    summary: 'Mengurai kemacetan berpikir dan rasa kewalahan saat menghadapi dosen atau revisi.',
    durationMinutes: 6,
    steps: [
      'Ambil selembar kertas, tuliskan 1 hambatan utama yang membuatmu menunda skripsi/tugas.',
      'Pecah hambatan tersebut menjadi satu tindakan super kecil (misal: mencari 1 referensi atau menulis 1 paragraf saja).',
      'Minum segelas air putih dan sadari bahwa progres kecil tetaplah progres.'
    ],
    reflectionQuestion: 'Satu kalimat kecil apa yang bisa kamu tuliskan hari ini untuk tugasmu?',
    completed: false
  },
  work: {
    id: 'mission-work-1',
    domain: 'work',
    title: 'Menetapkan Batasan Sehat (Work-Life Boundaries)',
    summary: 'Menjaga kewarasan mental dari tuntutan kantor dan bahaya kelelahan kronis (burnout).',
    durationMinutes: 5,
    steps: [
      'Buat ritual transisi: ambil 3 tarikan napas panjang yang menandakan jam kerjamu telah usai.',
      'Tunda membalas pesan non-darurat kantor hingga jam kerja esok hari.',
      'Katakan pada dirimu: "Pekerjaanku penting, tetapi kesehatan mentalku lebih utama."'
    ],
    reflectionQuestion: 'Bagaimana perasaanmu setelah memberikan jeda pada urusan pekerjaan hari ini?',
    completed: false
  },
  finance: {
    id: 'mission-finance-1',
    domain: 'finance',
    title: 'Grounding Keuangan: Mengurai Cemas Menjadi Data',
    summary: 'Menstabilkan pikiran saat menghadapi tekanan finansial atau kekhawatiran hutang.',
    durationMinutes: 7,
    steps: [
      'Tarik napas panjang. Ingatkan dirimu: "Kondisi finansialku bukan ukuran harga diriku sebagai manusia."',
      'Tuliskan daftar pengeluaran wajib vs yang bisa ditunda tanpa menghakimi diri sendiri.',
      'Jika menghadapi teror penagihan pinjol ilegal, simpan bukti dan ketahuilah ada saluran resmi Satgas PASTI/OJK (157) yang siap melindungimu.'
    ],
    reflectionQuestion: 'Apa satu hal dalam kendalimu hari ini yang bisa membantumu merasa sedikit lebih tenang?',
    completed: false
  },
  relationship: {
    id: 'mission-relationship-1',
    domain: 'relationship',
    title: 'Penyaluran Emosi Tertulis (Surat Tanpa Kirim)',
    summary: 'Menenangkan badai emosi saat mengalami patah hati, konflik, atau salah paham.',
    durationMinutes: 6,
    steps: [
      'Tahan diri untuk tidak mengirim pesan impulsif atau memposting sesuatu saat emosi masih panas.',
      'Tuliskan semua rasa kecewa, marah, atau sedihmu secara bebas di catatan pribadimu.',
      'Simpan atau robek catatan tersebut sebagai simbol bahwa kamu telah melepaskan beban emosi itu.'
    ],
    reflectionQuestion: 'Emosi apa yang paling terasa dominan di hatimu saat ini?',
    completed: false
  },
  family: {
    id: 'mission-family-1',
    domain: 'family',
    title: 'Ruang Tenang Mandiri dari Ketegangan Keluarga',
    summary: 'Memberi jeda emosional dari ekspektasi atau gesekan dinamika di rumah.',
    durationMinutes: 5,
    steps: [
      'Cari ruang tenang (kamar, teras, atau berjalan kaki sebentar) untuk menyendiri selama 5 menit.',
      'Sadari bahwa kamu tidak bertanggung jawab untuk memperbaiki suasana hati semua anggota keluarga.',
      'Fokus pada kebutuhan fisikmu: pastikan kamu sudah makan dan minum dengan cukup hari ini.'
    ],
    reflectionQuestion: 'Hal sederhana apa yang bisa kamu lakukan untuk merawat dirimu sendiri hari ini?',
    completed: false
  },
  loneliness: {
    id: 'mission-loneliness-1',
    domain: 'loneliness',
    title: 'Koneksi Mikro & Kesadaran Kehadiran',
    summary: 'Meringankan rasa hampa dan terasing dengan langkah sederhana menyapa dunia.',
    durationMinutes: 5,
    steps: [
      'Buka jendela atau melangkah ke luar rumah, rasakan hembusan angin dan cahaya sekitar selama 2 menit.',
      'Kirimkan satu pesan singkat yang tulus kepada seorang teman, atau sapa seseorang dengan senyum ramah.',
      'Ingatlah bahwa kesepian adalah pengalaman yang dirasakan oleh jutaan orang lain saat ini — kamu tidak aneh.'
    ],
    reflectionQuestion: 'Siapa satu orang yang terlintas di pikiranmu saat membaca ini?',
    completed: false
  },
  general: {
    id: 'mission-general-1',
    domain: 'general',
    title: 'Latihan Stabilisasi Napas 4-7-8 & Orientasi Ruang',
    summary: 'Menenangkan sistem saraf tubuh saat pikiran terasa penuh dan berantakan.',
    durationMinutes: 5,
    steps: [
      'Duduk bersandar tegak namun rileks. Tarik napas melalui hidung 4 detik.',
      'Tahan napasmu selama 7 detik tanpa tegang.',
      'Hembuskan napas panjang melalui mulut selama 8 detik. Ulangi siklus ini 3–4 kali.',
      'Sebutkan 3 benda nyata di sekitarmu yang bisa kamu lihat dengan jelas.'
    ],
    reflectionQuestion: 'Apakah sensasi di dada atau kepalamu terasa sedikit lebih lapang sekarang?',
    completed: false
  }
};
