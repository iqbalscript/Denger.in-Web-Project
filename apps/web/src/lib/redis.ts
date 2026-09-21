import { createClient } from 'redis';

/**
 * Koneksi Redis bersama untuk runtime Node.js di Next.js.
 *
 * Redis di sini bersifat OPSIONAL: seluruh pemanggil wajib tetap berfungsi
 * ketika REDIS_URL kosong atau servernya tidak bisa dijangkau (dev lokal,
 * demo juri tanpa Docker). Karena itu `getRedis()` mengembalikan `null`
 * alih-alih melempar error, dan pemanggil jatuh ke jalur in-memory miliknya.
 */

/**
 * Tipe client diturunkan dari fungsi pabrik KITA SENDIRI, bukan ditulis manual
 * dan bukan dari `createClient` langsung.
 *
 * Alasannya: `createClient` itu generik. `ReturnType<typeof createClient>`
 * memakai nilai default generiknya, sedangkan `createClient({ url, socket })`
 * menghasilkan generik sempit `RedisClientType<{}, {}, {}, 3, {}>` — kedua tipe
 * itu tidak saling cocok dan TypeScript menolaknya. Dengan membaca tipe dari
 * `createRedisClient`, tipenya selalu persis sama dengan yang benar-benar
 * dikembalikan, berapa pun opsi yang kita tambahkan nanti.
 */
type RedisClient = ReturnType<typeof createRedisClient>;

const REDIS_URL = process.env.REDIS_URL;

/**
 * Dev server Next.js mengevaluasi ulang modul pada tiap hot reload. Tanpa
 * cache di globalThis, setiap reload membuka socket baru sampai Redis
 * kehabisan koneksi.
 */
const globalForRedis = globalThis as typeof globalThis & {
  __dengarinRedisClient?: RedisClient;
  __dengarinRedisPending?: Promise<RedisClient | null>;
};

function createRedisClient() {
  const client = createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: 3_000,
      // Menyerah setelah 3 percobaan, bukan mencoba selamanya: request yang
      // bergantung pada Redis harus gagal cepat, bukan menggantung route.
      reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1_000))
    }
  });

  // Event 'error' tidak punya listener bawaan; bila tidak ditangani, Node.js
  // menganggapnya unhandled dan mematikan proses.
  client.on('error', (error: unknown) => {
    console.error('[Redis] error koneksi:', error instanceof Error ? error.message : error);
  });

  return client;
}

/**
 * Mengembalikan client yang siap pakai, atau `null` bila Redis tidak tersedia.
 * Aman dipanggil berkali-kali dan dari beberapa request sekaligus — percobaan
 * koneksi yang sedang berjalan dipakai ulang, tidak ditumpuk.
 */
export async function getRedis(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null;

  const cached = globalForRedis.__dengarinRedisClient;
  if (cached?.isReady) return cached;
  if (globalForRedis.__dengarinRedisPending) return globalForRedis.__dengarinRedisPending;

  const pending = (async (): Promise<RedisClient | null> => {
    try {
      let client = globalForRedis.__dengarinRedisClient;

      // Setelah `reconnectStrategy` menyerah, client masuk keadaan mati
      // PERMANEN — connect() tidak menghidupkannya kembali dan setiap perintah
      // menjawab "The client is closed". Client mati harus dibuang dan diganti,
      // bukan dipakai ulang; tanpa ini Redis yang restart membuat aplikasi
      // rusak sampai server Next.js ikut direstart.
      //
      // Patokannya `isReady`, BUKAN `isOpen`. Client yang socket-nya sudah
      // mati bisa tetap melaporkan `isOpen === true` sementara perintahnya
      // semua gagal — memakai `isOpen` sebagai patokan membuat client mati
      // lolos dari pembuangan dan aplikasi tidak pernah pulih.
      //
      // Baris di awal fungsi sudah mengembalikan client yang `isReady`, jadi
      // sampai di sini client mana pun memang belum siap pakai.
      if (client && !client.isReady) {
        try {
          client.destroy();
        } catch {
          // Client mungkin sudah dibuang; abaikan.
        }
        client = undefined;
        globalForRedis.__dengarinRedisClient = undefined;
      }

      if (!client) {
        client = createRedisClient();
        globalForRedis.__dengarinRedisClient = client;
      }

      if (!client.isOpen) await client.connect();
      return client;
    } catch (error) {
      console.error(
        '[Redis] gagal terhubung, fallback ke memori:',
        error instanceof Error ? error.message : error
      );
      // Buang client yang rusak supaya percobaan berikutnya membuat yang baru.
      globalForRedis.__dengarinRedisClient = undefined;
      return null;
    } finally {
      globalForRedis.__dengarinRedisPending = undefined;
    }
  })();

  globalForRedis.__dengarinRedisPending = pending;
  return pending;
}

/** Prefiks tunggal untuk semua key milik aplikasi, memudahkan SCAN dan FLUSH selektif. */
export const REDIS_PREFIX = 'dengarin:';
