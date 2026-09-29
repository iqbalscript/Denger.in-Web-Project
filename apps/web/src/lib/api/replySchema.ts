/**
 * The reply migration is deliberately not part of the story-feed rollout.
 * PostgreSQL's missing-table/column errors are converted at the route edge so
 * an unapplied draft migration cannot turn into an opaque public 500.
 */
export function isReplySchemaUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  const code = (error as { code?: unknown }).code;
  return code === '42P01' || code === '42703';
}
