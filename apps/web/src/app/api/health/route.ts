import { NextResponse } from 'next/server';
import { getRedis, withTimeout } from '@/lib/redis';

// Status Redis harus dibaca saat request, bukan dibekukan saat build.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RedisStatus = 'disabled' | 'up' | 'down';

async function redisStatus(): Promise<RedisStatus> {
  if (!process.env.REDIS_URL) return 'disabled';
  try {
    const redis = await withTimeout(getRedis(), 1_000);
    if (!redis) return 'down';
    await withTimeout(redis.ping(), 500);
    return 'up';
  } catch {
    return 'down';
  }
}

/**
 * Liveness: selalu 200 selama proses hidup. Redis itu OPSIONAL, jadi Redis mati
 * hanya dilaporkan (`redis: "down"`), tidak membuat instance dianggap tidak sehat.
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: 'dengarin-api', status: 'healthy', redis: await redisStatus() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
