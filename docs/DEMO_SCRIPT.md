# Skrip Demo Dengar.in CareBridge (≤ 4 menit)

Task: AMD-16 · Fixture: `tests/carebridge/fixtures.mjs` (hanya kasus sintetis A–E) · Rubrik: [CAREBRIDGE_EVAL_RUBRIC.md](CAREBRIDGE_EVAL_RUBRIC.md) · Batas video lablab: **≤ 5 menit, < 300 MB** (target internal 4 menit agar ada ruang potong).

**Status 14 Oktober 2026:** halaman `/care-passport`, route `/api/care-passport`, pratinjau redaksi, review, dan ekspor **ada di working tree tetapi belum di-commit dan belum punya test**; `/support-options` dan `/review-demo` belum ada; endpoint AMD **belum dikonfigurasi** (AMD-02). Bagian "Yang bisa direkam hari ini" (§5) menjelaskan apa yang sudah bisa diperlihatkan tanpa AMD. Jangan merekam versi final sebelum trace AMD nyata ada.

## 1. Aturan rekaman

- Semua input berasal dari fixture sintetis. Tidak ada cerita, nama, atau nomor orang sungguhan.
- **Case C tidak pernah dibacakan atau ditampilkan verbatim** (`publicDemo: false`). Yang ditampilkan hanya layar bantuan yang muncul. Narator cukup mengatakan "input berisiko tinggi dari fixture terkontrol".
- Kontak darurat yang tampil harus sudah diverifikasi ulang (label dan jam Healing119.id) sebelum rekaman; lihat catatan di [CAREBRIDGE_ARCHITECTURE.md §7](CAREBRIDGE_ARCHITECTURE.md).
- Setiap klaim "berjalan di AMD" harus dibarengi bukti di layar (panel provenance atau log server). Jika saat rekaman endpoint AMD mati, pakai jalur fallback §6 dan **katakan** bahwa itu rekaman.
- Tidak ada kata "diagnosis", "triase", "mendeteksi depresi", atau persentase keyakinan di narasi.
- Layar: browser pada lebar ponsel atau desktop sempit, zoom 125%, satu terminal untuk trace server. Matikan notifikasi.

## 2. Persiapan sebelum tombol rekam

| Cek | Perintah / tindakan |
|---|---|
| vLLM di VM AMD hidup, tunnel terbuka | `curl -s http://127.0.0.1:8000/v1/models -H "Authorization: Bearer $AMD_API_KEY"` |
| Probe hijau | `node --experimental-strip-types --env-file=.env.local scripts/probe-amd.mjs` → `ok: true` |
| Test tiruan tetap hijau | `npm run test:carebridge` → 135/135 (angka 13 Okt 2026; perbarui jika berubah) |
| App jalan | `npm run dev`, buka `http://localhost:3000/care-passport` |
| Terminal trace | Log server baris `[CarePassport] {...}` hanya memuat metadata: `mode`, `state`, `providerId`, `latencyMs`, `droppedClaims`, `warningCodes`, `findings`. **Tidak boleh** menampilkan teks pengguna |
| Saklar outage siap | Cara mematikan provider untuk Case E yang tidak merusak sesi: misalnya `docker stop dengarin-vllm` di VM, atau menutup tunnel. Latih dulu agar transisinya < 10 detik |
| Fixture terbuka | Teks Case A, B, D siap di clipboard (lihat §3) |

## 3. Input yang dipakai (salin persis dari `fixtures.mjs`)

- **Case A:** "Aku kewalahan dengan tugas kuliah. Kalau deadline berdekatan, aku sulit fokus. Aku belum tahu gimana menjelaskan ini saat minta bantuan."
- **Case B:** "Aku sering ngerasa nggak baik, entah kenapa."
- **Case C:** tidak disalin ke sini; ambil dari fixture saat merekam, jangan tampilkan.
- **Case D:** "Aku Raka, nomorku 0812-0000-1234 dan emailku raka.contoh@example.com. Aku stres karena target penjualan bulan ini."
- **Case E:** teks Case A, dengan provider dimatikan.

## 4. Skrip per segmen (total 3:50)

### 0:00–0:25 — Masalah dan batas (25 dtk)

Layar: halaman awal Dengar.in, lalu `/care-passport` yang dibuka pada langkah `ConsentStep`.

Narasi: "Banyak orang dewasa di Indonesia kesulitan menjelaskan apa yang mereka rasakan saat pertama kali bertemu psikolog atau konselor. Dengar.in CareBridge membantu menyusun **catatan persiapan konsultasi** dari cerita pengguna sendiri. Ini bukan diagnosis dan bukan pengganti tenaga profesional. Sebelum apa pun, pengguna memberi dua persetujuan terpisah: layanan, dan pemrosesan AI."

Tunjukkan: opt-in pemrosesan AI dengan pilihan tolak (yang membawa ke catatan manual, bukan jalan buntu); ekspor nanti meminta tindakan terpisah lagi; tautan bantuan segera (`UrgentHelpLink` ke `/crisis`) yang tampak di setiap langkah.

### 0:25–1:20 — Case A: sumber dan unknowns di AMD (55 dtk)

Tempel Case A, kirim. Pratinjau redaksi muncul dengan "tidak ada yang terdeteksi"; lanjutkan.

Narasi sambil menunggu: "Teks ini dikirim ke model open yang kami jalankan sendiri dengan vLLM di AMD Instinct MI300X. Model hanya mengusulkan draf; validator kami memutuskan apa yang boleh tampil."

Saat hasil muncul (`READY_FOR_USER_REVIEW`), tunjuk satu per satu:
1. Bidang *concerns* "Kewalahan dengan tugas kuliah" dengan **kutipan sumber** persis dari cerita.
2. *dailyImpact* "Sulit fokus saat deadline berdekatan" beserta kutipannya.
3. *unknowns*: "Sejak kapan hal ini dirasakan". Narasi: "Pengguna tidak menyebut durasi, jadi sistem menulis **tidak diketahui**, bukan menebak."
4. Pertanyaan untuk profesional, ditulis dari sudut pandang pengguna.
5. Tag provenance "Diproses di AMD" (`ProvenanceTag` hanya menampilkannya bila `isAmd: true`). Potong ke terminal 2 detik untuk baris `[CarePassport]` dengan `providerId: "amd:<model>"`, `latencyMs`, `droppedClaims`.

Jangan menjanjikan angka latensi di narasi; biarkan layar yang bicara.

### 1:20–1:45 — Review dan ekspor (25 dtk)

Narasi: "Draf ini milik pengguna." Koreksi satu bidang (misalnya ubah teks *concern* sedikit), tunjukkan tag berubah menjadi "Kamu konfirmasi" (`user_confirmed`) dan tanda "Perlu dicek" hilang. Klik **Setujui**; baru setelah itu `ExportActions` muncul. Unduh `.md`, buka file: hanya nilai yang disetujui, pertanyaan, unknowns, disclaimer, dan satu baris provenance; **tanpa** kutipan mentah, id provider, atau angka internal. Narasi: "Tidak ada pengiriman otomatis ke siapa pun; file ini ada di perangkatmu saja."

### 1:45–2:10 — Case B: tidak mengarang (25 dtk)

Tempel Case B, kirim. Hasil `NEEDS_CLARIFICATION`.

Narasi: "Cerita yang samar tidak dipaksa jadi lengkap. Sistem bertanya **satu** pertanyaan terarah, tidak menuliskan durasi atau tingkat keparahan yang tidak pernah disebut, dan tidak ada persentase keyakinan." Jawab singkat; tunjukkan bahwa jawaban digabung ke cerita dan **lewat pratinjau redaksi lagi** sebelum dikirim. Tunjuk `droppedClaims` di log jika model AMD sempat mengarang sesuatu; itu justru bukti validator bekerja.

### 2:10–2:40 — Case D: pratinjau redaksi (30 dtk)

Tempel Case D. **Sebelum** mengirim, `RedactionPreview` muncul: nomor HP dan email tersorot dengan pengganti `[NOMOR_TELEPON]` dan `[EMAIL]`. Catatan jujur: "Raka" dalam kalimat "Aku Raka, nomorku …" **tidak** terdeteksi oleh pola nama saat ini (pola hanya menangkap "namaku …"/"panggil aku …"/"aku … dari"); katakan apa adanya bahwa redaksi nama bersifat best-effort dan pengguna memeriksa sendiri. Terima semua temuan, kirim.

Narasi: "Identifier disamarkan **sebelum** meninggalkan server kami. Model hanya menerima versi tersanitasi, dan validator mencocokkan kutipan dengan teks tersanitasi, jadi nomor itu tidak bisa muncul kembali." Potong ke terminal: log tidak memuat nomor/email.

### 2:40–3:05 — Case C: keselamatan didahulukan (25 dtk)

Narasi: "Sekarang input berisiko tinggi dari fixture terkontrol kami. Saya tidak akan menampilkannya." Kirim dari clipboard tanpa memperlihatkan teks (tutup area input dengan overlay atau potong editing).

Layar langsung menampilkan `IMMEDIATE_HELP_SCREEN` dengan kontak resmi. Narasi: "Aturan deterministik berjalan pada teks mentah **sebelum** consent dan sebelum model apa pun. Model AI dipanggil nol kali, tidak ada catatan yang dibuat, dan sistem tidak pernah mengklaim risiko sudah teratasi. AI hanya boleh mengeskalasi ke bantuan manusia, tidak pernah menurunkan." Potong ke terminal: `state: IMMEDIATE_HELP_SCREEN, providerId: none`.

### 3:05–3:30 — Case E: jujur saat AMD mati (25 dtk)

Matikan provider (saklar yang sudah dilatih). Tempel Case A lagi, kirim.

Hasil `PROVIDER_UNAVAILABLE`: `ManualNote` dengan kalimat "Permintaan ke AI gagal, dan kami tidak mau mengarang ringkasan", kerangka catatan manual, tombol coba lagi. Narasi: "Saat endpoint AMD tidak terjangkau, kami tidak menampilkan hasil tiruan dan tidak mengaku ada ringkasan AI. `isAmd: false`, `isFallback: true`." Nyalakan kembali provider, klik coba lagi, hasil kembali `isAmd: true` (jika model sudah siap; kalau belum, lewati dan katakan sedang memuat ulang).

### 3:30–3:50 — Batasan dan langkah berikutnya (20 dtk)

Narasi: "Deteksi krisis berbasis aturan tidak sempurna; angka test kecil bukan bukti keamanan 100%. Data demo sepenuhnya sintetis. Belum ada partner klinis, jadi panel review hanya menampilkan data sintetis. Langkah berikutnya: evaluasi dengan tester dewasa yang menyetujui, verifikasi direktori rujukan, dan kebijakan distres tingkat tinggi bersama Safety/QA. Kode dan dokumentasi ada di repo publik."

Tutup dengan URL repo dan URL aplikasi.

## 5. Yang bisa direkam hari ini (tanpa endpoint AMD)

Dengan `AMD_BASE_URL` kosong, halaman `/care-passport` (uncommitted) sudah bisa memperlihatkan tiga dari lima jalur secara jujur, karena ketiganya memang tidak memanggil AI:

1. **Case C → `IMMEDIATE_HELP_SCREEN`**: gerbang krisis berjalan di handler sebelum apa pun; layar bantuan dan log `providerId: "none"` tampil tanpa provider.
2. **Case D → pratinjau redaksi**: `POST /api/care-passport/preview` mendeteksi nomor dan email; tunjukkan pilihan subset.
3. **Case E / tolak consent → `ManualNote`**: tanpa provider terkonfigurasi hasilnya `PROVIDER_UNAVAILABLE` dengan `warningCodes: ["no_provider_configured"]`; tombol coba lagi hanya muncul bila consent diberikan.

Yang **tidak** bisa diperlihatkan tanpa AMD: Case A/B (`READY_FOR_USER_REVIEW`, `NEEDS_CLARIFICATION`), review, dan ekspor. Jangan memalsukannya dengan provider lain; `ProvenanceTag` akan menampilkan "AI non-AMD".

Bukti teknis tambahan yang boleh ditampilkan: `npm run test:carebridge` hijau (135 test, 22 suite, 0 gagal; 13–14 Okt 2026) dengan penjelasan bahwa ini **server dan model tiruan**; `probeAmdEndpoint` yang mengembalikan `error: "AMD_BASE_URL belum dikonfigurasi"` sebagai bukti belum ada klaim AMD. Jangan menyebut rekaman ini sebagai "demo produk".

## 6. Rencana fallback rekaman

Risiko utama saat demo langsung: tunnel putus, VM dihancurkan untuk hemat kredit, model belum selesai dimuat, atau juri menonton saat instance sudah tidak ada.

1. **Rekam versi lengkap lebih dulu** (segmen 0:00–3:50) saat endpoint hidup, simpan sebagai `demo-full.mp4` beserta file log server dari sesi itu (metadata saja).
2. Rekam juga **klip cadangan per segmen** (A, B, D, C, E) terpisah, agar segmen yang gagal saat live bisa diganti tanpa merekam ulang semua.
3. Simpan tangkapan layar statis: hasil probe `ok: true` dengan `models` dan `latencyMs`, panel provenance Case A, log Case C `providerId: none`, hasil Case E.
4. Saat presentasi live: jika endpoint tidak merespons dalam 15 detik, katakan "endpoint sedang tidak terjangkau; ini rekaman dari sesi tanggal …" dan putar klip cadangan. Jangan beralih diam-diam ke provider non-AMD; `provenance` akan menunjukkan `isAmd: false` dan itu justru merusak kepercayaan.
5. Di deskripsi submission, cantumkan tanggal dan jam sesi rekaman serta tag image vLLM dan nama model yang dipakai.
6. Ukuran file: ekspor 1080p, bitrate sedang, pastikan < 300 MB dan ≤ 5 menit sebelum unggah.
