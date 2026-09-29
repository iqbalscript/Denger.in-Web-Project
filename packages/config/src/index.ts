import type { 
  AgeBracket, 
  PRDAgeBracket,
  AssessmentQuestion, 
  DailyMission, 
  EmergencyContact, 
  InterventionDomain, 
  TopicPillarId,
  TopicPillarConfig,
  AdaptiveAssessmentQuestion,
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
    targetAgeBrackets: ['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
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
    targetAgeBrackets: ['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
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
    targetAgeBrackets: ['18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
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
    targetAgeBrackets: ['18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
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
 * PRD 2.0 Target Age Bracket Definitions
 * With explicit rationale explaining why age is requested.
 */
export const PRD_AGE_BRACKET_CONFIGS: Record<
  PRDAgeBracket, 
  { id: PRDAgeBracket; label: string; subtext: string; rationale: string; highProtection: boolean; accessibilityMode?: boolean }
> = {
  '15-17': {
    id: '15-17',
    label: '15–17 Tahun',
    subtext: 'Pelajar Remaja (Perlindungan Khusus Anak)',
    rationale: 'Rentang usia ini mengaktifkan bahasa yang ramah remaja, materi empati sebaya, serta integrasi saluran darurat anak (Teencare & KPAI).',
    highProtection: true
  },
  '18-29': {
    id: '18-29',
    label: '18–29 Tahun',
    subtext: 'Mahasiswa, Fresh Graduate, Karier Awal',
    rationale: 'Pembahasan disesuaikan dengan masa peralihan: mulai mandiri, tekanan kuliah, awal karier, dan mencari jati diri.',
    highProtection: false
  },
  '30-49': {
    id: '30-49',
    label: '30–49 Tahun',
    subtext: 'Pekerja Profesional, Wirausaha, Berkeluarga',
    rationale: 'Pembahasan disesuaikan dengan tanggung jawab ekonomi keluarga, tekanan di karier yang sudah mapan, dan beban generasi sandwich (menanggung anak sekaligus orang tua).',
    highProtection: false
  },
  '50+': {
    id: '50+',
    label: '50+ Tahun',
    subtext: 'Senior / Lansia / Prapensiun (Mode Aksesibilitas Teks Besar)',
    rationale: 'Teks lebih besar dan mudah dibaca, tampilan tenang tanpa tekanan waktu, dan topik seputar ketenangan hidup.',
    highProtection: false,
    accessibilityMode: true
  }
};

/**
 * Universal Age Bracket Definitions (Including legacy compatibility)
 */
export const AGE_BRACKET_CONFIGS: Record<AgeBracket, { label: string; subtext: string; highProtection: boolean }> = {
  '15-17': {
    label: '15–17 Tahun',
    subtext: 'Pelajar SMA / SMK / Sederajat (Khusus Remaja)',
    highProtection: true
  },
  '18-29': {
    label: '18–29 Tahun',
    subtext: 'Mahasiswa, Fresh Graduate, Karier Awal',
    highProtection: false
  },
  '30-49': {
    label: '30–49 Tahun',
    subtext: 'Pekerja Profesional, Wirausaha, Berkeluarga',
    highProtection: false
  },
  '50+': {
    label: '50+ Tahun',
    subtext: 'Senior / Lansia / Prapensiun',
    highProtection: false
  },
  '18-24': {
    label: '18–24 Tahun',
    subtext: 'Mahasiswa, Fresh Graduate, Karier Awal',
    highProtection: false
  },
  '25-34': {
    label: '25–34 Tahun',
    subtext: 'Pekerja Profesional, Generasi Sandwich',
    highProtection: false
  },
  '35-54': {
    label: '35–54 Tahun',
    subtext: 'Pekerja Senior, Tanggung Jawab Rumah Tangga',
    highProtection: false
  }
};

/**
 * PRD 2.0 Primary Topic Pillars with Explicit Mapping to Life-Context Domains
 */
export const TOPIC_PILLARS: Record<TopicPillarId, TopicPillarConfig> = {
  finance: {
    id: 'finance',
    label: 'Tekanan Finansial & Utang',
    tagline: 'Pelan-pelan mengurai cemas soal biaya hidup, cicilan, dan tekanan ekonomi keluarga.',
    description: 'Ruang aman untuk bercerita tentang utang, pinjaman, nafkah keluarga, atau cemas soal masa depan. Kamu tidak perlu malu, dan tidak akan dihakimi.',
    icon: 'Coins',
    mappedDomains: ['finance', 'work'],
    primaryDomain: 'finance',
    isSensitive: false
  },
  trauma: {
    id: 'trauma',
    label: 'Beban Emosional & Trauma Masa Lalu',
    tagline: 'Merawat luka batin, rasa ditolak, rasa bersalah, dan duka yang dalam, sepelan yang kamu mau.',
    description: 'Dukungan bertahap untuk memproses kenangan yang menyakitkan atau dinamika keluarga yang membekas, dengan kecepatanmu sendiri. Kamu boleh berhenti kapan saja.',
    icon: 'HeartHandshake',
    mappedDomains: ['family', 'loneliness', 'general'],
    primaryDomain: 'family',
    isSensitive: true
  },
  sexual_violence: {
    id: 'sexual_violence',
    label: 'Penyintas Kekerasan Seksual & Hubungan Toksik',
    tagline: 'Ruang privat yang penuh hormat untuk memulihkan kendali atas dirimu.',
    description: 'Pendampingan yang menghormati keputusanmu sepenuhnya. Apa pun yang terjadi, itu bukan salahmu. Tersedia rujukan langsung ke pendamping profesional tersertifikasi.',
    icon: 'ShieldCheck',
    mappedDomains: ['relationship', 'general'],
    primaryDomain: 'relationship',
    isSensitive: true
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
    description: 'Burnout, konflik atasan/rekan kerja, beban target, atau kecemasan karier.',
    icon: 'Briefcase'
  },
  finance: {
    label: 'Tekanan Finansial',
    description: 'Kecemasan utang, teror pinjol, beban generasi sandwich, atau biaya hidup.',
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
    description: 'Merasa kewalahan tapi belum tahu penyebabnya, dan itu juga boleh.',
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
 * PRD 2.0 Adaptive Assessment Question Catalog
 * Non-diagnostic, one-question-per-screen, supporting dynamic branching and sensitive skippable controls.
 */
export const ADAPTIVE_ASSESSMENT_QUESTIONS: AdaptiveAssessmentQuestion[] = [
  {
    id: 'root-emotional-strain',
    topic: 'general',
    text: 'Dalam 7 hari terakhir, seberapa sering beban pikiran atau kelelahan emosional terasa menguras energimu?',
    subtext: 'Pilih kondisi yang paling mendekati apa yang Anda alami secara nyata.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'emotional_load',
    defaultNextQuestionId: 'topic-context-q',
    options: [
      { id: 'opt-strain-0', label: 'Jarang terasa / pikiran relatif tenang dan stabil', score: 0, nextQuestionId: 'topic-context-q' },
      { id: 'opt-strain-1', label: 'Kadang terasa memberatkan, namun masih bisa diatasi', score: 1, nextQuestionId: 'topic-context-q' },
      { id: 'opt-strain-2', label: 'Cukup sering menguras fokus dan semangat harian', score: 2, nextQuestionId: 'topic-context-q' },
      { id: 'opt-strain-3', label: 'Hampir setiap saat terasa sangat menekan dan melelahkan', score: 3, nextQuestionId: 'topic-context-q' }
    ]
  },
  {
    id: 'context-finance',
    topic: 'finance',
    text: 'Seberapa jauh kekhawatiran seputar kondisi finansial atau kewajiban utang memengaruhi rasa aman batin Anda?',
    subtext: 'Kondisi finansial bukan ukuran harga diri Anda sebagai manusia.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'context_impact',
    defaultNextQuestionId: 'functioning-impact',
    options: [
      { id: 'opt-fin-0', label: 'Masih dalam kendali wajar dan memiliki rencana langkah demi langkah', score: 0, nextQuestionId: 'functioning-impact' },
      { id: 'opt-fin-1', label: 'Cukup mengkhawatirkan namun masih ada jalan keluar yang bisa dicoba', score: 1, nextQuestionId: 'functioning-impact' },
      { id: 'opt-fin-2', label: 'Sering cemas saat memikirkan tagihan atau kelangsungan hari esok', score: 2, nextQuestionId: 'functioning-impact' },
      { id: 'opt-fin-3', label: 'Merasa sangat terkepung, buntu, dan kewalahan memikul beban ini', score: 3, nextQuestionId: 'functioning-impact' }
    ]
  },
  {
    id: 'context-trauma',
    topic: 'trauma',
    text: 'Ketika memori atau beban emosional masa lalu yang menyakitkan muncul, seberapa intens hal itu memicu rasa sesak atau gelisah?',
    subtext: 'Anda berada di ruang aman dan berdaya. Pertanyaan ini dapat Anda lewati tanpa memengaruhi akses layanan.',
    sensitive: true,
    skippable: true,
    scoringCategory: 'context_impact',
    defaultNextQuestionId: 'functioning-impact',
    options: [
      { id: 'opt-tr-0', label: 'Jarang memicu emosi berat dan lekas mereda dengan tenang', score: 0, nextQuestionId: 'functioning-impact' },
      { id: 'opt-tr-1', label: 'Kadang mengganggu sejenak, namun perlahan bisa kembali tenang', score: 1, nextQuestionId: 'functioning-impact' },
      { id: 'opt-tr-2', label: 'Cukup intens hingga membuat tubuh tegang dan membutuhkan jeda panjang', score: 2, nextQuestionId: 'functioning-impact' },
      { id: 'opt-tr-3', label: 'Sangat menguras tenaga dan membuat saya merasa terpuruk atau terasing', score: 3, nextQuestionId: 'functioning-impact' }
    ]
  },
  {
    id: 'context-sexual-violence',
    topic: 'sexual_violence',
    text: 'Dalam menjalani hari atau berinteraksi, seberapa besar rasa cemas akan batasan pribadi atau rasa sulit mempercayai sekitar membebanimu?',
    subtext: 'Otonomi dan keselamatanmu adalah prioritas mutlak. Pertanyaan ini dapat Anda lewati kapan saja.',
    sensitive: true,
    skippable: true,
    scoringCategory: 'context_impact',
    defaultNextQuestionId: 'functioning-impact',
    options: [
      { id: 'opt-sv-0', label: 'Merasa memiliki kendali sehat atas batasan diri dan merasa aman', score: 0, nextQuestionId: 'functioning-impact' },
      { id: 'opt-sv-1', label: 'Terkadang waspada namun masih bisa berbaur secara wajar', score: 1, nextQuestionId: 'functioning-impact' },
      { id: 'opt-sv-2', label: 'Sering merasa tidak aman dan cenderung menarik diri dari sekitar', score: 2, nextQuestionId: 'functioning-impact' },
      { id: 'opt-sv-3', label: 'Merasa sangat rentan, terancam, atau sulit mempercayai siapapun saat ini', score: 3, nextQuestionId: 'functioning-impact' }
    ]
  },
  {
    id: 'context-general',
    topic: 'general',
    text: 'Seberapa besar masalah yang sedang dihadapi mengaburkan fokus dan kenyamanan pikiran Anda saat ini?',
    subtext: 'Ambil jeda sejenak untuk mengenali apa yang sedang dialami tubuh dan pikiran.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'context_impact',
    defaultNextQuestionId: 'functioning-impact',
    options: [
      { id: 'opt-gen-0', label: 'Sama sekali tidak mengganggu fokus dan ketenangan harian', score: 0, nextQuestionId: 'functioning-impact' },
      { id: 'opt-gen-1', label: 'Sedikit mengganggu namun masih bisa beraktivitas dengan baik', score: 1, nextQuestionId: 'functioning-impact' },
      { id: 'opt-gen-2', label: 'Cukup mengganggu dan membuat sering melamun atau cemas', score: 2, nextQuestionId: 'functioning-impact' },
      { id: 'opt-gen-3', label: 'Sangat mengganggu hingga sulit menyelesaikan rutinitas harian', score: 3, nextQuestionId: 'functioning-impact' }
    ]
  },
  {
    id: 'functioning-impact',
    topic: 'general',
    text: 'Apakah pikiran yang berkecamuk membuat Anda sulit tidur nyenyak, gelisah saat istirahat, atau merasa lelah saat bangun pagi?',
    subtext: 'Kualitas istirahat sering mencerminkan seberapa tegang tubuh dan pikiranmu.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'functional_impact',
    defaultNextQuestionId: 'support-readiness',
    options: [
      { id: 'opt-func-0', label: 'Tidur dan istirahat masih cukup nyenyak serta menyegarkan', score: 0, nextQuestionId: 'support-readiness' },
      { id: 'opt-func-1', label: 'Kadang terbangun atau sedikit gelisah sebelum terlelap', score: 1, nextQuestionId: 'support-readiness' },
      { id: 'opt-func-2', label: 'Sering sulit tidur dan bangun dalam kondisi lelah berkepanjangan', score: 2, nextQuestionId: 'support-readiness' },
      { id: 'opt-func-3', label: 'Sangat sulit tidur nyenyak (insomnia berat) dan energi terasa habis', score: 3, nextQuestionId: 'support-readiness' }
    ]
  },
  {
    id: 'support-readiness',
    topic: 'general',
    text: 'Bentuk ruang dukungan seperti apa yang paling Anda harapkan untuk mendampingi Anda saat ini?',
    subtext: 'Jawaban Anda membantu kami merekomendasikan ruang pendampingan yang paling tepat dan tidak membebani.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'support_readiness',
    defaultNextQuestionId: null,
    options: [
      { id: 'opt-supp-0', label: 'Latihan mandiri perlahan & ruang jurnal refleksi privat', score: 0, nextQuestionId: null },
      { id: 'opt-supp-1', label: 'Misi harian dan ruang cerita anonim bersama sesama', score: 1, nextQuestionId: null },
      { id: 'opt-supp-2', label: 'Panduan mengelola emosi & opsi konsultasi profesional', score: 2, nextQuestionId: null },
      { id: 'opt-supp-3', label: 'Diarahkan ke tenaga profesional / bantuan darurat', score: 3, nextQuestionId: null }
    ]
  }
];

/**
 * Pure non-diagnostic triage scoring evaluator
 * Outputs strictly: 'MILD' | 'MODERATE' | 'SEVERE'
 * Strictly non-diagnostic; zero DSM or medical condition labeling.
 */
export function evaluateSeverityLevel(totalScore: number): 'MILD' | 'MODERATE' | 'SEVERE' {
  if (totalScore >= 8) {
    return 'SEVERE';
  }
  if (totalScore >= 4) {
    return 'MODERATE';
  }
  return 'MILD';
}

/**
 * Domain-Specific Daily Mission Blueprints
 * Action-oriented, non-clinical micro-interventions (3-7 mins)
 */
export const DOMAIN_MISSION_TEMPLATES: Record<InterventionDomain, DailyMission> = {
  school: {
    id: 'mission-school-1',
    domain: 'school',
    title: 'Tenangkan Diri Sebelum Belajar',
    summary: 'Menenangkan kecemasan sebelum menghadapi ujian atau tumpukan tugas sekolah.',
    durationMinutes: 5,
    steps: [
      'Tutup buku atau layar sejenak, kendurkan bahu dan rahangmu.',
      'Tarik napas pelan sambil hitung sampai 4, tahan 4 hitungan, embuskan pelan 4 hitungan, lalu tahan lagi 4 hitungan. Ulangi 3 kali.',
      'Pilih satu tugas kecil yang paling mendesak. Kerjakan itu dulu selama 25 menit, sisanya boleh menunggu.'
    ],
    reflectionQuestion: 'Apa satu tugas kecil yang akan kamu selesaikan pertama kali setelah ini?',
    completed: false
  },
  campus: {
    id: 'mission-campus-1',
    domain: 'campus',
    title: 'Mengurai Beban Skripsi & Tugas Kuliah',
    summary: 'Membantu pikiran yang buntu dan rasa kewalahan saat menghadapi dosen atau revisi.',
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
    title: 'Memberi Batas yang Sehat untuk Pekerjaan',
    summary: 'Menjaga pikiranmu dari tuntutan kantor dan kelelahan yang menumpuk (burnout).',
    durationMinutes: 5,
    steps: [
      'Tandai jam kerja selesai: tarik napas panjang 3 kali, lalu bilang ke dirimu, "kerjaan hari ini sudah cukup".',
      'Tunda membalas pesan non-darurat kantor hingga jam kerja esok hari.',
      'Katakan pada dirimu: "Pekerjaanku penting, tetapi kesehatan mentalku lebih utama."'
    ],
    reflectionQuestion: 'Bagaimana perasaanmu setelah memberikan jeda pada urusan pekerjaan hari ini?',
    completed: false
  },
  finance: {
    id: 'mission-finance-1',
    domain: 'finance',
    title: 'Menenangkan Cemas Soal Uang',
    summary: 'Menenangkan pikiran saat uang atau utang bikin cemas.',
    durationMinutes: 7,
    steps: [
      'Tarik napas panjang. Ingatkan dirimu: "Kondisi finansialku bukan ukuran harga diriku sebagai manusia."',
      'Tulis pengeluaran yang wajib dan yang bisa ditunda. Gak perlu menyalahkan diri sendiri.',
      'Jika menghadapi teror penagihan pinjol ilegal, simpan bukti dan ketahuilah ada saluran resmi Satgas PASTI/OJK (157) yang siap melindungimu.'
    ],
    reflectionQuestion: 'Apa satu hal dalam kendalimu hari ini yang bisa membantumu merasa sedikit lebih tenang?',
    completed: false
  },
  relationship: {
    id: 'mission-relationship-1',
    domain: 'relationship',
    title: 'Tulis Surat yang Tidak Dikirim',
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
    title: 'Waktu Tenang Saat Rumah Terasa Tegang',
    summary: 'Memberi dirimu jeda dari tuntutan atau ketegangan di rumah.',
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
    title: 'Terhubung Lagi, Pelan-Pelan',
    summary: 'Meringankan rasa sepi lewat langkah kecil untuk terhubung lagi.',
    durationMinutes: 5,
    steps: [
      'Buka jendela atau melangkah ke luar rumah, rasakan hembusan angin dan cahaya sekitar selama 2 menit.',
      'Kirimkan satu pesan singkat yang tulus kepada seorang teman, atau sapa seseorang dengan senyum ramah.',
      'Ingatlah bahwa kesepian adalah pengalaman yang dirasakan oleh jutaan orang lain saat ini. Kamu tidak aneh.'
    ],
    reflectionQuestion: 'Siapa satu orang yang terlintas di pikiranmu saat membaca ini?',
    completed: false
  },
  general: {
    id: 'mission-general-1',
    domain: 'general',
    title: 'Napas Pelan & Kenali Sekitarmu',
    summary: 'Menenangkan tubuh saat pikiran terasa penuh dan berantakan.',
    durationMinutes: 5,
    steps: [
      'Duduk santai dengan punggung tegak. Tarik napas lewat hidung sambil hitung sampai 4.',
      'Tahan napas sambil hitung sampai 7, tanpa menegangkan badan.',
      'Embuskan pelan lewat mulut sambil hitung sampai 8. Ulangi 3 sampai 4 kali.',
      'Sebutkan 3 benda nyata di sekitarmu yang bisa kamu lihat dengan jelas.'
    ],
    reflectionQuestion: 'Apakah dada atau kepalamu terasa sedikit lebih lega sekarang?',
    completed: false
  }
};
