import type { NextRequest } from 'next/server';
import { handleCarePassportHttp } from '@/lib/api/carePassportRoute';

/**
 * POST /api/care-passport
 * Body (F-A "Bukti Bertanggal"):
 *   { segments: [{ id, kind, date?, text }], keepSoftPii?, aiConsent, ageBracket?, mode?: 'preview' | 'generate' }
 * Legacy body `{ text, redactions?, aiConsent }` is still accepted.
 * Order: age check -> crisis gate on ALL raw segments joined -> server-side PII
 * redaction per segment (hard kinds always) -> Care Passport pipeline (consent ->
 * AMD inference on sanitized segments -> grounding -> per-segment attribution).
 * Nothing is cached or stored; user text is never logged. See lib/api/carePassportHandler.ts.
 */
export async function POST(request: NextRequest) {
  return handleCarePassportHttp(request);
}
