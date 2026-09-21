import { createHash } from 'node:crypto';
import type { AgeBracket, InterventionDomain } from '@dengarin/types';
import type { ChatHistoryEntry, OrchestratorResult } from '@dengarin/orchestrator';
import { getRedis, REDIS_PREFIX } from '../redis.ts';

/**
 * Cache hasil orkestrator AI di Redis.
 *
 * ATURAN PRIVASI (docs/SAFETY.md): Redis TIDAK PERNAH menyimpan teks mentah
 * pengguna. Pesan hanya dipakai untuk menghitung sidik jari SHA-256 yang
 * menjadi nama key — fungsi hash itu satu arah, jadi isi curhat tidak bisa
 * dipulihkan dari key. Yang tersimpan sebagai value hanyalah jawaban AI yang
 * sudah lolos validasi whitelist.
 */

const TTL_SECONDS = 3_600;

interface AiCacheInput {
  message: string;
  history?: ChatHistoryEntry[];
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
}

/** Bagian OrchestratorResult yang aman dan berguna untuk disimpan ulang. */
type CachedResult = Pick<OrchestratorResult, 'tier' | 'providerId' | 'action' | 'warnings'>;

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Seluruh input yang memengaruhi jawaban ikut masuk sidik jari — termasuk
 * riwayat percakapan. Kalau riwayat diabaikan, dua percakapan berbeda dengan
 * kalimat terakhir yang sama akan saling mencuri jawaban.
 */
export function aiCacheKey(input: AiCacheInput): string {
  const history = (input.history ?? []).map((entry) => `${entry.sender}:${normalize(entry.text)}`).join('\n');
  const fingerprint = [
    normalize(input.message),
    history,
    input.ageBracket ?? '-',
    input.domain ?? '-'
  ].join('|');

  return `${REDIS_PREFIX}ai:${createHash('sha256').update(fingerprint).digest('hex')}`;
}

export async function readAiCache(key: string): Promise<CachedResult | null> {
  const redis = await getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (typeof raw !== 'string') return null;
    return JSON.parse(raw) as CachedResult;
  } catch (error) {
    // JSON rusak atau Redis bermasalah tidak boleh menggagalkan chat —
    // anggap saja cache miss dan panggil AI seperti biasa.
    console.error('[AiCache] gagal membaca:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function writeAiCache(key: string, result: OrchestratorResult): Promise<void> {
  // Jawaban tier 'fallback' adalah teks darurat deterministik, bukan hasil AI.
  // Menyimpannya akan mengunci pengguna berikutnya pada jawaban darurat itu
  // selama satu jam meskipun penyedia AI sudah pulih.
  if (result.tier === 'fallback') return;

  const redis = await getRedis();
  if (!redis) return;

  const payload: CachedResult = {
    tier: result.tier,
    providerId: result.providerId,
    action: result.action,
    warnings: result.warnings
  };

  try {
    await redis.set(key, JSON.stringify(payload), {
      expiration: { type: 'EX', value: TTL_SECONDS }
    });
  } catch (error) {
    console.error('[AiCache] gagal menulis:', error instanceof Error ? error.message : error);
  }
}
