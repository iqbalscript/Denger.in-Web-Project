const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, { count: number; windowStart: number }>();

/**
 * Minimal in-memory fixed-window limiter to slow down abuse against the
 * AI/crisis-adjacent endpoints. Per-instance only — replace with a shared
 * store (e.g. Redis) before running more than one server instance.
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}
