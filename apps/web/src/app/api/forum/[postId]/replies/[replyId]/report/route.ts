import type { NextRequest } from 'next/server';
import type { ForumReportReason } from '@dengarin/persistence';
import { forumRepository } from '@/lib/api/repositories';
import { jsonError, jsonOk } from '@/lib/api/response';
import { isRateLimited } from '@/lib/api/rateLimit';
import { readJsonLimited } from '@/lib/api/requestLimits';
import { isReplySchemaUnavailable } from '@/lib/api/replySchema';

const REASONS = new Set<ForumReportReason>(['harassment_or_bullying', 'self_harm_or_dangerous_advice', 'contact_or_privacy', 'scam_or_spam', 'impersonation', 'other_safety']);
export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string; replyId: string }> }) {
  if (await isRateLimited('forum-reply-report')) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
  const parsed = await readJsonLimited(request, 1024);
  if (!parsed.ok) return jsonError('Laporan tidak valid atau terlalu besar.', parsed.status);
  const value = parsed.value as { reason?: unknown } | null;
  if (!value || typeof value.reason !== 'string' || !REASONS.has(value.reason as ForumReportReason)) return jsonError('Alasan laporan tidak valid.', 400);
  const { postId, replyId } = await params;
  try {
    if (!await forumRepository.createReplyReport({ storyId: postId, replyId, reason: value.reason as ForumReportReason })) return jsonError('Balasan tidak tersedia.', 404);
  } catch (error) {
    if (isReplySchemaUnavailable(error)) return jsonError('Fitur balasan belum tersedia.', 503);
    console.error('Failed to report forum reply:', error);
    return jsonError('Gagal mengirim laporan. Silakan coba lagi sebentar lagi.', 500);
  }
  return jsonOk({ reported: true });
}
