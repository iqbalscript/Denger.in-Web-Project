// L11: GET /api/redis-test must be admin-only in production (404 without a
// valid admin session) and must not touch Redis before the gate passes.
import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const webSrc = new URL('../../apps/web/src/', import.meta.url);
globalThis.__redisTestGate = { getRedisCalls: 0 };
const REDIS_STUB = 'data:text/javascript,' + encodeURIComponent(
  'export const REDIS_PREFIX = "test:"; export async function getRedis() { globalThis.__redisTestGate.getRedisCalls++; return null; }'
);

// Resolve the Next.js "@/..." alias and replace the real Redis client with a stub.
registerHooks({
  resolve(specifier, context, nextResolve) {
    // next has no "exports" map, so ESM needs the explicit file name.
    if (specifier === 'next/server') return nextResolve('next/server.js', context);
    if (specifier === '@/lib/redis') return { url: REDIS_STUB, shortCircuit: true };
    if (specifier.startsWith('@/')) {
      return { url: new URL(`${specifier.slice(2)}.ts`, webSrc).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { GET } = await import(new URL('app/api/redis-test/route.ts', webSrc).href);
const { ADMIN_SESSION_COOKIE } = await import(new URL('lib/api/adminSession.ts', webSrc).href);
const { createSessionToken } = await import('../../services/auth/src/sessionToken.ts');

const SECRET = 'redis-test-gate-secret-at-least-32-characters';
const originalEnv = { NODE_ENV: process.env.NODE_ENV, ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET };
after(() => {
  for (const [k, v] of Object.entries(originalEnv)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
});

function fakeRequest(cookie) {
  return { cookies: { get: (name) => (cookie && name === ADMIN_SESSION_COOKIE ? { value: cookie } : undefined) } };
}

describe('/api/redis-test production gate (L11)', () => {
  beforeEach(() => {
    globalThis.__redisTestGate.getRedisCalls = 0;
    process.env.ADMIN_SESSION_SECRET = SECRET;
  });

  it('answers 404 to anonymous callers in production without touching Redis', async () => {
    process.env.NODE_ENV = 'production';
    const res = await GET(fakeRequest());
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.doesNotMatch(JSON.stringify(body), /redis/i, 'must not reveal infrastructure');
    assert.equal(globalThis.__redisTestGate.getRedisCalls, 0);
  });

  it('rejects forged, expired and wrong-secret admin cookies in production', async () => {
    process.env.NODE_ENV = 'production';
    for (const cookie of ['garbage', createSessionToken('admin', 'another-secret-that-is-long-enough!!'), createSessionToken('admin', SECRET, -10)]) {
      const res = await GET(fakeRequest(cookie));
      assert.equal(res.status, 404);
    }
    assert.equal(globalThis.__redisTestGate.getRedisCalls, 0);
  });

  it('stays closed in production when ADMIN_SESSION_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';
    const cookie = createSessionToken('admin', SECRET);
    delete process.env.ADMIN_SESSION_SECRET;
    const res = await GET(fakeRequest(cookie));
    assert.equal(res.status, 404);
    assert.equal(globalThis.__redisTestGate.getRedisCalls, 0);
  });

  it('lets a valid admin session through in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await GET(fakeRequest(createSessionToken('admin', SECRET)));
    assert.equal(globalThis.__redisTestGate.getRedisCalls, 1);
    assert.equal(res.status, 503, 'stubbed Redis is disabled');
  });

  it('stays open in development for the local Redis checklist', async () => {
    process.env.NODE_ENV = 'development';
    const res = await GET(fakeRequest());
    assert.equal(res.status, 503);
    assert.equal(globalThis.__redisTestGate.getRedisCalls, 1);
  });
});
