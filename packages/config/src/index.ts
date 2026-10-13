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
 * Indonesian Emergency Contacts & Helplines
 *
 * Every field below was checked against the provider's own official channel
 * (or, where the live site was down, the Internet Archive copy of that
 * official site). Accessed 2026-10-14 unless stated. Anything not confirmed
 * by an official source is marked UNVERIFIED and must not be expanded on.
 *
 * healing119-kemenkes
 *   - https://www.healing119.id/ : "Layanan Hotline Kesehatan Mental dan Bunuh
 *     Diri Kementerian Kesehatan", "Hubungi 119 ext. 8", WhatsApp button (no
 *     number published). Hours/cost not stated on the site.
 *   - https://kesprimkom.kemkes.go.id/konten/127/151/0/cegah-bunuh-diri-dukung-kesehatan-jiwa-kenali-layanan-healing119-id
 *     (Kemenkes, 7 Aug 2025): "disediakan secara gratis", "beroperasi dari
 *     pagi hingga malam hari", "dukungan psikologis awal", anonymous, can refer.
 *   - No official source confirms 24/7, so no "24 jam" claim. The WhatsApp
 *     number quoted in the press is not on any Kemenkes page, so it is omitted.
 * lisa-helpline
 *   - http://lisahelpline.org redirects to https://bisahelpline.org (its HTTPS
 *     certificate does not cover lisahelpline.org). bisahelpline.org (Bali
 *     Bersama Bisa Foundation, operator of LISA): "Messages can be sent to our
 *     WhatsApp number +628113855472. Online support sessions are scheduled with
 *     Certified Listeners and may be placed on a waiting list."; /about-us/:
 *     "free online counselling", Indonesian and English. /contact/ lists no
 *     phone number, so the old 021-3777-5472 (found in no source) was removed,
 *     as was the 0811-381-5472 English line (third-party directories only).
 * yayasan-pulih
 *   - https://web.archive.org/web/20260911113333/https://yayasanpulih.org/ :
 *     "Telp : +62 21 788 42 580".
 *   - https://web.archive.org/web/20230831094436/http://yayasanpulih.org/layanan-psikologi/ :
 *     "021-78842580 atau via Whatsapp 08118436633 (pada jam kerja dan hari kerja)".
 *   - Live yayasanpulih.org (2026-10-14): expired TLS certificate and a hosting
 *     placeholder page, so no website link is shown. Exact clock hours
 *     (09:00-17:00) appear only in media, so they are not claimed.
 * tepsa-kemensos
 *   - https://kemensos.go.id/en/childrens-social-service-telephone-tepsa-ready-to-receive-online-services
 *     (Kemensos, 9 Apr 2020): "TePSA Call Center Service 1500771", telecounseling
 *     for children incl. emergency response and referral.
 *   - UNVERIFIED: 24-hour operation (third-party directories only) is no longer
 *     claimed. UNVERIFIED: cost; kept as before ('gratis').
 *   - Previously merged with KPAI under the name "Teencare"; TePSA is a Kemensos
 *     service, KPAI is a separate commission, so they are now two entries.
 * kpai-pengaduan
 *   - https://web.archive.org/web/20260609055833/https://www.kpai.go.id/ (live
 *     kpai.go.id is in maintenance; www returns HTTP 521): "Pengaduan: (+62)
 *     021 31901556", email pengaduan@kpai.go.id.
 *   - UNVERIFIED: WhatsApp 0811-177-2273 (kpai.go.id post, Jan 2024, per audit
 *     H2; not re-checkable today). 2025-2026 media cite 0811-1002-7727 instead.
 *     Kept as-is pending direct confirmation. Hours UNVERIFIED (not claimed).
 * satgas-pasti-ojk
 *   - https://ojk.go.id/id/berita-dan-kegiatan/publikasi/Pages/Jadwal-Operasional-Kontak-157.aspx
 *     (22 Jul 2025): telephone 157 "Senin s.d. Minggu (24 Jam setiap hari)"
 *     from 10 Oct 2025; WhatsApp 081-157-157-157 "Senin s.d. Minggu, 07.45 –
 *     16.50 WIB". konsumen.ojk.go.id times out; kontak157.ojk.go.id is the live
 *     official Kontak 157 portal. UNVERIFIED: cost (kept as before).
 */
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'healing119-kemenkes',
    name: 'Healing119 (Kemenkes)',
    category: 'national_emergency',
    phone: '119 ext 8',
    website: 'https://healing119.id',
    availableHours: 'Pagi hingga malam',
    cost: 'gratis',
    description: 'Layanan hotline kesehatan mental dan pencegahan bunuh diri Kementerian Kesehatan RI. Dukungan psikologis awal tanpa perlu menyebut nama, dan bisa dirujuk ke layanan profesional. Chat WhatsApp tersedia lewat healing119.id.',
    targetAgeBrackets: ['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'lisa-helpline',
    name: 'LISA Helpline (Bali Bersama Bisa Foundation)',
    category: 'crisis_hotline',
    whatsapp: '0811-3855-472',
    website: 'https://bisahelpline.org',
    availableHours: 'Sesi online terjadwal, bisa masuk daftar tunggu (ID / EN)',
    cost: 'gratis',
    description: 'Dukungan emosional dan pencegahan bunuh diri lewat WhatsApp oleh pendengar terlatih, dalam bahasa Indonesia atau Inggris.',
    targetAgeBrackets: ['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'yayasan-pulih',
    name: 'Yayasan Pulih',
    category: 'crisis_hotline',
    phone: '021-788-42580',
    whatsapp: '0811-8436-633',
    availableHours: 'Hari dan jam kerja',
    cost: 'tarif_standar',
    description: 'Lembaga nirlaba pemulihan trauma, penanganan kekerasan psikososial, dan konseling.',
    targetAgeBrackets: ['18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'tepsa-kemensos',
    name: 'TePSA Kemensos (Telepon Pelayanan Sosial Anak)',
    category: 'teen_protection',
    phone: '1500-771',
    website: 'https://kemensos.go.id',
    availableHours: 'Jam layanan: tanyakan saat menelepon',
    cost: 'gratis',
    description: 'Layanan telepon khusus anak dan remaja di bawah 18 tahun dari Kementerian Sosial: konseling, pengaduan, tanggap darurat, dan rujukan.',
    targetAgeBrackets: ['15-17'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'kpai-pengaduan',
    name: 'KPAI (Komisi Perlindungan Anak Indonesia)',
    category: 'teen_protection',
    phone: '021-3190-1556',
    whatsapp: '0811-177-2273',
    website: 'https://kpai.go.id',
    availableHours: 'Jam layanan: tanyakan saat menghubungi',
    cost: 'tarif_standar',
    description: 'Saluran pengaduan resmi untuk pelanggaran hak dan perlindungan anak di bawah 18 tahun.',
    targetAgeBrackets: ['15-17'],
    verificationStatus: 'todo_human_verification'
  },
  {
    id: 'satgas-pasti-ojk',
    name: 'Kontak OJK 157 (Pengaduan Pinjol Ilegal & Teror Finansial)',
    category: 'financial_advocacy',
    phone: '157',
    whatsapp: '081-157-157-157',
    website: 'https://kontak157.ojk.go.id',
    availableHours: 'Telepon 24 jam setiap hari; WA Senin-Minggu 07.45-16.50 WIB',
    cost: 'gratis',
    description: 'Saluran resmi OJK untuk pengaduan teror penagihan, pinjaman online ilegal, dan penipuan keuangan yang memicu kecemasan finansial.',
    targetAgeBrackets: ['18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  }
];

/**
 * Turns a display phone such as "119 ext 8" into a tel: target. The extension
 * becomes a pause-then-dial (",8") so the dialer reaches the counselor menu
 * without the caller having to know the extension.
 */
export function toTelHref(phone?: string): string {
  if (!phone) return '';
  const [base = '', ext] = phone.split(/\s*ext\.?\s*/i);
  const digits = base.replace(/[^0-9+]/g, '');
  const extDigits = (ext ?? '').replace(/[^0-9]/g, '');
  return `tel:${digits}${extDigits ? `,${extDigits}` : ''}`;
}

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
    label: '15-17 tahun',
    subtext: 'Pelajar SMA/SMK (perlindungan khusus anak)',
    rationale: 'Bahasa yang ramah remaja dan kontak darurat khusus anak (TePSA Kemensos dan KPAI).',
    highProtection: true
  },
  '18-29': {
    id: '18-29',
    label: '18-29 tahun',
    subtext: 'Mahasiswa, fresh graduate, awal kerja',
    rationale: 'Topik seputar mulai mandiri, tekanan kuliah, awal kerja, dan mencari jati diri.',
    highProtection: false
  },
  '30-49': {
    id: '30-49',
    label: '30-49 tahun',
    subtext: 'Pekerja, wirausaha, berkeluarga',
    rationale: 'Topik seputar nafkah keluarga, tekanan kerja, dan menanggung anak sekaligus orang tua.',
    highProtection: false
  },
  '50+': {
    id: '50+',
    label: '50+ tahun',
    subtext: 'Lansia atau menjelang pensiun (teks besar)',
    rationale: 'Teks lebih besar, tampilan tenang tanpa tekanan waktu, dan topik seputar ketenangan hidup.',
    highProtection: false,
    accessibilityMode: true
  }
};

/**
 * Universal Age Bracket Definitions (Including legacy compatibility)
 */
export const AGE_BRACKET_CONFIGS: Record<AgeBracket, { label: string; subtext: string; highProtection: boolean }> = {
  '15-17': {
    label: '15-17 tahun',
    subtext: 'Pelajar SMA/SMK (khusus remaja)',
    highProtection: true
  },
  '18-29': {
    label: '18-29 tahun',
    subtext: 'Mahasiswa, fresh graduate, awal kerja',
    highProtection: false
  },
  '30-49': {
    label: '30-49 tahun',
    subtext: 'Pekerja, wirausaha, berkeluarga',
    highProtection: false
  },
  '50+': {
    label: '50+ tahun',
    subtext: 'Lansia atau menjelang pensiun',
    highProtection: false
  },
  '18-24': {
    label: '18-24 tahun',
    subtext: 'Mahasiswa, fresh graduate, awal kerja',
    highProtection: false
  },
  '25-34': {
    label: '25-34 tahun',
    subtext: 'Pekerja, menanggung keluarga',
    highProtection: false
  },
  '35-54': {
    label: '35-54 tahun',
    subtext: 'Pekerja senior, urusan rumah tangga',
    highProtection: false
  }
};

/**
 * PRD 2.0 Primary Topic Pillars with Explicit Mapping to Life-Context Domains
 */
export const TOPIC_PILLARS: Record<TopicPillarId, TopicPillarConfig> = {
  finance: {
    id: 'finance',
    label: 'Tekanan Uang & Utang',
    tagline: 'Pelan-pelan meredakan cemas soal biaya hidup, cicilan, dan nafkah keluarga.',
    description: 'Tempat aman untuk cerita soal utang, pinjaman, nafkah keluarga, atau cemas soal masa depan. Kamu tidak perlu malu, dan tidak akan dihakimi.',
    icon: 'Coins',
    mappedDomains: ['finance', 'work'],
    primaryDomain: 'finance',
    isSensitive: false
  },
  trauma: {
    id: 'trauma',
    label: 'Luka Batin & Trauma',
    tagline: 'Merawat luka batin, rasa ditolak, rasa bersalah, dan duka yang dalam, sepelan yang kamu mau.',
    description: 'Dukungan bertahap untuk kenangan yang menyakitkan atau urusan keluarga yang membekas, dengan kecepatanmu sendiri. Kamu boleh berhenti kapan saja.',
    icon: 'HeartHandshake',
    mappedDomains: ['family', 'loneliness', 'general'],
    primaryDomain: 'family',
    isSensitive: true
  },
  sexual_violence: {
    id: 'sexual_violence',
    label: 'Kekerasan Seksual & Hubungan Toxic',
    tagline: 'Tempat pribadi yang penuh hormat untuk memulihkan kendali atas dirimu.',
    description: 'Kami menghormati keputusanmu sepenuhnya. Apa pun yang terjadi, itu bukan salahmu. Ada rujukan langsung ke pendamping profesional resmi.',
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
    description: 'Tekanan belajar di SMA/SMK, ujian masuk kuliah, atau masalah dengan teman.',
    icon: 'GraduationCap'
  },
  campus: {
    label: 'Dunia Kampus',
    description: 'Tugas menumpuk, skripsi, hidup merantau, atau ragu dengan jurusan.',
    icon: 'BookOpen'
  },
  work: {
    label: 'Beban Pekerjaan',
    description: 'Burnout, masalah dengan atasan atau rekan kerja, kejar target, atau cemas soal karier.',
    icon: 'Briefcase'
  },
  finance: {
    label: 'Tekanan Uang',
    description: 'Cemas soal utang, teror pinjol, menanggung keluarga, atau biaya hidup.',
    icon: 'Coins'
  },
  relationship: {
    label: 'Hubungan & Percintaan',
    description: 'Patah hati, putus, bertengkar dengan pasangan, atau kesepian.',
    icon: 'HeartHandshake'
  },
  family: {
    label: 'Urusan Keluarga',
    description: 'Harapan orang tua, ribut di keluarga, atau beban mengasuh.',
    icon: 'Home'
  },
  loneliness: {
    label: 'Kesepian',
    description: 'Merasa tidak punya teman bicara atau merasa sendirian di sekitar orang.',
    icon: 'Compass'
  },
  general: {
    label: 'Beban Pikiran Umum',
    description: 'Merasa kewalahan tapi belum tahu sebabnya, dan itu juga boleh.',
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
  { id: 'pelajar', label: 'Pelajar SMA/SMK' },
  { id: 'mahasiswa', label: 'Mahasiswa' },
  { id: 'pekerja_kantor', label: 'Karyawan (swasta, BUMN, PNS)' },
  { id: 'wirausaha', label: 'Wirausaha atau pedagang' },
  { id: 'pencari_kerja', label: 'Pencari kerja atau fresh graduate' },
  { id: 'freelancer', label: 'Freelancer atau pekerja kreatif' },
  { id: 'rumah_tangga', label: 'Ibu atau bapak rumah tangga' },
  { id: 'lainnya', label: 'Lainnya atau tidak ingin menyebutkan' }
] as const;

/**
 * Generic Contextual Assessment Questions (Instrument-Agnostic)
 * NOT a clinical diagnostic tool; designed to measure non-clinical distress & context load.
 */
export const GENERIC_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1-strain',
    text: 'Dalam 7 hari terakhir, seberapa sering beban pikiran menguras energimu?',
    category: 'emotional',
    scaleType: 'likert_4',
    options: [
      { value: 0, label: 'Tidak pernah' },
      { value: 1, label: 'Kadang-kadang' },
      { value: 2, label: 'Cukup sering' },
      { value: 3, label: 'Hampir setiap saat' }
    ]
  },
  {
    id: 'q2-impact',
    text: 'Seberapa besar masalahmu saat ini mengganggu konsentrasi sehari-hari?',
    category: 'context_impact',
    scaleType: 'likert_4',
    options: [
      { value: 0, label: 'Sama sekali tidak mengganggu' },
      { value: 1, label: 'Sedikit mengganggu' },
      { value: 2, label: 'Cukup mengganggu fokus' },
      { value: 3, label: 'Sangat mengganggu kegiatan harian' }
    ]
  },
  {
    id: 'q3-rest',
    text: 'Apakah pikiranmu membuat sulit tidur atau lelah saat bangun pagi?',
    category: 'daily_functioning',
    scaleType: 'likert_4',
    options: [
      { value: 0, label: 'Tidur cukup nyenyak' },
      { value: 1, label: 'Kadang terbangun atau gelisah' },
      { value: 2, label: 'Sering sulit tidur' },
      { value: 3, label: 'Hampir tidak bisa tidur' }
    ]
  },
  {
    id: 'q4-agency',
    text: 'Seberapa yakin kamu bisa membereskan situasi ini selangkah demi selangkah?',
    category: 'resilience',
    scaleType: 'likert_4',
    options: [
      { value: 0, label: 'Masih merasa mampu' },
      { value: 1, label: 'Ragu, tapi masih berusaha' },
      { value: 2, label: 'Sangat lelah dan sulit melihat jalan keluar' },
      { value: 3, label: 'Benar-benar buntu dan sendirian' }
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
    text: 'Dalam 7 hari terakhir, seberapa sering beban pikiran menguras energimu?',
    subtext: 'Pilih yang paling dekat dengan yang kamu alami.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'emotional_load',
    defaultNextQuestionId: 'topic-context-q',
    options: [
      { id: 'opt-strain-0', label: 'Jarang, pikiran cukup tenang', score: 0, nextQuestionId: 'topic-context-q' },
      { id: 'opt-strain-1', label: 'Kadang terasa berat, tapi masih bisa diatasi', score: 1, nextQuestionId: 'topic-context-q' },
      { id: 'opt-strain-2', label: 'Cukup sering menguras fokus dan semangat', score: 2, nextQuestionId: 'topic-context-q' },
      { id: 'opt-strain-3', label: 'Hampir setiap saat terasa menekan dan melelahkan', score: 3, nextQuestionId: 'topic-context-q' }
    ]
  },
  {
    id: 'context-finance',
    topic: 'finance',
    text: 'Seberapa besar urusan uang atau utang mengganggu rasa amanmu?',
    subtext: 'Kondisi uangmu bukan ukuran harga dirimu.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'context_impact',
    defaultNextQuestionId: 'functioning-impact',
    options: [
      { id: 'opt-fin-0', label: 'Masih terkendali dan ada rencana', score: 0, nextQuestionId: 'functioning-impact' },
      { id: 'opt-fin-1', label: 'Cukup mengkhawatirkan, tapi masih ada jalan keluar', score: 1, nextQuestionId: 'functioning-impact' },
      { id: 'opt-fin-2', label: 'Sering cemas memikirkan tagihan atau hari esok', score: 2, nextQuestionId: 'functioning-impact' },
      { id: 'opt-fin-3', label: 'Merasa terjepit, buntu, dan kewalahan', score: 3, nextQuestionId: 'functioning-impact' }
    ]
  },
  {
    id: 'context-trauma',
    topic: 'trauma',
    text: 'Saat kenangan menyakitkan muncul, seberapa kuat rasa sesak atau gelisahnya?',
    subtext: 'Kamu aman di sini. Pertanyaan ini boleh dilewati tanpa mengurangi apa pun.',
    sensitive: true,
    skippable: true,
    scoringCategory: 'context_impact',
    defaultNextQuestionId: 'functioning-impact',
    options: [
      { id: 'opt-tr-0', label: 'Jarang terasa berat dan cepat reda', score: 0, nextQuestionId: 'functioning-impact' },
      { id: 'opt-tr-1', label: 'Kadang mengganggu sebentar, lalu tenang lagi', score: 1, nextQuestionId: 'functioning-impact' },
      { id: 'opt-tr-2', label: 'Cukup kuat sampai badan tegang dan butuh jeda lama', score: 2, nextQuestionId: 'functioning-impact' },
      { id: 'opt-tr-3', label: 'Sangat menguras tenaga, merasa terpuruk atau sendirian', score: 3, nextQuestionId: 'functioning-impact' }
    ]
  },
  {
    id: 'context-sexual-violence',
    topic: 'sexual_violence',
    text: 'Seberapa berat rasa tidak aman atau sulit percaya pada orang lain?',
    subtext: 'Keselamatan dan keputusanmu yang utama. Pertanyaan ini boleh dilewati kapan saja.',
    sensitive: true,
    skippable: true,
    scoringCategory: 'context_impact',
    defaultNextQuestionId: 'functioning-impact',
    options: [
      { id: 'opt-sv-0', label: 'Merasa aman dan bisa menjaga batas diri', score: 0, nextQuestionId: 'functioning-impact' },
      { id: 'opt-sv-1', label: 'Kadang waspada, tapi masih bisa bergaul', score: 1, nextQuestionId: 'functioning-impact' },
      { id: 'opt-sv-2', label: 'Sering merasa tidak aman dan menarik diri', score: 2, nextQuestionId: 'functioning-impact' },
      { id: 'opt-sv-3', label: 'Merasa sangat rentan, terancam, atau sulit percaya siapa pun', score: 3, nextQuestionId: 'functioning-impact' }
    ]
  },
  {
    id: 'context-general',
    topic: 'general',
    text: 'Seberapa besar masalahmu mengganggu fokus dan ketenangan saat ini?',
    subtext: 'Ambil jeda sebentar untuk merasakan tubuh dan pikiranmu.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'context_impact',
    defaultNextQuestionId: 'functioning-impact',
    options: [
      { id: 'opt-gen-0', label: 'Sama sekali tidak mengganggu', score: 0, nextQuestionId: 'functioning-impact' },
      { id: 'opt-gen-1', label: 'Sedikit mengganggu, tapi masih bisa beraktivitas', score: 1, nextQuestionId: 'functioning-impact' },
      { id: 'opt-gen-2', label: 'Cukup mengganggu, sering melamun atau cemas', score: 2, nextQuestionId: 'functioning-impact' },
      { id: 'opt-gen-3', label: 'Sangat mengganggu sampai sulit menjalani rutinitas', score: 3, nextQuestionId: 'functioning-impact' }
    ]
  },
  {
    id: 'functioning-impact',
    topic: 'general',
    text: 'Apakah pikiranmu membuat sulit tidur atau lelah saat bangun pagi?',
    subtext: 'Kualitas tidur sering menunjukkan seberapa tegang tubuh dan pikiranmu.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'functional_impact',
    defaultNextQuestionId: 'support-readiness',
    options: [
      { id: 'opt-func-0', label: 'Tidur masih nyenyak dan menyegarkan', score: 0, nextQuestionId: 'support-readiness' },
      { id: 'opt-func-1', label: 'Kadang terbangun atau gelisah sebelum tidur', score: 1, nextQuestionId: 'support-readiness' },
      { id: 'opt-func-2', label: 'Sering sulit tidur dan bangun masih lelah', score: 2, nextQuestionId: 'support-readiness' },
      { id: 'opt-func-3', label: 'Hampir tidak bisa tidur dan tenaga terasa habis', score: 3, nextQuestionId: 'support-readiness' }
    ]
  },
  {
    id: 'support-readiness',
    topic: 'general',
    text: 'Dukungan seperti apa yang paling kamu harapkan saat ini?',
    subtext: 'Jawabanmu membantu kami menyarankan dukungan yang pas dan tidak membebani.',
    sensitive: false,
    skippable: false,
    scoringCategory: 'support_readiness',
    defaultNextQuestionId: null,
    options: [
      { id: 'opt-supp-0', label: 'Misi mandiri pelan-pelan dan jurnal pribadi', score: 0, nextQuestionId: null },
      { id: 'opt-supp-1', label: 'Misi harian dan Ruang Cerita anonim', score: 1, nextQuestionId: null },
      { id: 'opt-supp-2', label: 'Panduan mengelola emosi dan pilihan konsultasi psikolog', score: 2, nextQuestionId: null },
      { id: 'opt-supp-3', label: 'Langsung ke tenaga profesional atau bantuan darurat', score: 3, nextQuestionId: null }
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
    summary: 'Meredakan cemas sebelum ujian atau tumpukan tugas sekolah.',
    durationMinutes: 5,
    steps: [
      'Tutup buku atau layar sebentar, kendurkan bahu dan rahangmu.',
      'Tarik napas pelan sambil hitung sampai 4, tahan 4 hitungan, embuskan pelan 4 hitungan, lalu tahan lagi 4 hitungan. Ulangi 3 kali.',
      'Pilih satu tugas kecil yang paling mendesak. Kerjakan itu dulu 25 menit, sisanya boleh menunggu.'
    ],
    reflectionQuestion: 'Apa satu tugas kecil yang akan kamu selesaikan pertama kali setelah ini?',
    completed: false
  },
  campus: {
    id: 'mission-campus-1',
    domain: 'campus',
    title: 'Membereskan Skripsi & Tugas Kuliah',
    summary: 'Membantu saat pikiran buntu dan kewalahan menghadapi dosen atau revisi.',
    durationMinutes: 6,
    steps: [
      'Ambil selembar kertas, tulis 1 hambatan utama yang membuatmu menunda skripsi atau tugas.',
      'Pecah hambatan itu jadi satu tindakan paling kecil (misal: cari 1 referensi atau tulis 1 paragraf saja).',
      'Minum segelas air putih. Kemajuan kecil tetap kemajuan.'
    ],
    reflectionQuestion: 'Satu kalimat kecil apa yang bisa kamu tuliskan hari ini untuk tugasmu?',
    completed: false
  },
  work: {
    id: 'mission-work-1',
    domain: 'work',
    title: 'Memberi Batas untuk Pekerjaan',
    summary: 'Menjaga pikiranmu dari tuntutan kantor dan lelah yang menumpuk (burnout).',
    durationMinutes: 5,
    steps: [
      'Tandai jam kerja selesai: tarik napas panjang 3 kali, lalu bilang ke dirimu, "kerjaan hari ini sudah cukup".',
      'Tunda membalas pesan kantor yang tidak mendesak sampai jam kerja besok.',
      'Bilang ke dirimu: "Pekerjaanku penting, tapi kesehatan mentalku lebih utama."'
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
      'Tarik napas panjang. Ingatkan dirimu: "Kondisi uangku bukan ukuran harga diriku."',
      'Tulis pengeluaran yang wajib dan yang bisa ditunda. Gak perlu menyalahkan diri sendiri.',
      'Kalau diteror penagih pinjol ilegal, simpan buktinya. Ada kontak resmi OJK di 157 yang siap melindungimu.'
    ],
    reflectionQuestion: 'Apa satu hal dalam kendalimu hari ini yang bisa membantumu merasa sedikit lebih tenang?',
    completed: false
  },
  relationship: {
    id: 'mission-relationship-1',
    domain: 'relationship',
    title: 'Tulis Surat yang Tidak Dikirim',
    summary: 'Meredakan emosi saat patah hati, bertengkar, atau salah paham.',
    durationMinutes: 6,
    steps: [
      'Tahan diri, jangan kirim pesan atau posting apa pun saat emosi masih panas.',
      'Tulis semua rasa kecewa, marah, atau sedihmu sebebasnya di catatan pribadimu.',
      'Simpan atau robek catatan itu sebagai tanda kamu sudah melepaskan beban itu.'
    ],
    reflectionQuestion: 'Emosi apa yang paling terasa dominan di hatimu saat ini?',
    completed: false
  },
  family: {
    id: 'mission-family-1',
    domain: 'family',
    title: 'Waktu Tenang Saat Rumah Tegang',
    summary: 'Memberi dirimu jeda dari tuntutan atau suasana tegang di rumah.',
    durationMinutes: 5,
    steps: [
      'Cari tempat tenang (kamar, teras, atau jalan kaki sebentar) untuk menyendiri 5 menit.',
      'Ingat, kamu tidak wajib memperbaiki suasana hati semua orang di rumah.',
      'Urus kebutuhan badanmu: pastikan kamu sudah makan dan minum cukup hari ini.'
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
      'Buka jendela atau keluar rumah sebentar, rasakan angin dan cahaya selama 2 menit.',
      'Kirim satu pesan singkat yang tulus ke seorang teman, atau sapa seseorang sambil tersenyum.',
      'Ingat, jutaan orang lain juga sedang merasa kesepian saat ini. Kamu tidak aneh.'
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
      'Sebutkan 3 benda di sekitarmu yang bisa kamu lihat dengan jelas.'
    ],
    reflectionQuestion: 'Apakah dada atau kepalamu terasa sedikit lebih lega sekarang?',
    completed: false
  }
};

export * from './helpDestinations.ts';
