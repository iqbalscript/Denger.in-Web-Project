import type { NextRequest } from 'next/server';
import { runOrchestrator } from '@dengarin/orchestrator';
import { CLINICAL_DISCLAIMER } from '@dengarin/config';
import type { AgeBracket, InterventionDomain } from '@dengarin/types';
import { runCrisisGate } from '@/lib/api/crisisGate';
import { acquireSharedChatSlot, acquireSharedTtsSlot, isRateLimited } from '@/lib/api/rateLimit';
import { CHAT_MAX_BYTES, chatInputWithinLimits, readJsonLimited } from '@/lib/api/requestLimits';
import { jsonError, jsonOk } from '@/lib/api/response';
import { screenChatContext } from '@/lib/api/chatHistory';
import { aiCacheKey, readAiCache, writeAiCache } from '@/lib/api/aiCache';
import { createGeminiTtsProvider } from '@/lib/api/geminiTts';
import { validatedActionDisplayText } from '@/lib/voiceRoom';

interface ChatRequestBody {
  sessionId?: string;
  message?: string;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
  /** Untrusted UI hint; it enables a post-validation enhancement only. */
  voiceMode?: 'ruang-ngobrol';
  /**
   * Ruang Ngobrol keeps its conversation memory-only. This opt-out is checked
   * only after both deterministic crisis gates; it changes caching, never the
   * safety or provider pipeline.
   */
  noStore?: boolean;
}

/**
 * POST /api/chat
 * Pipeline: bounded input -> deterministic crisis gate (Step 0) -> AI quota -> AI orchestrator
 * (Tier 1 DeepSeek / Tier 2 OpenRouter / Tier 3 deterministic fallback) ->
 * whitelist-validated action. Mirrors docs/AI_POLICY.md and docs/SAFETY.md.
 */
export async function POST(request: NextRequest) {
  const parsed = await readJsonLimited(request, CHAT_MAX_BYTES);
  if (!parsed.ok) return jsonError('Permintaan tidak valid atau terlalu besar.', parsed.status);
  if (!chatInputWithinLimits(parsed.value)) return jsonError('Permintaan tidak valid atau terlalu besar.', 413);
  const body = parsed.value as ChatRequestBody;
  const screened = screenChatContext(body?.message, body?.history, body?.ageBracket);
  if (screened.error) return jsonError(screened.error);
  if (screened.evaluation) return jsonOk({ crisis: true, evaluation: screened.evaluation });
  if (!body || typeof body.message !== 'string' || body.message.trim().length === 0) {
    return jsonError('Properti "message" wajib diisi.');
  }

  // Preserve local crisis guidance even when the shared anonymous AI quota is exhausted.
  if (await isRateLimited('chat', request)) return jsonError('Sedang cukup ramai. Tarik napas dulu, lalu coba lagi sebentar lagi, ya.', 429);

  const { cleared, evaluation } = runCrisisGate(body.message, body.ageBracket);
  if (!cleared) {
    return jsonOk({ crisis: true, evaluation });
  }

  // BATAS KEAMANAN: cache dibaca SETELAH crisis gate, tidak pernah sebelumnya.
  // Gate deterministik itu wajib jalan di setiap request; cache hanya boleh
  // memangkas panggilan LLM, tidak boleh memangkas deteksi krisis.
  const cacheEnabled = body.noStore !== true;
  const cacheKey = cacheEnabled ? aiCacheKey({
    message: body.message,
    history: screened.history,
    ageBracket: body.ageBracket,
    domain: body.domain
  }) : null;

  if (cacheKey) {
    const cached = await readAiCache(cacheKey);
    if (cached) {
      return jsonOk({
        crisis: false,
        tier: cached.tier,
        providerId: cached.providerId,
        action: cached.action,
        disclaimer: CLINICAL_DISCLAIMER,
        warnings: cached.warnings,
        cached: true
      });
    }
  }

  const release = await acquireSharedChatSlot();
  if (!release) return jsonError('Sedang cukup ramai. Tarik napas dulu, lalu coba lagi sebentar lagi, ya.', 429);
  let result: Awaited<ReturnType<typeof runOrchestrator>>;
  try {
    result = await runOrchestrator({
      message: body.message,
      history: screened.history,
      ageBracket: body.ageBracket,
      domain: body.domain
    });
  } finally { release(); }

  if (cacheKey) await writeAiCache(cacheKey, result);

  // This untrusted request flag never authorizes arbitrary text synthesis. It
  // merely asks for an optional enhancement after the canonical orchestrator
  // has returned a validated action. noStore is mandatory for room audio so no
  // response or audio is added to the shared Redis cache.
  const wantsRoomTts = body.voiceMode === 'ruang-ngobrol' && body.noStore === true;
  let roomAudio: { data: string; mimeType: 'audio/wav' } | undefined;
  if (wantsRoomTts) {
    const displayText = validatedActionDisplayText(result.action);
    if (displayText && !(await isRateLimited('room-tts', request))) {
      const releaseTts = await acquireSharedTtsSlot();
      if (releaseTts) {
        try {
          const tts = await createGeminiTtsProvider().synthesizeValidatedText(displayText, request.signal);
          if (tts.ok) roomAudio = { data: tts.data, mimeType: tts.mimeType };
        } finally {
          releaseTts();
        }
      }
    }
  }

  return jsonOk({
    crisis: false,
    tier: result.tier,
    providerId: result.providerId,
    action: result.action,
    disclaimer: CLINICAL_DISCLAIMER,
    warnings: result.warnings,
    cached: false,
    roomAudio
  });
}
