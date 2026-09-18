import { jsonOk } from '@/lib/api/response';
import { ADMIN_SESSION_COOKIE } from '@/lib/api/adminSession';

/** POST /api/admin/logout — clears the admin session cookie. */
export async function POST() {
  const response = jsonOk({ loggedOut: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
