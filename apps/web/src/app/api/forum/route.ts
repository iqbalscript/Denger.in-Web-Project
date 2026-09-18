import type { NextRequest } from 'next/server';
import type { InterventionDomain } from '@dengarin/types';
import { runCrisisGate } from '@/lib/api/crisisGate';
import { forumRepository } from '@/lib/api/repositories';
import { jsonError, jsonOk } from '@/lib/api/response';

interface CreateForumPostBody {
  authorPseudonym?: string;
  domain?: InterventionDomain;
  title?: string;
  body?: string;
}

/** GET /api/forum — publicly readable, approved posts only. */
export async function GET() {
  const posts = await forumRepository.listApproved();
  return jsonOk({ posts });
}

/**
 * POST /api/forum
 * Every free-text submission is scanned by the deterministic crisis gate
 * before it is ever persisted (docs/SAFETY.md Section 2). Posts are always
 * created as 'pending_review' — there is no automated moderation model yet
 * (README Roadmap), so nothing goes public without explicit approval.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateForumPostBody | null;
  if (!body || !body.title?.trim() || !body.body?.trim() || !body.domain) {
    return jsonError('Properti "title", "body", dan "domain" wajib diisi.');
  }

  const { cleared, evaluation } = runCrisisGate(`${body.title}\n${body.body}`);
  if (!cleared) {
    return jsonOk({ crisis: true, evaluation });
  }

  const post = await forumRepository.create({
    authorPseudonym: body.authorPseudonym?.trim() || 'Sahabat Anonim',
    domain: body.domain,
    title: body.title.trim(),
    body: body.body.trim()
  });

  return jsonOk({ crisis: false, post }, { status: 201 });
}
