import type { NextRequest } from 'next/server';
import { forumRepository } from '@/lib/api/repositories';
import { jsonError, jsonOk } from '@/lib/api/response';

interface ModerateBody {
  status?: 'approved' | 'rejected';
}

/**
 * PATCH /api/forum/[postId]/moderate
 * TODO(Sprint 2+): gate behind an authenticated moderator/admin session —
 * this skeleton has no auth and must never be exposed publicly as-is.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
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
