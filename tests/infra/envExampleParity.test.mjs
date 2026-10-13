// L11: every environment variable the app reads must be documented in .env.example.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const SCAN_DIRS = ['apps/web/src', 'services', 'packages'];
const EXTRA_FILES = ['apps/web/next.config.js', 'apps/web/cache-handler.mjs'];
const SOURCE_EXT = /\.(ts|tsx|js|mjs|cjs)$/;
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist']);

// Set by Node/Next.js itself, never by an operator.
const FRAMEWORK_VARS = new Set(['NODE_ENV', 'NEXT_PHASE', 'NEXT_RUNTIME', 'NEXT_TELEMETRY_DISABLED', 'VERCEL', 'VERCEL_ENV', 'CI']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SOURCE_EXT.test(entry.name) && !entry.name.endsWith('.d.ts')) yield full;
  }
}

/** process.env.X, process.env['X'], env.X / env?.X (env defaulted to process.env), and destructuring. */
export function extractEnvReads(source) {
  const names = new Set();
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  for (const m of code.matchAll(/\benv\??\.([A-Z][A-Z0-9_]*)\b/g)) names.add(m[1]);
  for (const m of code.matchAll(/\benv\??\.?\[\s*['"`]([A-Z][A-Z0-9_]*)['"`]\s*\]/g)) names.add(m[1]);
  for (const m of code.matchAll(/\{([^{}]*)\}\s*=\s*process\.env\b/g)) {
    for (const part of m[1].split(',')) {
      const key = part.split(/[:=]/)[0].trim();
      if (/^[A-Z][A-Z0-9_]*$/.test(key)) names.add(key);
    }
  }
  return names;
}

async function collectReads() {
  const reads = new Map();
  const files = [];
  for (const dir of SCAN_DIRS) for await (const f of walk(path.join(root, dir))) files.push(f);
  for (const f of EXTRA_FILES) files.push(path.join(root, f));
  for (const file of files) {
    for (const name of extractEnvReads(await readFile(file, 'utf8'))) {
      if (!reads.has(name)) reads.set(name, []);
      reads.get(name).push(path.relative(root, file));
    }
  }
  return reads;
}

async function documentedVars() {
  const text = await readFile(path.join(root, '.env.example'), 'utf8');
  // Both active (`KEY=`) and commented-out (`# KEY=`) entries count as documented.
  return new Set([...text.matchAll(/^\s*#?\s*([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]));
}

describe('.env.example parity (L11)', () => {
  it('extracts every supported access pattern', () => {
    const found = extractEnvReads(`
      const a = process.env.ALPHA; const b = process.env['BETA']; const c = env?.GAMMA;
      function f(env = process.env) { return env.DELTA; }
      const { EPSILON, ZETA: z = '1' } = process.env;
      // process.env.COMMENTED_OUT
      /* process.env.BLOCK_COMMENT */
      const url = 'http://x'; const lower = process.env.notUpper;
    `);
    assert.deepEqual([...found].sort(), ['ALPHA', 'BETA', 'DELTA', 'EPSILON', 'GAMMA', 'ZETA']);
  });

  it('documents every variable read in apps/web, services and packages', async () => {
    const reads = await collectReads();
    const documented = await documentedVars();
    assert.ok(reads.size > 10, `scanner found only ${reads.size} variables`);
    const missing = [...reads.keys()]
      .filter((name) => !FRAMEWORK_VARS.has(name) && !documented.has(name))
      .sort()
      .map((name) => `${name} (read in ${reads.get(name).join(', ')})`);
    assert.deepEqual(missing, [], `Add these to .env.example:\n  ${missing.join('\n  ')}`);
  });

  it('lists each active variable only once', async () => {
    const text = await readFile(path.join(root, '.env.example'), 'utf8');
    const active = [...text.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]);
    const dupes = active.filter((name, i) => active.indexOf(name) !== i);
    assert.deepEqual(dupes, []);
  });

  it('keeps known operator variables in the scan (guards against a silently broken scanner)', async () => {
    const reads = await collectReads();
    for (const name of ['DATABASE_URL', 'REDIS_URL', 'ADMIN_SESSION_SECRET', 'TRUSTED_PROXY_HOPS', 'RATE_LIMIT_HASH_SECRET', 'AI_RESPONSE_CACHE']) {
      assert.ok(reads.has(name), name);
    }
  });
});
