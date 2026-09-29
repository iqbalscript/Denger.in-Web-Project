# M-01 anonymous abuse controls

The application has no verified client IP or trusted proxy configuration in its
server runtime. `sessionId` is client generated, and `x-forwarded-for` can be
supplied by a caller. Neither is used as a rate-limit identity. The trusted
identity for current quotas is the server-selected route name. All anonymous
clients on one server process share each route quota.

The fixed-window limiter expires entries after 60 seconds and caps its map at
32 live keys. It fails closed if that capacity is reached. It is process-local:
quotas and the four-call chat concurrency cap are not shared between instances
and reset on restart. A caller can exhaust a route quota for other users. The
chat quota applies to AI work after bounded parsing and deterministic crisis
screening, so a valid crisis request still receives local guidance when the AI
quota is exhausted. Other public operations can return 429 during abuse.

Limits:

| Route | Requests per process per minute | Request bytes |
| --- | ---: | ---: |
| Chat | 30 AI-eligible requests | 32 KiB |
| Admin login | 20 | 4 KiB |
| Forum post | 60 | 8 KiB |
| Forum support | 120 | no JSON body parsed |
| Weekly report | 120 | 64 KiB |
| Sync GET | 120 | no JSON body parsed |
| Sync PUT | 60 | 4 MiB |

Chat additionally allows 2,000 characters in the current message, 12 history
entries, 2,000 characters per entry, and 12,000 total history characters.
Oversized requests are rejected as a whole; no uninspected suffix is forwarded
to a provider. Weekly reports allow at most 500 check-ins and 500 missions.

For multi-instance production and fair per-client quotas, configure a trusted
edge that strips incoming forwarding headers, establishes a verified client
identity, and applies a shared distributed limiter. Keep a global cost ceiling
and concurrency cap. Do not enable per-IP quotas from raw forwarding headers.

## Kuota per-klien + pagar global (2026-09-29)

Model di atas punya cacat: satu pemanggil yang menghabiskan kuota rute membuat
semua orang kena 429. Sekarang tiap rute punya **dua lapis** (lihat
`RATE_QUOTAS` di `apps/web/src/lib/api/rateLimit.ts`):

| Lapis | Kunci Redis | Fungsi |
| --- | --- | --- |
| Klien | `dengarin:ratelimit:client:<rute>:<hmac-ip>` | Jatah satu klien per menit (`limit`, angka lama). |
| Global | `dengarin:ratelimit:global:<rute>` | Pagar biaya untuk semua klien (`ceiling`, umumnya 10×). |

- Permintaan yang **ditolak lapis klien tidak dihitung ke global**, jadi klien
  yang sudah diblokir tidak bisa menguras jatah orang lain.
- Kedua lapis dijalankan satu **skrip Lua atomik**; jendela dimulai dari
  permintaan pertama (TTL), bukan jam dinding, sehingga jam antar-instance yang
  tidak sinkron tidak memengaruhi dan tidak ada lonjakan 2× di pergantian menit.
- `admin-login` memakai `ceiling = limit`: brute force dibatasi global apa pun
  identitas kliennya. `room-tts` (Gemini, berbayar) ber-ceiling kecil (40).

**Identitas klien itu opt-in.** Header `X-Forwarded-For` tetap tidak dipercaya
kecuali operator mengisi `TRUSTED_PROXY_HOPS` (jumlah proxy tepercaya, 1–5) dan
`RATE_LIMIT_HASH_SECRET` (≥16 karakter). Aplikasi lalu memakai entri ke-N dari
**kanan** (yang ditulis proxy terdekat), memotong IPv6 ke /64, dan menyimpan
hanya `HMAC-SHA256(secret, ip)` 128-bit dengan TTL 60 detik. IP mentah tidak
pernah ditulis ke Redis atau log. Tanpa konfigurasi, semua klien jatuh ke satu
bucket `anon` per rute dengan angka lama, persis perilaku M01 semula.

Bila konfigurasi salah (mis. origin bisa diakses langsung), pemanggil hanya bisa
mengganti bucket kliennya, tidak pernah melewati `ceiling` global.

Ketika Redis mati/lambat (>1 dtk), `isRateLimited` jatuh ke penghitung memori
(kuota klien di tabel 2.048 entri, ceiling per rute di tabel lama). Bila tabel
klien penuh, klien baru tidak ditolak; hanya ceiling yang berlaku. `getRedis()`
juga menunda percobaan sambung ulang 2 detik setelah gagal supaya Redis yang
mati tidak membuat setiap request menunggu satu putaran reconnect (~1 dtk).

## Deployment review (2026-09-20)

The actual **web application production host is unverified**. This repository
has no deployment manifest, reverse-proxy/CDN configuration, CI workflow, or
documented production URL. Its GitHub repository has no public deployment
records, no homepage, and no Actions workflows; the connected Sites account
lists no Site. None of these observations rules out a deployment managed in
another account or outside GitHub. In particular, an active Supabase project
establishes the database deployment, not where Next.js requests terminate.

The connected `Dengerin` Supabase PostgreSQL project is healthy on an
organization with a Free plan. The repository has `DATABASE_URL` configuration
and a `pg` pool, but no configured Redis/Upstash service, client, or environment
variable, and the database has no application rate/quota/limiter table. The
`[auth.rate_limit]` settings in `supabase/config.toml` govern Supabase Auth
endpoints, not these Next.js `/api/*` routes. There is no verified client IP
available to the application in the inspected configuration. The anonymous
session ID and incoming forwarding headers remain untrusted.

**M-01 deployment status: partially fixed, known limitation.** Per-process
route-wide quotas and request/concurrency bounds constrain some local cost,
but multiple server instances do not coordinate and one client can exhaust
ordinary chat, admin login, forum, or backup capacity for others. Crisis
guidance runs before the chat AI quota. No claim of per-client or distributed
limiting is made.

### Safest production path once the web host is identified

1. Confirm the canonical production URL, hosting account/project, full ingress
   chain, origin access controls, instance model, and whether native edge rate
   rules cover all API paths. Test both direct-origin access and a client-sent
   spoofed forwarding header. Do not accept a header until the last trusted
   proxy strips/overwrites inbound copies and direct origin bypass is blocked.
2. Prefer the host/CDN's native shared edge limiter if available. Apply distinct
   policies to AI calls, admin login, forum writes/support, sync, and report
   work. Keep bounded payloads and a global provider-cost/concurrency ceiling;
   allow bounded deterministic crisis guidance during AI quota exhaustion.
   Treat verified network IP as an abuse signal, not as a user account: shared
   NAT and address changes require careful thresholds and monitoring.
3. If the verified host lacks such a service, evaluate a shared limiter with
   atomic counters, expiry, bounded cardinality, and explicit failure behavior
   after measuring traffic and deployment scale. No external store is assumed
   or provisioned by this review.

Supabase PostgreSQL could implement atomic counters with expiry, but every
anonymous request would then spend a database transaction before reaching the
existing workload. A global row creates contention; per-IP rows create
cardinality/cleanup pressure; pool exhaustion could also block recovery and
forum operations. On the current Free database, it is **not established as a
safe default** without a trusted identity, load testing, connection-budget
analysis, cleanup, and failure-mode design. Database pooling does not itself
provide API rate limiting.
