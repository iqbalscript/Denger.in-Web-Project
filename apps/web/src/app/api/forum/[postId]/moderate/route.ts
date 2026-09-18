import type { NextRequest } from 'next/server';
import { forumRepository } from '@/lib/api/repositories';
import { verifyAdminRequest } from '@/lib/api/adminSession';
import { jsonError, jsonOk } from '@/lib/api/response';

interface ModerateBody {
  status?: 'approved' | 'rejected';
}

/**
 * PATCH /api/forum/[postId]/moderate
 * Requires a valid admin session cookie (see POST /api/admin/login).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { authorized } = verifyAdminRequest(request);
  if (!authorized) {
    return jsonError('Butuh sesi admin yang valid. Silakan login lewat /api/admin/login.', 401);
  }

  const body = (await request.json().catch(() => null)) as ModerateBody | null;
  if (!body || (body.status !== 'approved' && body.status !== 'rejected')) {
    return jsonError('Properti "status" harus "approved" atau "rejected".');
  }

  const { postId } = await params;
  const updated = await forumRepository.moderate(postId, body.status);
  if (!updated) {
    return jsonError('Post tidak ditemukan.', 404);
  }

  return jsonOk({ post: updated });
}
