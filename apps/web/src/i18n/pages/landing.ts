import type { TextBundle } from '../language';

const id = {
  badge: '100% anonim, tanpa akun',
  heroLine1: 'Gak harus',
  heroLine2: 'beres semuanya',
  heroLine3: 'hari ini.',
  heroBody: 'Kalau hari ini terasa berat, kamu tidak sendirian. Istirahat sebentar, cerita tanpa dihakimi, lalu melangkah pelan-pelan.',
  start: 'Mulai tanpa akun',
  emergency: 'Bantuan darurat',
  moodQuestion: 'Apa kabar hatimu hari ini? Ketuk salah satu.',
  moodSaved: 'Tersimpan di perangkat ini',
  moodPrivacy: 'Pilihanmu hanya tersimpan di perangkat ini.',
  moods: {
    sangat_baik: 'Bertenaga',
    baik: 'Cukup baik',
    netral: 'Biasa saja',
    berat: 'Berat',
    kewalahan: 'Kewalahan',
  },
  pillarsTitle: 'Tiga hal yang sering terasa berat',
  pillarsBody: 'Beban ini nyata, dan kamu tidak perlu memikulnya sendirian.',
  pillarSkippable: 'Boleh dilewati kapan saja',
  pillarMission: 'Misi harian',
  agesTitle: 'Untuk siapa pun, di usia berapa pun',
  agesBody: 'Bahasa dan pertanyaannya kami sesuaikan supaya terasa dekat untukmu.',
  ages: [
    {
      range: '15-17 tahun',
      title: 'Remaja dan pelajar',
      body: 'Bahasa yang ramah untuk remaja, plus perlindungan khusus dan kontak TePSA Kemensos/KPAI kalau kamu butuh.',
    },
    {
      range: '18-29 tahun',
      title: 'Dewasa muda',
      body: 'Skripsi, awal karier, bingung arah hidup, dan belajar mandiri. Wajar kalau terasa berat.',
    },
    {
      range: '30-49 tahun',
      title: 'Dewasa dan keluarga',
      body: 'Menanggung anak sekaligus orang tua, mencari nafkah, dan lelah bekerja. Kamu boleh merasa capek.',
    },
    {
      range: '50+ tahun',
      title: 'Lansia',
      body: 'Teks lebih besar dan mudah dibaca, tampilan tenang, dan tanpa terburu-buru.',
    },
  ],
  crisisTitle: 'Kalau terasa terlalu berat, bantuan manusia langsung ada',
  crisisBody:
    'Kalau tulisanmu menunjukkan kamu sedang dalam bahaya atau ingin melukai diri, kami langsung menghentikan alur biasa dan menampilkan kontak bantuan: Healing119 dari Kemenkes (119 ext 8) dan LISA Helpline. Deteksinya memakai aturan tetap, bukan AI, jadi tidak ada yang menunda bantuan untukmu. Kamu penting, dan kamu tidak harus melewatinya sendirian.',
};

const en: typeof id = {
  badge: '100% anonymous, no account',
  heroLine1: 'Not everything',
  heroLine2: 'has to be fixed',
  heroLine3: 'today.',
  heroBody: 'If today feels heavy, you are not alone. Rest for a moment, share without being judged, then take it one small step at a time.',
  start: 'Start without an account',
  emergency: 'Emergency help',
  moodQuestion: 'How is your heart today? Tap one.',
  moodSaved: 'Saved on this device',
  moodPrivacy: 'Your choice is stored on this device only.',
  moods: {
    sangat_baik: 'Energised',
    baik: 'Pretty good',
    netral: 'So-so',
    berat: 'Heavy',
    kewalahan: 'Overwhelmed',
  },
  pillarsTitle: 'Three things that often feel heavy',
  pillarsBody: 'These burdens are real, and you do not have to carry them alone.',
  pillarSkippable: 'You can skip this any time',
  pillarMission: 'Daily mission',
  agesTitle: 'For anyone, at any age',
  agesBody: 'We adjust the language and the questions so they feel close to you.',
  ages: [
    {
      range: 'Ages 15-17',
      title: 'Teens and students',
      body: 'Teen-friendly language, extra protection, and TePSA / KPAI child helplines if you need them.',
    },
    {
      range: 'Ages 18-29',
      title: 'Young adults',
      body: 'Thesis, first jobs, not knowing where life is going, and learning to stand on your own. It is normal for that to feel heavy.',
    },
    {
      range: 'Ages 30-49',
      title: 'Adults and families',
      body: 'Caring for children and parents at once, providing for a family, and being tired from work. You are allowed to feel worn out.',
    },
    {
      range: 'Ages 50+',
      title: 'Older adults',
      body: 'Bigger, easier-to-read text, a calm layout, and no rush.',
    },
  ],
  crisisTitle: 'If it gets too heavy, human help is right here',
  crisisBody:
    'If what you write shows you are in danger or want to hurt yourself, we stop the normal flow right away and show help contacts: Healing119 from the Ministry of Health (119 ext 8) and LISA Helpline. Detection uses fixed rules, not AI, so nothing delays help for you. You matter, and you do not have to get through this alone.',
};

export const landingText: TextBundle<typeof id> = { id, en };
