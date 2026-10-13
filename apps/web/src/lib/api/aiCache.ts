import { createHash } from 'node:crypto';
import type { AgeBracket, InterventionDomain } from '@dengarin/types';
import type { ChatHistoryEntry, OrchestratorResult } from '@dengarin/orchestrator';
import { getRedis, REDIS_PREFIX } from '../redis.ts';
import type { Language } from '../../i18n/language.ts';

/**
 * Cache hasil orkestrator AI di Redis.
 *
 * ATURAN PRIVASI (docs/SAFETY.md): Redis TIDAK PERNAH menyimpan teks mentah
 * pengguna. Pesan hanya dipakai untuk menghitung sidik jari SHA-256 yang
 * menjadi nama key — fungsi hash itu satu arah, jadi isi curhat tidak bisa
 * dipulihkan dari key. Yang tersimpan sebagai value hanyalah jawaban AI yang
 * sudah lolos validasi whitelist.
 *
 * OPT-IN SAJA (audit H6): jawaban AI lazim mengutip isi curhat, jadi menyimpannya
 * di Redis bersama tetap membawa data sensitif meski key-nya hash. /api/chat
 * hanya memakai cache ini bila `AI_RESPONSE_CACHE=true` diset eksplisit; bawaan
 * mati. Fungsi baca/tulis di bawah sengaja tidak memeriksa flag (dipakai tes
 * integrasi Redis); gerbangnya ada di pemanggil lewat isAiResponseCacheEnabled().
 */

/** Diperpendek dari 1 jam: kalaupun diaktifkan, jejak sensitif cepat kedaluwarsa. */
export const AI_CACHE_TTL_SECONDS = 600;

/** True hanya bila operator mengaktifkan cache dengan `AI_RESPONSE_CACHE=true`. */
export function isAiResponseCacheEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.AI_RESPONSE_CACHE?.trim().toLowerCase() === 'true';
}

interface AiCacheInput {
  message: string;
  history?: ChatHistoryEntry[];
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
  /** Bahasa balasan; jawaban EN dan ID tidak boleh saling tertukar. */
  lang?: Language;
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
    input.domain ?? '-',
    input.lang ?? 'id'
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
  // selama TTL meskipun penyedia AI sudah pulih.
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
      expiration: { type: 'EX', value: AI_CACHE_TTL_SECONDS }
    });
  } catch (error) {
    console.error('[AiCache] gagal menulis:', error instanceof Error ? error.message : error);
  }
}
