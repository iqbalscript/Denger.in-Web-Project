import type { InterventionDomain } from '@dengarin/types';
import { DOMAIN_CONFIGS } from '@dengarin/config';

/**
 * Forum stories are tagged with one of the InterventionDomain values. The
 * `forum_posts.domain` column is free TEXT, so the API boundary is the only
 * place that keeps arbitrary strings out of the table (and out of cache keys).
 */
export const FORUM_DOMAINS = Object.freeze(Object.keys(DOMAIN_CONFIGS) as InterventionDomain[]);

export function isInterventionDomain(value: unknown): value is InterventionDomain {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DOMAIN_CONFIGS, value);
}

export type ForumDomainFilter =
  | { ok: true; domain: InterventionDomain | undefined }
  | { ok: false };

/** Parses the optional `?domain=` filter: absent/empty means "all domains". */
export function parseForumDomainFilter(raw: string | null): ForumDomainFilter {
  if (raw === null || raw === '') return { ok: true, domain: undefined };
  return isInterventionDomain(raw) ? { ok: true, domain: raw } : { ok: false };
}
