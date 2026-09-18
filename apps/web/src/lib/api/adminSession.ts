import type { NextRequest } from 'next/server';
import { verifySessionToken, type AdminSessionPayload } from '@dengarin/auth';

export const ADMIN_SESSION_COOKIE = 'dengarin_admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET belum dikonfigurasi');
  }
  return secret;
}

export interface AdminAuthResult {
  authorized: boolean;
  session?: AdminSessionPayload;
}

/**
 * Verifies the admin session cookie on an incoming request. Gates every
 * /api/admin/* route and the forum moderation endpoint. Dengar.in's
 * anonymous end users never hold this cookie (docs/SAFETY.md, Zero
 * Unnecessary PII) — it exists solely for the operator/moderator dashboard.
 */
export function verifyAdminRequest(request: NextRequest): AdminAuthResult {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return { authorized: false };
  }

  let secret: string;
  try {
    secret = getAdminSessionSecret();
  } catch {
    return { authorized: false };
  }

  const session = verifySessionToken(token, secret);
  if (!session) {
    return { authorized: false };
  }

  return { authorized: true, session };
}
