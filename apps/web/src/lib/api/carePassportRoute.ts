import type { NextRequest } from 'next/server';
import { acquireSharedChatSlot, isRateLimited } from '@/lib/api/rateLimit';
import { readJsonLimited } from '@/lib/api/requestLimits';
import { jsonError, jsonOk } from '@/lib/api/response';
import { toPublicWarnings } from '@/lib/api/publicWarnings';
import {
  CARE_PASSPORT_MAX_BYTES,
  handleCarePassportRequest,
  type CarePassportMode,
  type CarePassportTelemetry,
} from '@/lib/api/carePassportHandler';

const BUSY = 'Sedang cukup ramai. Tarik napas dulu, lalu coba lagi sebentar lagi, ya.';

/** Metadata only (docs/CAREBRIDGE_SAFETY_POLICY.md §7): never text, never findings' content. */
function logTelemetry(meta: CarePassportTelemetry) {
  console.info('[CarePassport]', JSON.stringify(meta));
}

/**
 * Shared HTTP wrapper for POST /api/care-passport and /api/care-passport/preview.
 * Body is size-bounded before parsing; the AI-bearing mode shares the chat
 * concurrency slot so the AMD endpoint is never flooded from one process.
 */
export async function handleCarePassportHttp(request: NextRequest, forcedMode?: CarePassportMode) {
  const parsed = await readJsonLimited(request, CARE_PASSPORT_MAX_BYTES);
  if (!parsed.ok) return jsonError('Permintaan tidak valid atau terlalu besar.', parsed.status);

  const body = (parsed.value && typeof parsed.value === 'object' ? parsed.value : {}) as Record<string, unknown>;
  const mode: CarePassportMode = forcedMode ?? (body.mode === 'preview' ? 'preview' : 'generate');
  const payload = { ...body, mode };

  const route = mode === 'preview' ? 'care-passport-preview' : 'care-passport';
  if (await isRateLimited(route, request)) return jsonError(BUSY, 429);

  if (mode === 'preview') {
    const outcome = await handleCarePassportRequest(payload, { onTelemetry: logTelemetry });
    return outcome.ok ? jsonOk(outcome.data) : jsonError(outcome.error, outcome.status);
  }

  const release = await acquireSharedChatSlot();
  if (!release) return jsonError(BUSY, 429);
  try {
    const outcome = await handleCarePassportRequest(payload, { onTelemetry: logTelemetry });
    if (!outcome.ok) return jsonError(outcome.error, outcome.status);
    // Provider error text never reaches the browser, on either request shape.
    const data = outcome.data as { result?: { warnings?: string[] } };
    if (data.result && Array.isArray(data.result.warnings)) {
      return jsonOk({ ...outcome.data, result: { ...data.result, warnings: toPublicWarnings(data.result.warnings) } });
    }
    return jsonOk(outcome.data);
  } finally {
    release();
  }
}
