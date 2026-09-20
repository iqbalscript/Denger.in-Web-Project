type Entry = { count: number; expiresAt: number };

/** Process-local quotas. Keys are server constants, never request fields. */
export function createRateLimiter(windowMs = 60_000, maxEntries = 32, now = Date.now) {
  const hits = new Map<string, Entry>();
  return {
    check(key: string, limit: number): boolean {
      const time = now();
      for (const [id, entry] of hits) {
        if (entry.expiresAt <= time) hits.delete(id);
      }
      const entry = hits.get(key);
      if (entry) {
        entry.count += 1;
        return entry.count > limit;
      }
      // Fail closed at capacity: evicting a live bucket would reset its quota.
      if (hits.size >= maxEntries) return true;
      hits.set(key, { count: 1, expiresAt: time + windowMs });
      return false;
    },
    get size() { return hits.size; }
  };
}

const limiter = createRateLimiter();
export type PublicRoute = 'chat' | 'admin-login' | 'forum-write' | 'forum-support' | 'weekly-report' | 'sync-read' | 'sync-write';
const limits: Record<PublicRoute, number> = {
  chat: 30,
  'admin-login': 20,
  'forum-write': 60,
  'forum-support': 120,
  'weekly-report': 120,
  'sync-read': 120,
  'sync-write': 60
};

/** Anonymous route-wide quota; session IDs and forwarding headers have no authority. */
export function isRateLimited(route: PublicRoute): boolean {
  return limiter.check(route, limits[route]);
}

let activeChat = 0;
const MAX_ACTIVE_CHAT = 4;
export function acquireChatSlot(): (() => void) | null {
  if (activeChat >= MAX_ACTIVE_CHAT) return null;
  activeChat += 1;
  let released = false;
  return () => { if (!released) { activeChat -= 1; released = true; } };
}
