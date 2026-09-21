# CHECKLIST PENGUJIAN REDIS — Dengar.in

**Versi**: 1.1.0
**Pendamping**: `docs/REDIS.md` (penjelasan konsep & implementasi)
**Otomatis**: `npm run test:redis` (dev), `npm run test:redis -- --production` (build bersih + produksi + dua instance)

## Hasil verifikasi — 21 September 2026

- Dev: **9 pemeriksaan lulus, 0 gagal**.
- Produksi: **15 pemeriksaan lulus, 0 gagal**, termasuk build bersih dan dua instance.
- `npm run typecheck`, `npm run lint`, `npm test`: exit 0. Integrasi PostgreSQL dilewati oleh suite karena `DATABASE_URL` tidak diset; tes TLS tetap berjalan.
- Lingkungan lokal: macOS, Node v25.8.2. Redis dan Next.js tes berjalan pada port loopback dinamis, source disalin ke direktori sementara tanpa `.env` dan `.next` developer.
- API key AI dikosongkan: tes ini memverifikasi fallback dan cache dengan payload sintetis, bukan koneksi penyedia AI langsung.
- Log `ECONNREFUSED`/socket closed memang diharapkan ketika tes sengaja mematikan Redis. Tidak ada assertion gagal.
- `[x]` berarti telah dibuktikan pada pengujian lokal ini; `[ ]` berarti belum diverifikasi. Konfigurasi deployment belum diuji.

Skrip membutuhkan `redis-server`, Node yang mendukung `--experimental-strip-types`, dan dependency npm terpasang. Tidak perlu menyalakan `npm run dev` terlebih dahulu. Skrip tidak memakai `REDIS_URL` pribadi, tidak menjalankan `FLUSHDB`, dan tidak menghentikan service Redis developer. Proses serta direktori sementara dibersihkan setelah tes.

---

## Cara pakai

| Kapan | Jalankan minimal |
|---|---|
| Setiap kali mengubah kode Redis | §1 → §2 → §6 |
| Sebelum merge / PR | §1 → §2 → §3 → §6 → §7 |
| Sebelum deploy / demo lomba | Semua, termasuk §4 dan §5 |
| Setelah upgrade Next.js | Semua pada Redis terisolasi; invalidasi cache deployment secara terencana |

---

## 1. Prasyarat

- [x] Server Redis tes hidup → perintah `PING` melalui client Node menjawab `PONG`
- [x] `REDIS_URL` terisi di **`apps/web/.env.local`**
      ⚠️ Bukan `.env.local` di root repo — Next.js mengabaikannya diam-diam
- [x] `apps/web/.env.local` tidak akan ter-commit → `git check-ignore -v apps/web/.env.local` mencetak baris
- [x] Tes memakai port dinamis tersendiri; server developer pada port 3000 tetap berjalan

```bash
redis-cli ping
# Cek keberadaan REDIS_URL di editor; jangan salin nilainya ke log/laporan.
git check-ignore -v apps/web/.env.local
```

---

## 2. Gerbang kualitas (wajib hijau sebelum lanjut)

- [x] `npm run typecheck` → PASS
- [x] `npm run lint` → PASS
- [x] `npm test` → PASS (seluruh suite keamanan & klinis)
- [x] `next build` (perintah yang dijalankan `npm run build`) → PASS melalui runner produksi

> `npm run dev` yang menyala **bukan** bukti kode benar. SWC tidak memeriksa tipe,
> jadi dev bisa jalan sementara `npm run typecheck` gagal.

---

## 3. Mode pengembangan (`npm run dev`)

🤖 Seluruh bagian ini ditutup oleh `npm run test:redis`.

- [x] Server tes merespons → GET `/api/health` melalui runner = `200`
- [x] Koneksi Redis → `/api/redis-test` mengembalikan `"connected": true`
- [x] Key punya TTL → `redis-cli TTL dengarin:healthcheck` > 0
- [x] Rate limit → 33 request ke `/api/chat` menghasilkan tepat **30× 200** dan **3× 429**
- [x] Penghitung tercatat → `redis-cli --scan --pattern 'dengarin:ratelimit:*'` berisi 1 key dengan nilai 33 dan TTL > 0 (maksimum 60s)
- [x] Cache AI round-trip → miss `null`, setelah tulis terbaca
- [x] Riwayat percakapan berbeda → key berbeda
- [x] Tier `fallback` → **tidak** ter-cache
- [x] Privasi → input sintetis **0 kemunculan** dalam nilai string Redis tes

```bash
npm run test:redis   # Lolos: 9; Gagal: 0 (dev)
```

> ❗ Cache ISR (`dengarin:next:*`) **tidak** aktif di `npm run dev`.
> Itu perilaku Next.js, bukan bug. Jangan cari key-nya di sini.

---

## 4. Mode produksi (`next build` + `next start` lewat runner)

- [x] Build bersih → `next build` melalui runner produksi pada salinan source tanpa `.next`: PASS
- [x] Log startup memuat **kedua** baris ini:
      `[CacheHandler] Redis tersambung.`
      `[Instrumentation] cache awal terdaftar ke Redis.`
- [x] Cache terisi **sebelum request halaman pertama** → `redis-cli --scan --pattern 'dengarin:next:*' | wc -l` ≈ jumlah halaman
- [x] Nama key bersih, tanpa prefiks ganda
      ✅ `dengarin:next:__sharedTags__`
      ❌ `dengarin:next:dengarin:next:__sharedTags__`
- [x] `npm run test:redis -- --production` lulus 15/15
- [x] GET `/resources` melalui runner menyertakan header `x-nextjs-cache: HIT`

```bash
npm run test:redis -- --production
```

---

## 5. Multi-instance — inti nilai Redis

Runner `--production` menjalankan dua instance ke satu Redis. Perintah manual berikut hanya untuk lingkungan khusus tes:

```bash
npm start --workspace=apps/web              # A, port 3000
npm start --workspace=apps/web -- -p 3001   # B, port 3001
```

- [x] Instance A dan B memakai Redis tes yang sama; halaman sudah di-warm-up saat startup.
- [x] `/resources` menghasilkan `200` dan `x-nextjs-cache: HIT`.
- [x] Bukti cache bersama: runner mengubah marker teks pada value `/resources` di Redis, lalu respons B memuat marker tersebut. Value asli dikembalikan setelah assertion.
- [ ] Hapus key lalu muat di B → key muncul lagi (belum diuji).
- [x] Kuota tidak bocor: 20 request ke A + 15 ke B → total lolos **30**, diblokir **5**.
- [x] B mengembalikan `429` walau B sendiri belum mendekati kuota.

Warm-up membuat request pertama dapat langsung `HIT`; `MISS` bukan syarat pembuktian. Mengubah marker membuktikan asal data lebih kuat daripada hanya melihat header.

---

## 6. Regresi — bug yang pernah nyata terjadi

Setiap poin di sini pernah lolos semua gerbang lain. Jangan dilewati.

- [x] **Redis restart, aplikasi pulih sendiri**
      Matikan Redis → hidupkan lagi → `/api/redis-test` kembali `"connected": true`
      **tanpa** merestart Next.js.
      Gejala kalau rusak: `The client is closed` selamanya.
      Sebab: client mati dipakai ulang; patokan sehat harus `isReady`, bukan `isOpen`.

- [x] **Situs tetap hidup tanpa Redis**
      Saat Redis mati: `/api/health` = `200`, `/api/chat` = `200` (fallback memori),
      `/api/redis-test` = `503` dengan pesan yang jelas.

- [x] **Kuota selamat dari restart aplikasi**
      Habiskan kuota → restart server → request pertama tetap `429`.

- [x] **Tidak ada `Module not found: Can't resolve 'stream'`**
      Uji dari `.next` yang **bersih** (`rm -rf apps/web/.next`).
      Perbaikan bundler bisa terlihat berhasil hanya karena sisa cache.

- [x] **Tidak ada `UnhandledSchemeError: ... "node:path"`**
      Jangan impor modul inti Node di file yang ikut di-bundle untuk semua runtime.

- [x] **Tidak ada `TS1375: 'await' expressions are only allowed...`**
      Ditangkap `npm run typecheck`, **tidak** oleh `npm run dev`.

- [x] **`await` tidak lupa dipasang pada `isRateLimited()`**
      Gejala: **setiap** request kena `429`, karena `Promise` selalu truthy.
      Cek: `grep -rn "if (isRateLimited(" apps/web/src` harus **kosong**.

```bash
grep -rn "if (isRateLimited(" apps/web/src   # harus tidak ada hasil
```

---

## 7. Keamanan & privasi (wajib — lihat `docs/SAFETY.md`)

- [x] **Input sintetis tidak tersimpan pada skenario tes** — runner memindai nilai string Redis tes, hasil 0. Ini bukan bukti untuk semua kemungkinan jawaban AI yang mungkin mengulang input pengguna. Contoh pemeriksaan manual pada Redis khusus tes:

```bash
redis-cli --scan --pattern 'dengarin:*' | while read k; do redis-cli GET "$k"; done \
  | grep -c "kalimat uji yang kamu kirim"     # harapkan 0
```

- [x] Key cache AI berupa hash SHA-256, bukan teks terbaca → `redis-cli --scan --pattern 'dengarin:ai:*'`
- [x] Value cache AI hanya menyimpan field `tier`, `providerId`, `action`, `warnings`; field tambahan `userInput` tidak ikut tersimpan pada fixture tes
- [x] Kuota rate limit tetap **per-rute dan anonim** — bukan per-IP, bukan per-session
      (session ID sebagai kunci kuota membuat pengguna anonim bisa dilacak)
- [x] Crisis gate berjalan **sebelum** cache dibaca di `apps/web/src/app/api/chat/route.ts`
      Cache hanya boleh memangkas panggilan LLM, **tidak pernah** deteksi krisis.
- [ ] Tidak ada frasa pemulihan atau kunci enkripsi di Redis setelah alur recovery/sync (alur tersebut belum diuji terhadap Redis)

---

## 8. Sebelum deploy

- [ ] `REDIS_URL` produksi memakai **`rediss://`** (TLS), bukan `redis://`
- [ ] Password Redis kuat dan tidak pernah masuk git
- [ ] Redis tidak terekspos ke internet publik tanpa autentikasi
- [ ] Batas memori & eviction diset → `maxmemory 256mb`, `maxmemory-policy allkeys-lru`
- [ ] Setelah upgrade Next.js mayor: **flush** cache lama (format Next 14 dan 15 tidak kompatibel)
- [x] `REDIS_URL` **dikosongkan** — health, chat, dan `/resources` tetap HTTP 200

---

## 9. Yang TIDAK perlu dikhawatirkan

| Terlihat seperti masalah | Sebenarnya |
|---|---|
| `dengarin:next:*` kosong saat `npm run dev` | Normal — `cacheHandler` hanya aktif di produksi |
| `tier: fallback`, `cached: false` di chat | Normal tanpa API key — fallback memang sengaja tidak di-cache |
| `MODULE_TYPELESS_PACKAGE_JSON` warning | Kosmetik, aman diabaikan |
| `Fast Refresh had to perform a full reload` | Normal setelah mengubah file yang dipakai server |

---

## Ringkasan satu layar

```bash
npm run typecheck
npm run lint
npm test
npm run test:redis                 # 9 lulus, 0 gagal
npm run test:redis -- --production # build bersih + 15 lulus, 0 gagal
```

Gerbang kualitas diperiksa di workspace; build produksi diperiksa oleh runner pada salinan source yang bersih agar `.next` milik server developer tidak terganggu. Checklist deployment tetap harus diperiksa di lingkungan target.
