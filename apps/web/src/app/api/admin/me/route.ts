import type { NextRequest } from 'next/server';
import { verifyAdminRequest } from '@/lib/api/adminSession';
import { jsonError, jsonOk } from '@/lib/api/response';

/** GET /api/admin/me — returns the current admin session, or 401. */
export async function GET(request: NextRequest) {
  const { authorized, session } = verifyAdminRequest(request);
  if (!authorized || !session) {
    return jsonError('Belum login.', 401);
  }
  return jsonOk({ username: session.sub, expiresAt: session.exp });
}
