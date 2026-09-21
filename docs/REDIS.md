# REDIS — Panduan Implementasi Lengkap (Dengar.in)

**Versi Dokumen**: 1.0.0
**Status**: Terpasang & terverifikasi
**Bahasa**: Indonesia (ditulis untuk pembaca yang baru pertama kali memakai TypeScript)
**Checklist pengujian**: [`docs/REDIS_TESTING_CHECKLIST.md`](./REDIS_TESTING_CHECKLIST.md)

---

## Daftar Isi

1. [Ringkasan: apa yang dipasang](#1-ringkasan-apa-yang-dipasang)
2. [Kenapa BUKAN `@neshca/cache-handler`](#2-kenapa-bukan-neshcacache-handler)
3. [Konsep dasar: apa itu Redis](#3-konsep-dasar-apa-itu-redis)
4. [Instalasi](#4-instalasi)
5. [Konfigurasi environment](#5-konfigurasi-environment)
6. [Peran 1 — Cache halaman Next.js (ISR/SSG)](#6-peran-1--cache-halaman-nextjs-isrssg)
7. [Peran 2 — Rate limiting terdistribusi](#7-peran-2--rate-limiting-terdistribusi)
8. [Peran 3 — Cache respons AI](#8-peran-3--cache-respons-ai)
9. [Pelajaran TypeScript dari kode ini](#9-pelajaran-typescript-dari-kode-ini)
10. [Verifikasi](#10-verifikasi)
11. [Troubleshooting](#11-troubleshooting)
12. [Deploy ke produksi](#12-deploy-ke-produksi)

---

## 1. Ringkasan: apa yang dipasang

| Paket | Versi | Fungsi |
|---|---|---|
| `redis` | `^6.2.1` | Client resmi Redis untuk Node.js |
| `@fortedigital/nextjs-cache-handler` | `^2.5.3` | Mengganti cache ISR/SSG Next.js dengan Redis |

Keduanya terpasang di workspace **`apps/web`**, bukan di root, karena hanya aplikasi web yang memakainya.

### File yang ditambahkan / diubah

| File | Status | Isi |
|---|---|---|
| `apps/web/cache-handler.mjs` | **baru** | Konfigurasi cache handler Next.js |
| `apps/web/src/instrumentation.ts` | **baru** | Hook start server (aman untuk semua runtime) |
| `apps/web/src/instrumentation-node.ts` | **baru** | Kode Node-only: mengisi Redis dari hasil build |
| `scripts/test-redis.sh` | **baru** | Runner tes terisolasi (dev dan produksi) |
| `docs/REDIS_TESTING_CHECKLIST.md` | **baru** | Checklist pengujian lengkap |
| `apps/web/src/lib/api/aiCache.ts` | **baru** | Cache respons AI (privasi-aman) |
| `apps/web/src/app/api/redis-test/route.ts` | **baru** | Endpoint diagnostik |
| `apps/web/next.config.js` | diubah | Mendaftarkan `cacheHandler` |
| `apps/web/src/lib/redis.ts` | ditulis ulang | Koneksi bersama yang aman |
| `apps/web/src/lib/api/rateLimit.ts` | diubah | Kuota pindah ke Redis + fallback memori |
| `apps/web/src/app/api/chat/route.ts` | diubah | Memakai cache AI |
| 6 route API lain | diubah | `isRateLimited()` jadi `await` |
| `.env.example` | diubah | Dokumentasi `REDIS_URL` |

### Prinsip utama: Redis itu OPSIONAL

> Seluruh fitur di atas dirancang untuk **tetap berjalan tanpa Redis**.

Kalau `REDIS_URL` kosong atau servernya mati, aplikasi jatuh ke penghitung in-memory dan cache LRU lokal — lebih lambat, tapi **tidak error**. Ini penting untuk demo lomba: juri yang menjalankan proyekmu tanpa Docker tetap melihat aplikasi yang utuh.

---

## 2. Kenapa BUKAN `@neshca/cache-handler`

Paket yang kamu minta awalnya **tidak bisa dipakai** di proyek ini. Ini temuan faktualnya:

```
Next.js di apps/web         : 15.5.25
@neshca peer requirement    : ">= 13.5.1 < 15"     ← Next 15 ditolak
Rilis terakhir @neshca      : 26 November 2024     ← tidak dirawat lagi
```

Memaksakannya (`--legacy-peer-deps`) mungkin lolos build, tapi berisiko error runtime: Next.js 15 mengubah struktur internal nilai cache (`body` jadi `Buffer`, `rscData` jadi `string`, `segmentData` jadi `Map`), dan neshca tidak tahu perubahan itu.

**`@fortedigital/nextjs-cache-handler` adalah kelanjutan resmi neshca** — fork dari tim Forte Digital yang mengambil alih perawatannya. Sejak v2.0.0 ia berdiri sendiri dan kompatibel penuh dengan Next.js 15 serta `redis` v5+.

API-nya **identik**. Migrasinya hanya mengganti nama paket di baris `import`:

```js
// Lama
import { CacheHandler } from "@neshca/cache-handler";

// Baru — sisanya sama persis
import { CacheHandler } from "@fortedigital/nextjs-cache-handler";
```

Dokumentasi neshca di <https://caching-tools.github.io/next-shared-cache> **masih relevan** untuk paket ini.

---

## 3. Konsep dasar: apa itu Redis

Redis adalah **database key-value yang hidup di RAM**. Bayangkan satu `Map` raksasa yang:

- dipakai bersama oleh **semua** server aplikasimu, dan
- **tetap hidup** meski aplikasimu di-restart.

```
        TANPA REDIS                          DENGAN REDIS
┌──────────┐  ┌──────────┐          ┌──────────┐  ┌──────────┐
│ Server A │  │ Server B │          │ Server A │  │ Server B │
│ Map lokal│  │ Map lokal│          └────┬─────┘  └────┬─────┘
│  (beda!) │  │  (beda!) │               └──────┬──────┘
└──────────┘  └──────────┘                      ▼
 restart = hilang                          ┌──────────┐
 kuota bocor 2x lipat                      │  REDIS   │ ← satu sumber kebenaran
                                           └──────────┘
```

Itulah dua masalah yang Redis pecahkan di proyek ini: **state yang tidak dibagi** dan **state yang hilang saat restart**.

### Tiga peran Redis di Dengar.in

| Peran | File | Masalah yang dipecahkan |
|---|---|---|
| Cache halaman | `cache-handler.mjs` | Tiap instance merender ulang halaman yang sama |
| Rate limit | `lib/api/rateLimit.ts` | Kuota anti-abuse bocor & hilang saat restart |
| Cache AI | `lib/api/aiCache.ts` | Kuota API DeepSeek/OpenRouter terbakar sia-sia |

---

## 4. Instalasi

### 4.1 Menyalakan server Redis

**Opsi A — Docker (paling bersih):**

```bash
docker run -d --name dengarin-redis -p 6379:6379 redis:7-alpine
```

**Opsi B — Homebrew (macOS, yang dipakai di mesin ini):**

```bash
brew install redis
brew services start redis     # otomatis hidup tiap boot
```

Pastikan hidup:

```bash
redis-cli ping
# → PONG
```

### 4.2 Paket npm

Sudah dipasang. Untuk referensi, perintahnya:

```bash
npm install redis@^6.2.1 @fortedigital/nextjs-cache-handler@^2.5.3 --workspace=apps/web
```

> **Catatan monorepo:** bendera `--workspace=apps/web` itu wajib. Tanpanya npm memasang ke `package.json` root, padahal yang mengimpor adalah `apps/web` — dependensinya jadi tidak tercatat di tempat yang benar.

---

## 5. Konfigurasi environment

> ### ⚠️ Lokasi file sangat menentukan
>
> Letakkan di **`apps/web/.env.local`**, **bukan** `.env.local` di root repo.
>
> `npm run dev` menjalankan `next dev` dengan `apps/web` sebagai project root, dan
> Next.js hanya membaca file env dari project root-nya sendiri. File di root repo
> **diabaikan diam-diam** — gejalanya `/api/redis-test` menjawab *"Redis tidak aktif"*
> padahal `redis-cli ping` membalas `PONG`.
>
> Satu file di `apps/web/.env.local` cukup untuk semuanya: `services/persistence/src/db/pool.ts`
> sudah mencantumkan folder itu sebagai kandidat pencariannya.

Salin variabel yang kamu butuhkan dari `.env.example` ke `apps/web/.env.local`, lalu isi:

```bash
# Lokal
REDIS_URL=redis://localhost:6379

# Terkelola (Upstash, Redis Cloud, Railway) — perhatikan rediss:// dengan dua "s"
REDIS_URL=rediss://default:[PASSWORD]@[HOST]:[PORT]
```

> `redis://` = polos. `rediss://` = **TLS terenkripsi**. Untuk Redis terkelola di internet publik, **selalu** pakai `rediss://`. Menaruh data pengguna di koneksi tanpa enkripsi melanggar `docs/SAFETY.md`.

Mengosongkan `REDIS_URL` mematikan Redis sepenuhnya dan aplikasi memakai fallback in-memory.

---

## 6. Peran 1 — Cache halaman Next.js (ISR/SSG)

### Masalahnya

Secara bawaan, Next.js menyimpan hasil render halaman ke **folder `.next` di disk masing-masing instance**. Kalau kamu menjalankan 3 instance:

- Halaman yang sama dirender 3 kali (boros).
- `revalidatePath()` di instance A **tidak terlihat** oleh B dan C — mereka menyajikan konten basi.
- Setiap deploy menghapus seluruh cache.

### Solusinya

`apps/web/next.config.js` menunjuk Next.js ke handler kustom:

```js
const path = require('node:path');

const nextConfig = {
  reactStrictMode: true,
  cacheHandler: path.resolve(__dirname, 'cache-handler.mjs'),  // wajib path ABSOLUT
  cacheMaxMemorySize: 0                                        // matikan cache memori bawaan
};
```

Dua hal yang sering bikin orang tersandung:

1. **`cacheHandler` hanya aktif di produksi** (`next build` + `next start`). `next dev` mengabaikannya sepenuhnya. Jadi jangan heran kalau Redis terlihat kosong saat `npm run dev`.
2. **`cacheMaxMemorySize: 0` itu penting.** Tanpa itu, Next.js tetap menyimpan salinan di memori tiap instance dan bisa menyajikan halaman basi meski Redis sudah diperbarui.

### Isi `cache-handler.mjs`

```js
CacheHandler.onCreation(() => {
  if (global.cacheHandlerConfig) return global.cacheHandlerConfig;        // 1
  if (global.cacheHandlerConfigPromise) return global.cacheHandlerConfigPromise;  // 2

  if (process.env.NODE_ENV === 'development') {                          // 3
    return { handlers: [createLruHandler()] };
  }
  ...
});
```

1. **Cache di `global`** — supaya hanya ada satu koneksi Redis untuk seluruh proses.
2. **Penjaga race condition** — bila dua request datang bersamaan saat koneksi sedang dibuat, keduanya menunggu promise yang sama, bukan membuka koneksi kedua.
3. **Dev pakai LRU** — supaya kamu tidak perlu menyalakan Redis hanya untuk mengedit CSS.

Handler akhirnya memakai **composite**: entri bertag `'memory-cache'` disimpan lokal, sisanya ke Redis.

```js
createCompositeHandler({
  handlers: [lruCache, redisCacheHandler],
  setStrategy: (ctx) => (ctx?.tags.includes('memory-cache') ? 0 : 1)
});
```

> **Kenapa `.mjs`, bukan `.ts`?** Next.js memuat file ini **lebih awal** dari pipeline kompilasinya sendiri. Pada titik itu belum ada yang bisa mentranspile TypeScript, jadi file ini wajib JavaScript murni. Ekstensi `.mjs` memberi tahu Node.js bahwa isinya ES module (`import`/`export`), bukan CommonJS (`require`).

### `instrumentation.ts` — dan perang melawan webpack

Bagian ini butuh **empat kali percobaan** sebelum benar. Kami tuliskan seluruh rantainya, karena setiap kegagalan mengajarkan satu hal nyata tentang cara webpack bekerja.

#### Gejala awal

```
Module not found: Can't resolve 'stream'

Import trace for requested module:
  ../../node_modules/@redis/client/dist/index.js
  ../../node_modules/redis/dist/index.js
  ./cache-handler.mjs
  ./src/instrumentation.ts
```

**Akar masalah:** `instrumentation.ts` dikompilasi untuk **semua** runtime — Node.js, Edge, dan browser. Client Redis memakai modul inti Node seperti `stream` dan `net` yang tidak ada di Edge/browser.

#### Percobaan 1 — penjaga runtime ❌

```ts
if (process.env.NEXT_RUNTIME !== 'nodejs') return;   // tidak menolong
```

Penjaga ini berjalan saat **RUNTIME**. webpack menelusuri impor saat **BUILD** — ia tidak peduli cabang `if` mana yang nanti dieksekusi.

> **Inilah pelajaran intinya:** kamu tidak bisa menyembunyikan impor dari bundler dengan logika runtime.

#### Percobaan 2 — `serverExternalPackages` ❌

```js
serverExternalPackages: ['redis', '@redis/client', '@fortedigital/nextjs-cache-handler']
```

Opsi ini benar dan tetap kami pertahankan, tapi **tidak cukup**: ia hanya berlaku untuk bundel server Node, sedangkan `instrumentation.ts` juga dikompilasi untuk runtime lain.

#### Percobaan 3 — pisahkan file ❌

Memindahkan kode Node-only ke `instrumentation-node.ts` lalu memanggilnya dengan `await import('./instrumentation-node')` **juga gagal**. webpack tetap mengikuti dynamic import selama specifier-nya berupa string literal — jejak error-nya hanya bertambah satu baris:

```
  ./cache-handler.mjs
  ./src/instrumentation-node.ts      ← file baru ikut ditelusuri
  ./src/instrumentation.ts
```

> Perbaikan ini sempat kami kira berhasil karena dev server menyala. Ternyata itu hanya sisa cache `.next`; setelah `rm -rf .next` error-nya kembali. **Selalu uji perbaikan bundler dari kondisi build yang bersih.**

#### Percobaan 4 — specifier yang tidak bisa dianalisis ✅

webpack hanya bisa menelusuri impor yang targetnya ia ketahui saat build. Simpan specifier di **variabel** dan tandai dengan `webpackIgnore`, maka impor itu dibiarkan apa adanya dan Node.js yang meresolusinya saat runtime:

```ts
// src/instrumentation-node.ts
export async function registerNodeInstrumentation(): Promise<void> {
  if (process.env.NODE_ENV !== 'production' || !process.env.REDIS_URL) return;

  // cwd berbeda tergantung cara server dijalankan:
  //   npm start --workspace=apps/web  -> cwd = <repo>/apps/web
  //   npx next start apps/web         -> cwd = <repo>
  const candidates = [
    `file://${process.cwd()}/cache-handler.mjs`,
    `file://${process.cwd()}/apps/web/cache-handler.mjs`
  ];
  const spec = '@fortedigital/nextjs-cache-handler/instrumentation';

  const { registerInitialCache } = await import(/* webpackIgnore: true */ spec);

  let CacheHandler: unknown;
  for (const url of candidates) {
    try { CacheHandler = (await import(/* webpackIgnore: true */ url)).default; break; } catch {}
  }
  if (!CacheHandler) return;

  await registerInitialCache(CacheHandler, { setOnlyIfNotExists: true });
}
```

Dua detail yang juga hasil kegagalan nyata:

- **Jangan pakai `node:path` / `node:url` di sini.** Mengimpornya memindahkan error, bukan menghilangkannya:
  `UnhandledSchemeError: Reading from "node:path" is not handled by plugins`.
  URL dirakit dengan template string biasa.
- **Jangan berasumsi soal `process.cwd()`.** Percobaan pertama memakai satu path saja dan gagal dengan
  `Cannot find module '<repo>/cache-handler.mjs'` ketika server dijalankan dari root repo. Karena itu kandidatnya dicoba berurutan.

#### File yang memanggilnya

```ts
// src/instrumentation.ts — aman untuk semua runtime, tidak menyebut Redis sama sekali
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { registerNodeInstrumentation } = await import('./instrumentation-node');
  await registerNodeInstrumentation();
}
```

> `instrumentation-node.ts` **mengekspor fungsi**, bukan memakai `await` di level atas. Versi yang memakai top-level `await` ditolak `tsc`:
> ```
> TS1375: 'await' expressions are only allowed at the top level of a file
>         when that file is a module, but this file has no imports or exports.
> ```
> File TypeScript baru dianggap *module* kalau punya `import`/`export`; tanpa itu ia dianggap *script* dan top-level `await` dilarang. `npm run dev` tetap jalan karena SWC tidak memeriksa tipe — hanya `npm run typecheck` yang menangkapnya.

#### Hasilnya

Saat `next start`, log menampilkan:

```
[Instrumentation] cache awal terdaftar ke Redis.
```

dan seluruh halaman hasil build langsung terisi di Redis sebelum request pertama:

```
dengarin:next:/index      dengarin:next:/chat      dengarin:next:/forum
dengarin:next:/dashboard  dengarin:next:/journal   ... (17 key)
```

Ia menyalin hasil build ke Redis. Tanpanya, pengguna pertama setelah setiap deploy menanggung render penuh setiap halaman.

Opsi `setOnlyIfNotExists: true` berarti: **jangan timpa** entri yang sudah ditulis instance lain saat runtime. Tanpa opsi ini, instance yang baru restart akan menimpa cache yang sudah lebih baru.

---

## 7. Peran 2 — Rate limiting terdistribusi

### Sebelum

`lib/api/rateLimit.ts` memakai `Map` di memori. Dua kelemahannya:

- **Kuota bocor.** 3 instance × kuota 30 = pengguna sebenarnya dapat 90.
- **Restart mereset kuota.** Penyerang cukup memicu redeploy untuk mendapat kuota baru.

### Sesudah

```ts
export async function isRateLimited(route: PublicRoute): Promise<boolean> {
  const limit = limits[route];
  const redis = await getRedis();
  if (!redis) return limiter.check(route, limit);      // fallback in-memory

  const windowIndex = Math.floor(Date.now() / WINDOW_MS);
  const key = `${REDIS_PREFIX}ratelimit:${route}:${windowIndex}`;

  try {
    const replies = await redis.multi()
      .incr(key)
      .expire(key, Math.ceil(WINDOW_MS / 1_000))
      .exec();

    const count = Number(replies[0]);
    if (!Number.isFinite(count)) return limiter.check(route, limit);
    return count > limit;
  } catch (error) {
    return limiter.check(route, limit);
  }
}
```

**Tiga keputusan desain yang perlu kamu pahami:**

**a. Fixed window lewat nama key.** Indeks jendela (`Math.floor(Date.now() / 60000)`) ikut masuk ke nama key. Saat menit berganti, key-nya otomatis berbeda — jendela lama kedaluwarsa sendiri, tidak perlu pembersihan manual.

**b. `MULTI`/`EXEC` itu atomik.** Kalau `INCR` dan `EXPIRE` dikirim terpisah dan proses mati di antaranya, key-nya ter-increment tapi tidak pernah punya TTL — ia akan menetap di Redis **selamanya** dan kuota rute itu terkunci permanen. `MULTI` menjamin keduanya dijalankan sebagai satu unit.

**c. Fallback tidak pernah menjatuhkan request yang sah.** Kalau Redis mati, kita kembali ke penghitung memori. Lebih longgar, tapi pengguna yang tidak bersalah tidak ikut diblokir karena masalah infrastruktur.

### Properti keamanan yang DIPERTAHANKAN

Kuota tetap **per-rute dan anonim**, bukan per-IP atau per-session:

```ts
/** Anonymous route-wide quota; session IDs and forwarding headers have no authority. */
```

Ini disengaja (lihat `docs/M01_RATE_LIMITING.md`). Header seperti `X-Forwarded-For` gampang dipalsukan, dan memakai session ID sebagai kunci kuota akan membuat pengguna anonim bisa dilacak — bertentangan dengan janji anonimitas Dengar.in.

### `acquireChatSlot()` sengaja TIDAK dipindah ke Redis

Fungsi itu membatasi **konkurensi** — berapa panggilan AI yang boleh berjalan bersamaan. Angkanya melindungi memori dan socket **proses ini sendiri**, jadi memakai penghitung global justru salah.

> **Perubahan yang merambat:** karena `isRateLimited()` sekarang `async`, ia mengembalikan `Promise<boolean>`. Semua pemanggil wajib `await`:
> ```ts
> if (await isRateLimited('chat')) return jsonError('...', 429);
> ```
> Tanpa `await`, `if` akan mengevaluasi objek Promise — yang **selalu** truthy — sehingga **setiap** request diblokir 429. Ini jebakan async/await paling umum di TypeScript.

---

## 8. Peran 3 — Cache respons AI

### Masalahnya

Setiap pesan chat memanggil DeepSeek atau OpenRouter. Kuota tier gratis terbatas, dan banyak pengguna anonim mengirim pembuka yang mirip ("aku cemas", "lagi sedih banget"). Merender ulang jawaban yang sama membakar kuota tanpa manfaat.

### Aturan privasi — bagian terpenting dokumen ini

> **Redis TIDAK PERNAH menyimpan teks mentah pengguna.**

Pesan hanya dipakai untuk menghitung **sidik jari SHA-256** yang menjadi *nama key*:

```ts
export function aiCacheKey(input: AiCacheInput): string {
  const history = (input.history ?? [])
    .map((entry) => `${entry.sender}:${normalize(entry.text)}`)
    .join('\n');

  const fingerprint = [
    normalize(input.message),
    history,
    input.ageBracket ?? '-',
    input.domain ?? '-'
  ].join('|');

  return `${REDIS_PREFIX}ai:${createHash('sha256').update(fingerprint).digest('hex')}`;
}
```

SHA-256 adalah fungsi **satu arah**. Siapa pun yang membuka Redis melihat ini:

```
dengarin:ai:3f8a9c2e1b7d4f6a8e0c5b3d9f2a7e4c1b8d6f0a3e5c7b9d1f4a6e8c0b2d5f7a
```

…dan **tidak bisa** memulihkan isi curhatnya. Yang tersimpan sebagai *value* hanyalah jawaban AI yang sudah lolos validator whitelist — bukan input pengguna.

### Riwayat percakapan ikut di-hash

Kalau riwayat diabaikan, dua percakapan berbeda yang kebetulan berakhir dengan kalimat sama akan **saling mencuri jawaban**. Konsekuensinya berbahaya di aplikasi kesehatan mental, jadi seluruh konteks ikut masuk sidik jari. Efek sampingnya hit rate lebih rendah — dan itu pertukaran yang benar.

### Jawaban `fallback` tidak pernah di-cache

```ts
if (result.tier === 'fallback') return;
```

Tier `fallback` adalah teks darurat deterministik yang muncul ketika **semua** penyedia AI gagal. Menyimpannya akan mengunci pengguna berikutnya pada jawaban darurat itu selama satu jam, padahal penyedia AI mungkin sudah pulih.

### BATAS KEAMANAN: cache dibaca setelah crisis gate

Di `apps/web/src/app/api/chat/route.ts`, urutannya **tidak boleh dibalik**:

```
input → screening → rate limit → CRISIS GATE → baca cache → AI → tulis cache
                                      ▲
                                      └── selalu jalan, tidak pernah dilewati cache
```

Crisis gate deterministik (`services/crisis-engine`) wajib mengevaluasi **setiap** request. Cache hanya boleh memangkas panggilan LLM — **tidak pernah** memangkas deteksi krisis. Ini konsekuensi langsung dari Golden Rule di `docs/SAFETY.md`.

Respons API sekarang menyertakan penanda `cached: true | false` supaya perilakunya bisa diamati.

---

## 9. Pelajaran TypeScript dari kode ini

Karena kamu baru mulai TypeScript, ini konsep-konsep yang benar-benar dipakai di kode yang baru ditulis.

### 9.1 `ReturnType<typeof f>` — menurunkan tipe, bukan menulisnya

Ini bug **asli** yang kita temui saat implementasi. Versi pertama menulis:

```ts
type RedisClient = ReturnType<typeof createClient>;   // ❌ error
```

TypeScript menolak dengan pesan panjang soal `RedisClientType<{}, {}, {}, 3, {}>` tidak cocok dengan `RedisClientType<RedisModules, ...>`.

**Penyebabnya:** `createClient` adalah fungsi **generik**. `ReturnType<typeof createClient>` mengambil tipe dengan nilai generik *default*, sedangkan memanggil `createClient({ url, socket })` menghasilkan generik yang *sempit*. Dua tipe itu tidak saling cocok.

**Perbaikannya** — turunkan tipe dari pabrik kita sendiri:

```ts
type RedisClient = ReturnType<typeof createRedisClient>;

function createRedisClient() {        // ← tanpa anotasi return
  const client = createClient({ url: REDIS_URL, socket: { /* ... */ } });
  return client;
}
```

**Pelajaran umum:** kalau sebuah tipe sudah bisa disimpulkan TypeScript, jangan menulisnya ulang dengan tangan. Tipe hasil turunan otomatis ikut berubah saat kodenya berubah; tipe tulisan tangan akan basi diam-diam.

### 9.2 `Pick<T, K>` — mengambil sebagian bentuk

```ts
type CachedResult = Pick<OrchestratorResult, 'tier' | 'providerId' | 'action' | 'warnings'>;
```

Artinya: "buat tipe baru yang isinya **hanya** empat properti itu dari `OrchestratorResult`."

Manfaatnya bukan sekadar hemat ketikan — ini **kontrak**. Kalau nanti `OrchestratorResult` menambah field sensitif, field itu tidak akan ikut tersimpan ke Redis secara tidak sengaja, dan kalau `action` berganti tipe, TypeScript langsung menandai `aiCache.ts`.

Saudara-saudaranya: `Omit<T, K>` (kebalikannya), `Partial<T>` (semua opsional), `Record<K, V>` (peta key-value, dipakai di `limits`).

### 9.3 `import type` — impor yang hilang saat runtime

```ts
import type { AgeBracket, InterventionDomain } from '@dengarin/types';
import { createHash } from 'node:crypto';
```

`import type` hanya membawa **informasi tipe**. Ia dihapus total saat kompilasi — tidak ada `require` yang tersisa di JavaScript hasilnya.

Ini penting di monorepo: `@dengarin/types` tidak perlu bisa diresolusi saat runtime, karena barisnya memang lenyap. Baris `createHash` di bawahnya adalah impor **nilai** — itu benar-benar berjalan.

### 9.4 `unknown` lebih aman daripada `any`

```ts
client.on('error', (error: unknown) => {
  console.error('[Redis]', error instanceof Error ? error.message : error);
});
```

`any` mematikan seluruh pemeriksaan tipe — `error.message` akan lolos kompilasi lalu meledak saat runtime kalau yang dilempar ternyata sebuah string.

`unknown` memaksamu membuktikan tipenya dulu. `error instanceof Error` adalah **type guard**: di dalam cabang itu TypeScript tahu `error` benar-benar `Error`, jadi `.message` aman.

### 9.5 Union dengan `null` sebagai kontrak eksplisit

```ts
export async function getRedis(): Promise<RedisClient | null>
```

Tipe ini **memberi tahu pemanggil** bahwa Redis bisa tidak ada. Dengan `strict: true` di `tsconfig.json`, TypeScript **menolak** kode yang langsung memakai hasilnya:

```ts
const redis = await getRedis();
await redis.get('key');        // ❌ 'redis' is possibly 'null'

if (!redis) return null;       // ✅ setelah dicek, aman
await redis.get('key');
```

Kompiler jadi memaksakan strategi fallback kita — mustahil lupa menanganinya.

### 9.6 `async` merambat ke pemanggil

Mengubah satu fungsi jadi `async` memaksa **semua** pemanggilnya ikut berubah. Di sini satu perubahan di `rateLimit.ts` merambat ke 7 pemanggil di 6 file.

Jebakannya: melupakan `await` **tidak** menghasilkan error TypeScript di dalam `if`, karena `Promise<boolean>` adalah objek yang sah dan selalu truthy. Kodenya diam-diam salah total. Selalu periksa ulang setiap pemanggil.

### 9.7 Alias `@/` hanya ada untuk TypeScript

Bug **asli** kedua yang kita temui. Impor ini membuat test suite gagal:

```ts
import { getRedis } from '@/lib/redis';    // ❌ pecah di test
```

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@/lib'
```

`@/*` didefinisikan di `paths` dalam `tsconfig.json`. Yang memahaminya hanya TypeScript dan bundler Next.js. Test di repo ini berjalan lewat `node --experimental-strip-types` yang **membaca file .ts langsung tanpa bundler** — ia tidak pernah membaca `tsconfig.json`, jadi alias itu tidak ada artinya.

Perbaikannya mengikuti konvensi yang sudah dipakai repo ini (lihat `services/orchestrator/src/orchestrator.ts`) — impor relatif dengan ekstensi `.ts` eksplisit:

```ts
import { getRedis, REDIS_PREFIX } from '../redis.ts';   // ✅ jalan di Next.js DAN Node
```

**Aturan praktisnya di repo ini:** file yang diimpor test suite memakai impor relatif ber-ekstensi. File yang hanya dipakai Next.js (route, komponen) boleh memakai `@/`.

### 9.8 `isOpen` vs `isReady` — bug pemulihan yang nyaris lolos

Bug ini **hanya ketahuan karena tes mematikan Redis lalu menyalakannya lagi**. Tanpa tes itu, ia akan lolos ke produksi dan baru terasa saat Redis pertama kali restart.

**Gejalanya:** Redis mati sebentar lalu hidup lagi, tapi aplikasi terus menjawab
`The client is closed` **selamanya** — sampai server Next.js ikut direstart.

**Sebabnya:** setelah `reconnectStrategy` menyerah, client masuk keadaan mati permanen. Memanggil `connect()` padanya tidak menghidupkannya kembali. Jadi client mati harus **dibuang dan diganti**, bukan dipakai ulang:

```ts
if (client && !client.isReady) {
  client.destroy();
  client = undefined;
}
if (!client) client = createRedisClient();
```

**Dan di sinilah jebakannya.** Percobaan pertama memakai `!client.isOpen` sebagai patokan, dan gagal:

```ts
if (client && !client.isOpen) { ... }   // ❌ client mati lolos dari pembuangan
```

Client yang socket-nya sudah mati bisa tetap melaporkan **`isOpen === true`** sementara semua perintahnya gagal. Akibatnya client mati tidak pernah dibuang, dan aplikasi tidak pernah pulih.

| Properti | Arti | Layak jadi patokan sehat? |
|---|---|---|
| `isOpen` | Client belum di-`destroy`/`close` | ❌ bisa `true` walau socket mati |
| `isReady` | Terhubung **dan** siap menerima perintah | ✅ |

**Dua pelajaran umum:**

1. Untuk "apakah ini sehat?", pakai sinyal yang berarti **siap dipakai**, bukan sekadar **belum dibuang**.
2. Bug ini lolos dari test unit, lolos dari typecheck, dan lolos dari pemakaian normal. Yang menangkapnya adalah tes yang **benar-benar mematikan dependensinya**. Kalau kodemu mengklaim tahan gangguan, ujilah dengan mengadakan gangguan itu.

> Sempat ada hasil tes yang membingungkan: pengujian modul langsung **pulih**, sedangkan lewat HTTP **tidak**. Penyebabnya beda waktu — di tes langsung `connect()` sempat gagal lebih dulu sehingga client terbuang lewat jalur `catch`, sementara lewat HTTP client mati bertahan dengan `isOpen === true`. Saat dua cara pengujian berbeda hasilnya, biasanya bukan salah satunya "salah" — keduanya sedang menunjukkan jalur kode yang berbeda.

### 9.9 Kenapa `globalThis` untuk koneksi

```ts
const globalForRedis = globalThis as typeof globalThis & {
  __dengarinRedisClient?: RedisClient;
  __dengarinRedisPending?: Promise<RedisClient | null>;
};
```

Dev server Next.js mengevaluasi ulang modul pada **setiap hot reload**. Variabel biasa di level modul akan direset — tiap kali kamu menyimpan file, socket Redis baru terbuka sampai servernya kehabisan koneksi. `globalThis` bertahan melewati reload.

Sintaks `as typeof globalThis & { ... }` adalah **intersection type**: "`globalThis` yang asli, **ditambah** dua properti opsional ini." Tanpa itu TypeScript menolak karena `globalThis` standar tidak punya properti bernama `__dengarinRedisClient`.

---

## 10. Verifikasi

> Untuk daftar periksa langkah demi langkah (dev, produksi, multi-instance, regresi,
> privasi, pra-deploy), lihat [`REDIS_TESTING_CHECKLIST.md`](./REDIS_TESTING_CHECKLIST.md).

### 10.0 Cara tercepat — skrip otomatis

```bash
npm run test:redis                 # dev: 9 lulus, 0 gagal
npm run test:redis -- --production # build bersih + produksi: 15 lulus, 0 gagal
```

`scripts/test-redis.sh` menjalankan `tests/redis/integration.test.mjs`. Prasyarat:
`redis-server` tersedia di PATH, dependency npm terpasang, dan Node mendukung
`--experimental-strip-types`.

Runner membuat Redis khusus tes dan Next.js pada port loopback dinamis. Source
aplikasi disalin ke direktori sementara tanpa `.env` atau `.next` developer.
API key AI serta `DATABASE_URL` dikosongkan; payload cache sintetis dipakai untuk
menguji hit dan fallback tanpa panggilan penyedia AI. Redis developer tidak
dihapus atau dihentikan. Semua proses tes dan direktori sementara dibersihkan.

Cakupan dev: PONG, health HTTP 200, diagnostik connected, TTL, kuota 30/3,
cache AI miss/hit/history/fallback, penggunaan cache oleh route, crisis gate,
pemindaian input sintetis di nilai string Redis, Redis mati/hidup, dan URL kosong.
Mode produksi menambah build bersih, warm-up, header cache, pembuktian isi cache
dibaca oleh instance B, kuota bersama 20+15 request, dan kuota setelah restart app.

Log koneksi error saat Redis sengaja dihentikan merupakan bagian tes kegagalan.
Hasil sukses akhir adalah `Lolos: 9; Gagal: 0 (dev).` atau
`Lolos: 15; Gagal: 0 (produksi).` Tidak ada tes yang dilewati diam-diam.
Batas pembuktian privasi dan checklist deployment tercatat di
[REDIS_TESTING_CHECKLIST.md](./REDIS_TESTING_CHECKLIST.md).

### 10.1 Endpoint diagnostik

```bash
npm run dev
curl http://localhost:3000/api/redis-test
```

Redis hidup:
```json
{"ok":true,"data":{"connected":true,"key":"dengarin:healthcheck","value":"2026-09-21T...","latencyMs":2}}
```

Redis mati / `REDIS_URL` kosong:
```json
{"ok":false,"error":"Redis tidak aktif. Isi REDIS_URL lalu jalankan ulang server."}
```

### 10.2 Melihat isi Redis langsung

```bash
redis-cli KEYS 'dengarin:*'          # semua key aplikasi
redis-cli KEYS 'dengarin:next:*'     # cache halaman
redis-cli KEYS 'dengarin:ratelimit:*'
redis-cli TTL dengarin:ratelimit:chat:29012345
redis-cli MONITOR                    # lihat perintah mengalir real-time
```

> `KEYS` memindai seluruh database dan **memblokir** server. Aman untuk dev, **jangan** dijalankan di produksi — pakai `SCAN`.

### 10.3 Membuktikan rate limit terdistribusi

```bash
for i in $(seq 1 35); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:3000/api/chat \
    -H 'Content-Type: application/json' -d '{"message":"halo"}'
done
```

Sekitar request ke-31 kamu akan melihat `429`. Restart servernya lalu ulangi — dengan Redis, hitungannya **tidak** ter-reset.

### 10.4 Membuktikan cache AI

Kirim pesan yang sama dua kali dan perhatikan field `cached`:

```bash
curl -s -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"aku lagi cemas"}' | grep -o '"cached":[a-z]*'
```

Panggilan pertama `"cached":false`, kedua `"cached":true`.

### 10.5 Membuktikan cache benar-benar dibagi (hanya bisa di produksi)

Tes paling meyakinkan: jalankan **dua instance** yang menunjuk ke satu Redis.

```bash
npm run build
npm start --workspace=apps/web              # instance A, port 3000
npm start --workspace=apps/web -- -p 3001   # instance B, port 3001
```

#### a. Cache halaman dibagi — bukti dari header

```bash
redis-cli FLUSHDB
curl -sI http://localhost:3000/resources | grep -i x-nextjs-cache   # A
curl -sI http://localhost:3001/resources | grep -i x-nextjs-cache   # B
```

```
A: x-nextjs-cache: MISS     <- A merender, lalu menulis ke Redis
B: x-nextjs-cache: HIT      <- B MENYAJIKAN HALAMAN YANG TIDAK PERNAH IA RENDER
```

`HIT` di instance B adalah inti seluruh cache handler ini. Tanpa Redis, B akan
`MISS` juga dan merender ulang halaman yang sama.

Dampaknya terukur:

| Halaman | A (render, MISS) | B (dari Redis, HIT) |
|---|---|---|
| `/resources` | 10,7 ms | 3,4 ms |
| `/dashboard` | 9,6 ms | 4,0 ms |
| `/journal` | 8,2 ms | 3,0 ms |

#### b. Kuota rate limit dibagi — bukti kebocoran tertutup

Kuota chat 30/menit. Kirim **20 ke A**, lalu **15 ke B** (total 35):

```
A (3000): 20 request -> 200=20  429=0     penghitung Redis: 20
B (3001): 15 request -> 200=10  429=5     penghitung Redis: 35
Total lolos = 30
```

Instance B diblokir setelah 10 request **walaupun B sendiri belum mendekati 30** —
karena jatahnya sudah dipakai A. Dengan `Map` di memori, totalnya akan 35: setiap
instance memberi kuota penuh sendiri-sendiri, dan batasnya bocor sebanyak jumlah
instance.

#### c. Cache dan kuota selamat dari deploy

```
sebelum restart : penghitung 32, key ISR 19
matikan instance A, hidupkan lagi
setelah restart : request pertama -> HTTP 429   (kuota tidak ter-reset)
                  key ISR 19                    (cache tidak hilang)
```

Log startup memastikan kedua bagian aktif:

```
[CacheHandler] Redis tersambung.
[Instrumentation] cache awal terdaftar ke Redis.
```

### 10.6 Gerbang kualitas

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # seluruh suite keamanan & klinis
npm run build       # build produksi
```

---

## 11. Troubleshooting

| Gejala | Sebab | Perbaikan |
|---|---|---|
| `Module not found: Can't resolve 'stream'` | webpack ikut mem-bundle `redis` untuk Edge/browser lewat `instrumentation.ts` | Pakai specifier dalam variabel + `webpackIgnore` (§6). Penjaga runtime dan pemisahan file saja tidak cukup |
| `UnhandledSchemeError: ... "node:path"` | Modul inti Node diimpor di file yang ikut di-bundle | Rakit path dengan template string, jangan impor `node:path`/`node:url` (§6) |
| `TS1375: 'await' expressions are only allowed...` | File tanpa `import`/`export` dianggap script, bukan module | Ekspor fungsi alih-alih memakai top-level `await` (§6) |
| Perbaikan bundler "berhasil" lalu error lagi | Sisa cache di `.next` | Selalu `rm -rf apps/web/.next` sebelum menguji perbaikan bundler |
| `redis-cli ping` = PONG tapi API bilang "Redis tidak aktif" | `.env.local` ada di root repo, bukan di `apps/web/` | Pindahkan ke `apps/web/.env.local` lalu restart dev server (§5) |
| `The client is closed` terus-menerus setelah Redis restart | Client mati dipakai ulang; patokan sehat memakai `isOpen`, bukan `isReady` | Buang client yang `!isReady` lalu buat baru (§9.8) |
| `ECONNREFUSED 127.0.0.1:6379` | Server Redis mati | `brew services start redis` atau jalankan container Docker |
| Redis kosong saat `npm run dev` | **Normal.** `cacheHandler` hanya aktif di produksi | Uji dengan `npm run build && npm start` |
| `Cannot find package '@/lib'` | Alias `@/` dipakai di file yang diimpor test | Ganti ke impor relatif `../redis.ts` (§9.7) |
| Semua request kena 429 | Lupa `await` pada `isRateLimited()` | Tambahkan `await` (§9.6) |
| Data cache aneh setelah upgrade Next | Format cache Next 14 dan 15 **tidak kompatibel** | `redis-cli FLUSHDB` lalu build ulang |
| `MODULE_TYPELESS_PACKAGE_JSON` warning | Node mem-parse ulang `.ts` sebagai ESM | Kosmetik saja, aman diabaikan |
| Halaman basi meski sudah revalidate | `cacheMaxMemorySize` tidak 0 | Set `cacheMaxMemorySize: 0` di `next.config.js` |

### Menghapus cache dengan aman

```bash
redis-cli --scan --pattern 'dengarin:next:*' | xargs -r redis-cli DEL   # cache halaman saja
redis-cli --scan --pattern 'dengarin:ai:*'   | xargs -r redis-cli DEL   # cache AI saja
redis-cli FLUSHDB                                                        # SEMUA — hati-hati
```

---

## 12. Deploy ke produksi

### Checklist

- [ ] `REDIS_URL` diisi di environment produksi, memakai skema **`rediss://`** (TLS).
- [ ] Password Redis kuat dan **tidak pernah** masuk ke git.
- [ ] Redis punya batas memori dan kebijakan eviction:
      `maxmemory 256mb`, `maxmemory-policy allkeys-lru`.
- [ ] Setelah upgrade Next.js mayor, **flush** cache lama (format bisa berubah).
- [ ] Redis **tidak** terekspos ke internet publik tanpa autentikasi.

### Catatan kapasitas

Cache AI memakai TTL **1 jam** dan cache halaman mengikuti nilai `revalidate` masing-masing halaman. Dengan `allkeys-lru`, Redis membuang entri terlama saat memori penuh — jadi batas memori yang kekecilan hanya menurunkan hit rate, **tidak** merusak aplikasi.

### Yang TIDAK boleh masuk Redis

Sesuai `docs/SAFETY.md`:

- ❌ Teks curhat mentah pengguna (hanya hash SHA-256 — §8)
- ❌ Frasa pemulihan atau kunci enkripsi
- ❌ Apa pun yang menautkan session ID ke isi percakapan

---

## Referensi

- Dokumentasi neshca (masih relevan): <https://caching-tools.github.io/next-shared-cache>
- Fork Forte Digital: <https://github.com/fortedigital/nextjs-cache-handler>
- Client Redis untuk Node.js: <https://github.com/redis/node-redis>
- Next.js `cacheHandler`: <https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath>
- Dokumen terkait: `docs/SAFETY.md`, `docs/M01_RATE_LIMITING.md`, `docs/AI_POLICY.md`
