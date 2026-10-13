// M11: the voice-mode page /ruang-ngobrol must be reachable from the UI.
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../../apps/web/src/${p}`, import.meta.url), 'utf8');

it('is listed in the Navbar mobile drawer', async () => {
  const navbar = await read('components/Navbar.tsx');
  const drawer = navbar.slice(navbar.indexOf('const mobileNavLinks'), navbar.indexOf('];', navbar.indexOf('const mobileNavLinks')));
  assert.match(drawer, /href: '\/ruang-ngobrol'/);
});

it('is linked from the chat page', async () => {
  assert.match(await read('app/chat/page.tsx'), /href="\/ruang-ngobrol"/);
});
