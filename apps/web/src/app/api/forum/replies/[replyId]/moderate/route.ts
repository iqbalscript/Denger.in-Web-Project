import type { NextRequest } from 'next/server';
import { forumRepository } from '@/lib/api/repositories';
import { verifyAdminRequest } from '@/lib/api/adminSession';
import { jsonError, jsonOk } from '@/lib/api/response';
import { isReplySchemaUnavailable } from '@/lib/api/replySchema';
import { invalidateForumPosts, invalidateForumReplies } from '@/lib/api/forumCache';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  if (!verifyAdminRequest(request).authorized) return jsonError('Butuh sesi admin yang valid.', 401);
  const body = await request.json().catch(() => null) as { status?: unknown } | null;
  if (!body || (body.status !== 'approved' && body.status !== 'rejected')) return jsonError('Status moderasi tidak valid.', 400);
  const { replyId } = await params;
let reply;
try {
  reply = await forumRepository.moderateReply(replyId, body.status);
  if (reply) await Promise.all([invalidateForumReplies(reply.storyId), invalidateForumPosts()]);
} catch (error) {
  if (isReplySchemaUnavailable(error)) return jsonError('Fitur balasan belum tersedia.', 503);
  console.error('Failed to moderate forum reply:', error);
  return jsonError('Gagal memoderasi balasan. Silakan coba lagi sebentar lagi.', 500);
}
  return reply ? jsonOk({ reply }) : jsonError('Balasan tidak ditemukan.', 404);
}
