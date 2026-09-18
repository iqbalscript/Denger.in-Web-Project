import type { NextRequest } from 'next/server';
import { createSessionToken, verifyPassword } from '@dengarin/auth';
import { adminRepository } from '@/lib/api/repositories';
import { isRateLimited } from '@/lib/api/rateLimit';
import { jsonError, jsonOk } from '@/lib/api/response';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS, getAdminSessionSecret } from '@/lib/api/adminSession';

interface LoginBody {
  username?: string;
  password?: string;
}

/**
 * POST /api/admin/login
 * Operator/moderator login only — there is no signup route. Accounts are
 * provisioned out-of-band via `npm run db:seed-admin` (see
 * services/persistence/scripts/seedAdmin.ts). On success, sets an httpOnly
 * signed session cookie consumed by verifyAdminRequest().
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;
  if (!body || !body.username || !body.password) {
    return jsonError('Properti "username" dan "password" wajib diisi.');
  }

  const rateLimitKey = `admin-login:${request.headers.get('x-forwarded-for') ?? 'local'}`;
  if (isRateLimited(rateLimitKey)) {
    return jsonError('Terlalu banyak percobaan login. Coba lagi sebentar lagi.', 429);
  }

  let secret: string;
  try {
    secret = getAdminSessionSecret();
  } catch {
    return jsonError('Server belum dikonfigurasi untuk admin login (ADMIN_SESSION_SECRET kosong).', 500);
  }

  const admin = await adminRepository.findByUsername(body.username);
  const isValid = admin ? await verifyPassword(body.password, admin.passwordHash) : false;

  if (!admin || !isValid) {
    return jsonError('Username atau password salah.', 401);
  }

  const token = createSessionToken(admin.username, secret, ADMIN_SESSION_TTL_SECONDS);

  const response = jsonOk({ username: admin.username });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS
  });
  return response;
}
