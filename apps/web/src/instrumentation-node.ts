/**
 * Kode instrumentation khusus runtime Node.js.
 *
 * MASALAH YANG DIPECAHKAN DI SINI:
 * webpack menganalisis impor saat BUILD. Menaruh `import('redis')` di balik
 * cabang `if (NEXT_RUNTIME === 'nodejs')` TIDAK menolong, karena penjaga itu
 * baru berjalan saat RUNTIME — webpack tetap mengikuti impornya dan mencoba
 * mem-bundle client Redis untuk runtime Edge/browser yang tidak punya modul
 * inti Node, lalu gagal dengan:
 *   Module not found: Can't resolve 'stream'
 *
 * Memisahkan file pun tidak cukup: webpack ikut menelusuri dynamic import
 * antar-file selama specifier-nya berupa string literal.
 *
 * Solusinya dua-duanya sekaligus:
 *   1. specifier disimpan di VARIABEL, jadi webpack tidak bisa menebak
 *      targetnya saat build;
 *   2. penanda `webpackIgnore` memerintahkan webpack membiarkan impor ini
 *      apa adanya, supaya Node.js yang meresolusinya sendiri saat runtime.
 */

/**
 * `registerInitialCache` menyalin hasil build (halaman statis, hasil fetch)
 * ke Redis. Tanpa ini, instance baru menyajikan cache kosong dan pengguna
 * pertama setelah deploy menanggung render penuh setiap halaman.
 */
export async function registerNodeInstrumentation(): Promise<void> {
  if (process.env.NODE_ENV !== 'production' || !process.env.REDIS_URL) return;

  // URL dirakit dengan template string, BUKAN lewat 'node:path'/'node:url'.
  // Mengimpor modul inti Node pun ikut ditelusuri webpack dan gagal dengan
  // "UnhandledSchemeError: Reading from 'node:path' is not handled by plugins".
  //
  // cwd berbeda tergantung cara server dijalankan:
  //   npm start --workspace=apps/web  -> cwd = <repo>/apps/web
  //   npx next start apps/web         -> cwd = <repo>
  // Jadi kedua kemungkinan dicoba, bukan diasumsikan salah satu.
  const candidates = [
    `file://${process.cwd()}/cache-handler.mjs`,
    `file://${process.cwd()}/apps/web/cache-handler.mjs`
  ];
  const instrumentationSpecifier = '@fortedigital/nextjs-cache-handler/instrumentation';

  try {
    const { registerInitialCache } = await import(/* webpackIgnore: true */ instrumentationSpecifier);

    let CacheHandler: unknown;
    for (const url of candidates) {
      try {
        CacheHandler = (await import(/* webpackIgnore: true */ url)).default;
        break;
      } catch {
        // Coba kandidat berikutnya.
      }
    }

    if (!CacheHandler) {
      console.warn('[Instrumentation] cache-handler.mjs tidak ditemukan di:', candidates.join(', '));
      return;
    }

    await registerInitialCache(CacheHandler, {
      // Jangan menimpa entri yang sudah ditulis instance lain saat runtime.
      setOnlyIfNotExists: true
    });
    console.info('[Instrumentation] cache awal terdaftar ke Redis.');
  } catch (error) {
    // Optimasi warm-up gagal tidak boleh menggagalkan start server.
    console.warn(
      '[Instrumentation] melewati pendaftaran cache awal:',
      error instanceof Error ? error.message : error
    );
  }
}
