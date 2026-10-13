# Kebijakan Keselamatan Care Passport (AMD Track 2)

Task: AMD-05. Implementasi: `services/orchestrator/src/carePassportPipeline.ts`. Test: `tests/carebridge/pipeline.test.mjs`.

**Status:** draf teknis. Penanganan *high distress* (§3) adalah **usulan yang menunggu persetujuan Safety/QA**.

## 1. Urutan wajib

Setiap permintaan Care Passport melewati urutan ini. Tidak ada langkah yang boleh dilewati atau ditukar.

1. **Gerbang krisis deterministik** (`@dengarin/crisis-engine`) dijalankan pada teks **mentah**, sebelum langkah lain.
2. **Persetujuan pemrosesan AI.** Persetujuan ini terpisah dari persetujuan berbagi atau ekspor.
3. **Inferensi** hanya pada teks yang **sudah disanitasi** (PII disamarkan). Provider tidak pernah menerima teks mentah.
4. **Validasi grounding** (`validateCarePassportDraft`) terhadap teks tersanitasi, lalu pemilihan state.

## 2. Jalur bantuan segera (`IMMEDIATE_HELP_SCREEN`)

- Dipicu oleh aturan krisis deterministik (`isCrisis`), **atau** permintaan eksplisit pengguna untuk bantuan darurat, misalnya "butuh bantuan darurat" atau "aku dalam bahaya".
- Provider AI **tidak dipanggil sama sekali**, dan tidak ada Care Passport yang dibuat.
- Kontak darurat dewasa dari crisis engine ditampilkan.
- Gerbang ini berjalan **sebelum** cek persetujuan, sehingga pengguna yang menolak AI tetap mendapat jalur bantuan.

## 3. *High distress* (usulan, perlu persetujuan Safety/QA)

Jika crisis engine memberi `severity: 'high'` tanpa `isCrisis`:
- Draf tetap boleh dibuat (jika pengguna setuju AI), tetapi state **dikunci** ke `HUMAN_SUPPORT_RECOMMENDED`, dengan peringatan `deterministic_high_distress`.
- Ini saran informatif untuk berbicara dengan profesional, **bukan** triase atau diagnosis.
- Alternatif yang perlu ditimbang Safety/QA: menahan pembuatan draf sama sekali untuk kasus `high`.

## 4. Aturan eskalasi saja

- Model boleh **menaikkan** ke `HUMAN_SUPPORT_RECOMMENDED` lewat `humanSupportSuggested: true`.
- Model **tidak pernah** bisa menurunkan penanda deterministik. Field seperti `riskLevel: "none"` dari model diabaikan.
- Model tidak bisa menandai fakta sebagai `user_confirmed`, tidak bisa menyetujui passport (`reviewStatus` selalu `user_pending`), dan tidak bisa menimpa disclaimer.

## 5. Persetujuan AI ditolak

- Tidak ada panggilan AI. State: `PROVIDER_UNAVAILABLE`, `provenance.isFallback = true`, peringatan `ai_consent_declined`.
- UI menawarkan penulisan catatan manual. Tidak ada teks yang menyiratkan bahwa ringkasan AI sudah dibuat.

## 6. Provider gagal

- Timeout, error, atau keluaran yang ditolak validator membuat pipeline mencoba provider berikutnya.
- Jika semua gagal: `PROVIDER_UNAVAILABLE` tanpa passport, dengan `providerId: 'none'`. Passport tidak pernah dikarang.
- `provenance.isAmd` hanya `true` jika draf yang diterima benar-benar dari provider AMD. Fallback non-AMD dilabeli apa adanya.

## 7. Yang tidak pernah di-cache atau dicatat

- Pipeline tidak memakai cache respons AI. Intake sensitif **tidak** melewati `aiCache`.
- Teks mentah, teks tersanitasi, dan isi passport tidak boleh masuk log atau metrik. Yang boleh dicatat hanya metadata: state, `providerId`, `latencyMs`, `droppedClaims`, dan kode peringatan.
- Pesan error provider dicatat di `warnings` untuk debugging. Lapisan API (AMD-09) wajib memastikan pesan itu tidak memuat isi teks pengguna sebelum dicatat.

## 8. Keterbatasan

- Deteksi krisis berbasis aturan frasa bahasa Indonesia. Deteksi ini **tidak sempurna**: ada frasa yang terlewat (false negative) dan ada yang terpicu keliru (false positive). Setiap kasus yang terlewat harus diinvestigasi dan ditambahkan ke regresi.
- Tombol "Butuh bantuan sekarang?" harus selalu tersedia di UI, terlepas dari klasifikasi apa pun.
- Lulus test dengan provider tiruan bukan bukti keamanan produksi. Evaluasi menyeluruh ada di AMD-13.
- Kontak darurat berasal dari crisis engine. Akurasinya (misalnya label 24 jam Sejiwa) perlu diverifikasi ulang sebelum demo, sesuai catatan di plan §5D.
