# AMD-01 — Scope CareBridge dan Syarat Hackathon

Task: [AMD-01](AMD_TRACK2_TASKS.md) · Rencana: [development plan](AMD_TRACK2_DEVELOPMENT_PLAN.md)

**Diverifikasi:** 13 Oktober 2026 (WIB), sehari setelah kickoff.

**Status:** sebagian. Butir bertanda **PERLU CEK** hanya bisa dipastikan lewat Discord, dashboard setelah login, atau penyelenggara, dan menahan AMD-15 serta AMD-16.

## Sumber

| Kode | Sumber | Dibaca |
|---|---|---|
| S1 | Halaman event resmi: https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii | 13 Okt 2026 |
| S2 | Dashboard live: https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii/live | 13 Okt 2026 |
| S3 | Panduan submission lablab.ai: https://lablab.ai/ai-articles/hackathon-guidelines | 13 Okt 2026 |
| K | Kit riset tim `AMD_ACT_III_Team_Research_2026-10-12_TIM_6_ORANG.zip` (file 01, 09, 12, 13). Ini rangkuman sekunder, terakhir dicek terhadap S1/S2 pada 11 Okt 2026 | 13 Okt 2026 |

Tag yang dipakai di bawah:
- **RESMI**: tertulis di S1–S3 saat dibaca hari ini.
- **KIT**: hanya ada di K. Belum terlihat lagi di sumber resmi hari ini.
- **KEPUTUSAN TIM**: pilihan scope internal, bukan aturan lomba.
- **PERLU CEK**: belum bisa dipastikan.

## 1. Jadwal dan tenggat

| Butir | Temuan | Tag |
|---|---|---|
| Online build | S1: **12–18 Okt 2026**. S2: **12–17 Okt 2026**. Kedua sumber resmi berbeda | RESMI (tidak konsisten) |
| Onsite | 17–18 Okt 2026 (Roma, Milan, Imperia). Jadwal onsite: *To be announced*. Tim mengikuti online | RESMI |
| Registrasi | Ditutup 12 Okt 2026 15:00 UTC (22:00 WIB), bersamaan kickoff | KIT |
| **Tenggat submission** | **18 Okt 2026 15:00 UTC = 22:00 WIB**. Angka ini dicatat K dari dashboard pada 11 Okt. **Hari ini S2 tidak lagi menampilkan tanggal itu**: countdown-nya nol semua, kemungkinan countdown registrasi | **PERLU CEK** |
| Acuan kerja | Pakai tenggat paling awal yang mungkin: anggap build selesai **17 Okt**, submit internal **18 Okt 18:00 WIB** (buffer dari K-09) | KEPUTUSAN TIM |

## 2. Peserta dan tim

| Butir | Temuan | Tag |
|---|---|---|
| Ukuran tim | 1–6 orang | RESMI (S1) |
| Kelayakan | Semua anggota wajib bergabung ke AMD AI Developer Program untuk disetujui. Tidak ada syarat usia peserta | RESMI (S1) |

## 3. Syarat AMD

| Butir | Temuan | Tag |
|---|---|---|
| Wajib AMD | "Every project must run a meaningful part of its workload on AMD infrastructure or AMD hardware." AMD adalah teknologi wajib untuk bisa memenangkan hadiah | RESMI (S1) |
| Opsi infrastruktur | AMD Developer Cloud, AMD Instinct, ROCm, Ryzen AI, Radeon | RESMI (S1) |
| Artinya untuk CareBridge | Ekstraksi Care Passport dan pertanyaan konsultasi (AMD-07) harus benar-benar berjalan di AMD dan **terlihat dalam demo**. Fallback DeepSeek/OpenRouter yang sudah ada **tidak** memenuhi syarat, dan provenance harus jujur saat fallback dipakai | KEPUTUSAN TIM, diturunkan dari RESMI |
| Kredit | ADP Member Perks US$100. Harus diklaim lalu menunggu approval (perkiraan 2–3 hari kerja), dan **kedaluwarsa 30 hari setelah aktivasi**. Mematikan VM tidak menghentikan tagihan; instance harus di-destroy | KIT (K-13, dari pengumuman AMD 22 Jun 2026) |
| Status kredit tim | Belum diketahui. **Diperbarui 14 Okt 2026:** kredit tidak lagi jalur kritis, karena FAQ S1 menyatakan kredit $100 tidak wajib bila memakai Token Factory (lihat catatan di bawah tabel) | **PERLU CEK** (hanya untuk jalur VM) |
| Token Factory | FAQ S1: "The event is hosted on notebooks.amd.com/tokenfactory. There is no billing or credit card info needed." dan "Developers dont need the $100 credit to participate in the event. Just the api from the tokenfactory." | RESMI (S1, dibaca 14 Okt 2026) |

### Catatan 14 Oktober 2026: AMD Token Factory

Diperiksa ulang 14 Okt 2026 (WIB) dari HTML mentah S1, halaman https://notebooks.amd.com/tokenfactory, dan probe HTTP langsung. Rincian dan langkah: [AMD_SETUP.md §9](AMD_SETUP.md).

**Terverifikasi (RESMI / dibaca langsung):**
- S1 FAQ: event "hosted on notebooks.amd.com/tokenfactory", tanpa billing/kartu kredit; kredit $100 **tidak wajib**, "Just the api from the tokenfactory".
- S1: daftar opsi infrastruktur AMD memuat "Other approved AMD powered infrastructure provided during the event", dan komponen AMD harus bagian dari produk yang didemokan.
- Syarat model sendiri di vLLM pada AMD Developer Cloud hanya untuk partner prize Evolus, bukan untuk Track 2.
- https://notebooks.amd.com/tokenfactory hanya menampilkan halaman login "Sign in with AMD AI Developer Program"; isi di baliknya belum terlihat.
- Ada gateway "Token Factory" (BETA) di situs AMD Radeon Cloud China (`developer.amd.com.cn/radeon`) yang menjawab `/v1/chat/completions` bergaya OpenAI.

**Belum terverifikasi (PERLU CEK, oleh anggota tim yang login):** base URL API untuk event, model id, format key, kuota/rate limit, kebijakan retensi data, dan apakah endpoint event sama dengan gateway China. Data ini hanya ada di sumber pihak ketiga atau di balik login.

**Dampak untuk scope:** jika portal memberi endpoint OpenAI-compatible, adapter `createAmdProvider` bisa langsung memakainya lewat `AMD_BASE_URL`/`AMD_API_KEY`/`AMD_MODEL` tanpa ubah kode, dan AMD-02 tidak lagi bergantung pada approval kredit. Bahwa inferensi lewat Token Factory dihitung sebagai "meaningful part of its workload on AMD infrastructure" adalah **interpretasi tim** yang didukung kalimat S1 di atas; tanyakan ke penyelenggara bila ragu.

## 4. Track 2: Health and Wellbeing

Kutipan dan parafrase dari S1:
- **Tujuan:** membantu pasien, caregiver, atau staf kesehatan menangani satu bagian perjalanan pasien dengan lebih baik.
- **Demo:** kasus realistis dari input pertama sampai hasil akhir. Ketidakpastian harus terlihat, dan sistem harus tahu kapan manusia perlu meninjau atau mengambil alih.
- **Larangan:** "The product must not present autonomous diagnosis or treatment as medical advice."
- **Kewajiban penjelasan:** tim harus menjelaskan cara menangani respons salah atau tanpa dasar, informasi sensitif, hasil yang tidak pasti, keputusan berisiko tinggi, dan human review.

| Butir AMD-01 | Temuan | Tag |
|---|---|---|
| Larangan diagnosis/resep | Sesuai S1. Sudah selaras dengan `docs/AI_POLICY.md` dan `test:security-m04` | RESMI |
| Batas human handoff | Diwajibkan secara umum oleh S1, tanpa format tertentu. Di CareBridge diwujudkan lewat `reviewStatus`, unknowns, dan eskalasi krisis (AMD-03, AMD-05) | RESMI + KEPUTUSAN TIM |
| **Scope usia 18+** | **Bukan aturan lomba.** S1 tidak menyebut usia pengguna sasaran. Ini pilihan tim untuk menghindari persetujuan wali dan perlindungan anak dalam waktu sprint. Produk lama tetap 15–54 dan tidak diubah | KEPUTUSAN TIM |
| **Data demo sintetis** | **Tidak disebut di S1.** Tapi S1 mewajibkan penanganan informasi sensitif, dan K mencatat bahwa memakai data sensitif nyata tanpa izin melemahkan atau bisa menggugurkan karya. Data demo tetap 100% sintetis | KEPUTUSAN TIM, didukung RESMI + KIT |

## 5. Lisensi dan orisinalitas

| Butir | Temuan | Tag |
|---|---|---|
| Lisensi | "Submissions must be original and MIT-compliant." Ketentuan lengkap ada di terms lablab.ai yang tidak terbaca tanpa login | RESMI (S1) |
| **Status repo** | `package.json` menyatakan `"license": "MIT"`, dan per 14 Okt 2026 file `LICENSE` (MIT) sudah ada di root working tree tetapi **belum di-commit** (AMD-15). Dependensi pihak ketiga perlu diaudit kompatibilitasnya | Temuan repo |
| **Proyek yang sudah ada** | Dengar.in sudah ada sebelum hackathon (MindCraft Web Competition 2026). S1 mensyaratkan "original", tapi S1 dan S3 **tidak mengatur kode yang sudah ada sebelumnya**. Perlu ditanyakan ke penyelenggara: bolehkah membangun di atas proyek lama, dan bagaimana cara mendeklarasikannya (misalnya memisahkan commit sebelum dan sesudah 12 Okt di README) | **PERLU CEK, risiko tinggi** |

## 6. Materi submission

| Butir | Temuan | Tag |
|---|---|---|
| Wajib | Judul, deskripsi singkat dan panjang, challenge/track, technology tags, prototipe yang berjalan, cover, video demo, pitch deck, penjelasan masalah dan pengguna, repo GitHub publik, platform demo, URL aplikasi | RESMI (S1) |
| Batas | Judul ≤ 50 karakter. Ringkasan ≤ 255 karakter. Deskripsi panjang ≥ 100 kata. Video ≤ 5 menit dan < 300 MB. Cover 16:9 (saran) | RESMI (S3) |
| Penilaian | Application of Technology, Business Value, Originality, Presentation. Tidak ada bobot persen | RESMI (S1) |

## 7. Partner prize

Google dan Evolus bersifat opsional (S1). Evolus mensyaratkan open model sendiri di vLLM pada AMD dan minimal dua building block Evolus (K-01, K-12). Tidak masuk scope CareBridge MVP, karena backlog tidak memuat task Evolus. Kalau tim ingin mengejarnya, tambahkan task terpisah.

## 8. Catatan: arah kit vs backlog repo

Kit riset tim merekomendasikan **Vertalt Commerce Intelligence (Track 3)**, dengan alternatif Adaptive Worlds (Track 4) dan SupportFlow (Track 3). Kit tidak menyebut Dengar.in atau Track 2 sama sekali. Backlog di repo ini memilih **CareBridge (Track 2)**.

**Keputusan (13 Okt 2026):** pengembangan tetap memakai Dengar.in di Track 2 Health and Wellbeing. Ide Vertalt dari kit tidak dipakai.

## 9. Yang harus dicek (pemilik: Product/Pitch)

1. Tenggat submission persis dan zona waktunya, lewat Discord atau dashboard setelah login. Lalu perbarui tabel §1.
2. Apakah membangun di atas proyek yang sudah ada diperbolehkan, dan bagaimana cara mendeklarasikannya (§5).
3. Isi lengkap terms lablab.ai soal MIT dan pihak ketiga.
4. Status klaim dan approval kredit AMD tim, termasuk tanggal kedaluwarsanya. (14 Okt 2026: tidak wajib bila memakai Token Factory; tetap relevan untuk jalur VM.)
5. Apakah aplikasi harus tetap hidup selama penjurian, atau rekaman demo cukup.
6. ~~Kesepakatan tim soal track (§8).~~ Sudah diputuskan: Dengar.in, Track 2.
7. Login ke https://notebooks.amd.com/tokenfactory dan catat base URL, model id, dan kuota API Token Factory (AMD_SETUP §9.4).

Setelah butir 1–4 terjawab, AMD-01 dapat ditandai selesai. AMD-02 dan AMD-03 sudah bisa dimulai sekarang, karena keduanya tidak bergantung pada butir yang masih terbuka.
