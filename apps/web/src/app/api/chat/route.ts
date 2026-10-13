import type { NextRequest } from 'next/server';
import { acquireSharedChatSlot, acquireSharedTtsSlot, isRateLimited } from '@/lib/api/rateLimit';
import { CHAT_MAX_BYTES, readJsonLimited } from '@/lib/api/requestLimits';
import { jsonError, jsonOk } from '@/lib/api/response';
import { CHAT_INVALID, handleChatRequest } from '@/lib/api/chatHandler';
import { createGeminiTtsProvider } from '@/lib/api/geminiTts';

/**
 * POST /api/chat
 * Thin HTTP wrapper around handleChatRequest (lib/api/chatHandler.ts), which
 * owns the pipeline: bounded input -> deterministic crisis gate (Step 0) ->
 * AI quota -> optional opt-in cache -> AI orchestrator within a turn budget ->
 * whitelist-validated action (+ deterministic support pathway for `high`).
 * Mirrors docs/AI_POLICY.md and docs/SAFETY.md.
 */
export async function POST(request: NextRequest) {
  const parsed = await readJsonLimited(request, CHAT_MAX_BYTES);
  if (!parsed.ok) return jsonError(CHAT_INVALID, parsed.status);

  const outcome = await handleChatRequest(parsed.value, {
    isRateLimited: () => isRateLimited('chat', request),
    acquireSlot: () => acquireSharedChatSlot(),
    synthesizeRoomAudio: async (displayText) => {
      if (await isRateLimited('room-tts', request)) return undefined;
      const releaseTts = await acquireSharedTtsSlot();
      if (!releaseTts) return undefined;
      try {
        const tts = await createGeminiTtsProvider().synthesizeValidatedText(displayText, request.signal);
        return tts.ok ? { data: tts.data, mimeType: tts.mimeType } : undefined;
      } finally {
        releaseTts();
      }
    }
  });

  return outcome.ok ? jsonOk(outcome.data) : jsonError(outcome.error, outcome.status);
}
