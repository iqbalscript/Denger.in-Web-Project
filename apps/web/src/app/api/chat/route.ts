import type { NextRequest } from 'next/server';
import { runOrchestrator } from '@dengarin/orchestrator';
import { CLINICAL_DISCLAIMER } from '@dengarin/config';
import type { AgeBracket, InterventionDomain } from '@dengarin/types';
import { runCrisisGate } from '@/lib/api/crisisGate';
import { acquireChatSlot, isRateLimited } from '@/lib/api/rateLimit';
import { CHAT_MAX_BYTES, chatInputWithinLimits, readJsonLimited } from '@/lib/api/requestLimits';
import { jsonError, jsonOk } from '@/lib/api/response';
import { screenChatContext } from '@/lib/api/chatHistory';

interface ChatRequestBody {
  sessionId?: string;
  message?: string;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
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
  if (isRateLimited('chat')) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);

  const { cleared, evaluation } = runCrisisGate(body.message, body.ageBracket);
  if (!cleared) {
    return jsonOk({ crisis: true, evaluation });
  }

  const release = acquireChatSlot();
  if (!release) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
  let result: Awaited<ReturnType<typeof runOrchestrator>>;
  try {
    result = await runOrchestrator({
      message: body.message,
      history: screened.history,
      ageBracket: body.ageBracket,
      domain: body.domain
    });
  } finally { release(); }

  return jsonOk({
    crisis: false,
    tier: result.tier,
    providerId: result.providerId,
    action: result.action,
    disclaimer: CLINICAL_DISCLAIMER,
    warnings: result.warnings
  });
}
