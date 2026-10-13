import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('../../apps/web/src/app/', import.meta.url));
const COMPONENTS_DIR = fileURLToPath(new URL('../../apps/web/src/components/', import.meta.url));

/** Routes that must stay reachable without consent (help must never be gated). */
const UNGUARDED_ROUTES = new Set(['/', '/consent', '/crisis', '/resources']);

function findPages(dir) {
  const pages = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'api') continue; // API routes are server handlers, not pages.
      pages.push(...findPages(full));
    } else if (name === 'page.tsx') {
      pages.push(full);
    }
  }
  return pages;
}

function routeOf(pagePath) {
  const rel = relative(APP_DIR, pagePath).split(sep).slice(0, -1).join('/');
  return `/${rel}`;
}

const pages = findPages(APP_DIR).map((file) => ({
  route: routeOf(file),
  source: readFileSync(file, 'utf8'),
}));

const read = (route) => pages.find((page) => page.route === route)?.source ?? '';

describe('H5: consent guard coverage', () => {
  it('finds the app pages', () => {
    assert.ok(pages.length >= UNGUARDED_ROUTES.size + 1);
    for (const route of UNGUARDED_ROUTES) {
      assert.ok(pages.some((page) => page.route === route), `missing page ${route}`);
    }
  });

  it('guards every page outside the allowlist', () => {
    for (const { route, source } of pages) {
      if (UNGUARDED_ROUTES.has(route)) continue;
      assert.match(
        source,
        /import \{ useConsentGuard \} from '@\/lib\/useConsentGuard'/,
        `${route} must import useConsentGuard`
      );
      assert.match(source, /useConsentGuard\(\)/, `${route} must call useConsentGuard()`);
      // Some pages (e.g. /mission) keep their own skeleton until ready; all must wait on `ready`.
      assert.match(source, /\bready\b/, `${route} must wait for the guard's ready flag`);
    }
  });

  it('keeps the unguarded allowlist exactly landing, consent, crisis and resources', () => {
    const unguarded = pages
      .filter(({ source }) => !/useConsentGuard\(\)/.test(source))
      .map(({ route }) => route)
      .sort();
    assert.deepEqual(unguarded, [...UNGUARDED_ROUTES].sort());
  });

  it('covers the pages added in this pass', () => {
    for (const route of ['/chat', '/forum', '/ruang-ngobrol', '/perjalanan', '/care-passport', '/assessment/result', '/onboarding']) {
      assert.match(read(route), /useConsentGuard\(\)/, `${route} must be guarded`);
      assert.match(read(route), /if \(!ready\) return <ConsentPending \/>;/, `${route} must show ConsentPending while not ready`);
    }
  });

  it('care passport keeps its separate AI opt-in on top of app consent', () => {
    const source = read('/care-passport');
    assert.match(source, /useConsentGuard\(\)/);
    assert.match(source, /aiConsent/);
  });

  it('chat and assessment result do not read storage during render', () => {
    for (const route of ['/chat', '/assessment/result']) {
      assert.doesNotMatch(read(route), /getAnonymousSession\(/, `${route} must use the guard session`);
    }
  });
});

describe('Support pathway card reuse', () => {
  const card = readFileSync(join(COMPONENTS_DIR, 'SupportPathwayCard.tsx'), 'utf8');

  it('is a shared, static component', () => {
    assert.match(card, /export function SupportPathwayCard/);
    assert.match(card, /export function readSupportPathway/);
    assert.doesNotMatch(card, /animate-/, 'support content is never animated');
  });

  it('is rendered by chat and ruang-ngobrol from the API supportPathway', () => {
    for (const route of ['/chat', '/ruang-ngobrol']) {
      const source = read(route);
      assert.match(source, /from '@\/components\/SupportPathwayCard'/, `${route} must import the shared card`);
      assert.match(source, /<SupportPathwayCard pathway=\{/, `${route} must render the card`);
      assert.match(source, /readSupportPathway\(json\?{0,1}\.data\?{0,1}\.supportPathway\)/, `${route} must read data.supportPathway`);
    }
  });
});
