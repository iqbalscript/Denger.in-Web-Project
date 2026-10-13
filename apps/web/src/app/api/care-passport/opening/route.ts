import type { NextRequest } from 'next/server';
import { acquireSharedChatSlot, isRateLimited } from '@/lib/api/rateLimit';
import { readJsonLimited } from '@/lib/api/requestLimits';
import { jsonError, jsonOk } from '@/lib/api/response';
import {
  OPENING_LINES_MAX_BYTES,
  handleOpeningLinesRequest,
  type OpeningLinesTelemetry,
} from '@/lib/api/openingLinesHandler';

const BUSY = 'Sedang cukup ramai. Tarik napas dulu, lalu coba lagi sebentar lagi, ya.';

/** Metadata only (docs/CAREBRIDGE_SAFETY_POLICY.md §7): never passport text. */
function logTelemetry(meta: OpeningLinesTelemetry) {
  console.info('[OpeningLines]', JSON.stringify(meta));
}

/**
 * POST /api/care-passport/opening
 * Body: { passport: CarePassport (reviewStatus 'user_approved'), destination, aiConsent }.
 * Order: crisis gate on the approved text -> consent -> AMD inference on
 * approved values only -> grounding; otherwise a deterministic template.
 * Nothing is cached or stored. See lib/api/openingLinesHandler.ts.
 */
export async function POST(request: NextRequest) {
  const parsed = await readJsonLimited(request, OPENING_LINES_MAX_BYTES);
  if (!parsed.ok) return jsonError('Permintaan tidak valid atau terlalu besar.', parsed.status);

  if (await isRateLimited('care-passport-opening', request)) return jsonError(BUSY, 429);

  const release = await acquireSharedChatSlot();
  if (!release) return jsonError(BUSY, 429);
  try {
    const outcome = await handleOpeningLinesRequest(parsed.value, { onTelemetry: logTelemetry });
    return outcome.ok ? jsonOk(outcome.data) : jsonError(outcome.error, outcome.status);
  } finally {
    release();
  }
}
