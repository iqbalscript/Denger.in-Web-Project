# Riset Fitur & Analisis Gap — Dengar.in CareBridge (AMD Track 2)

**Tanggal:** 13 Oktober 2026 (WIB) · **Sisa waktu build:** ±3 hari (target selesai 17 Okt, submit internal 18 Okt 18:00 WIB per [AMD-01](../AMD_01_SCOPE_DAN_SYARAT.md))
**Status dokumen:** riset + rekomendasi. Tidak ada perubahan kode. Semua angka eksternal diberi sumber dan tanggal akses; yang belum terverifikasi ditandai **[BELUM DIVERIFIKASI]**.
**Pembaca:** Product/Pitch, Frontend, AI/AMD, Safety/QA.

Rujukan internal: [Development Plan](../AMD_TRACK2_DEVELOPMENT_PLAN.md) · [Backlog](../AMD_TRACK2_TASKS.md) · [Kebijakan Safety](../CAREBRIDGE_SAFETY_POLICY.md) · [Rubrik Eval](../CAREBRIDGE_EVAL_RUBRIC.md) · [PRD-DESIGN](../PRD-DESIGN.md) · [AI Policy](../AI_POLICY.md)

---

## 0. Ringkasan eksekutif

1. **Yang sudah kuat:** rantai keamanan deterministik → consent → inferensi pada teks tersanitasi → validator grounding (setiap fakta wajib mengutip kata pengguna sendiri; tanpa diagnosis, tanpa persentase buatan; model hanya bisa *mengeskalasi*). Ini sudah lebih ketat daripada produk intake komersial (Limbic, Wysa) yang justru mengklaim "akurasi diagnostik".
2. **Gap paling fatal untuk penjurian:** AMD belum terlihat di produk (belum ada route `/api/care-passport` dan halaman `/care-passport`); `/api/chat` masih DeepSeek. Brief resmi: *"The AMD component must be part of the working product shown to the judges."*
3. **Gap faktual yang bisa memalukan di demo:** nama/jam layanan krisis di kode dan UI masih "Kemenkes Sejiwa, Siaga 24 Jam, sejiwa.kemkes.go.id". Halaman resmi Kemenkes (7 Agu 2025) menyebut **Healing119.id**, "pagi hingga malam", gratis, "dukungan psikologis awal" (bukan terapi).
4. **Rekomendasi build (urutan):** (a) selesaikan fondasi AMD-09/10/11 (route + halaman + ekspor) ≈ 1 hari; (b) **Fitur #1 "Bukti Bertanggal"** — pengguna memilih entri jurnal/check-in lokal sebagai bukti tambahan, per entri dengan izin dan pratinjau redaksi, lalu AMD mengekstrak dan setiap fakta ditautkan ke sumber bertanggal; (c) **Fitur #2 "Kalimat Pembuka per Tujuan"** — AMD menyusun 2–3 kalimat pembuka dalam kata-kata pengguna sendiri untuk tujuan yang dipilih (dokter puskesmas/FKTP, psikolog, chat Healing119) plus checklist rujukan BPJS deterministik.

---

## 1. Analisis gap vs brief Track 2 & kriteria juri

Brief Track 2 (diakses 13 Okt 2026, [lablab.ai](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii)): *"Make a part of the patient journey safer, clearer, or easier."* Demo harus kasus realistis dari input pertama sampai hasil; ketidakpastian terlihat; sistem tahu kapan manusia harus meninjau/mengambil alih; dilarang menyajikan diagnosis/treatment otonom sebagai saran medis. Kriteria: Application of Technology, Business Value, Originality, Presentation (tanpa bobot).

| # | Area | Gap konkret (bukti di repo) | Dampak ke kriteria | Prioritas |
|---|---|---|---|---|
| G1 | **AMD visibility** | Tidak ada `apps/web/src/app/api/care-passport/` dan `apps/web/src/app/care-passport/`. `apps/web/src/app/api/chat/route.ts` memanggil `runOrchestrator` (DeepSeek→OpenRouter→Gemini). `README.md` §Safety Architecture masih menggambar DeepSeek/Nemotron/Gemini, tanpa AMD. `AMD_TRACK2_TASKS.md` mencatat AMD-02 (endpoint nyata) masih TODO. | Application of Technology (gugur jika AMD tidak tampil di produk) | **P0** |
| G2 | **Akurasi layanan krisis** | `services/crisis-engine/src/crisisDetector.ts` L102–106 dan `packages/config/src/index.ts` L20–24: `name: 'Kemenkes Sejiwa'`, `website: 'https://sejiwa.kemkes.go.id'`; `PRD-DESIGN.md` §23 "Siaga 24 Jam"; `consent/page.tsx` dan `README.md` menyebut "Kemenkes Sejiwa". Sumber resmi (lihat §2.2): layanan bernama **Healing119.id**, jam "pagi hingga malam" (bukan 24 jam), gratis. Nomor WhatsApp Lisa Helpline di config `0811-381-5472` mirip dengan nomor WhatsApp Healing119 yang diberitakan media `08113855472` — **cek silang keduanya**. | Presentation, Safety (juri Track 2 pasti membuka layar krisis) | **P0** |
| G3 | **Consent & klaim "lokal"** | `apps/web/src/app/consent/page.tsx`: dua centang (anonim + bukan layanan darurat); tidak ada opt-in terpisah untuk pemrosesan AI di server pihak ketiga/AMD. Landing (`page.tsx` value prop "Semua data tersimpan di perangkatmu sendiri") kontradiktif dengan inferensi cloud. Pipeline (`carePassportPipeline.ts`) sudah menuntut `aiConsent`, tetapi UI belum ada. | Business Value (kepercayaan), Safety ("handle sensitive data") | **P0** |
| G4 | **Uncertainty & human review di UI** | Skema sudah punya `unknowns`, `needsReview`, `droppedClaims`, lima state (`packages/types/src/index.ts` L382–437), tetapi tidak satu pun dirender. `HUMAN_SUPPORT_RECOMMENDED` belum punya kasus emas (Rubrik §1) dan kebijakan `high` masih usulan (Safety Policy §3). | Track 2 wajib "show uncertainty & when human must review" | **P0** |
| G5 | **Celah validator yang diketahui** | Rubrik §4: label diagnosis tanpa subjek lolos di `containsUnsafeMedicalAdvice`; hanya persentase pertama dicek. Keduanya test `todo`. | Safety; mudah dipakai juri untuk "menjatuhkan" demo | P1 (kecil, perbaiki) |
| G6 | **Bukti/metrik** | Semua test CareBridge pakai provider tiruan (`tests/carebridge/*`). Belum ada log panggilan AMD nyata, latensi median/p95, jumlah `droppedClaims` dari model asli (Rubrik §3). Plan §7 hanya target, bukan hasil. | Application of Technology, Presentation | **P0** (setelah AMD-02) |
| G7 | **Business value belum dirumuskan** | Plan §1 menyebut pengguna "dewasa Indonesia 18+" tanpa segmen pembayar, tanpa angka biaya/akses lokal, tanpa jalur ke layanan nyata (FKTP/BPJS/Healing119). Tidak ada bagian "siapa yang membayar". | Business Value | P1 (konten pitch, bukan kode) |
| G8 | **Dua narasi bersaing** | `README.md` L16–18 menautkan dua proposal: *Yang Tak Terucap* (pesan ke teman/keluarga) dan *CareBridge* (Care Passport). Juri akan bingung; pilih satu untuk video/deck. | Presentation, Originality | P1 |
| G9 | **Lisensi & reproduksi** | Tidak ada `LICENSE` dan `Dockerfile` di root (dicek 13 Okt). Brief: "original and MIT-compliant". | Syarat submission | **P0** (15 menit) |
| G10 | **Umur** | Onboarding menerima 15–17 (`PRD.md` F04) sementara CareBridge adult-only. Route baru harus menolak `ageBracket` <18 dan UI menyembunyikan entri untuk remaja. | Safety | P1 |
| G11 | **Cache** | `apps/web/src/lib/api/aiCache.ts` dipakai `/api/chat`. Route passport **tidak boleh** memakainya (Safety Policy §7). Pastikan saat implementasi. | Safety | P0 (desain) |
| G12 | **Visual** | Komponen bernama `GlassCard`/`SoftCard` (`components/ui/index.ts`) berpotensi melanggar larangan glassmorphism/soft shadow PRD-DESIGN §3; `/crisis` sudah bebas `animate-*` (dicek: 0 kemunculan) — pertahankan. | Presentation | P2 (audit nama vs isi) |

---

## 2. Riset

Tanggal akses semua sumber: **13 Oktober 2026**.

### 2.1 Bagaimana "pre-visit summary" / catatan yang disiapkan pasien bekerja di praktik

| Temuan | Angka kunci | Sumber | Catatan keandalan |
|---|---|---|---|
| Pasien mengetik agenda kunjungan sendiri ke rekam medis sebelum bertemu dokter (klinik safety-net, Seattle) | 79% pasien & 74% klinisi: komunikasi membaik; 73%/82% ingin dilanjutkan; 80% pasien menulis <60 kata, 83% <10 menit | Anderson et al., *Annals of Family Medicine* 15(2), 2017 — https://www.annfammed.org/content/15/2/158 | Pilot n=101, satu klinik, tanpa kelompok kontrol, ada insentif. **Pelajaran produk:** catatan pendek saja sudah membantu; jangan membuat form panjang. |
| Chatbot intake (Limbic Access) mengumpulkan keluhan bebas + PHQ-9/GAD-7/WSAS *sebelum* asesmen NHS Talking Therapies | Waktu asesmen klinisi 41,6 vs 54,4 menit (−12,7 menit); tunggu asesmen 15,2 vs 17,4 hari; dropout 21,9% vs 26,7%; n=64.862, 9 layanan | Rollwage et al., *JMIR AI* 2024 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11041479 | Observasional/quasi-eksperimental; beberapa penulis pegawai/pemegang saham Limbic. Mekanisme yang diakui: *informasi yang terkumpul sebelum asesmen*, bukan "kecerdasan" chatbot. |
| Wysa Gateway (AS, 2025): intake self-service → ringkasan terstruktur untuk klinisi, masuk EHR, flag krisis | Klaim vendor: asesmen −30 menit; "95% diagnostic accuracy, confirmed by clinician" | https://blogs.wysa.io/blog/company-news/wysa-launches-ai-powered-chatbot-to-streamline-mental-health-patient-intake-in-the-us | Materi pers, tanpa metode. Ringkasan **menghadap klinisi**; tidak disebut pasien bisa melihat/mengedit. Klaim "akurasi diagnostik" justru hal yang dilarang brief Track 2 — ini celah positioning kita. |
| Panduan Mind (UK) untuk janji temu GP soal kesehatan mental | Tulis dulu apa yang ingin disampaikan, bagaimana perasaan & dampaknya ke keseharian, minta slot lebih panjang, boleh bawa catatan tercetak | https://www.mind.org.uk/for-young-people/how-to-get-help-and-support/what-happens-in-a-gp-appointment/ | Panduan organisasi, bukan studi. Struktur Care Passport (keluhan utama → dampak harian → durasi → pertanyaan) sudah sejalan. |
| Catatan yang dipegang pasien (user-held records) pada gangguan jiwa berat | Cochrane 2013: tidak ada efek terukur pada penggunaan rawat inap/rawat jalan; bukti tipis | Farrelly et al., Cochrane CD001711 — https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001711/information | **Batas klaim:** jangan mengklaim outcome klinis. Klaim yang aman: *beban persiapan, kelengkapan informasi, kejelasan komunikasi* (sesuai metrik Plan §7). |

**Implikasi desain:** (1) nilai utama datang dari *informasi terkumpul sebelum pertemuan* → fitur yang memperkaya bukti (jurnal/check-in) langsung menaikkan nilai; (2) tetap pendek; (3) output harus milik pengguna dan bisa diedit — ini pembeda dari Limbic/Wysa.

### 2.2 Konteks akses kesehatan jiwa Indonesia

| Topik | Temuan | Sumber | Status |
|---|---|---|---|
| **Healing119.id (Kemenkes)** | Akses: telepon **119 ekstensi 8**, atau www.healing119.id (opsi *call* dan tombol **WhatsApp**). Gratis. Jam: *"dari pagi hingga malam hari"*, akan diperluas seiring konselor bertambah. Cakupan: *"dukungan psikologis awal"* untuk tekanan psikologis/keputusasaan/pikiran bunuh diri; membuka ruang tindak lanjut & **rujukan** ke layanan profesional. Anonim, tidak tatap muka. Disebut "reaktivasi". | Kemenkes Ditjen Kesmas, 7 Agu 2025 — https://kesprimkom.kemkes.go.id/konten/127/151/0/cegah-bunuh-diri-dukung-kesehatan-jiwa-kenali-layanan-healing119-id ; situs https://www.healing119.id/ ("Hubungi 119 ext. 8 untuk darurat bunuh diri"; tombol "Konseling via WhatsApp") | **RESMI.** Jam 24 jam **tidak** terkonfirmasi di sumber resmi → hapus label "Siaga 24 Jam". FAQ PDF resmi (https://kesprimkom.kemkes.go.id/assets/uploads/contents/others/FAQ_Cegah_Bunuh_Diri%2C_Dukung_Kesehatan_Jiwa__Kenali_Layanan_Healing119.id.pdf) ada tetapi tidak bisa diekstrak teksnya di sesi ini — **buka manual sebelum demo**. |
| Beban antrean Healing119 | Antrean telepon "cukup banyak"; Kemenkes (Imran Pambudi, Direktur Pelayanan Kesehatan Kelompok Rentan) menyarankan chat/call via situs. | detikHealth, 2 Sep 2025 — https://health.detik.com/berita-detikhealth/d-8092544/kemenkes-buka-layanan-konseling-gratis-bagi-warga-62-yang-anxiety-gegara-demo | Media mengutip pejabat. Angka ">220.000 kontak setahun" dan nomor WA `08113855472` hanya dari media (Kontan/RCTI+/JawaPos) → **[BELUM DIVERIFIKASI]**. |
| Rasio tenaga | Psikiater **1:200.000** penduduk (WHO ideal 1:30.000); **baru ±50% dari 10.321 puskesmas** mampu memberi layanan kesehatan jiwa. | Kemenkes, 10 Okt 2022 — https://www.kemkes.go.id/id/kemenkes-kembangkan-jejaring-pelayanan-kesehatan-jiwa-di-seluruh-fasyankes | RESMI (2022, mungkin sudah berubah). Psikolog klinis ±3.412 anggota IPK 2022 (≈1:80.000) hanya dari skripsi/jurnal → **[BELUM DIVERIFIKASI]**. |
| Pemanfaatan layanan (remaja) | 1 dari 3 remaja 10–17 punya masalah kesehatan mental 12 bulan terakhir; hanya **2,6%** yang mengakses layanan; **43,8%** pengasuh tidak mencari bantuan karena memilih menangani sendiri/keluarga. | I-NAMHS (data 2021, rilis UGM 15 Nov 2022) — https://ugm.ac.id/en/news/23169-burden-of-adolescent-mental-disorders-in-indonesia-results-from-indonesia-s-first-national-mental-health-survey/ | Survei nasional, tetapi populasi remaja (bukan target 18+). Pakai sebagai indikator budaya "selesaikan sendiri". Tidak ditemukan survei nasional 2024–2026 tentang stigma/biaya orang dewasa → jangan mengarang angka. |
| Jalur BPJS ke psikolog/psikiater | Mulai dari **FKTP** (puskesmas/klinik) → tanya poli jiwa/psikolog → bila tidak ada, minta **rujukan** ke RS → bawa kartu BPJS/KIS, KTP, KK, surat rujukan, diagnosis sebelumnya bila ada. Kepesertaan aktif tanpa tunggakan. | CNN Indonesia, 1 Agu 2025 — https://www.cnnindonesia.com/edukasi/20250730134021-561-1256711/konsultasi-ke-psikolog-bisa-pakai-bpjs-kesehatan-ini-syarat-caranya | Media, tanpa kutipan dokumen BPJS. Masa berlaku rujukan 3 bulan (Suara Surabaya 2024, pengalaman pengguna) → **[BELUM DIVERIFIKASI]**. Di UI tulis "cek ke FKTP-mu", jangan menjanjikan. |
| Skrining jiwa di puskesmas | Kemenkes anjurkan skrining jiwa ≥1×/tahun; tersedia digital via **SIMKESWA** dan **SATUSEHAT Mobile**; dilakukan di puskesmas. Media 2025: masuk program Cek Kesehatan Gratis dengan SRQ/SDQ; hanya skrining, bukan diagnosis. | Kemenkes, 25 Okt 2024 — https://www.kemkes.go.id/id/skrining-kesehatan-jiwa-minimal-setahun-sekali ; CNN 4 Feb 2025 — https://www.cnnindonesia.com/nasional/20250204065721-20-1194210/dimulai-februari-2025-ini-cara-warga-bisa-cek-kesehatan-mental-gratis | Instrumen SRQ/SDQ hanya dari media. Peluang: Care Passport = "cerita naratif" yang melengkapi skrining kuesioner negara, bukan menggantikannya. |
| Biaya konseling swasta | Riliv "mulai Rp50.000/sesi" (Kontan, tanpa tanggal); kisaran Surabaya Rp150.000–350.000/sesi (Halodoc). | https://momsmoney.kontan.co.id/news/bingung-mau-curhat-sama-siapa-coba-jajal-aja-aplikasi-riliv ; https://www.halodoc.com/artikel/harga-psikolog-surabaya-konsultasi-tanpa-bikin-kantong-bolong | **[BELUM DIVERIFIKASI 2025–2026]**; pakai hanya sebagai "orde besaran" dengan tanda ±. |

### 2.3 Produk pembanding dan apa yang mereka tidak punya

| Produk | Apa yang dilakukan | Yang kurang (celah untuk Dengar.in) |
|---|---|---|
| Limbic Access (UK) | Intake chatbot + kuesioner klinis sebelum asesmen NHS | Output untuk klinisi; pasien tidak memegang/mengedit ringkasannya; butuh layanan terintegrasi; tidak ada versi Indonesia |
| Wysa Gateway (AS/UK) | Self-referral → ringkasan klinisi → EHR; flag krisis | Mengklaim "akurasi diagnostik"; ringkasan tidak milik pasien; perlu akun |
| Riliv, Kalm, Halodoc psikolog (ID) | Marketplace konseling berbayar per sesi | Tidak ada tahap **persiapan** sebelum sesi; perlu akun & pembayaran; tidak mengantar ke jalur gratis (FKTP/BPJS/Healing119) |
| Healing119.id (Kemenkes) | Pertolongan psikologis awal via telepon/WA, gratis | Antrean; tidak menyiapkan pengguna untuk konsultasi lanjutan; tidak ada catatan yang bisa dibawa |
| Skrining CKG/SATUSEHAT | Kuesioner SRQ/SDQ di puskesmas | Angka, bukan cerita; tidak membantu "mau bilang apa ke dokter" |

**Positioning yang terbukti kosong:** *catatan persiapan konsultasi yang dimiliki pengguna, anonim, berbahasa Indonesia, setiap fakta ditautkan ke kata pengguna sendiri, yang-belum-diketahui ditampilkan terang-terangan, dan mengantar ke jalur bantuan nyata (FKTP/BPJS/Healing119) tanpa menjanjikan ketersediaan.*

---

## 3. Usulan fitur orisinal (perluasan alur Care Passport)

Semua fitur mengasumsikan fondasi AMD-09/10/11 (route + halaman + ekspor) selesai dulu. Estimasi: S ≤ 0,5 hari, M ≈ 1 hari, L > 1 hari (1–2 orang).

### F-A. "Bukti Bertanggal" — jurnal & check-in lokal sebagai bukti yang dipilih per entri
- **Masalah pengguna:** saat ditanya "sejak kapan?" atau "seberapa sering?", pengguna lupa. Padahal data check-in/jurnal sudah ada di perangkat (`getDailyCheckins()`, jurnal lokal). Kasus emas A dan B selalu menghasilkan `duration: unknown`.
- **Orisinalitas:** Limbic/Wysa menarik kuesioner standar; tidak ada yang membiarkan pengguna **memilih entri longitudinal miliknya sendiri satu per satu**, melihat redaksi PII per entri, lalu melihat setiap fakta passport ditautkan ke *"Jurnal 2 Okt"* atau *"Check-in 5 Okt: BERAT"*.
- **Peran AMD:** ekstraksi lintas-sumber (cerita + N entri) menjadi satu passport; kutipan harus ada di salah satu segmen. Lebih sulit daripada satu paragraf → beban inferensi bermakna.
- **Risiko & mitigasi:** entri jurnal bisa memuat krisis → gerbang krisis berjalan di gabungan teks mentah (sudah default pipeline). Jurnal memuat nama orang → `detectPii` per entri, pratinjau, kind keras (email/HP/NIK/kartu) selalu disamarkan. Kutipan "melompat" antar segmen → gabungkan segmen dengan pemisah non-spasi (`¶`) agar `isGroundedQuote` gagal untuk kutipan lintas segmen.
- **Estimasi:** M.
- **Momen demo:** passport awal menampilkan "Sejak kapan: belum diketahui" → pengguna mencentang 2 entri jurnal → passport baru: "Sejak kapan: *'udah hampir tiga minggu'* — Jurnal, 24 Sep". Kotak *unknowns* mengecil dari 3 menjadi 1 di layar.

### F-B. "Kalimat Pembuka per Tujuan" + checklist jalur bantuan
- **Masalah pengguna:** "Di puskesmas mau bilang apa supaya dirujuk ke psikolog?" Hambatan pertama bukan diagnosis, tetapi kalimat pertama.
- **Orisinalitas:** produk lain menyusun ringkasan untuk klinisi; ini menyusun **ucapan pengguna** (2–3 kalimat, maks. 60 kata) untuk tujuan yang dipilih: *Dokter umum/FKTP*, *Psikolog*, *Chat Healing119*, *Konselor kampus*. Disertai checklist deterministik (bukan AI): dokumen BPJS, "tanya apakah ada poli jiwa/psikolog", "boleh minta waktu lebih panjang".
- **Peran AMD:** generasi terkondisi (tujuan + passport yang sudah disetujui) dengan batasan: hanya boleh memakai fakta dari field yang `user_confirmed`/`user_input`; validator menolak kalimat yang memuat istilah diagnosis/obat/persentase (reuse `containsUnsafeMedicalAdvice`, `DIAGNOSTIC_LABEL`, `introducesPercentage`).
- **Risiko & mitigasi:** model "menambah gejala" → grounding: setiap kalimat harus mengandung ≥1 frasa dari passport (cek `normalizeForGrounding`). Checklist jalur = konten statis dengan "tanggal verifikasi" dan tautan sumber (G2).
- **Estimasi:** S (prompt + validator kecil + 1 panel UI).
- **Momen demo:** pilih "Dokter puskesmas" → muncul kalimat: *"Dok, beberapa minggu ini saya kewalahan dengan tugas dan sulit fokus. Saya ingin tahu apakah bisa dirujuk ke psikolog."* + tombol salin.

### F-C. "Latihan 2 Menit" — gladi tanya-jawab atas *unknowns*
- **Masalah pengguna:** takut "blank" saat ditanya. 
- **Orisinalitas:** gladi bukan terapi: AMD hanya memparafrasekan pertanyaan dari daftar `unknowns` (bank pertanyaan deterministik) dan jawaban pengguna masuk sebagai `user_confirmed`. Bukan chatbot bebas.
- **Peran AMD:** multi-turn terbatas (≤3 giliran), setiap giliran divalidasi.
- **Risiko:** model menyelinap ke nasihat → whitelist: output hanya `{question}`; teks lain dibuang. 
- **Estimasi:** M. **Demo:** jawaban latihan langsung mengisi field yang tadinya *unknown*.

### F-D. "Tanya Balik Bertahap" — loop klarifikasi dengan penghitung *unknowns*
- **Masalah:** state `NEEDS_CLARIFICATION` sudah ada, tetapi tanpa UI satu putaran pun terbuang.
- **Orisinalitas:** sedang (banyak intake punya follow-up). Nilainya pada **visualisasi ketidakpastian yang menyusut** dan batas maks. 3 putaran.
- **AMD:** satu inferensi per putaran. **Risiko:** rendah. **Estimasi:** S (bila dibangun di atas F-A: jawaban = segmen `clarification`). **Demo:** kasus B ("ngerasa nggak baik, entah kenapa") → 1 pertanyaan → passport terbentuk.

### F-E. "Mode Tanpa AI" — formulir manual berskema sama + stopwatch jujur
- **Masalah:** pengguna menolak AI atau AMD down (Kasus E) tetap harus bisa membuat kartu.
- **Orisinalitas:** rendah sebagai fitur, tinggi sebagai **bukti**: stopwatch lokal (tanpa teks) mengukur "manual vs dibantu AMD" — angka untuk Plan §7 yang sampai sekarang kosong.
- **AMD:** tidak (justru itu poinnya: provenance `isAmd:false` tampil jujur). **Estimasi:** S. **Demo:** matikan AMD → label "AI tidak tersedia", form manual muncul, tidak ada draf karangan.

### F-F. "Kartu Saku" — ekspor + bagian "Yang TIDAK ada di kartu ini"
- **Masalah:** ekspor mudah disalahartikan sebagai dokumen medis.
- **Orisinalitas:** bagian eksplisit *"Tidak ada di kartu ini: diagnosis, skor, obat. Belum diketahui: durasi, frekuensi."* — pengungkapan negatif sebagai fitur. 
- **AMD:** tidak. **Risiko:** identifier buatan model → hanya field yang disetujui. **Estimasi:** S (bagian dari AMD-11). **Demo:** salin → tempel ke WhatsApp sendiri.

### F-G. "Peta Jalur Bantuan Terverifikasi" — direktori dengan tanggal cek & batas jam
- **Masalah:** G2. Setiap entri punya `verifiedOn`, `hours` jujur ("pagi–malam, cek situs"), `source` URL.
- **AMD:** tidak. **Estimasi:** S. Bukan fitur orisinal, tetapi prasyarat kredibilitas demo.

**Ditolak:** "Mode Pendamping" (passport untuk orang lain → data pihak ketiga tanpa consent), "Kamus Istilah Dokter" (konten medis non-grounded), panel reviewer live (dilarang tanpa partner; cukup sintetis per AMD-12).

### 3.1 Peringkat

Skor 1–5 per kriteria juri + kelayakan 3 hari (bobot sama).

| Peringkat | Fitur | Tech (AMD) | Business | Originality | Presentation | Feasible | Total |
|---|---|---|---|---|---|---|---|
| 1 | **F-A Bukti Bertanggal** | 5 | 4 | 5 | 5 | 4 (M) | **23** |
| 2 | **F-B Kalimat Pembuka per Tujuan** | 4 | 5 | 4 | 5 | 5 (S) | **23** |
| 3 | F-D Tanya Balik Bertahap | 4 | 3 | 3 | 4 | 5 | 19 |
| 4 | F-E Mode Tanpa AI + stopwatch | 2 | 4 | 3 | 4 | 5 | 18 |
| 5 | F-C Latihan 2 Menit | 4 | 3 | 4 | 4 | 3 | 18 |
| 6 | F-F Kartu Saku (negatif) | 1 | 3 | 4 | 4 | 5 | 17 |
| 7 | F-G Direktori terverifikasi | 1 | 3 | 1 | 4 | 5 | 14 (wajib, bukan fitur) |

**Rekomendasi:** bangun **F-A** dan **F-B** sekarang. F-D dan F-E sebagian otomatis terbawa oleh spesifikasi F-A (state `NEEDS_CLARIFICATION` dan `PROVIDER_UNAVAILABLE` wajib dirender). F-G dikerjakan sebagai perbaikan data 1 jam (G2).

Urutan hari: **14 Okt** route + halaman dasar + F-G; **15 Okt** F-A (picker, redaksi, atribusi) + uji dengan endpoint AMD nyata; **16 Okt** F-B + ekspor + a11y + rekam metrik; **17 Okt** demo, README, LICENSE, Dockerfile.

---

## 4. Spesifikasi implementasi #1 — Fondasi `/care-passport` + F-A "Bukti Bertanggal"

Prinsip: **tidak mengubah validator dan pipeline yang sudah teruji**; semua tambahan bersifat aditif.

### 4.1 Bentuk data

```ts
// packages/types/src/index.ts — tambahan aditif (schema tetap version: 1)
export type CarePassportSegmentKind = 'intake' | 'journal' | 'checkin' | 'clarification';

export interface CarePassportSegment {
  id: string;                     // client-generated, mis. 'journal:2026-09-24'
  kind: CarePassportSegmentKind;
  date?: string;                  // 'YYYY-MM-DD' untuk journal/checkin
  text: string;                   // teks MENTAH segmen (hanya untuk crisis gate + redaksi server)
}

export interface EvidenceRef { segmentId: string; kind: CarePassportSegmentKind; date?: string }

export interface EvidenceField {
  value: string | null;
  source: EvidenceSource;
  sourceQuote?: string;
  needsReview: boolean;
  sourceRef?: EvidenceRef;        // BARU, opsional; diisi server setelah validasi
}

export interface CarePassportRequest {
  ageBracket: AgeBracket;         // ditolak jika '15-17'
  aiConsent: boolean;             // opt-in terpisah, wajib true untuk inferensi
  segments: CarePassportSegment[];// 1..12, total ≤ 6000 karakter
  /** id temuan PII jenis lunak (address_hint, person_name_hint) yang pengguna TOLAK samarkan. */
  keepSoftPii?: string[];         // id = `${segmentId}:${start}-${end}`
}

export interface CarePassportResponse extends CarePassportResult {
  /** Kelengkapan terukur, bukan "confidence". */
  completeness: { known: number; total: number; unknownLabels: string[] };
  sanitizedSegments: { id: string; text: string }[]; // yang benar-benar dikirim ke AMD (untuk ditampilkan)
}
```

Penyimpanan lokal (client, `apps/web/src/lib/carePassportClient.ts`): kunci `dengarin_care_passport_draft` (passport yang sudah diedit + `reviewStatus`), `dengarin_care_passport_metrics` (hanya angka: `startedAt`, `approvedAt`, `rounds`, `providerId`, `latencyMs`, `isAmd`; **tanpa teks**). Keduanya ikut terhapus oleh wipe `/recovery` karena prefiks `dengarin_`.

### 4.2 API — `POST /api/care-passport`

File: `apps/web/src/app/api/care-passport/route.ts` (tipis) + logika murni di `apps/web/src/lib/api/carePassportHandler.ts` agar bisa diuji tanpa Next.

Urutan (wajib, cermin Safety Policy §1):
1. `readJsonLimited(request, 32 * 1024)`; validasi bentuk; tolak `ageBracket === '15-17'` (403, pesan netral).
2. `isRateLimited('care-passport', request)` (tambahkan kunci di `apps/web/src/lib/api/rateLimit.ts`).
3. **Gerbang krisis** pada gabungan teks mentah semua segmen: `rawText = segments.map(s => s.text).join('\n¶\n')`. Pipeline sudah melakukan ini di langkah 1; handler hanya menyusun `rawText`.
4. **Redaksi server-side** per segmen: `detectPii(text)` → semua temuan diterapkan **kecuali** id yang ada di `keepSoftPii` dan berjenis `address_hint`/`person_name_hint`. Jenis keras tidak pernah bisa dipertahankan. `sanitizedText = sanitizedSegments.join('\n¶\n')` (pemisah `¶` memastikan kutipan lintas segmen tidak lolos `isGroundedQuote` karena bukan whitespace).
5. `runCarePassportPipeline({ rawText, sanitizedText, aiConsent })` — provider default AMD (`createAmdProvider()`); **tidak ada** `aiCache`, tidak ada provider pihak ketiga.
6. **Atribusi** (file baru `services/validator/src/carePassportAttribution.ts`): untuk setiap `EvidenceField` dengan `sourceQuote`, cari segmen pertama yang `normalizeForGrounding(segment.text).includes(normalizeForGrounding(quote))` → isi `sourceRef`. Tidak ada kecocokan (seharusnya mustahil) → `needsReview = true`.
7. `completeness`: `total = 3` (keluhan, dampak harian, durasi) + jumlah `unknowns` model; `known = 3 − jumlah label UNKNOWN_LABELS yang muncul di unknowns`.
8. Bersihkan `warnings` sebelum dikirim/dilog: potong setiap pesan provider pada 120 karakter dan buang apa pun setelah `:` kedua (mencegah bocoran teks). Log server hanya `{state, providerId, isAmd, latencyMs, droppedClaims, segmentsCount, warningCodes}`.

Kode HTTP: 200 untuk semua lima state (state ada di body, bukan status); 400 bentuk salah; 403 umur; 413 melebihi batas; 429 rate limit. Pada `IMMEDIATE_HELP_SCREEN` body hanya `{state, emergencyContacts, provenance}` tanpa segmen.

### 4.3 UI — `/care-passport` (`apps/web/src/app/care-passport/page.tsx`)

Warna dominan: **Cobalt `#4169FF`** (persiapan = fokus), CTA **Lime `#B8F34A`**. Kartu putih, `border-2 border-ink`, `shadow-hard`, radius 6–8px, Space Grotesk, tanpa gradien/glass/pill. Tombol `[ 🚨 BANTUAN DARURAT ]` dari `HelpButton` selalu terlihat di header halaman (Safety Policy §8). Blok krisis dan blok `HUMAN_SUPPORT_RECOMMENDED` **tanpa** `animate-*`.

| State UI | Isi | CTA utama |
|---|---|---|
| `intake` | H1 "SIAPKAN CERITAMU." Sub: *"Supaya pas konsultasi nanti kamu nggak bingung mulai dari mana."* Textarea (min 240px). Di bawahnya kartu **"Sertakan bukti dari perangkatmu (opsional)"**: daftar entri check-in & jurnal 30 hari terakhir, tiap baris = checkbox + tanggal + mood/ekskerp 80 karakter + badge `[ 2 DATA PRIBADI DISAMARKAN ]` bila `containsPii`. Label `PRIVAT • TETAP DI PERANGKAT SAMPAI KAMU KIRIM`. | `[ LANJUT PERIKSA PRIVASI → ]` |
| `pii_preview` | Teks tiap segmen dengan temuan di-highlight kotak kuning `#FFD84D` + label jenis. Jenis keras: kunci (tidak bisa dibuka). Jenis lunak: toggle "biarkan". Catatan: *"Ini yang akan dikirim. Nama & nomor disamarkan supaya cerita tetap anonim."* | `[ LANJUT → ]` |
| `consent_ai` | Satu checkbox terpisah: *"Saya setuju teks yang sudah disamarkan ini diproses oleh model AI di server tim (AMD) untuk disusun jadi catatan. Tidak dibagikan ke pihak lain."* + tautan ke `/consent`. Tombol sekunder `[ TANPA AI, ISI MANUAL ]` → state `manual`. | `[ SUSUN CATATAN ]` |
| `loading` | Kartu statis: *"Sedang menyusun dari kata-katamu sendiri…"* + spinner di dalam tombol (sesuai §29). Maks. `AMD_TIMEOUT_MS`. | — |
| `review` | Banner provenance kecil: `DIPROSES DI AMD • amd:<model> • 1,8 DTK` (jika `isAmd`) atau `TANPA AI`. Kotak **"Kelengkapan: 2 dari 3 hal utama diketahui"** (teks, bukan meter berwarna-warni). Empat seksi: *Hal utama*, *Pengaruh sehari-hari*, *Sejak kapan*, *Konteks*. Setiap `EvidenceCard`: nilai (bold) → baris kutipan *"‘…’"* → chip sumber `[ CERITA ]` / `[ JURNAL • 24 SEP ]` / `[ CHECK-IN • 5 OKT ]` → tiga aksi `Benar` / `Ubah` / `Hapus`. `needsReview` → label `[ PERIKSA: PARAFRASE ]` kuning. Seksi **"Belum diketahui"** (daftar `unknowns`, tiap item punya tombol `+ Tambah sendiri` → field `user_confirmed`). Seksi **"Pertanyaan untukmu ajukan"** (editable). Disclaimer `CARE_PASSPORT_DISCLAIMER` statis di bawah. | `[ SAYA SUDAH PERIKSA, SETUJUI ]` (aktif hanya jika semua kartu sudah `Benar`/`Ubah`) |
| `review` + `HUMAN_SUPPORT_RECOMMENDED` | Di atas review: kartu kuning `#FFD84D` statis: *"Dari ceritamu, sepertinya baik kalau ini dibicarakan langsung dengan profesional. Ini saran, bukan penilaian."* + tombol `[ LIHAT JALUR BANTUAN ]` → `/resources`. Passport tetap bisa diedit. | sama |
| `clarify` (`NEEDS_CLARIFICATION`) | Satu pertanyaan (`clarificationQuestion`) + textarea pendek; counter "Putaran 1 dari 3". Jawaban dikirim sebagai segmen `kind: 'clarification'` bersama segmen sebelumnya. Setelah 3 putaran → ke `review` apa adanya. | `[ KIRIM JAWABAN ]` / `[ LEWATI ]` |
| `immediate_help` (`IMMEDIATE_HELP_SCREEN`) | Render blok krisis **statis** (coral `#FF5252`, tanpa animasi) dengan `emergencyContacts` + `[ 📞 HUBUNGI 119 EXT 8 ]` (min 52px) + `[ BUKA HALAMAN BANTUAN ]` → `/crisis`. Draft lokal tidak dibuat. | — |
| `unavailable` (`PROVIDER_UNAVAILABLE`) | Label `AI TIDAK TERSEDIA` (bukan error merah; abu `#D8D3C9` border) + *"Tidak ada catatan yang dibuat AI."* + `[ COBA LAGI ]` + `[ ISI MANUAL ]`. | `[ COBA LAGI ]` |
| `manual` | Form 4 field + pertanyaan; semua `source: 'user_confirmed'`; provenance `TANPA AI`. | `[ SIMPAN & TINJAU ]` |
| `approved` | Kartu Saku: teks siap salin (hanya field disetujui + unknowns + bagian *"Tidak ada di kartu ini: diagnosis, skor, obat"* + disclaimer). Checkbox afirmatif *"Saya memahami kartu ini saya buat sendiri dan boleh saya bagikan sendiri"* → `[ SALIN ]`, `[ UNDUH .TXT ]`. Tidak ada kirim ke pihak ketiga. | `[ SALIN KARTU ]` |

Mobile: satu kolom, padding 16px, target sentuh ≥44px, picker entri jadi daftar penuh (bukan tabel). Keyboard: semua aksi kartu = `<button>`, fokus ring 2px cobalt. Tambahkan entri `Siap Konsultasi` (`/care-passport`) ke sheet "Menu" mobile dan nav desktop di `components/Navbar.tsx` (jangan geser 4 ikon utama).

### 4.4 File yang ditambah / diubah

| Aksi | Path | Isi |
|---|---|---|
| Tambah | `apps/web/src/app/api/care-passport/route.ts` | `POST` → `handleCarePassportRequest` |
| Tambah | `apps/web/src/lib/api/carePassportHandler.ts` | Urutan §4.2, murni, deps injeksi (`pipeline`, `now`) |
| Tambah | `apps/web/src/app/care-passport/page.tsx` | State machine §4.3 |
| Tambah | `apps/web/src/components/ui/EvidenceCard.tsx` | Kartu fakta + chip sumber + 3 aksi |
| Tambah | `apps/web/src/lib/carePassportClient.ts` | Bangun segmen dari `getDailyCheckins()` dan getter jurnal (verifikasi nama fungsi jurnal di `lib/storage.ts`/`journal/page.tsx`), draft & metrik lokal, teks ekspor |
| Tambah | `services/validator/src/carePassportAttribution.ts` + ekspor di `services/validator/src/index.ts` | `attributeEvidence(passport, sanitizedSegments)` |
| Ubah (aditif) | `packages/types/src/index.ts` | `CarePassportSegment`, `EvidenceRef`, `sourceRef?`, request/response |
| Ubah | `apps/web/src/lib/api/rateLimit.ts` | kunci `care-passport` |
| Ubah | `apps/web/src/components/Navbar.tsx` | tautan `/care-passport` |
| Ubah | `packages/config/src/index.ts`, `services/crisis-engine/src/crisisDetector.ts`, `consent/page.tsx`, `README.md`, `PRD-DESIGN.md` §23 | G2: `Healing119.id (Kemenkes)`, hapus "24 Jam", website `https://www.healing119.id`, tambah `verifiedOn: '2026-10-13'` |
| Ubah | `package.json` | `test:carebridge` tambah file test baru |
| Tambah | `LICENSE` (MIT), `Dockerfile` | G9 |

### 4.5 Tes (node:test, pola `tests/carebridge/pipeline.test.mjs`)

`tests/carebridge/attribution.test.mjs`
1. Kutipan ada di segmen `journal:2026-09-24` → `sourceRef.kind === 'journal'`, `date === '2026-09-24'`.
2. Kutipan yang hanya cocok bila dua segmen digabung tanpa `¶` → setelah gabung dengan `¶`, `isGroundedQuote` **false** (klaim dibuang, `droppedClaims` +1).
3. Nilai sama muncul di dua segmen → segmen pertama (urutan request) yang dirujuk; deterministik.

`tests/carebridge/handler.test.mjs` (provider tiruan seperti `mockProvider`)
4. Frasa krisis hanya di entri jurnal (bukan di cerita) → `IMMEDIATE_HELP_SCREEN`, `provider.calls.length === 0`, tidak ada `sanitizedSegments` di respons.
5. `keepSoftPii` berisi id temuan `phone` → tetap disamarkan; body ke provider tidak memuat digit nomor (assert pada `provider.calls[0].userPrompt`).
6. `aiConsent: false` → `PROVIDER_UNAVAILABLE`, `provider.calls.length === 0`, `warnings` memuat `ai_consent_declined`.
7. `ageBracket: '15-17'` → 403, tidak ada panggilan provider.
8. 13 segmen atau total > 6000 karakter → 413.
9. Putaran klarifikasi: request kedua membawa segmen `clarification` berisi "sejak tiga minggu lalu" → `duration.source === 'user_input'`, `completeness.known` naik dari 2 ke 3.
10. `warnings` dari error provider yang menyertakan potongan teks pengguna → setelah sanitasi tidak memuat teks itu.
11. Provider gagal semua → `PROVIDER_UNAVAILABLE`, `provenance.isAmd === false`, tidak ada `passport`.

Manual QA (catat di AMD-13): keyboard-only sampai `approved`; VoiceOver membaca chip sumber; 360px tanpa scroll horizontal; `prefers-reduced-motion` mematikan translate; `/crisis` dan blok krisis tanpa animasi.

### 4.6 Metrik demo yang dikumpulkan otomatis (tanpa teks)
`providerId`, `isAmd`, `latencyMs` (median/p95 dari ≥20 request pada endpoint AMD nyata), `droppedClaims` per request, `completeness` sebelum vs sesudah F-A, waktu `startedAt→approvedAt` manual vs dibantu (F-E). Tampilkan di deck sebagai hasil terukur, terpisah dari target Plan §7.

---

## 5. Spesifikasi ringkas #2 — F-B "Kalimat Pembuka per Tujuan"

- **Input:** passport `user_approved` + `destination: 'fktp' | 'psikolog' | 'healing119' | 'kampus'`.
- **Prompt** (`packages/prompts/src/openingLines.ts`): "Tulis 2–3 kalimat (≤60 kata total) yang bisa diucapkan pengguna kepada {tujuan}, HANYA memakai fakta berikut: {daftar value}. Jangan menambah gejala, durasi, label, obat, atau angka. Balas JSON `{ "lines": [] }`."
- **Validator** (`services/validator/src/openingLines.ts`): tiap baris ≤ 200 karakter, lulus `containsUnsafeMedicalAdvice`, `DIAGNOSTIC_LABEL`, `introducesPercentage`, dan mengandung ≥1 frasa (≥3 kata) dari salah satu `value` passport (grounding ke passport, bukan ke cerita).
- **Route:** `POST /api/care-passport/opening-lines` — tanpa crisis gate ulang (input = passport yang sudah lolos), tetap `aiConsent` dan rate limit; provider AMD saja.
- **UI:** panel di state `approved`: 4 chip tujuan → kalimat + `[ SALIN ]`; di bawahnya **checklist statis** per tujuan dengan `verifiedOn` dan tautan sumber (§2.2): FKTP = "bawa kartu BPJS/KIS, KTP, KK; tanya apakah ada poli jiwa/psikolog; kalau tidak ada, minta rujukan" (label: *"Aturan bisa beda per daerah — cek ke FKTP-mu"*); Healing119 = "119 ext 8 atau chat via healing119.id; gratis; jam pagi–malam (cek situs)".
- **Tes:** baris dengan "depresi" dibuang; baris tanpa frasa passport dibuang; tujuan tidak dikenal → 400; provider gagal → panel menampilkan "AI tidak tersedia" dan hanya checklist statis.
- **Estimasi:** S (≈ 4–5 jam).

---

## 6. Catatan untuk pitch (Business Value, 1 slide)

- **Masalah terukur:** psikiater 1:200.000; hanya ±50% puskesmas melayani jiwa (Kemenkes 2022); antrean Healing119 (Kemenkes via detik, Sep 2025). Konsultasi pertama yang singkat harus dimanfaatkan maksimal.
- **Nilai:** mengurangi beban persiapan & meningkatkan kelengkapan informasi (klaim yang didukung literatur intake, §2.1), **bukan** outcome klinis.
- **Siapa yang membayar (hipotesis, belum divalidasi):** unit konseling kampus / EAP perusahaan (B2B2C) yang ingin mahasiswa/karyawan datang "siap"; puskesmas/klinik mitra BPJS sebagai pilot pre-visit; pengguna akhir tetap gratis dan anonim.
- **Batas yang harus diucapkan sendiri di video:** tidak ada diagnosis, tidak ada skor, kartu milik pengguna, manusia (profesional) yang memutuskan; AMD terlihat lewat label provenance dan log latensi.
