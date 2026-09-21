# Dengar.in

> **Dengar.in — Pendamping Mental Well-being Anonim Berbasis AI**

Dengar.in adalah platform pendamping kesehatan mental digital yang bersifat **100% anonim**, bebas registrasi (tanpa nama, email, atau nomor telepon), dan berbasis konteks nyata kehidupan untuk masyarakat Indonesia berusia **15–54 tahun**. 

Platform ini menjembatani kesenjangan antara beban emosional, akar masalah situasional (studi, karir, finansial/pinjol, keluarga), tindakan pemulihan mikro harian (3–7 menit), dan evaluasi berkelanjutan—didukung oleh sistem penanganan krisis deterministik yang aktif tanpa perantara kecerdasan buatan (AI).

---

## 1. Project Overview

### Latar Belakang & Masalah yang Diselesaikan
Kesehatan mental tidak terjadi di ruang hampa. Sebagian besar tekanan emosional berakar pada tekanan nyata kehidupan: tuntutan akademik, lingkungan kerja toksik, himpitan ekonomi dan teror pinjaman online ilegal, atau ekspektasi keluarga. Namun, solusi digital yang ada saat ini umumnya terbagi menjadi dua ekstrem:
1. **Artikel statis** yang pasif dan tidak memberikan panduan aksi konkret.
2. **Chatbot AI tanpa batas** yang berisiko memberikan halusinasi klinis atau bertindak sebagai terapis semu tanpa protokol keselamatan yang teruji.

Dengar.in hadir untuk menghubungkan 5 mata rantai yang kerap terputus:
```
[ 1. Beban Emosional ]
          ↓
[ 2. Konteks Nyata Hidup (Sekolah / Kampus / Kerja / Finansial / Relasi / Keluarga) ]
          ↓
[ 3. Tindakan Kecil Nyata (Misi harian 3–7 menit: grounding / reframing / batasan) ]
          ↓
[ 4. Eskalasi Bantuan Profesional (Hotline darurat resmi terverifikasi) ]
          ↓
[ 5. Pendampingan Berkelanjutan (Check-in harian / jurnal lokal / laporan mingguan) ]
```

### Konteks Hidup yang Didukung
- **Sekolah & Ujian (Usia 15–17)**: Tekanan ujian masuk, nilai akademik, perlindungan khusus anak di bawah umur.
- **Dunia Kampus (Usia 18–24)**: Tugas akhir/skripsi, adaptasi merantau, kecemasan prospek karir.
- **Beban Pekerjaan (Usia 25–34 & 35–54)**: *Burnout*, konflik kantor, jam kerja berlebih, kelelahan mental kronis.
- **Tekanan Finansial**: Tekanan hutang, intimidasi penagihan pinjaman online ilegal, beban generasi *sandwich*.
- **Hubungan & Cinta**: Patah hati, isolasi sosial, kesepian di perantauan.
- **Dinamika Keluarga**: Ekspektasi orang tua, konflik internal, tanggung jawab nafkah.
- **Kesepian & Hampa**: Ketiadaan tempat bercerita yang aman dan bebas dari penghakiman.
- **Beban Pikiran Umum**: Kelelahan emosional umum yang belum terpetakan pemicunya.

> [!NOTE]
> **Batasan Produk**: Dengar.in adalah alat pendamping mandiri (*self-help companion*), **BUKAN pengganti psikolog, psikiater, layanan medis darurat, atau penasihat hukum/keuangan berlisensi**. Platform ini tidak memberikan diagnosis klinis ataupun resep obat.

---

## 2. Core Principles

- **Anonymous by Design**: Tanpa formulir registrasi, tanpa verifikasi email, tanpa nomor telepon. Identitas pengguna didasarkan pada UUID lokal acak dan frasa pemulihan 12 kata.
- **Privacy-First**: Seluruh catatan jurnal dan riwayat check-in disimpan secara lokal di peramban pengguna (*client-side local persistence*).
- **Non-Diagnostic**: Tidak pernah mengeluarkan label diagnosis psikiatri (DSM-5 / PPDGJ / ICD-10).
- **Context-Aware Support**: Personalisasi alur intervensi berdasarkan usia, peran aktivitas, dan sumber tekanan hidup utama.
- **Human-Centered**: Mengutamakan kenyamanan, ketenangan kognitif, dan kepastian rasa aman bagi pengguna yang sedang tertekan.
- **Crisis-First Safety Architecture**: Filter deteksi krisis berjalan 100% deterministik sebelum proses apa pun berjalan.
- **AI Bounded by Application Controls**: Kecerdasan buatan dibatasi secara ketat oleh skema aksi yang tervalidasi dan tidak memiliki akses ke gerbang krisis hidup.
- **Zero Unnecessary PII**: Tidak ada pengumpulan data identitas pribadi (*Personally Identifiable Information*).

---

## 3. Current MVP User Flow

Alur interaksi pengguna saat ini dirancang secara terstruktur dan tenang:

```mermaid
flowchart TD
    A[Landing Page] --> B[Informed Consent]
    B --> C[Anonymous Session Creation & UUID]
    C --> D[Onboarding: Usia, Peran, Domain Tekanan]
    D --> E[Context Assessment]
    E --> F{Deterministic Crisis Gate}
    
    F -- Crisis Detected --> G[Emergency Crisis Hub /crisis]
    G --> H[1-Tap Call: Kemenkes Sejiwa 119 ext 8 / Lisa Helpline]
    G --> I[Normal Flow Halts]
    
    F -- Non-Crisis --> J[Dashboard Utama]
    J --> K[Misi Harian 3–7 Menit]
    K --> L[Refleksi Mikro & Penyelesaian]
    J --> M[Check-in Emosi & Energi]
    J --> N[Jurnal Privat Lokal / Toolkit Bantuan]
```

### Cabang Penanganan Krisis (Crisis Branch)
Jika pada asesmen awal atau input teks bebas terdeteksi indikasi bahaya diri atau krisis akut:
1. Alur normal dan otomatisasi AI langsung dihentikan secara instan.
2. Pengguna dialihkan ke layar `/crisis` yang memuat saluran darurat resmi nasional (Kemenkes Sejiwa 119 ext 8, Lisa Helpline, KPAI untuk remaja).

### Cabang Non-Krisis (Standard Flow)
1. Menghitung skor keletihan emosional non-diagnostik (Ringan, Menengah, Tinggi).
2. Membuka Dashboard dengan jalur terpersonalisasi 14 hari.
3. Menyajikan Misi Harian sesuai domain tekanan dan fitur pencatatan Check-in emosi.

---

## 4. Features

### Implemented (Fitur yang Berfungsi Penuh)
- **Anonymous UUID Session**: Pembuatan sesi unik berbasis UUID v4 tanpa akun dan tanpa backend database.
- **12-Word Recovery Mnemonic**: Pembangkitan kunci pemulihan 12-kata berbasis peramban untuk memulihkan sesi di perangkat lain.
- **Informed Consent**: Penjelasan transparan batasan hukum, medis, dan privasi dengan verifikasi persetujuan interaktif.
- **Guided 3-Step Onboarding**: Pemilihan kelompok usia (15–17, 18–24, 25–34, 35–54), status peran, dan domain tekanan utama secara bertahap (satu pertanyaan per layar).
- **Generic Context Assessment**: Kuesioner evaluasi beban emosional bertahap dengan visual terfokus dan skor evaluasi non-diagnostik.
- **Deterministic Crisis Engine**: Pemindaian teks deterministik sub-milidetik terhadap kata kunci bahaya, metode melukai diri, serta normalisasi anti-evasi (*leetspeak*, pemanjangan karakter).
- **Emergency Crisis Hub (`/crisis`)**: Tampilan darurat berprioritas tinggi dengan tombol panggil langsung 1-tap (*tel:*) dan tautan WhatsApp resmi.
- **Domain-Specific Daily Missions (`/mission`)**: Modul intervensi bertahap dengan linimasa vertikal, estimasi durasi, panduan aksi, dan kolom refleksi mikro.
- **Daily Mood Check-in (`/checkin`)**: Pemilih suasana hati taktil 5-tingkat, penggeser tingkat energi 1–10, chip pemicu tekanan, catatan singkat, dan riwayat check-in.
- **Local Browser Persistence**: Penyimpanan data sesi, misi, refleksi, jurnal, dan check-in sepenuhnya di `localStorage` peramban.
- **Permanent Data Wipe**: Utilitas pembersihan total data lokal di menu `/recovery` untuk menjaga kerahasiaan saat berbagi perangkat.
- **API Abuse & Rate Limit Controls**: Pembatas permintaan berbasis jendela tetap (*fixed-window*) per rute (`chat`, `admin-login`, `forum-write`, `forum-support`, `weekly-report`, `sync-read`, `sync-write`), batas konkurensi 4 panggilan `/chat` simultan, serta validasi ukuran payload/pesan/riwayat chat (`apps/web/src/lib/api/rateLimit.ts` & `requestLimits.ts`). Bersifat *process-local* per instance — lihat `docs/M01_RATE_LIMITING.md` untuk keterbatasan pada deployment multi-instance.
- **Forum Pseudonym Anti-Abuse Moderation**: Validasi nama samaran cerita forum yang menolak alamat kontak (email, nomor telepon, tautan/domain, termasuk varian Unicode penyamaran), ajakan judi/pinjol ilegal, ujaran kasar, dan markup HTML sebelum cerita tersimpan (`services/validator/src/contentModerator.ts`).
- **Verified Directory (`/resources`)**: Direktori kontak darurat, konseling psikologis, perlindungan anak, dan advokasi pinjaman online ilegal dengan filter kategori dan pencarian.
- **Local Private Journal (`/journal`)**: Ruang menuangkan pikiran secara bebas yang tersimpan privat di peramban tanpa terkirim ke server mana pun.
- **AI Companion Multi-Brain Chat (`/chat`)**: Antarmuka percakapan empati terpandu dengan arsitektur 3-Brain (*DeepSeek Platform* sebagai Primary Brain, *OpenRouter NVIDIA Nemotron 3 Ultra* sebagai Second Brain / Anti-Bias Reviewer, dan *Google Gemini 3.1 Flash-Lite* sebagai Third Brain / Fallback), dilengkapi kartu aksi interaktif langsung (`suggest_mission`, `open_journal_prompt`, `suggest_forum`, `show_help_directory`, `adjust_path`) serta *Ironclad Maximum Guardrails*.
- **Ruang Cerita Anonim Solidaritas (`/forum`)**: Ruang baca dan berbagi cerita pengalaman hidup anonim dengan penyaringan gerbang krisis dan moderasi keselamatan otomatis real-time (`moderateForumPost`), filter kategori topik, serta tombol dukungan empati *"Rasakan Hal Serupa"*.
- **Laporan Kemajuan Mingguan Dinamis (`/report`)**: Evaluasi berkala yang mensintesis data riwayat check-in dan misi lokal klien secara dinamis, visualisasi grafik tren suasana hati 7 hari, distribusi pemicu beban emosional, pengamatan kualitatif AI, dan tombol salin ringkasan untuk konselor.
- **Sinkronisasi Terenkripsi Ujung-ke-Ujung (E2EE Sync - `/recovery`)**: Pencadangan dan pemulihan data lokal antarperangkat menggunakan enkripsi Web Crypto API (AES-GCM 256-bit + PBKDF2) yang diturunkan langsung dari 12 kata kunci pemulihan pengguna dengan arsitektur *Zero-Knowledge* (server hanya menyimpan *ciphertext* opaque).
- **Responsive Layout & Accessibility**: Desain responsif mobile/tablet/desktop dengan dukungan keyboard navigation, fokus visual terstandarisasi, dan `@media (prefers-reduced-motion)`.

### UI / Design System ("Soft Calm Glass")
- **Minimalism**: Tipografi tertata, visual tanpa kebisingan (*low noise*), hierarki jelas, spasi bernapas yang lega.
- **Soft Material**: Permukaan dengan radius sudut lembut (`rounded-2xl`, `rounded-3xl`), elevasi bayangan halus (*soft shadows*), dan kontras teks tinggi yang ramah aksesibilitas.
- **Restrained Glassmorphism**: Efek kaca translusen dengan blur lembut (`backdrop-blur-md`, `border-white/70`) yang digunakan **secara selektif** hanya pada navigasi, kartu hero fitur, dan elemen mengambang kontekstual. Permukaan solid tetap digunakan pada konten teks padat, pertanyaan asesmen, dan antarmuka krisis.
- **Reusable Primitives**: `PageContainer`, `ContentColumn`, `SplitLayout`, `GlassCard`, `SoftCard`, `Button`, `Input`, `Textarea`, `Chip`, `Badge`, `ProgressBar`, `HelpButton`, `MoodSelector`, `MissionCard`.

---

## 5. Safety Architecture & Ironclad Guardrails

Keselamatan pengguna dan kemurnian domain pendampingan emosional adalah prioritas mutlak di atas estetika dan fitur kecerdasan buatan. Dengar.in menerapkan sistem pertahanan bertingkat (*4-Layer Ironclad Defense*) sebelum dan sesudah inferensi model:

```
Input Pengguna (Asesmen / Chat / Catatan)
               │
               ▼
┌────────────────────────────────────────────────────────┐
│  LAYER 0: DETERMINISTIC CRISIS ENGINE                  │
│  (services/crisis-engine)                              │
│  - Deteksi bahaya diri & keputusasaan akut             │
│  - Normalisasi teks & anti-evasi (leetspeak/elongation)│
│  - ZERO AI / LLM Dependencies                          │
└───────────────────────┬────────────────────────────────┘
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
 [CRISIS DETECTED]                 [NON-CRISIS]
       │                                 │
       ▼                                 ▼
 Proses AI STOP!          ┌────────────────────────────────────────────────────────┐
 Alihkan ke Layar         │  LAYER 1: DOMAIN & ANTI-CODING DETERMINISTIC GATE      │
 Darurat Resmi (/crisis)  │  (services/orchestrator/src/guardrails/domainGate.ts)  │
                          │  - Intersepsi pertanyaan koding, skrip & teknis IT     │
                          │  - Redireksi empati deterministik non-kritis           │
                          │  - Mencegah eksploitasi chatbot di luar well-being     │
                          └───────────────────────┬────────────────────────────────┘
                                                  │
                                 ┌────────────────┴────────────────┐
                                 ▼                                 ▼
                         [OUT-OF-DOMAIN]                    [VALID DOMAIN]
                                 │                                 │
                                 ▼                                 ▼
                          Respons Redireksi         ┌───────────────────────────────────────┐
                          Empati Langsung           │  LAYER 2: MULTI-BRAIN AI PIPELINE     │
                          (Tanpa Konsumsi Token)    │  1. Primary Brain: DeepSeek Platform  │
                                                    │     (deepseek-flash / JSON schema)    │
                                                    │  2. Second Brain: NVIDIA Nemotron 3   │
                                                    │     (OpenRouter anti-bias & review)   │
                                                    │  3. Third Brain: Google Gemini 3.1    │
                                                    │     (gemini-3.1-flash-lite fallback)  │
                                                    └──────────────────┬────────────────────┘
                                                                       │
                                                                       ▼
                                                    ┌───────────────────────────────────────┐
                                                    │  LAYER 3: MAXIMUM ACTION VALIDATOR    │
                                                    │  (services/validator)                 │
                                                    │  - Blokir blok kode markdown (```)    │
                                                    │  - Blokir diagnosis medis / klinis    │
                                                    │  - Blokir toxic positivity            │
                                                    │  - Sensor otomatis PII (email/tel/NIK)│
                                                    │  - Validasi Whitelist 6 Aksi JSON     │
                                                    └──────────────────┬────────────────────┘
                                                                       │
                                                                       ▼
                                                            [Output Aman ke Pengguna]
```

### Rincian Lapisan Keamanan (The 4 Layers of Defense)

1. **Layer 0: Isolasi Mutlak Crisis Engine (`services/crisis-engine`)**
   - **NOL Ketergantungan AI**: Beroperasi murni menggunakan normalisasi string (*anti-leetspeak*, pemadatan pemanjangan karakter) dan pencocokan pola regex terhadap katalog frasa krisis bahasa Indonesia.
   - **Prioritas Eksekusi Utama**: Menjadi filter absolut (Langkah 0) sebelum data pengguna diproses oleh modul apa pun. Jika krisis terdeteksi, AI sama sekali tidak dipanggil dan alur langsung beralih ke hub darurat resmi (`/crisis`).

2. **Layer 1: Domain & Anti-Coding Deterministic Gate (`services/orchestrator/src/guardrails/domainGate.ts`)**
   - **Pencegahan Penyalahgunaan Teknis**: Dengar.in adalah ruang aman kesehatan mental, bukan asisten pemrograman atau mesin penjawab umum.
   - **Deteksi Cepat**: Menyaring kata kunci pemrograman teknis (*syntax error*, *fizzbuzz*, *function*, *bikin navbar react*, *SQL query*, dll.) tanpa tanda distres emosional.
   - **Redireksi Empatik**: Mengembalikan respons pengalihan ramah secara instan untuk membawa percakapan kembali ke perasaan dan kesejahteraan pengguna, tanpa menghabiskan kuota inferensi LLM.

3. **Layer 2: Multi-Brain AI Pipeline dengan Anti-Bias Debiasing**
   - **Primary Brain (DeepSeek Platform - `deepseek-flash`)**: Menghasilkan respons empati yang kaya konteks sesuai format skema JSON terstruktur.
   - **Second Brain (OpenRouter - `nvidia/nemotron-3-ultra-550b-a55b:free`)**: Bertindak sebagai *independent debiaser & alignment reviewer* berbobot 550B parameter yang memeriksa apakah respons mengandung bias kognitif, klaim klinis ilegal, kebocoran koding, atau kepalsuan empati (*toxic positivity*), lalu merevisinya sebelum dikirim.
   - **Third Brain / Fallback (Google Gemini - `gemini-3.1-flash-lite`)**: Bertindak sebagai cadangan generatif berbasis *Google Generative Language API* dengan mode JSON terstruktur jika penyedia utama mengalami gangguan jaringan atau kuota.

4. **Layer 3: Maximum Guardrails Action Validator (`services/validator`)**
   - **Blokir Kode**: Menolak dan membuang respons apa pun yang menyertakan blok kode markdown (` ``` `) atau tag pemrograman.
   - **Anti-Diagnosis**: Melarang keras pernyataan diagnosa klinis (seperti "kamu menderita depresi mayor", "ini bipolar").
   - **Anti-Toxic Positivity**: Membatasi kalimat hampa yang menginvalidasi emosi (seperti "jangan sedih, semua ada hikmahnya").
   - **Sensor PII Otomatis**: Melakukan redaksi instan terhadap data sensitif pribadi (alamat email, nomor telepon Indonesia, dan format NIK 16 digit).
   - **Enforce Whitelist**: Memastikan hanya 6 aksi resmi yang diizinkan (`listen_and_reflect`, `suggest_mission`, `open_journal_prompt`, `suggest_forum`, `show_help_directory`, `adjust_path`).

5. **Layer 4: Deterministic Safe Rule Fallback**
   - Jika seluruh provider AI gagal merespons atau melanggar aturan validator skema, sistem secara otomatis mengembalikan respons pendamping deterministik yang hangat, aman, dan bebas risiko kegagalan.

---

## 6. Anonymity & Privacy

- **Identitas Kriptografis Lokal**: Sesi diidentifikasi menggunakan UUID v4 (`crypto.randomUUID`) yang dibuat langsung di peramban klien.
- **12-Kata Kunci Pemulihan**: Menggunakan katalog kata-kata tenang bahasa Indonesia terpilih untuk pencadangan manual tanpa akun.
- **Tanpa PII**: Tidak ada field database, form, atau log yang meminta nama asli, nomor identitas (NIK), email, atau nomor seluler.
- **Penyimpanan Lokal Saja (Local-First)**: Data sesi, refleksi misi, dan catatan check-in disimpan di `localStorage` peramban pengguna. Tidak ada sinkronisasi cloud tanpa persetujuan eksplisit.
- **Pembersihan Data Sekali Klik**: Tersedia opsi *Hapus Permanen* di halaman `/recovery` untuk menghapus seluruh jejak lokal seketika.

---

## 7. Technology Stack

### Current Implementation

| Lapisan | Teknologi | Versi | Catatan |
|---|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) | `15.1.4` | React Server/Client Components, Static Generation |
| **UI Library** | [React](https://react.dev/) | `19.0.0` | Antarmuka deklaratif interaktif |
| **Bahasa** | [TypeScript](https://www.typescriptlang.org/) | `5.7.3` | Strict typechecking di seluruh monorepo |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `3.4.17` | Desain token kustom & utilitas glassmorphism |
| **Ikonografi** | [Lucide React](https://lucide.dev/) | `^1.16.0` | Ikon visual konsisten dan ringan |
| **Monorepo** | npm Workspaces | `10.x+` | Manajemen paket monorepo lintas aplikasi & modul |
| **Test Runner** | Node.js Test Runner | Native | `node --experimental-strip-types` (Zero external test runner) |
| **Linter** | ESLint | `8.57.1` | Standalone `@typescript-eslint` dengan 0 error/warning |

### Backend

| Lapisan | Paket | Catatan |
|---|---|---|
| **HTTP API** | `apps/web/src/app/api/*` | Route Handlers Next.js: `/api/chat`, `/api/forum`, `/api/forum/[postId]/moderate`, `/api/report/weekly`, `/api/sync`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/me`, `/api/health` |
| **AI Orchestrator** | `services/orchestrator` (`@dengarin/orchestrator`) | Multi-Brain AI Pipeline: Domain Gate → Primary Brain (DeepSeek Platform: `deepseek-flash`) → Second Brain (OpenRouter: `nvidia/nemotron-3-ultra-550b-a55b:free` debiaser) → Third Brain Fallback (Google Gemini: `gemini-3.1-flash-lite`) → Rule-based Fallback |
| **Prompt Templates** | `packages/prompts` (`@dengarin/prompts`) | Sistem prompt, JSON action schemas, & batasan larangan koding / diagnosa medis, dikonsumsi oleh `services/orchestrator` |
| **Persistence** | `services/persistence` (`@dengarin/persistence`) | `ForumRepository`, `SyncRepository`, `AdminRepository` — adapter **PostgreSQL sungguhan** (`pg`) teruji integrasi, dengan fallback in-memory otomatis saat `DATABASE_URL` kosong (lihat `src/factory.ts`) |
| **Auth (Admin/Moderator)** | `services/auth` (`@dengarin/auth`) | Hashing password (`scrypt`, native Node `crypto`) & sesi bertanda tangan HMAC-SHA256 (JWT-lite) untuk gerbang `/api/admin/*` dan moderasi forum |

### Database

Skema PostgreSQL didefinisikan di `services/persistence/migrations/001_init.sql` (tabel `forum_posts`, `synced_sessions`, `admin_users`) dan sudah **diuji terhadap instance PostgreSQL sungguhan** (bukan hanya typecheck) — lihat `tests/persistence-pg/`. Jalankan:

```bash
# 1. Set DATABASE_URL di .env.local (lihat .env.example)
# 2. Terapkan skema
npm run db:migrate

# 3. Buat akun admin/moderator pertama (tidak ada endpoint signup)
ADMIN_SEED_USERNAME=admin ADMIN_SEED_PASSWORD=ganti-ini-dengan-yang-kuat npm run db:seed-admin
```

Tanpa `DATABASE_URL`, seluruh API tetap berjalan menggunakan adapter in-memory (data hilang saat proses berhenti) — cocok untuk pengembangan lokal tanpa database.

### AI Engine Architecture (Live Multi-Brain)
- **Primary Brain**: DeepSeek Platform (`DEEPSEEK_API_KEY`, model default `deepseek-flash` atau `deepseek-chat`, overridable lewat `DEEPSEEK_MODEL`) menghasilkan respons afektif berbasis JSON action schema.
- **Second Brain (Anti-Bias & Alignment)**: OpenRouter (`OPENROUTER_API_KEY`, model `nvidia/nemotron-3-ultra-550b-a55b:free`, overridable lewat `OPENROUTER_MODEL`) bertindak sebagai penilai netralitas independen berukuran 550B parameter untuk mereduksi bias kognitif dan membersihkan klaim yang melanggar batasan.
- **Third Brain (Generative Fallback)**: Google Gemini (`GEMINI_API_KEY`, model `gemini-3.1-flash-lite`, overridable lewat `GEMINI_MODEL`) bertindak sebagai jaring pengaman inferensi cloud dengan mode JSON terstruktur bawaan.
- **Pre-LLM Domain Gate**: Filter deterministik cepat yang mencegat pertanyaan koding/teknis tanpa menyentuh kuota token AI.
- **Post-LLM Maximum Guardrails**: Sensor otomatis PII (email, telepon, NIK), penghapusan blok kode markdown, dan pembatasan whitelist 6 aksi.

---

## 8. Project Structure

Repositori menggunakan arsitektur monorepo berbasis npm Workspaces:

```
Denger.in/
├── apps/
│   └── web/                     # Aplikasi Next.js 15 (Frontend + Backend API)
│       ├── src/
│       │   ├── app/             # Rute App Router (/consent, /dashboard, /chat, dll.)
│       │   │   └── api/         # Route Handlers backend (/api/chat, /api/forum, /api/admin/*, /api/report/weekly, /api/sync, /api/health)
│       │   ├── components/      # Komponen navigasi, footer, kartu aksi interaktif, dan UI primitives
│       │   │   └── ui/          # Primitives: GlassCard, SoftCard, Button, Layout, dll.
│       │   └── lib/
│       │       ├── api/         # Crisis gate, rate limiter, sesi admin, repositori singleton, helper respons JSON
│       │       └── storage.ts   # Manajemen sesi anonim & storage peramban
│       ├── tailwind.config.js   # Konfigurasi token desain visual Soft Calm Glass
│       └── tsconfig.json
├── packages/
│   ├── types/                   # Definisi tipe data TypeScript global (@dengarin/types)
│   ├── config/                  # Katalog kontak darurat, misi, dan opsi domain (@dengarin/config)
│   └── prompts/                 # Template, skema aksi JSON & batasan prompt AI (@dengarin/prompts)
├── services/
│   ├── crisis-engine/           # Detektor krisis deterministik tanpa AI (@dengarin/crisis-engine)
│   ├── validator/               # Validator runtime skema aksi AI & Maximum Guardrails (@dengarin/validator)
│   ├── orchestrator/            # Pipeline Multi-Brain: Domain Gate → DeepSeek → Nemotron Debiaser → Gemini 3.1 → Deterministik (@dengarin/orchestrator)
│   ├── persistence/             # Repositori forum, sinkronisasi & admin — adapter PostgreSQL + in-memory (@dengarin/persistence)
│   │   ├── migrations/          # Skema SQL (001_init.sql: forum_posts, synced_sessions, admin_users)
│   │   └── scripts/             # db:migrate, db:seed-admin
│   └── auth/                    # Hashing password & sesi HMAC untuk admin/moderator (@dengarin/auth)
├── tests/
│   ├── crisis/                  # 33 pengujian unit mesin krisis (normalisasi, false-positive, slang)
│   ├── validator/               # 28 pengujian unit validator skema aksi & maximum guardrails
│   ├── assessment/              # 19 pengujian alur asesmen adaptif
│   ├── orchestrator/            # 9 pengujian pipeline Multi-Brain, debiaser & anti-coding domain gate
│   ├── persistence/              # Pengujian repositori forum & sinkronisasi in-memory
│   ├── persistence-pg/           # Pengujian integrasi terhadap PostgreSQL sungguhan (skip otomatis tanpa DATABASE_URL)
│   └── auth/                     # 10 pengujian hashing password & sesi admin
├── docs/                        # Dokumentasi arsitektur, PRD, kebijakan keselamatan, UX, rate limiting (M01), & migrasi recovery
├── supabase/
│   └── migrations/              # Migrasi skema Supabase tambahan (mis. synced_sessions_v2 dengan RLS untuk secure sync v2)
├── .env.example                 # Contoh variabel lingkungan backend (kunci AI, DATABASE_URL, ADMIN_SESSION_SECRET)
├── package.json                 # Konfigurasi monorepo root & script eksekusi
└── tsconfig.base.json           # Konfigurasi TypeScript dasar monorepo
```

---

## 9. Routes

| Route | Tujuan / Fungsi | Status Implementasi |
|---|---|---|
| `/` | Halaman beranda utama dengan editorial hero, filosofi, dan direktori domain | **Implemented** |
| `/consent` | Persetujuan batasan hukum, privasi, dan non-medis | **Implemented** |
| `/onboarding` | Panduan pemilihan kelompok usia, peran, dan domain beban hidup | **Implemented** |
| `/assessment` | Kuesioner evaluasi beban emosional bertahap dengan filter keselamatan | **Implemented** |
| `/assessment/result` | Ringkasan hasil evaluasi & rekomendasi jalur lanjutan pasca-asesmen | **Implemented** |
| `/crisis` | Saluran tanggap darurat resmi dengan tombol telepon 1-tap | **Implemented** |
| `/dashboard` | Dasbor utama: misi harian aktif, status check-in, dan alat bantuan | **Implemented** |
| `/mission` | Panduan langkah misi intervensi harian dengan kolom refleksi | **Implemented** |
| `/checkin` | Pencatatan suasana hati harian, energi, pemicu stres, dan riwayat | **Implemented** |
| `/recovery` | Tampilan 12-kata kunci pemulihan sesi dan utilitas pembersihan data | **Implemented** |
| `/journal` | Jurnal privat lokal bebas jejak di peramban pengguna | **Implemented (Local-First)** |
| `/chat` | Antarmuka pendamping interaktif Multi-Brain AI dengan aksi tervalidasi | **Implemented (Live Multi-Brain: DeepSeek + Nemotron + Gemini 3.1)** |
| `/resources` | Direktori layanan bantuan profesional & hotline terverifikasi | **Implemented** |
| `/forum` | Ruang cerita solidaritas anonim dengan moderasi keselamatan otomatis | **Implemented** |
| `/report` | Laporan evaluasi sintesis kemajuan mingguan & grafik suasana hati 7 hari | **Implemented** |

---

## 9a. Backend HTTP API

Permukaan HTTP backend diimplementasikan sebagai Next.js Route Handlers di `apps/web/src/app/api/`, memakai logika dari `services/crisis-engine`, `services/orchestrator`, `services/validator`, `services/persistence`, dan `services/auth`. Lihat `docs/API_SPEC.md` Bagian 5 untuk kontrak permintaan/respons lengkap.

| Endpoint | Metode | Tujuan / Fungsi | Status |
|---|---|---|---|
| `/api/health` | `GET` | Health check layanan backend | **Implemented** |
| `/api/chat` | `POST` | Gerbang krisis deterministik → Gerbang domain/anti-coding → Multi-Brain AI Pipeline (DeepSeek → Nemotron Debiaser → Gemini 3.1 Fallback) → Maximum Guardrails & PII Redactor | **Implemented (Live Multi-Brain)** |
| `/api/forum` | `GET`, `POST` | Filter kategori; kirim cerita baru dengan penyaringan krisis & moderasi keselamatan otomatis (`moderateForumPost`) | **Implemented** (PostgreSQL / in-memory, teruji end-to-end) |
| `/api/forum/[postId]/support` | `POST` | Tambah dukungan empati komunitas ("Rasakan Hal Serupa") | **Implemented** |
| `/api/forum/[postId]/moderate` | `PATCH` | Setujui/tolak cerita forum secara manual | **Implemented** — dilindungi sesi admin (`/api/admin/login`), teruji end-to-end |
| `/api/report/weekly` | `POST` | Sintesis mingguan dinamis & personal dari riwayat check-in/misi klien | **Implemented** |
| `/api/sync` | `GET`, `PUT` | Simpan/ambil paket terenkripsi ujung-ke-ujung (AES-GCM 256-bit + PBKDF2) klien berdasarkan hash frasa 12-kata | **Implemented (Client-Side Zero-Knowledge E2EE)** |
| `/api/admin/login` | `POST` | Login admin/moderator (username+password → cookie sesi HMAC httpOnly) | **Implemented**, teruji end-to-end |
| `/api/admin/logout` | `POST` | Hapus cookie sesi admin | **Implemented** |
| `/api/admin/me` | `GET` | Cek sesi admin aktif saat ini | **Implemented** |

> [!NOTE]
> Semua endpoint di atas sudah diuji end-to-end terhadap instance PostgreSQL sungguhan maupun in-memory. Multi-Brain AI didukung penuh secara live menggunakan kredensial yang dikonfigurasi pada `.env.local` (`DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, dan `GEMINI_API_KEY`). Sinkronisasi antarperangkat `/api/sync` sepenuhnya aman dengan enkripsi ujung-ke-ujung (E2EE) berbasis Web Crypto API di sisi klien (server hanya menyimpan ciphertext tanpa mengetahui data asli).

---

## 10. Crisis Resources

Daftar saluran bantuan darurat di dalam repositori dikurasi secara ketat dan memiliki status verifikasi resmi:

| Lembaga | Kategori | Kontak | Waktu Operasional | Biaya | Status |
|---|---|---|---|---|---|
| **Kemenkes Sejiwa** | Darurat Nasional | `119 ext 8` | 24 Jam / 7 Hari | Bebas Pulsa | `verified_official` |
| **Lisa Helpline** | Pencegahan Krisis | `021-3777-5472` / WA `0811-381-5472` | 24 Jam (ID / EN) | Tarif Standar | `verified_official` |
| **Yayasan Pulih** | Konseling Trauma | `021-788-42580` / WA `0811-8436-633` | Hari Kerja | Tarif Standar | `verified_official` |
| **KPAI & Teencare** | Perlindungan Remaja | `1500-771` / WA `0811-177-2273` | 24 Jam / 7 Hari | Bebas Pulsa | `verified_official` |
| **Satgas PASTI / OJK** | Teror Pinjol / Finansial | `157` / WA `081-157-157-157` | Hari Kerja | Tarif Standar | `verified_official` |

> [!IMPORTANT]
> Seluruh nomor bantuan darurat wajib diverifikasi ulang secara manual oleh operator sebelum pelaksanaan peluncuran produksi publik.

---

## 11. Development

### Prasyarat
- **Node.js**: Versi `20.x`, `22.x`, atau `24.x` (mendukung flag native TypeScript `--experimental-strip-types`)
- **npm**: Versi `10.x` atau lebih baru

### Instalasi Dependensi
```bash
npm install
```

### Menjalankan Server Pengembangan Lokal
```bash
npm run dev
```
Akses aplikasi melalui peramban di `http://localhost:3000`. Tanpa `DATABASE_URL`, backend otomatis memakai penyimpanan in-memory (lihat bagian 7 "Database").

### Konfigurasi Variabel Lingkungan (.env.local)
Salin `.env.example` ke `.env.local` untuk mengonfigurasi database dan kunci API Multi-Brain:
```env
# Multi-Brain AI Providers (Aktif pada /chat & /api/chat)
DEEPSEEK_API_KEY=sk-...                          # Primary Brain: DeepSeek Platform
DEEPSEEK_MODEL=deepseek-flash
OPENROUTER_API_KEY=sk-or-v1-...                  # Second Brain: OpenRouter Anti-Bias
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
GEMINI_API_KEY=...                               # Third Brain: Google Gemini Fallback
GEMINI_MODEL=gemini-3.1-flash-lite

# Database & Auth (Opsional untuk dev lokal)
DATABASE_URL=postgresql://user:pass@localhost:5432/dengarin
ADMIN_SESSION_SECRET=kunci-rahasia-minimal-32-karakter-acak
```

### (Opsional) Menyambungkan PostgreSQL Sungguhan
```bash
# 1. Terapkan skema migrasi
npm run db:migrate

# 2. Buat akun admin/moderator pertama
ADMIN_SEED_USERNAME=admin ADMIN_SEED_PASSWORD=ganti-ini-dengan-yang-kuat npm run db:seed-admin
```

### Menjalankan Seluruh Validasi Otomatis
```bash
# 1. Menjalankan seluruh rangkaian unit & integrasi test (157+ pengujian, termasuk suite keamanan M-01/M-02/M-03)
npm run test

# 2. Validasi tipe TypeScript di seluruh monorepo
npm run typecheck

# 3. Pemeriksaan linting ESLint
npm run lint

# 4. Kompilasi production bundle Next.js
npm run build
```
Pengujian integrasi PostgreSQL (`tests/persistence-pg`) otomatis dilewati (exit 0) jika `DATABASE_URL` tidak diset saat menjalankan `npm run test` — jadi validasi tetap hijau di lingkungan tanpa database.

---

## 12. Validation

Status validasi otomatis saat ini di repositori:

| Uji Kelayakan | Cakupan | Hasil |
|---|---|---|
| **Crisis Engine Tests** | 54 pengujian (33 deteksi inti: anti-evasi, leetspeak, frasa bunuh diri, false-positive; 21 regresi tambahan) | **54 / 54 PASS** |
| **Action Validator & Moderation Tests** | 35 pengujian (whitelist 6 aksi, blokir blok koding ` ``` `, sensor PII NIK/email/telepon, anti-diagnosis, anti-toxic positivity, dan moderasi konten forum) | **35 / 35 PASS** |
| **Assessment Tests** | 19 pengujian alur asesmen adaptif | **19 / 19 PASS** |
| **AI Orchestrator Tests** | 9 pengujian (Domain Gate anti-coding, pipeline Multi-Brain Tier 1/2/3, Nemotron debiaser, fallback aman) | **9 / 9 PASS** |
| **Persistence Tests (in-memory)** | 7 pengujian repositori forum & sinkronisasi | **7 / 7 PASS** |
| **Auth Tests** | 10 pengujian hashing password & sesi admin bertanda tangan | **10 / 10 PASS** |
| **Crypto & Recovery Sync Security Tests** | 9 pengujian (4 enkripsi/dekripsi AES-GCM 256-bit & PBKDF2 Web Crypto API, 5 keamanan sinkronisasi v2: bukti tulis anti-replay, migrasi backup lama) | **9 / 9 PASS** |
| **Security M-01: Rate Limit & Request Boundary Tests** | Uji limiter jendela tetap per-rute, batas konkurensi 4 panggilan `/chat` simultan, batas ukuran pesan/riwayat/payload JSON | **PASS** (proses-lokal; lihat `docs/M01_RATE_LIMITING.md` untuk keterbatasan multi-instance) |
| **Security M-02: Forum Pseudonym Anti-Abuse Tests** | 7 pengujian penolakan alamat kontak, tautan, ajakan judi/pinjol, ujaran kasar, dan markup HTML pada nama samaran forum | **7 / 7 PASS** |
| **Security M-03: Anonymous Data Wipe Tests** | 3 pengujian penghapusan total data lokal berawalan `dengarin_` lintas tanggal tanpa menyentuh data situs lain | **3 / 3 PASS** |
| **Persistence Tests (PostgreSQL, integrasi)** | Pengujian repositori & konfigurasi TLS koneksi database terhadap instance sungguhan (skip otomatis tanpa `DATABASE_URL`) | **PASS** (diverifikasi dengan PostgreSQL lokal) |
| **End-to-End API (manual)** | Alur penuh chat Multi-Brain live, registrasi sesi, krisis, moderasi forum, dan E2EE sync | **PASS** |
| **Typecheck** | `tsc --noEmit` pada seluruh paket dan aplikasi monorepo | **0 Errors** |
| **Lint** | ESLint pada seluruh komponen dan modul TypeScript | **0 Errors, 0 Warnings** |
| **Production Build** | `next build` App Router + 10 API routes (27 total routes) | **SUCCESS** |

---

## 13. Design System

Visual Dengar.in menerapkan konsep identitas **"Soft Calm Glass"**:
- **Warna Alami**: Palet warna yang dirancang untuk meredakan ketegangan mata, berpusat pada nuansa *sage calm* (`#38614F`), *warm sand* (`#FAF8F5`, `#F4F0E8`), dan *soft terracotta* (`#D97736`).
- **Pemanfaatan Kaca Selektif**: Efek kaca translusen hanya diaplikasikan pada navigasi atas, kartu hero, dan elemen mengambang kontekstual untuk memberikan kedalaman berdimensi tanpa mengorbankan keterbacaan.
- **Aksesibilitas Kontras Tinggi**: Pada konten panjang, form interaktif, pertanyaan asesmen, dan antarmuka darurat, sistem menggunakan kartu material solid berkontras tinggi untuk memastikan kepatuhan standar WCAG.
- **Dukungan Gerak Berkurang**: Animasi dan transisi dinonaktifkan secara otomatis bagi pengguna yang mengaktifkan preferensi *prefers-reduced-motion*.

---

## 14. Security & Safety Notes

### Perlindungan Saat Ini (Current Implementation)
- **Isolasi Logika Krisis (Layer 0)**: Logika keselamatan hidup beroperasi secara independen di sisi klien/server tanpa campur tangan model generatif.
- **Domain & Anti-Coding Gate (Layer 1)**: Penyaringan pra-LLM instan untuk mencegah pembelokan platform menjadi asisten pemrograman atau penjawab umum.
- **Second Brain Debiasing (Layer 2)**: Pemeriksaan netralitas emosional dan penghapusan bias kognitif menggunakan NVIDIA Nemotron 3 Ultra 550B sebelum pesan dikirimkan ke pengguna.
- **Validasi Skema Aksi Ketat & Maximum Guardrails (Layer 3)**: Segala respons kecerdasan buatan disaring melalui whitelist 6 aksi terdefinisi; larangan keras penyertaan blok kode markdown, klaim diagnostik klinis psikiatri, dan penyingkiran *toxic positivity*.
- **Moderasi Keselamatan Otomatis Forum (`moderateForumPost`)**: Penyaringan multi-kategori yang memeriksa ujaran kebencian, kata-kata kasar, promosi pinjol ilegal/judi, serta klaim medis sebelum cerita dapat tampil di ruang publik.
- **Enkripsi Ujung-ke-Ujung Sisi Klien (Zero-Knowledge E2EE)**: Data sesi, check-in, dan jurnal dienkripsi menggunakan algoritma AES-GCM 256-bit dan PBKDF2 (100.000 iterasi) langsung di peramban pengguna menggunakan 12 kata kunci pemulihan. Server hanya menerima dan menyimpan *ciphertext opaque*, sehingga privasi pengguna terlindungi secara absolut.
- **Sensor Data Sensitif (PII Redaction)**: Deteksi dan penyensoran otomatis terhadap alamat surel, nomor telepon Indonesia, serta format 16-digit NIK agar privasi pengguna terlindungi dari kebocoran log.
- **Sesi Bebas Identitas**: Identitas berbasis UUID acak lokal yang tidak memerlukan database identitas kependudukan.
- **Data Tersimpan Lokal**: Catatan emosional dan jurnal disimpan di peramban lokal tanpa log server sentral.
- **Kontrol Anti-Abuse API (M-01)**: Limiter jendela tetap (*fixed-window*) per rute publik (`/api/chat`, `/api/admin/login`, `/api/forum`, `/api/forum/[postId]/support`, `/api/report/weekly`, `/api/sync`), batas konkurensi 4 panggilan `/chat` simultan, serta pembatasan ukuran payload/pesan/riwayat chat. **Catatan**: saat `REDIS_URL` aktif, kuota per-rute dibagi lintas instance dan bertahan sampai window berakhir meski aplikasi restart. Saat Redis tidak tersedia, limiter memakai fallback memori lokal; batas konkurensi tetap lokal. Lihat [panduan Redis](docs/REDIS.md) dan [hasil pengujian](docs/REDIS_TESTING_CHECKLIST.md).
- **Moderasi Anti-Abuse Nama Samaran Forum (M-02)**: Penolakan otomatis alamat kontak, tautan/domain (termasuk penyamaran karakter Unicode), ajakan judi/pinjol ilegal, dan ujaran kasar pada nama samaran cerita forum sebelum tersimpan.
- **Verifikasi Penghapusan Data Total (M-03)**: Pengujian otomatis yang memastikan seluruh kunci `localStorage` berawalan `dengarin_` (sesi, check-in, jurnal, draf asesmen, metadata sinkronisasi) terhapus tuntas oleh utilitas *Hapus Permanen*.

### Fitur Keamanan Direncanakan (Planned)
- Verifikasi konfigurasi Redis di lingkungan deployment: TLS, autentikasi, akses jaringan, serta batas memori. Kuota Redis yang sudah diterapkan bersifat anonim per-rute, bukan per-klien.

---

## 15. Roadmap

### Completed (Sprint 0, Sprint 1, Sprint 2 & Sprint 3+)
- [x] Fondasi arsitektur monorepo, paket konfigurasi, dan tipe data global.
- [x] Mesin deteksi krisis deterministik bahasa Indonesia (33 pengujian tervalidasi).
- [x] Runtime action whitelist validator untuk output AI & Maximum Guardrails (35 pengujian tervalidasi).
- [x] Alur pengguna inti: Landing → Consent → Anonymous UUID → Onboarding → Assessment → Dashboard → Mission → Check-in.
- [x] Direktori bantuan darurat resmi Indonesia terverifikasi.
- [x] Redesain sistem visual "Soft Calm Glass" dan restrukturisasi hierarki tata letak 12-kolom responsif.
- [x] Integrasi penyimpanan lokal aman (*client-side local persistence*).
- [x] Kerangka backend: HTTP API (`apps/web/src/app/api`), template prompt (`packages/prompts`), adapter PostgreSQL sungguhan & in-memory.
- [x] Autentikasi admin/moderator (`services/auth`: hashing password scrypt + sesi bertanda tangan HMAC) yang menggerbangi `/api/forum/[postId]/moderate`.
- [x] Skema migrasi (`services/persistence/migrations`) & script operasional (`npm run db:migrate`, `npm run db:seed-admin`).
- [x] **Live Multi-Brain AI Orchestrator**:
  - Primary Brain: DeepSeek Platform (`deepseek-flash`) via JSON Mode.
  - Second Brain: OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free`) untuk debiasing, anti-bias, dan penyelarasan empati.
  - Third Brain: Google Gemini (`gemini-3.1-flash-lite`) sebagai cadangan cloud generatif.
  - Deterministic Rule-based Fallback.
- [x] **Ironclad Maximum Guardrails & Anti-Coding Domain Gate**:
  - Pencegahan pertanyaan koding/teknis di gerbang awal.
  - Penolakan blok format kode ` ``` ` dan bahasa pemrograman.
  - Redaksi otomatis PII (email, nomor telepon Indonesia, NIK).
  - Larangan diagnosis klinis & eliminasi *toxic positivity*.
- [x] **Interactive Action Cards pada Antarmuka Chat**:
  - Kartu visual interaktif langsung untuk misi harian, prompt jurnal lokal, rekomendasi forum, direktori bantuan darurat, dan penyesuaian jalur 14 hari.
- [x] **Ruang Cerita Anonim Solidaritas (`/forum`) Live**:
  - Feed cerita antar-pengguna dengan filter kategori domain.
  - Modal interaktif "Bagikan Cerita Anonim" dengan generator nama samaran tanpa PII.
  - Moderasi keselamatan otomatis lapis ganda (Gerbang Krisis + Anti-Toksik/Spam/Scam).
  - Tombol empati interaktif *"Rasakan Hal Serupa"* dengan pelacakan status lokal.
- [x] **Laporan Kemajuan Mingguan Dinamis (`/report`)**:
  - Evaluasi berbasis data aktual peramban (`getDailyCheckins`, misi harian, catatan jurnal).
  - Grafik visual tren suasana hati 7 hari (*7-Day Mood Trend Chart*) interaktif.
  - Sintesis pola emosi kualitatif & pesan penguat via endpoint `/api/report/weekly`.
  - Tombol salin ringkasan evaluasi untuk keperluan konsultasi profesional.
- [x] **Sinkronisasi Antarperangkat Terenkripsi Ujung-ke-Ujung (Client-Side E2EE Sync)**:
  - Enkripsi Web Crypto API (AES-GCM 256-bit + PBKDF2) dari 12 kata kunci pemulihan.
  - Tombol "Cadangkan ke Cloud (E2EE)" pada halaman `/recovery`.
  - Tombol "Dekripsi & Pulihkan Sesi" untuk memulihkan seluruh riwayat check-in dan jurnal di perangkat baru secara *zero-knowledge*.
- [x] **Kontrol Anti-Abuse & Keamanan Tambahan (M-01, M-02, M-03)**:
  - Rate limiting jendela tetap per-rute & batas konkurensi chat, dengan validasi ukuran payload/pesan/riwayat (`apps/web/src/lib/api/rateLimit.ts`, `requestLimits.ts`).
  - Moderasi anti-abuse nama samaran forum (kontak, tautan, judi/pinjol, ujaran kasar, markup HTML).
  - Verifikasi penghapusan data lokal total pasca-*Hapus Permanen* dan migrasi backup lama ke sinkronisasi v2 (lihat `docs/RECOVERY_MIGRATION.md`).
  - 3 suite pengujian keamanan baru (`tests/security/`) menambah cakupan validasi otomatis repositori.

### Planned (Sprint 4+ / Future Scale)
- [x] Rate limiting Redis per-rute dengan fallback memori; tes dua instance dan restart aplikasi lulus. Lihat [checklist Redis](docs/REDIS_TESTING_CHECKLIST.md).
- [ ] Opsi bookmark cerita komunitas ke dalam jurnal refleksi pribadi lokal.

---

## 16. Team

Proyek Dengar.in dikembangkan dan dikelola oleh:
- **Dengar.in Team** (MindCraft Web Competition 2026)

---

## 17. Competition Context

Dengar.in dikembangkan dalam rangka keikutsertaan pada:
- **Kompetisi**: MindCraft Web Competition 2026
- **Tema**: *"Building Digital Solutions for Mental Well-being"*

Proyek ini dirancang untuk mendemonstrasikan bagaimana teknologi web modern dapat menghadirkan ruang aman kesehatan mental yang berempati, menjunjung tinggi privasi anonim, serta memiliki tata kelola keselamatan klinis yang kokoh.

---

## 18. Disclaimer

> **Pernyataan Penyangkalan (Disclaimer):**  
> Dengar.in adalah purwarupa pendamping mandiri digital (*self-help well-being prototype*) dan **BUKAN pengganti layanan medis, psikoterapi profesional, diagnosis psikiatri, atau penanganan gawat darurat klinis**. Platform ini tidak menyediakan diagnosis, resep obat, ataupun nasihat hukum dan keuangan.  
> Jika Anda atau seseorang yang Anda kenal berada dalam kondisi krisis akut, memiliki pikiran untuk menyakiti diri sendiri, atau membutuhkan bantuan darurat segera, hubungi saluran darurat resmi **Kemenkes Sejiwa di 119 ext 8** atau kunjungi instalasi gawat darurat fasilitas kesehatan terdekat.

---

## 19. License

License: **MIT** (dideklarasikan pada `package.json`). Berkas `LICENSE` formal belum ditambahkan ke repositori.
