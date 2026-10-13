import type { NextRequest } from 'next/server';
import { handleCarePassportHttp } from '@/lib/api/carePassportRoute';

/**
 * POST /api/care-passport/preview
 * Returns PII findings and a fully redacted preview PER SEGMENT (story and
 * each selected journal / check-in entry) WITHOUT any AI call, so the user can
 * see exactly what would be sent. The deterministic crisis gate still runs
 * first, on all raw segments joined.
 */
export async function POST(request: NextRequest) {
  return handleCarePassportHttp(request, 'preview');
}
