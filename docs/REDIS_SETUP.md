# Setup Redis (Dengar.in)

Panduan praktis dari nol sampai jalan. Penjelasan desain dan alasan teknisnya ada di [`REDIS.md`](./REDIS.md), daftar pengujian di [`REDIS_TESTING_CHECKLIST.md`](./REDIS_TESTING_CHECKLIST.md).

> **Redis itu opsional.** Kalau `REDIS_URL` kosong atau Redis mati, aplikasi tetap jalan dengan penghitung memori. Jadi kamu boleh mulai tanpa Redis dan menyalakannya belakangan.

## Redis dipakai untuk apa

| Fungsi | Tanpa Redis |
|---|---|
| Rate limit per klien + pagar global (`dengarin:ratelimit:*`) | penghitung memori per proses |
| Cache jawaban AI (`dengarin:ai:*`, hanya hash SHA-256, tidak ada teks curhat) | selalu panggil AI |
| Cache feed forum yang sudah disetujui (`dengarin:forum:*`) | baca langsung dari database |
| Batas konkurensi lintas instance (`dengarin:slots:*`) | hanya batas per proses |
| Cache halaman ISR/SSG (`dengarin:next:*`, khusus `next start`) | LRU lokal |

Tidak pernah masuk Redis: teks chat, jurnal, check-in, kunci pemulihan, cadangan `/api/sync`.

---

## A. Lokal (development)

### 1. Nyalakan Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis      # otomatis nyala tiap boot
redis-cli ping                 # harus membalas PONG
```

**Docker:**
```bash
docker run -d --name dengarin-redis -p 6379:6379 redis:7-alpine
```

### 2. Isi `REDIS_URL`

Buat `apps/web/.env.local` (bukan di root repo, Next.js hanya membaca env dari folder `apps/web`):
```bash
REDIS_URL=redis://localhost:6379
```
File ini sudah di-`.gitignore`. Jangan pernah commit isinya.

### 3. Jalankan dan cek

```bash
npm run dev
curl http://localhost:3000/api/health
# {"ok":true,...,"redis":"up"}
curl http://localhost:3000/api/redis-test
# {"ok":true,"data":{"connected":true,...}}
```

`redis` di `/api/health` punya tiga nilai: `up`, `down` (URL diisi tapi tidak terjangkau), `disabled` (URL kosong). Statusnya selalu HTTP 200, karena Redis mati bukan alasan menganggap server tidak sehat.

### 4. Lihat isinya

```bash
redis-cli --scan --pattern 'dengarin:*'      # semua key aplikasi
redis-cli --scan --pattern 'dengarin:ratelimit:*'
redis-cli TTL <nama-key>                      # semua key punya TTL
```
Pakai `--scan`, bukan `KEYS`, supaya tidak memblokir server.

### 5. Tes otomatis

```bash
npm run test:redis                    # dev: Redis + Next.js khusus tes, port acak
npm run test:redis -- --production    # build bersih + dua instance
```
Runner memakai Redis sendiri (tidak menyentuh Redis-mu) dan dibersihkan otomatis. Butuh `redis-server` di PATH.

---

## B. Produksi (Vercel)

### 1. Buat Redis terkelola

Pilih salah satu (semuanya punya tier gratis): **Upstash** (paling mudah lewat Vercel Marketplace), Redis Cloud, atau Railway.

Ambil connection string-nya. Untuk Redis di internet publik **wajib TLS**, jadi skemanya `rediss://` (dua "s"):
```
rediss://default:<PASSWORD>@<HOST>:<PORT>
```
`redis://` polos berarti tanpa enkripsi. Jangan dipakai di luar mesinmu sendiri.

### 2. Isi env di Vercel

Project → Settings → Environment Variables (Production, dan Preview bila perlu):

| Variabel | Wajib? | Isi |
|---|---|---|
| `REDIS_URL` | ya, untuk mengaktifkan Redis | `rediss://default:...` |
| `TRUSTED_PROXY_HOPS` | opsional (rate limit per klien) | `1` bila hanya ada satu proxy tepercaya di depan app |
| `RATE_LIMIT_HASH_SECRET` | wajib bila `TRUSTED_PROXY_HOPS` diisi | string acak ≥16 karakter |

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Aturan main `TRUSTED_PROXY_HOPS`:
- Kosongkan bila kamu belum yakin. Semua klien anonim lalu berbagi satu kuota per rute (perilaku M01), aman tapi satu orang bisa memenuhi jatah orang lain.
- Isi hanya bila **seluruh** trafik lewat proxy yang menimpa `X-Forwarded-For` dan origin tidak bisa diakses langsung. Kalau salah isi, pemanggil bisa memalsukan IP; batas global tetap jadi cadangan, tapi kuota per klien jadi tidak berarti.
- Cek setelah deploy: kirim beberapa request lalu `redis-cli --scan --pattern 'dengarin:ratelimit:client:chat:*'`. Kalau semua klien menumpuk di satu key, header IP tidak terbaca; kalau tiap klien punya key sendiri, jalan.

Setelah menyimpan env, **redeploy** (env baru hanya terbaca deployment berikutnya).

### 3. Verifikasi

```bash
curl https://<domain-kamu>/api/health
# "redis":"up"
```
Kalau `disabled`: `REDIS_URL` belum terbaca (belum redeploy, atau salah environment). Kalau `down`: URL salah, password salah, atau memakai `redis://` ke server yang mewajibkan TLS. Lihat log Vercel untuk baris `[Redis]`.

### 4. Catatan khusus Vercel

- Bagian **cache halaman ISR** (`cache-handler.mjs`) dirancang untuk server yang dijalankan sendiri (`next start`). Vercel mengelola cache halamannya sendiri, jadi jangan berharap key `dengarin:next:*` terisi di sana; itu bukan tanda ada yang rusak. Manfaat Redis di Vercel ada di rate limit, cache AI, cache forum, dan batas konkurensi. Ini belum saya verifikasi pada deployment Vercel-mu; cek key yang muncul di Redis.
- Tiap serverless instance membuka satu koneksi TCP. Tier gratis punya batas koneksi; pantau di dashboard penyedia bila trafik naik.
- Sebaiknya di dashboard Redis atur `maxmemory` (mis. 256 MB) dan `maxmemory-policy allkeys-lru`. Batas memori yang terlalu kecil hanya menurunkan hit rate cache, tidak merusak aplikasi.

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `/api/health` → `redis: "disabled"` padahal Redis nyala | `REDIS_URL` tidak terbaca | Lokal: pindahkan ke `apps/web/.env.local` lalu restart `npm run dev`. Vercel: redeploy. |
| `redis: "down"` | URL/password salah, Redis mati, atau TLS tidak cocok | Cek `redis-cli -u "$REDIS_URL" ping`; produksi pakai `rediss://` |
| Log `ECONNREFUSED` terus | Redis lokal mati | `brew services start redis` atau nyalakan container Docker |
| Semua orang kena 429 | Rate limit anonim (satu bucket) dan trafik ramai | Isi `TRUSTED_PROXY_HOPS` + `RATE_LIMIT_HASH_SECRET` bila deploy di belakang proxy tepercaya |
| Situs lambat saat Redis mati | Tidak seharusnya: timeout 1 dtk lalu fallback memori, sambung ulang ditunda 2 dtk | Cek log; bila berulang buka issue |
| Feed forum terlihat basi | TTL 30 dtk, atau invalidasi gagal | Tunggu ≤30 dtk; hitungan dukungan sengaja tidak menaikkan versi |
| Redis kosong saat `npm run dev` | Cache halaman hanya aktif di produksi | Normal. Key `ratelimit`, `ai`, `forum` tetap terisi saat dipakai |

### Menghapus data Redis dengan aman

```bash
redis-cli --scan --pattern 'dengarin:ai:*'    | xargs -r redis-cli DEL   # cache AI
redis-cli --scan --pattern 'dengarin:forum:*' | xargs -r redis-cli DEL   # cache forum
redis-cli --scan --pattern 'dengarin:ratelimit:*' | xargs -r redis-cli DEL   # reset kuota
```
Hindari `FLUSHDB` bila Redis dipakai bersama aplikasi lain. Semua key aplikasi ini berawalan `dengarin:`.

## Checklist cepat

- [ ] Lokal: `redis-cli ping` → PONG, `apps/web/.env.local` berisi `REDIS_URL`
- [ ] `/api/health` → `"redis":"up"`
- [ ] `npm run test:redis` lulus
- [ ] Produksi: `REDIS_URL` memakai `rediss://`, password tidak masuk git
- [ ] Produksi: redeploy setelah mengubah env, `/api/health` → `"redis":"up"`
- [ ] (Opsional) `TRUSTED_PROXY_HOPS` + `RATE_LIMIT_HASH_SECRET` diisi dan diverifikasi
