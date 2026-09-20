import type { NextRequest } from 'next/server';
import { forumRepository } from '@/lib/api/repositories';
import { jsonError, jsonOk } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ postId: string }>;
}

/**
 * POST /api/forum/[postId]/support
 * Increments the community empathy counter ("Rasakan Hal Serupa") for an approved post.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const { postId } = await context.params;
  if (!postId) {
    return jsonError('Parameter "postId" wajib disertakan.', 400);
  }

  const updated = await forumRepository.incrementSupport(postId);
  if (!updated) {
    return jsonError('Cerita tidak ditemukan.', 404);
  }

  return jsonOk({ success: true, supportCount: updated.supportCount });
}
