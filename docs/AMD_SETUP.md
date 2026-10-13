# Setup Endpoint AMD untuk Dengar.in CareBridge

Task: [AMD-02](AMD_TRACK2_TASKS.md) · Adapter: `services/orchestrator/src/providers/amdProvider.ts` · Arsitektur: [CAREBRIDGE_ARCHITECTURE.md](CAREBRIDGE_ARCHITECTURE.md)

Ditulis 13–14 Oktober 2026. **Belum ada endpoint AMD yang dikonfigurasi di repo ini; semua test AI memakai server tiruan.** Dokumen ini adalah panduan yang harus dijalankan tim AI/AMD, bukan laporan bahwa langkah-langkahnya sudah berhasil. Diperbarui 14 Oktober 2026 dengan temuan AMD Token Factory (§9).

Legenda:
- **TERVERIFIKASI** — dibaca langsung dari sumber resmi pada tanggal yang dicantumkan.
- **PERLU CEK PORTAL** — hanya bisa dipastikan setelah login ke portal AMD/lablab atau dari pengumuman penyelenggara. Jangan dianggap benar sebelum dicek.
- **KODE** — perilaku yang ditentukan kode repo ini.

## 0. Pilihan jalur infrastruktur

Adapter `createAmdProvider` hanya butuh **endpoint OpenAI-compatible** (`GET /v1/models`, `POST /v1/chat/completions`) plus Bearer key opsional. Ada dua jalur yang memenuhi syarat "meaningful part of the workload on AMD infrastructure":

| Jalur | Deskripsi | Status |
|---|---|---|
| **A. VM AMD Developer Cloud + vLLM sendiri** (jalur yang didesain adapter dan dijelaskan di dokumen ini) | Sewa instance Instinct MI300X, jalankan vLLM ROCm di Docker pada loopback, akses lewat SSH tunnel | Memakai kredit; trace sepenuhnya milik tim; juga prasyarat partner prize Evolus (opsional) |
| **B. AMD Token Factory** | Gateway inferensi terkelola AMD. FAQ halaman event: "The event is hosted on notebooks.amd.com/tokenfactory. There is no billing or credit card info needed." dan "Developers dont need the $100 credit to participate in the event. Just the api from the tokenfactory." (TERVERIFIKASI 14 Okt 2026). Portal event ada di balik login AMD AI Developer Program; base URL, model, dan format key untuk event ini **belum terlihat** | Lihat **§9**. Bentuk API (OpenAI-compatible, `/v1/chat/completions`, Bearer) cocok dengan `createAmdProvider` tanpa ubah kode, tetapi nilai pastinya PERLU CEK PORTAL |

Rekomendasi (diperbarui 14 Okt 2026): coba **Jalur B dulu** karena tidak menunggu approval kredit dan tidak ada VM yang harus di-destroy; jalur A tetap cadangan dan tetap wajib bila tim mengejar partner prize Evolus. Apa pun jalurnya, jalankan probe (§6). Keduanya menghasilkan `provenance.isAmd: true` hanya jika melewati `createAmdProvider`.

## 1. Klaim kredit AMD Developer Program (ADP)

1. Semua anggota tim wajib terdaftar di **AMD AI Developer Program**; ini syarat approval peserta hackathon (TERVERIFIKASI, halaman event lablab 13 Okt 2026).
2. Halaman event mengiklankan "Free $100 AMD credits for new members" (TERVERIFIKASI). Kredit ini **tidak wajib** untuk ikut event bila memakai Token Factory (FAQ halaman event, TERVERIFIKASI 14 Okt 2026; lihat §9). Langkah klaim di bawah hanya relevan untuk jalur A. Cara klaim: lewat menu Member Perks di akun ADP, lalu tunggu approval. Kit riset tim mencatat approval ±2–3 hari kerja — **PERLU CEK PORTAL**.
3. **Kedaluwarsa kredit:** kit riset tim (dari pengumuman AMD 22 Jun 2026) mencatat kredit hangus **30 hari setelah aktivasi**. **PERLU CEK PORTAL**: lihat tanggal kedaluwarsa persis di halaman billing setelah kredit aktif, dan tulis tanggalnya di tabel status AMD-01.
4. Catat siapa pemilik akun yang memegang kredit; kredensial VM dan API key tidak boleh dibagikan lewat chat grup, hanya lewat secret manager/`.env.local` masing-masing.

Halaman amd.com untuk Developer Cloud dan Developer Program **tidak berhasil dimuat** (timeout) saat penulisan dokumen ini, jadi detail klaim di atas belum diverifikasi ulang terhadap halaman resminya.

## 2. Buat VM MI300X di AMD Developer Cloud

Konsol: https://devcloud.amd.com/ (alamat lama https://amd.digitalocean.com/ dialihkan ke sana; TERVERIFIKASI 13 Okt 2026, halaman memuat tetapi isinya dirender JavaScript sehingga langkah di bawah **PERLU CEK PORTAL**).

1. Login dengan akun ADP yang kreditnya sudah aktif.
2. Buat GPU Droplet/instance: pilih **AMD Instinct MI300X** (1 GPU cukup untuk model 7–8B dalam fp16/bf16). Pilih image yang sudah berisi ROCm + Docker bila tersedia.
3. Tambahkan **SSH public key** tim pada saat pembuatan. Jangan aktifkan password login.
4. Catat IP publik instance. Jangan buka port 8000 ke publik; semua akses lewat SSH tunnel (§4).
5. Setelah login SSH, verifikasi GPU dan Docker:

```bash
rocm-smi                      # harus menampilkan MI300X
docker --version
ls -l /dev/kfd /dev/dri        # device node yang akan diteruskan ke container
```

**Peringatan biaya (PERLU CEK PORTAL untuk angka persisnya):**
- Instance ditagih per jam **selama ada**, termasuk saat dimatikan (power off). Kit riset tim mencatat: *mematikan VM tidak menghentikan tagihan; instance harus di-destroy*. Destroy instance setiap selesai sesi kerja/demo.
- Simpan perintah dan model di script agar instance bisa dibuat ulang dalam hitungan menit (unduhan model ±15 GB untuk 7–8B bf16; pertimbangkan volume/snapshot bila portal menyediakan).
- Kredit kedaluwarsa (§1 butir 3) berjalan terus walau instance tidak ada.

## 3. Jalankan vLLM ROCm via Docker pada loopback

Dua keluarga image yang terverifikasi 13 Okt 2026:

- **Image resmi vLLM**: `vllm/vllm-openai-rocm:latest` (atau `:nightly`). Dokumentasi vLLM menyatakan image AMD `rocm/vllm` dan `rocm/vllm-dev` "deprecated in favor of the official vLLM Docker images". Image ini langsung menjalankan server OpenAI-compatible; argumen setelah nama image diteruskan ke server. Sumber: https://docs.vllm.ai/en/latest/getting_started/installation/gpu.html (bagian ROCm).
- **Image AMD di ROCm docs**: mis. `rocm/vllm:rocm10.1.0_ubuntu24.04_py3.14-pytorch_2.13.0_vllm-0.29.0` (varian `cdna` untuk Instinct). Container ini dibuka dengan `bash`, lalu server dijalankan manual dengan `vllm serve`. Sumber: https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html.

Kedua sumber resmi saling berbeda soal image mana yang "disarankan"; pilih yang berhasil memuat model di instance kalian dan catat tag persisnya untuk README.

Contoh dengan image resmi vLLM, **hanya mendengar di loopback host** (`-p 127.0.0.1:8000:8000`, bukan `-p 8000:8000`), dengan API key:

```bash
export HF_TOKEN=...                       # hanya jika model gated di Hugging Face
export AMD_VLLM_KEY="$(openssl rand -hex 24)"   # simpan; ini nilai AMD_API_KEY nanti

docker run -d --name dengarin-vllm \
  --group-add=video \
  --cap-add=SYS_PTRACE \
  --security-opt seccomp=unconfined \
  --device /dev/kfd \
  --device /dev/dri \
  --ipc=host \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  --env "HF_TOKEN=$HF_TOKEN" \
  -p 127.0.0.1:8000:8000 \
  vllm/vllm-openai-rocm:latest \
  --model Qwen/Qwen2.5-7B-Instruct \
  --host 0.0.0.0 --port 8000 \
  --api-key "$AMD_VLLM_KEY" \
  --max-model-len 8192 \
  --dtype auto

docker logs -f dengarin-vllm     # tunggu sampai "Application startup complete"
```

Catatan:
- `--host 0.0.0.0` di sini adalah alamat **di dalam container**; publikasinya ke host dibatasi `127.0.0.1` oleh flag `-p`. Jika memakai `--network=host` (seperti contoh ROCm docs), ganti menjadi `--host 127.0.0.1`.
- Flag `--api-key`, `--host`, `--port`, `--max-model-len`, `--dtype` terverifikasi ada di referensi CLI vLLM (https://docs.vllm.ai/en/latest/cli/serve/, 13 Okt 2026). `--api-key` hanya melindungi path `/v1`, `/v2`, `/inference`.
- Model `Qwen/Qwen2.5-7B-Instruct` hanya contoh (nama yang sama dipakai di test tiruan adapter). Tim bebas memilih model open yang lisensinya kompatibel dan berbahasa Indonesia cukup baik; catat pilihan dan lisensinya di README.
- Tes dari dalam VM sebelum tunneling:

```bash
curl -s http://127.0.0.1:8000/v1/models -H "Authorization: Bearer $AMD_VLLM_KEY"
```

## 4. SSH tunnel dari mesin yang menjalankan Dengar.in

Jalankan di laptop/server yang menjalankan `npm run dev` atau deployment Next.js:

```bash
ssh -N -L 8000:127.0.0.1:8000 -i ~/.ssh/<kunci_tim> root@<IP_VM>
# biarkan terminal ini terbuka; tambahkan -o ServerAliveInterval=30 untuk sesi panjang
```

Setelah itu `http://127.0.0.1:8000/v1` di mesin lokal mengarah ke vLLM di VM. Untuk deployment yang di-host (Vercel dsb.), tunnel seperti ini **tidak** tersedia; dua opsi yang perlu dipertimbangkan tim:

1. **Jalankan Next.js di VM yang sama.** `apps/web/Dockerfile` (ada di working tree 14 Okt 2026, belum di-commit, belum pernah di-build di VM) dibangun dari root repo: `docker build -f apps/web/Dockerfile -t dengarin-web .` lalu `docker run --rm -p 3000:3000 --env-file .env.local dengarin-web`. Dengan `--network=host` pada container web, `AMD_BASE_URL=http://127.0.0.1:8000/v1` tetap loopback. Port 3000 lalu dipublikasikan lewat reverse proxy + TLS.
2. **Buka port vLLM lewat reverse proxy + TLS + API key** untuk app yang di-host di tempat lain (bukan loopback lagi; nilai keamanannya berbeda dan harus dicatat di README).

Keputusan ini belum diambil — **PERLU DIPUTUSKAN TIM** sebelum AMD-15.

## 5. Isi variabel lingkungan

Salin dari `.env.example` ke `.env.local` (jangan commit):

```env
AMD_BASE_URL=http://127.0.0.1:8000/v1   # KODE: dengan/tanpa /v1, trailing slash, atau /chat/completions sama-sama dinormalisasi
AMD_API_KEY=<nilai AMD_VLLM_KEY>        # KODE: boleh kosong HANYA jika endpoint loopback tanpa --api-key
AMD_MODEL=Qwen/Qwen2.5-7B-Instruct      # KODE: harus persis seperti id di GET /v1/models
AMD_JSON_MODE=                          # KODE: kosong = mati; isi `true` hanya jika probe melaporkan jsonModeOk: true
AMD_TIMEOUT_MS=12000                    # KODE: batas waktu per panggilan; dibaca pipeline, bawaan 12000
```

Perilaku kode yang relevan (KODE):
- `isConfigured()` benar hanya jika `AMD_BASE_URL` **dan** `AMD_MODEL` terisi. Tanpa keduanya pipeline mengembalikan `PROVIDER_UNAVAILABLE` dengan warning `no_provider_configured`.
- `AMD_JSON_MODE=true` menambahkan `response_format: { type: 'json_object' }` ke request. Dokumentasi vLLM structured outputs (dicek 13 Okt 2026) hanya menampilkan `json_schema`, tidak menyebut `json_object` secara eksplisit, dan backend-nya bergantung pada flag server. Karena itu JSON mode mati secara bawaan dan validator tetap mengekstrak objek JSON dari teks bebas.
- Permintaan memakai `temperature: 0.2`, `max_tokens: 1024`.
- Pesan error yang dikembalikan adapter menyamarkan `Bearer …` dan nilai key, dipotong 300 karakter.

Variabel `DENGARIN_AI_PROVIDER` dan `DENGARIN_DEMO_MODE` yang disebut di development plan **tidak dibaca oleh kode** saat ini; jangan mengandalkannya.

## 6. Jalankan probe kapabilitas (`probeAmdEndpoint`)

Fungsi ini sudah ada dan teruji dengan server tiruan. Ia: (1) `GET /v1/models`, (2) satu chat completion kecil yang diukur waktunya, (3) percobaan `response_format: json_object`. Tidak pernah melempar exception.

Simpan sebagai `scripts/probe-amd.mjs` (belum ada di repo; buat saat AMD-02) atau jalankan dari file sementara:

```js
// scripts/probe-amd.mjs — jalankan dari root repo
import { probeAmdEndpoint } from '../services/orchestrator/src/providers/amdProvider.ts';

const result = await probeAmdEndpoint(); // membaca AMD_BASE_URL, AMD_API_KEY, AMD_MODEL dari env
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 1;
```

```bash
node --experimental-strip-types --env-file=.env.local scripts/probe-amd.mjs
```

Satu baris tanpa file:

```bash
node --experimental-strip-types --env-file=.env.local --input-type=module -e \
  "import { probeAmdEndpoint } from './services/orchestrator/src/providers/amdProvider.ts'; console.log(JSON.stringify(await probeAmdEndpoint(), null, 2));"
```

Diverifikasi 14 Okt 2026 (Node v26.11.1) **tanpa endpoint**: kedua bentuk berjalan dan mengembalikan `{ ok: false, error: "AMD_BASE_URL belum dikonfigurasi" }`, dan dengan URL loopback mati mengembalikan `{ ok: false, error: "GET /models gagal: fetch failed" }`. Peringatan `MODULE_TYPELESS_PACKAGE_JSON` dari Node tidak berbahaya. Belum pernah dijalankan terhadap endpoint AMD sungguhan.

Hasil yang diharapkan saat endpoint hidup:

```json
{ "ok": true, "models": ["Qwen/Qwen2.5-7B-Instruct"], "chatOk": true, "jsonModeOk": true, "latencyMs": 420 }
```

Tindak lanjut:
- `jsonModeOk: true` → boleh set `AMD_JSON_MODE=true`. `false` → biarkan kosong.
- Catat `models`, `latencyMs`, tag image Docker, dan tanggal ke tabel status AMD-02 di [AMD_TRACK2_TASKS.md](AMD_TRACK2_TASKS.md). Ini "trace AMD" pertama yang diminta rubrik.
- Lalu jalankan `npm run test:carebridge` (tetap memakai tiruan; per 14 Okt 2026 harus 237/237) dan ulangi kasus A, B, D, E serta 20 skenario terhadap endpoint nyata sesuai [rubrik §3](CAREBRIDGE_EVAL_RUBRIC.md).

## 7. Daftar tutup sesi (wajib setiap hari)

1. `docker stop dengarin-vllm` (opsional; destroy di langkah 3 menghapusnya juga).
2. Tutup SSH tunnel.
3. **Destroy instance** di konsol devcloud.amd.com. Matikan saja tidak cukup (lihat §2).
4. Cek saldo kredit dan tanggal kedaluwarsa; catat di AMD-01.
5. Pastikan `.env.local` tidak ter-commit: `git status --porcelain | grep -i env` harus kosong.

## 8. Sumber yang dirujuk

| Sumber | URL | Status saat ditulis |
|---|---|---|
| Halaman event lablab (syarat AMD, Token Factory, kredit $100, ADP) | https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii | Dimuat 13 Okt 2026 |
| Panduan submission lablab (batas judul/deskripsi/video) | https://lablab.ai/ai-articles/hackathon-guidelines | Dimuat 13 Okt 2026 |
| Konsol AMD Developer Cloud | https://devcloud.amd.com/ | Dimuat 13 Okt 2026 (isi dirender JS) |
| Halaman AMD Developer Cloud / Developer Program di amd.com | https://www.amd.com/en/developer/resources/cloud-access/amd-developer-cloud.html · https://www.amd.com/en/developer/developer-program.html | **Timeout** 13 Okt 2026; belum terverifikasi |
| vLLM instalasi GPU (bagian ROCm, image `vllm/vllm-openai-rocm`) | https://docs.vllm.ai/en/latest/getting_started/installation/gpu.html | Dimuat 13 Okt 2026 |
| vLLM referensi CLI `vllm serve` | https://docs.vllm.ai/en/latest/cli/serve/ | Dimuat 13 Okt 2026 |
| vLLM online serving (endpoint `/v1/models`, `/v1/chat/completions`) | https://docs.vllm.ai/en/latest/serving/online_serving/ | Dimuat 13 Okt 2026 |
| vLLM structured outputs | https://docs.vllm.ai/en/latest/features/structured_outputs/ | Dimuat 13 Okt 2026 |
| ROCm docs: vLLM inference Docker (image `rocm/vllm:*`) | https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html | Dimuat 13 Okt 2026 |
| Kit riset tim (kredit 30 hari, destroy instance) | `AMD_ACT_III_Team_Research_2026-10-12_TIM_6_ORANG.zip`, file K-13 | Sumber sekunder; PERLU CEK PORTAL |
| Halaman event lablab, FAQ Token Factory (dibaca ulang dari HTML mentah) | https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii | Dimuat 14 Okt 2026 |
| Portal Token Factory event | https://notebooks.amd.com/tokenfactory | Dimuat 14 Okt 2026: hanya halaman login "Sign In - AMD AI Notebooks" |
| Katalog Token Factory (AMD Radeon Cloud, situs China) | https://developer.amd.com.cn/radeon/tokenfactory | Dimuat 14 Okt 2026, dirender JS; nilai akses dimuat setelah login |
| Rangkuman pihak ketiga (bukan AMD) | https://itsfree.ai/provider/amd-radeon/ · https://freeaiapi.org/articles/amd-radeon-cloud-token-factory-free-api · https://github.com/luotianyiismywife/amd-tokenfactory-copilot | Dimuat 14 Okt 2026; sumber sekunder, saling berbeda soal format key |

## 9. AMD Token Factory (Jalur B) — temuan 14 Oktober 2026

Diperiksa 14 Okt 2026 lewat web fetch dan probe HTTP langsung. Tidak ada login ke portal; semua yang ada di balik login **belum terlihat**.

### 9.1 Fakta terverifikasi (dibaca langsung, dengan URL dan tanggal akses 14 Okt 2026)

| # | Fakta | Sumber |
|---|---|---|
| V1 | FAQ event: "1) The event is hosted on notebooks.amd.com/tokenfactory. There is no billing or credit card info needed." dengan tautan ke `https://notebooks.amd.com/tokenfactory` | https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii (HTML mentah) |
| V2 | FAQ event: "2) Developers dont need the $100 credit to participate in the event. Just the api from the tokenfactory." Banner "Free $100 AMD credits for new members!" tetap ada, tetapi kredit **tidak wajib** | sama |
| V3 | Syarat teknologi untuk semua track: "Every project must run a meaningful part of its workload on AMD infrastructure or AMD hardware", daftar opsinya termasuk "Other approved AMD powered infrastructure provided during the event", dan "The AMD component must be part of the working product shown to the judges" | sama |
| V4 | Track 2 tidak punya syarat AMD tambahan. Syarat "serve your own model with vLLM on AMD Developer Cloud" hanya untuk partner prize Evolus | sama |
| V5 | `https://notebooks.amd.com/tokenfactory` = halaman "Sign In - AMD AI Notebooks" ("Sign in to access GPU-powered Jupyter notebooks") dengan satu tombol "Sign in with AMD AI Developer Program" (`/auth/saml/login?next=/tokenfactory`) | URL tersebut |
| V6 | Path API tebakan di host itu (`/tokenfactory/v1/models`, `/v1/models`, `/tokenfactory/v1/chat/completions`, `/api/v1/models`) menjawab `{"detail":"Not Found"}`. Jadi base URL API event **bukan** salah satu path itu, atau baru muncul setelah login | probe langsung |
| V7 | Ada katalog "Token Factory (model gateway catalog)" berlabel BETA di situs AMD Radeon Cloud China; kartu model menyebut mis. "OpenAI-compatible API served with vLLM on AMD Radeon PRO W7900". Panel API menampilkan `base_url`, `model`, `api_key` yang dimuat setelah login | https://developer.amd.com.cn/radeon/tokenfactory |
| V8 | `GET https://developer.amd.com.cn/radeon/api/v1/models` → 401 `{"detail":"Login required"}`; `POST .../radeon/api/v1/chat/completions` dengan key palsu → 404 bergaya OpenAI (`"type":"invalid_request_error","code":"model_not_found"`). Path `/v1/chat/completions` di gateway itu ada dan berperilaku OpenAI-compatible | probe langsung |
| V9 | Tidak ditemukan dokumentasi resmi berbahasa Inggris di amd.com / ROCm docs yang menjelaskan Token Factory | pencarian web |

### 9.2 Belum terverifikasi / asumsi (JANGAN dianggap benar sebelum dicek di portal)

| # | Asumsi | Dasar |
|---|---|---|
| A1 | Setelah login, portal event menampilkan base URL, model id, dan API key yang bisa dipakai dari server kita | V2 ("Just the api from the tokenfactory") + V7; belum dilihat |
| A2 | Base URL event sama dengan gateway China `https://developer.amd.com.cn/radeon/api/v1` | Hanya sumber pihak ketiga; **tidak** terkonfirmasi untuk notebooks.amd.com |
| A3 | Model yang tersedia mis. `DeepSeek-V4-Flash-0731`, `Qwen3.8-Flash-Next`, `MiniCPM5-1B` | Hanya sumber pihak ketiga untuk gateway China |
| A4 | Kuota gratis harian (~US$10/hari, reset harian), 429 saat kuota habis | Hanya sumber pihak ketiga |
| A5 | Format key (`sk-…` vs `rc-…`) | Sumber pihak ketiga saling bertentangan |
| A6 | Inferensi lewat Token Factory memenuhi syarat "meaningful part of its workload on AMD infrastructure" (V3) | Interpretasi tim: gateway itu disediakan event ("Other approved AMD powered infrastructure provided during the event"). Konfirmasi ke penyelenggara bila ragu |
| A7 | `response_format: json_object` didukung | Tidak diketahui; biarkan `AMD_JSON_MODE` kosong sampai probe melaporkan `jsonModeOk: true` |

### 9.3 Kecocokan dengan adapter (KODE)

`createAmdProvider` (`services/orchestrator/src/providers/amdProvider.ts`) hanya butuh: `GET {AMD_BASE_URL}/models` (untuk probe), `POST {AMD_BASE_URL}/chat/completions` dengan body OpenAI (`model`, `messages`, `temperature`, `max_tokens`), header `Authorization: Bearer <AMD_API_KEY>`, dan balasan `choices[0].message.content`. `AMD_BASE_URL` dinormalisasi agar berakhir di `/v1`; base yang sudah berakhir `/v1` (mis. `.../radeon/api/v1`) dipakai apa adanya. Bila V8 berlaku juga untuk endpoint event, **tidak perlu perubahan kode**. Yang membedakan dari jalur A hanyalah lokasinya: bukan loopback/SSH tunnel, melainkan HTTPS publik ke layanan terkelola AMD.

### 9.4 Langkah (untuk anggota tim yang punya akun AMD AI Developer Program)

1. Login di https://notebooks.amd.com/tokenfactory dengan akun AMD AI Developer Program (syarat peserta, AMD-01 §2).
2. Cari bagian API/Token Factory; salin **base URL**, **model id**, dan **API key** persis seperti yang ditampilkan. Catat juga batas kuota/rate limit dan wilayah layanan bila disebutkan. Jangan bagikan key lewat chat grup.
3. Isi `.env.local` (jangan commit):

```env
AMD_BASE_URL=<base URL dari portal, mis. https://…/v1>
AMD_API_KEY=<key dari portal>
AMD_MODEL=<model id persis seperti di GET {base}/models>
AMD_JSON_MODE=
AMD_TIMEOUT_MS=12000
```

4. Cek cepat dengan curl (tanpa mencetak key ke log bersama):

```bash
curl -s "$AMD_BASE_URL/models" -H "Authorization: Bearer $AMD_API_KEY"
```

5. Jalankan probe §6 (`probeAmdEndpoint`). Isi `AMD_JSON_MODE=true` hanya jika `jsonModeOk: true`. Bila `latencyMs` mendekati `AMD_TIMEOUT_MS`, naikkan timeout atau pilih model yang lebih kecil.
6. Catat hasil (models, latensi, tanggal, base URL tanpa key) di tabel status AMD-02 dan perbarui §9.1/§9.2 dokumen ini: pindahkan asumsi yang sudah terbukti ke tabel terverifikasi.
7. Jalankan kasus A, B, D, E dan 20 skenario rubrik §3 terhadap endpoint ini.

### 9.5 Pertimbangan sebelum dipakai untuk data pengguna

- Dengan jalur B, teks **tersanitasi** (setelah redaksi PII) dikirim ke layanan pihak AMD, bukan ke VM milik tim. Klaim "tidak ada pihak ketiga di antara server dan model" di [CAREBRIDGE_ARCHITECTURE.md](CAREBRIDGE_ARCHITECTURE.md) §5 hanya berlaku untuk jalur A. Teks consent CareBridge perlu menyebut ini.
- Bila base URL ternyata gateway China (A2), ada implikasi transfer data lintas negara (UU PDP No. 27/2022). Untuk demo, tetap gunakan data **100% sintetis** (AMD-01 §4).
- Kebijakan retensi/pelatihan data Token Factory **belum diketahui**; cari di portal setelah login.

