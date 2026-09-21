# Panduan Scriptwriter Dengar.in

Panduan ini untuk penulis yang ingin mengubah kata-kata di website: judul, deskripsi, tombol, pertanyaan, pesan kosong, dan pesan kesalahan. Mengedit dokumen ini **tidak mengubah website**. Teks saat ini berada di file `.tsx` dan `.ts` di bawah; belum ada panel CMS atau satu file terjemahan terpusat.

## Mulai dari sini

1. Buka halaman yang ingin diubah dan salin potongan kalimatnya.
2. Di VS Code gunakan **Cmd+Shift+F** (Mac) atau **Ctrl+Shift+F** (Windows), lalu cari potongan tersebut. Aktifkan pencarian teks biasa, bukan regex.
3. Pilih file sumber di `apps/web/src`, `packages/config/src`, atau lokasi pada tabel. Abaikan `node_modules` dan `.next`: keduanya hasil instalasi/build.
4. Ubah teksnya, simpan, lalu lihat hasil di browser setelah menjalankan `npm run dev` dari root proyek.
5. Periksa halaman terkait dan jalankan `npm run typecheck` serta `npm run lint` sebelum menyerahkan perubahan.

Alternatif pencarian melalui terminal:

```bash
rg -n -F 'GAK HARUS' apps/web/src packages services
rg -n -F 'Teks yang ingin dicari' apps/web/src packages services
```

Jika satu kalimat tidak ditemukan, cari 2–3 kata unik. Judul dapat dipisahkan oleh `<br />`, `<span>`, atau variabel seperti `{pillar.label}`. Jika ditemukan beberapa salinan, periksa konteks masing-masing: sambutan pertama dan sambutan setelah reset chat memang berbeda.

## Peta halaman

Semua lokasi berikut adalah tautan relatif yang bisa dibuka dari dokumen ini.

| Halaman / URL | File sumber | Teks yang biasa diedit |
|---|---|---|
| Beranda `/` | [page.tsx](../apps/web/src/app/page.tsx) | Headline `GAK HARUS`, pengantar, tombol, `moodOptions`, pemberitahuan tersimpan |
| Persetujuan `/consent` | [consent/page.tsx](../apps/web/src/app/consent/page.tsx) | Penjelasan privasi, persetujuan, label checkbox, tombol lanjut |
| Perkenalan `/onboarding` | [onboarding/page.tsx](../apps/web/src/app/onboarding/page.tsx) | Judul langkah, petunjuk memilih usia/topik, tombol navigasi |
| Asesmen `/assessment` | [assessment/page.tsx](../apps/web/src/app/assessment/page.tsx) | Instruksi dan tombol; pertanyaan berasal dari config |
| Hasil asesmen `/assessment/result` | [assessment/result/page.tsx](../apps/web/src/app/assessment/result/page.tsx) | Ringkasan hasil dan penjelasan rekomendasi |
| Dashboard `/dashboard` | [dashboard/page.tsx](../apps/web/src/app/dashboard/page.tsx) | Sapaan, judul kartu, ringkasan, ajakan aktivitas |
| Chat `/chat` | [chat/page.tsx](../apps/web/src/app/chat/page.tsx) | `STARTER_PROMPTS`, sambutan awal, sambutan `handleResetChat`, placeholder, pesan gagal |
| Check-in `/checkin` | [checkin/page.tsx](../apps/web/src/app/checkin/page.tsx) | Pertanyaan suasana hati, label pilihan, tombol simpan |
| Jurnal `/journal` | [journal/page.tsx](../apps/web/src/app/journal/page.tsx) | Petunjuk menulis, placeholder, pesan kosong dan simpan |
| Misi `/mission` | [mission/page.tsx](../apps/web/src/app/mission/page.tsx) | Instruksi halaman; isi misi berasal dari config |
| Laporan `/report` | [report/page.tsx](../apps/web/src/app/report/page.tsx) | Ringkasan mingguan, judul bagian, pesan tanpa data |
| Forum `/forum` | [forum/page.tsx](../apps/web/src/app/forum/page.tsx) | Ajakan berbagi, label formulir, placeholder, pesan moderasi |
| Bantuan `/resources` | [resources/page.tsx](../apps/web/src/app/resources/page.tsx) | Judul direktori, pencarian, kategori; kontak berasal dari config |
| Krisis `/crisis` | [crisis/page.tsx](../apps/web/src/app/crisis/page.tsx) | Pesan pendampingan dan ajakan mencari bantuan |
| Pemulihan `/recovery` | [recovery/page.tsx](../apps/web/src/app/recovery/page.tsx) | Petunjuk frasa pemulihan, sinkronisasi, hapus data, pesan status |

## Teks yang dipakai di banyak tempat

| Bagian | File / penanda pencarian | Yang bisa diedit |
|---|---|---|
| Menu desktop dan mobile | [Navbar.tsx](../apps/web/src/components/Navbar.tsx), `centerLinks`, `mobileNavLinks` | `label` dan teks tombol; cek kedua versi menu |
| Footer | [Footer.tsx](../apps/web/src/components/Footer.tsx) | Deskripsi, link berlabel, disclaimer footer |
| Judul tab dan deskripsi situs | [layout.tsx](../apps/web/src/app/layout.tsx), `metadata` | Nilai `title` dan `description` |
| Tombol bantuan | [HelpButton.tsx](../apps/web/src/components/ui/HelpButton.tsx) | Teks tiga varian tombol serta `aria-label` |
| Keluar cepat | [QuickExitButton.tsx](../apps/web/src/components/ui/QuickExitButton.tsx) | Teks tombol, tooltip `title`, `aria-label` |
| Pilihan mood | [MoodSelector.tsx](../apps/web/src/components/ui/MoodSelector.tsx) | Label bawaan; periksa juga opsi yang dikirim halaman pemanggil |

`aria-label` dibaca pembaca layar; `placeholder` adalah petunjuk di kolom kosong; `title` pada elemen bisa berupa tooltip. Sesuaikan ketiganya jika nama tombol atau maksud input berubah.

## Isi terpusat dalam config

Buka [packages/config/src/index.ts](../packages/config/src/index.ts), lalu cari nama konstanta di tabel ini. Mengubah nilai di sini dapat memengaruhi beberapa halaman sekaligus.

| Konstanta | Isi teks |
|---|---|
| `TOPIC_PILLARS` | `label`, `description` untuk pilar topik di beranda/onboarding |
| `DOMAIN_CONFIGS` | `label`, `description` untuk subtopik |
| `PRD_AGE_BRACKET_CONFIGS`, `AGE_BRACKET_CONFIGS` | `label`, `subtext` kelompok usia; pertahankan rentang usia yang benar |
| `OCCUPATION_OPTIONS` | `label` pilihan pekerjaan |
| `GENERIC_ASSESSMENT_QUESTIONS`, `ADAPTIVE_ASSESSMENT_QUESTIONS` | Teks pertanyaan dan `label` jawaban; pertahankan makna dan skala jawaban |
| `DOMAIN_MISSION_TEMPLATES` | `title`, `summary`, `steps`, `reflectionQuestion` misi harian |
| `EMERGENCY_CONTACTS` | Nama dan deskripsi layanan; perubahan nomor, URL, jam layanan perlu verifikasi sumber resminya |
| `CLINICAL_DISCLAIMER` | Penjelasan batas layanan yang digunakan bersama |

Ubah nilai teks, bukan nama konstanta, `id`, `domain`, `value`, skor, `highProtection`, atau rentang numeriknya. Contoh: `label: 'Tekanan Finansial'` boleh disunting; identifier `finance` tidak diganti menjadi kalimat baru karena digunakan logika aplikasi.

## Contoh pengeditan

**Mengubah judul beranda.** Di `apps/web/src/app/page.tsx`, ganti hanya kata-katanya dan pertahankan tag:

```tsx
// Sebelum
GAK HARUS <br />
BERES SEMUANYA <br />

// Sesudah (contoh redaksi)
PELAN-PELAN AJA <br />
SATU LANGKAH DULU <br />
```

Contoh di atas hanya menunjukkan bagian teks di dalam `<h1>`; jangan menempelkan komentar `//` sebagai teks JSX. Bagian `HARI INI.` ada di `<span>` berikutnya dan bisa disesuaikan juga.

**Mengubah petunjuk kolom chat.** Di `apps/web/src/app/chat/page.tsx`:

```tsx
placeholder="Tulis apa yang sedang kamu rasakan..."
```

Pertahankan nama atribut `placeholder`, tanda kutip, dan atribut lain di elemen tersebut.

**Mengubah deskripsi topik.** Pada objek yang sudah ada di `TOPIC_PILLARS`, edit nilai `description` saja:

```ts
description: 'Tempat bercerita tentang beban keuangan, tanpa takut dihakimi.',
```

Pertahankan koma di akhir. Di string dengan tanda petik tunggal, apostrof harus ditulis `\'`, atau gunakan tanda petik ganda. Di teks JSX, gunakan `&amp;` untuk `&` dan `&quot;` untuk tanda kutip bila lint memintanya. Jangan menghapus `{variabel}`, `${variabel}`, tag, `href`, `onClick`, atau `className` ketika menyunting kalimat dinamis.

## Teks chat, AI, dan pesan server

Sambutan serta contoh pembuka chat berasal dari halaman chat. Jawaban setelah pesan dikirim dapat berasal dari AI, cache, atau fallback; tidak semuanya merupakan kalimat tetap di halaman itu.

- Instruksi gaya dan perilaku AI: [packages/prompts/src/index.ts](../packages/prompts/src/index.ts). Perubahan prompt perlu diperiksa developer karena memengaruhi aturan respons.
- Jawaban saat penyedia AI tidak tersedia: [deterministicFallback.ts](../services/orchestrator/src/fallback/deterministicFallback.ts), yang juga mengambil langkah misi dari config.
- Disclaimer UI chat: cari `STANDARD_DISCLAIMER` di [actionValidator.ts](../services/validator/src/actionValidator.ts). Selaraskan maknanya dengan `CLINICAL_DISCLAIMER` tanpa mengubah aturan validator.
- Pesan kesalahan API: cari kalimatnya di `apps/web/src/app/api/**/route.ts` atau `apps/web/src/lib/api`. Ubah pesan manusia, bukan status HTTP atau nama field JSON.

Untuk perubahan konten keselamatan, persetujuan, pertanyaan asesmen, disclaimer, dan instruksi AI, ikuti [SAFETY.md](./SAFETY.md) serta [AI_POLICY.md](./AI_POLICY.md). Gunakan bahasa hangat tanpa menjanjikan diagnosis, kesembuhan, atau penghapusan jejak yang tidak dilakukan fitur.

## Melihat hasil dan menyerahkan perubahan

```bash
npm run dev
# Buka URL halaman yang diubah pada alamat yang dicetak terminal.

npm run typecheck
npm run lint
# Untuk config/asesmen/prompt/fallback/disclaimer:
npm test
```

Jika server dev sudah berjalan, cukup simpan file dan muat ulang halaman. Pada produksi, perubahan teks memerlukan build dan deployment baru. Jawaban AI lama mungkin masih berasal dari cache Redis (TTL satu jam); minta developer menginvalidasi cache yang terkait jika perubahan harus langsung berlaku. Jangan menjalankan `FLUSHDB` untuk memperbarui kata-kata website.

Checklist penyerahan untuk scriptwriter:

- [ ] Teks baru muncul di halaman dan keadaan yang tepat, termasuk kosong/error/reset bila terkait.
- [ ] Tampilan mobile dan desktop tidak terpotong; tombol tetap mudah dipahami.
- [ ] Istilah, sapaan, ejaan, serta tanda baca konsisten dengan halaman terkait.
- [ ] Placeholder, tooltip, dan label pembaca layar masih sesuai.
- [ ] Link, identifier, skor, dan perilaku tombol tetap benar.
- [ ] Typecheck dan lint lulus; tes tambahan lulus jika konten bersama/aturan berubah.
- [ ] Catatan perubahan memuat URL halaman, file, teks lama → baru, serta alasan perubahan.

Format catatan: `/chat | STARTER_PROMPTS | “teks lama” → “teks baru” | memperjelas ajakan bercerita`.
