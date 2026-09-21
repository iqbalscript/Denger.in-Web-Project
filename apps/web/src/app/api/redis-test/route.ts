import { getRedis, REDIS_PREFIX } from '@/lib/redis';
import { jsonError, jsonOk } from '@/lib/api/response';

/**
 * GET /api/redis-test
 * Endpoint diagnostik: membuktikan koneksi Redis hidup dengan satu tulis-baca
 * pulang-pergi. Tidak menyentuh data pengguna dan key-nya kedaluwarsa sendiri.
 */

// Client `redis` memakai socket TCP Node.js, jadi route ini tidak bisa
// berjalan di Edge runtime.
export const runtime = 'nodejs';
// Tanpa ini Next.js bisa membekukan hasilnya saat build dan selalu
// mengembalikan jawaban lama.
export const dynamic = 'force-dynamic';

export async function GET() {
  const redis = await getRedis();
  if (!redis) {
    return jsonError('Redis tidak aktif. Isi REDIS_URL lalu jalankan ulang server.', 503);
  }

  const key = `${REDIS_PREFIX}healthcheck`;
  const startedAt = Date.now();

  try {
    await redis.set(key, new Date().toISOString(), {
      // Bentuk modern redis v6. Bentuk lama `{ EX: 60 }` sudah deprecated.
      expiration: { type: 'EX', value: 60 }
    });
    const value = await redis.get(key);

    return jsonOk({ connected: true, key, value, latencyMs: Date.now() - startedAt });
  } catch (error) {
    return jsonError(
      `Redis menolak perintah: ${error instanceof Error ? error.message : 'unknown'}`,
      503
    );
  }
}
