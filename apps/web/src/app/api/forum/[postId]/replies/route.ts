import type { NextRequest } from 'next/server';
import { runCrisisGate } from '@/lib/api/crisisGate';
import { forumRepository } from '@/lib/api/repositories';
import { jsonError, jsonOk } from '@/lib/api/response';
import { acquireForumReplyWriteSlot, isRateLimited } from '@/lib/api/rateLimit';
import { readJsonLimited } from '@/lib/api/requestLimits';
import { deriveThreadParticipantHash, generateAliasCandidates } from '@/lib/api/threadAlias';
import { isReplySchemaUnavailable } from '@/lib/api/replySchema';
import { moderateForumReply } from '@dengarin/validator';

const MAX_REPLY_BYTES = 4096;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
interface Context { params: Promise<{ postId: string }>; }
interface CreateReplyBody { body?: unknown; parentReplyId?: unknown; threadKey?: unknown; }

export async function GET(request: NextRequest, context: Context) {
  if (await isRateLimited('forum-reply-list')) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
  const { postId } = await context.params;
  const rawLimit = request.nextUrl.searchParams.get('limit');
  const requestedLimit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_LIMIT) return jsonError('Batas balasan harus antara 1 dan 50.', 400);
  let page;
  try {
    page = await forumRepository.listApprovedReplies(postId, requestedLimit, request.nextUrl.searchParams.get('cursor') ?? undefined);
  } catch (error) {
    if (isReplySchemaUnavailable(error)) return jsonError('Fitur balasan belum tersedia.', 503);
    console.error('Failed to list forum replies:', error);
    return jsonError('Gagal memuat balasan. Silakan coba lagi sebentar lagi.', 500);
  }
  if (!page) return jsonError('Cerita tidak tersedia.', 404);
  return jsonOk(page);
}

export async function POST(request: NextRequest, context: Context) {
  const parsed = await readJsonLimited(request, MAX_REPLY_BYTES);
  if (!parsed.ok) return jsonError('Permintaan tidak valid atau terlalu besar.', parsed.status);
  const payload = parsed.value as CreateReplyBody | null;
  if (!payload || typeof payload.body !== 'string' || typeof payload.threadKey !== 'string' || (payload.parentReplyId !== undefined && typeof payload.parentReplyId !== 'string')) return jsonError('Balasan tidak valid.', 400);
  const body = payload.body.trim();
  const crisis = runCrisisGate(body);
  if (!crisis.cleared) return jsonOk({ crisis: true, evaluation: crisis.evaluation });
  const moderation = moderateForumReply({ body });
  if (moderation.status === 'rejected') return jsonError(moderation.reason ?? 'Balasan tidak memenuhi panduan keamanan.', 422);
  if (await isRateLimited('forum-reply-create')) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
  const release = acquireForumReplyWriteSlot();
  if (!release) return jsonError('Ruang cerita sedang sibuk. Coba lagi sebentar.', 429);
  try {
    const { postId } = await context.params;
    const participantKeyHash = deriveThreadParticipantHash(postId, payload.threadKey);
    if (!participantKeyHash) return jsonError('Sesi balasan tidak valid atau belum dikonfigurasi.', 400);
    const reply = await forumRepository.createReply({ storyId: postId, parentReplyId: payload.parentReplyId, participantKeyHash, aliasCandidates: generateAliasCandidates(), body, initialStatus: moderation.status });
    if (!reply) return jsonError('Cerita atau konteks balasan tidak tersedia.', 404);
    return jsonOk({ crisis: false, reply, moderation }, { status: 201 });
  } catch (error) {
    if (isReplySchemaUnavailable(error)) return jsonError('Fitur balasan belum tersedia.', 503);
    console.error('Failed to create forum reply:', error instanceof Error ? error.message : error);
    return jsonError('Terjadi kendala saat menyimpan balasan. Silakan coba lagi.', 500);
  } finally { release(); }
}
