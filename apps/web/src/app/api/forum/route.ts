import type { NextRequest } from 'next/server';
import type { InterventionDomain } from '@dengarin/types';
import { runCrisisGate } from '@/lib/api/crisisGate';
import { forumRepository } from '@/lib/api/repositories';
import { jsonError, jsonOk } from '@/lib/api/response';
import { isRateLimited } from '@/lib/api/rateLimit';
import { readJsonLimited } from '@/lib/api/requestLimits';

import { moderateForumPost } from '@dengarin/validator';

interface CreateForumPostBody {
  authorPseudonym?: string;
  domain?: InterventionDomain;
  title?: string;
  body?: string;
}

/** GET /api/forum — publicly readable, approved posts only (optional domain filter). */
export async function GET(request: NextRequest) {
  const domainParam = request.nextUrl.searchParams.get('domain') as InterventionDomain | null;
  const posts = await forumRepository.listApproved(50, domainParam || undefined);
  return jsonOk({ posts });
}

/**
 * POST /api/forum
 * 1. Layer 0: Deterministic Crisis Gate scan.
 * 2. Layer 1: Automated Safety Moderation (moderateForumPost).
 *    - Approved -> automatically published immediately!
 *    - Pending Review -> held for moderator review.
 *    - Rejected -> returns helpful feedback.
 */
export async function POST(request: NextRequest) {
  if (isRateLimited('forum-write')) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
  const parsed = await readJsonLimited(request, 8192);
  if (!parsed.ok) return jsonError('Permintaan tidak valid atau terlalu besar.', parsed.status);
  const body = parsed.value as CreateForumPostBody | null;
  if (!body || typeof body.title !== 'string' || !body.title.trim() ||
      typeof body.body !== 'string' || !body.body.trim() || !body.domain ||
      (body.authorPseudonym !== undefined && typeof body.authorPseudonym !== 'string')) {
    return jsonError('Properti "title", "body", dan "domain" wajib diisi.');
  }
  const authorPseudonym = body.authorPseudonym?.trim() || 'Sahabat Anonim';

  // Layer 0: Crisis Gate
  const pseudonymCrisis = runCrisisGate(authorPseudonym);
  if (!pseudonymCrisis.cleared) {
    return jsonOk({ crisis: true, evaluation: pseudonymCrisis.evaluation });
  }
  const storyCrisis = runCrisisGate(`${body.title}\n${body.body}`);
  if (!storyCrisis.cleared) {
    return jsonOk({ crisis: true, evaluation: storyCrisis.evaluation });
  }

  // Layer 1: Automated Content & Quality Moderation
  const moderation = moderateForumPost({
    title: body.title.trim(),
    body: body.body.trim(),
    domain: body.domain,
    authorPseudonym
  });

  if (moderation.status === 'rejected') {
    return jsonError(moderation.reason || 'Konten tidak memenuhi panduan komunitas kami.', 422);
  }

  const post = await forumRepository.create({
    authorPseudonym,
    domain: body.domain,
    title: body.title.trim(),
    body: body.body.trim(),
    initialStatus: moderation.status
  });

  return jsonOk({ crisis: false, post, moderation }, { status: 201 });
}
