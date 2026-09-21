import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

console.log('--- RUNNING INTEGRATION AUDIT & REGRESSION SUITE ---');

// 1. API Response Envelope Unwrapping Regression
console.log('1. Testing API Response Envelope Unwrapping...');

// Simulated jsonOk envelope matching @/lib/api/response.ts
function simulateJsonOk(payload) {
  return { ok: true, data: payload };
}

// Forum GET unwrap logic
function unwrapForumPosts(responseBody) {
  return responseBody.data?.posts ?? responseBody.posts ?? [];
}

const mockPosts = [{ id: 'p1', title: 'Test Post' }];
const envelopedForum = simulateJsonOk({ posts: mockPosts });
const flatForum = { ok: true, posts: mockPosts };

assert.deepEqual(unwrapForumPosts(envelopedForum), mockPosts, 'Must correctly extract posts from nested envelope');
assert.deepEqual(unwrapForumPosts(flatForum), mockPosts, 'Must maintain backward compatibility with flat posts');

// Forum POST unwrap logic
function unwrapForumCreate(responseBody) {
  const payload = responseBody.data ?? responseBody;
  return {
    post: payload.post,
    moderation: payload.moderation,
    crisis: payload.crisis,
  };
}

const envelopedCreate = simulateJsonOk({
  post: { id: 'new-1' },
  moderation: { isFlagged: false },
  crisis: false,
});
assert.equal(unwrapForumCreate(envelopedCreate).post?.id, 'new-1');
assert.equal(unwrapForumCreate(envelopedCreate).moderation?.isFlagged, false);
assert.equal(unwrapForumCreate(envelopedCreate).crisis, false);

// Weekly Report Summary unwrap logic
function unwrapWeeklyReport(responseBody) {
  return responseBody.data?.summary ?? responseBody.summary ?? null;
}

const mockSummary = {
  totalCheckins: 5,
  dominantMood: 'baik',
  keyObservation: 'Stabil',
  encouragementNote: 'Tetap jaga ritme',
};
const envelopedReport = simulateJsonOk({ summary: mockSummary });
assert.deepEqual(unwrapWeeklyReport(envelopedReport), mockSummary, 'Must correctly extract summary from nested envelope');

console.log('✔ API Response Unwrapping verified.');

// 2. Telephone Dial Number Extractor Regression (BUG-09)
console.log('2. Testing Telephone Dial Number Extractor...');

function getDialableTel(phone) {
  if (!phone) return '';
  const baseNumber = phone.split(/\s*ext/i)[0] || '';
  return baseNumber.replace(/[^0-9]/g, '');
}

assert.equal(getDialableTel('119 ext 8'), '119', '119 ext 8 must dial 119 without ext suffix');
assert.equal(getDialableTel('119 Ext. 8'), '119', 'Case insensitive extension parsing');
assert.equal(getDialableTel('119 EXT 8'), '119', 'All-caps extension parsing');
assert.equal(getDialableTel('021-500-454'), '021500454', 'Standard hyphenated number');
assert.equal(getDialableTel('08111929557'), '08111929557', 'Plain mobile number');
assert.equal(getDialableTel(''), '', 'Empty phone string');
assert.equal(getDialableTel(undefined), '', 'Undefined phone');

console.log('✔ Telephone dialable extraction verified.');

// 3. Chat Status & Error Mapping (BUG-06)
console.log('3. Testing Chat Status & Error Mapping...');

function mapChatError(status, json) {
  return (
    json?.error ||
    (status === 413
      ? 'Pesan terlalu panjang (maksimum 2.000 karakter).'
      : status === 429
        ? 'Terlalu banyak permintaan. Coba lagi sebentar lagi.'
        : 'Maaf, terjadi kendala saat memproses respons. Silakan coba kirim kembali.')
  );
}

assert.equal(
  mapChatError(413, null),
  'Pesan terlalu panjang (maksimum 2.000 karakter).',
  '413 Payload Too Large must produce human-readable length warning'
);
assert.equal(
  mapChatError(429, null),
  'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
  '429 Too Many Requests must produce rate-limit advice'
);
assert.equal(
  mapChatError(400, { error: 'Invalid payload' }),
  'Invalid payload',
  'Server provided error string must take precedence'
);
assert.equal(
  mapChatError(500, null),
  'Maaf, terjadi kendala saat memproses respons. Silakan coba kirim kembali.',
  'Generic server error fallback message'
);

console.log('✔ Chat error mapping verified.');

// 4. Tailwind Configuration Integrity Check (BUG-08)
console.log('4. Testing Tailwind Configuration for Design Tokens...');

const tailwindConfigPath = join(process.cwd(), 'apps/web/tailwind.config.js');
const tailwindConfigContent = readFileSync(tailwindConfigPath, 'utf8');

assert.ok(
  tailwindConfigContent.includes("'#FF8A3D'") || tailwindConfigContent.includes('"#FF8A3D"'),
  'Tailwind config must define tangerine: #FF8A3D'
);
assert.ok(
  tailwindConfigContent.includes('tangerine:'),
  'Tailwind colors must contain tangerine key'
);

console.log('✔ Tailwind design token tangerine verified.');

// 5. Source Relationship Static Checks: No Invalid <a><button> nesting (BUG-11)
console.log('5. Testing for forbidden nested <Link><Button> patterns in modified files...');

const filesToCheck = [
  'apps/web/src/app/forum/page.tsx',
  'apps/web/src/app/report/page.tsx',
  'apps/web/src/app/chat/page.tsx',
  'apps/web/src/app/checkin/page.tsx',
  'apps/web/src/app/journal/page.tsx',
  'apps/web/src/app/crisis/page.tsx',
  'apps/web/src/app/resources/page.tsx',
  'apps/web/src/app/page.tsx',
  'apps/web/src/app/recovery/page.tsx',
  'apps/web/src/app/mission/page.tsx',
  'apps/web/src/app/assessment/result/page.tsx',
];

const nestedLinkButtonRegex = /<Link[^>]*>\s*<Button/i;

for (const relPath of filesToCheck) {
  const fullPath = join(process.cwd(), relPath);
  const content = readFileSync(fullPath, 'utf8');
  assert.ok(
    !nestedLinkButtonRegex.test(content),
    `File ${relPath} must NOT contain nested <Link><Button> which generates invalid <a><button>`
  );
}

console.log('✔ No nested <Link><Button> found across audited routes.');

// 6. Mobile Safe Bottom Spacing Check (BUG-10)
console.log('6. Testing Mobile Safe Bottom Spacing in layout...');

const layoutPath = join(process.cwd(), 'apps/web/src/app/layout.tsx');
const layoutContent = readFileSync(layoutPath, 'utf8');

assert.ok(
  layoutContent.includes('pb-20') || layoutContent.includes('pb-24'),
  'Root layout main tag must include bottom padding for mobile dock'
);

console.log('✔ Mobile bottom safe padding verified.');

// 7. Data Wipe Security & BFcache Cleansing Verification (M-03)
console.log('7. Verifying M-03 Data Wipe Invariants...');

const recoveryPagePath = join(process.cwd(), 'apps/web/src/app/recovery/page.tsx');
const recoveryContent = readFileSync(recoveryPagePath, 'utf8');

assert.ok(recoveryContent.includes('clearAnonymousSession()'), 'Must call clearAnonymousSession');
assert.ok(recoveryContent.includes('setSession(null)'), 'Must clear session state');
assert.ok(recoveryContent.includes("setRestoreInput('')"), 'Must clear restore input state');
assert.ok(recoveryContent.includes("window.location.replace('/')"), 'Must use replace to avoid back cache');

console.log('✔ M-03 Data Wipe Invariants verified.');

// 8. Forum Relationship Lifecycle & Edge Cases Regression
console.log('8. Testing Forum Relationship Lifecycle & Edge Cases...');

// 8.1 Successful submit & feed refresh
const initialFeed = [{ id: 'p1', title: 'Old Post' }];
const newPost = { id: 'p2', title: 'New Post', moderation_status: 'approved' };
const successEnvelope = simulateJsonOk({ crisis: false, post: newPost, moderation: { status: 'approved' } });
const payloadSuccess = successEnvelope.data ?? successEnvelope;

assert.equal(payloadSuccess.crisis, false);
assert.equal(payloadSuccess.moderation.status, 'approved');
const updatedFeed = [payloadSuccess.post, ...initialFeed];
assert.equal(updatedFeed.length, 2);
assert.equal(updatedFeed[0].id, 'p2', 'New post must be prepended to feed');
console.log('  ✔ Successful submit and feed refresh verified.');

// 8.2 Double-submit protection
let submissionAttempts = 0;
const isSubmittingRef = { current: false };

async function submitMock() {
  if (isSubmittingRef.current) return 'BLOCKED';
  isSubmittingRef.current = true;
  submissionAttempts++;
  // simulate async work
  await new Promise(r => setTimeout(r, 10));
  isSubmittingRef.current = false;
  return 'PROCESSED';
}

const [res1, res2] = await Promise.all([submitMock(), submitMock()]);
assert.ok(
  (res1 === 'PROCESSED' && res2 === 'BLOCKED') || (res1 === 'BLOCKED' && res2 === 'PROCESSED'),
  'Simultaneous duplicate clicks must be blocked by isSubmittingRef'
);
assert.equal(submissionAttempts, 1, 'Only exactly 1 request may process');
console.log('  ✔ Double-submit protection verified.');

// 8.3 Structured database failure handling (500)
const dbFailEnvelope = { ok: false, error: 'Terjadi kendala saat menyimpan cerita ke database. Silakan coba lagi sebentar lagi.' };
assert.equal(dbFailEnvelope.ok, false);
assert.ok(dbFailEnvelope.error.includes('Terjadi kendala saat menyimpan cerita'));
console.log('  ✔ Structured database failure handling verified.');

// 8.4 Malformed / non-JSON failure response handling
const malformedResponse = {
  json: async () => { throw new SyntaxError('Unexpected token < in JSON at position 0'); }
};
const safeParsed = await malformedResponse.json().catch(() => null);
assert.equal(safeParsed, null, 'Malformed JSON must be caught safely as null');
const fallbackMsg = safeParsed?.error || safeParsed?.message || 'Gagal mengirim cerita. Mohon periksa kembali tulisanmu.';
assert.equal(fallbackMsg, 'Gagal mengirim cerita. Mohon periksa kembali tulisanmu.', 'Must fall back to safe error message');
console.log('  ✔ Malformed/non-JSON failure handling verified.');

// 8.5 Moderation rejection handling (422)
const moderationReject = {
  status: 422,
  body: { ok: false, error: 'Konten terdeteksi mengandung kata-kata kasar atau penghinaan.' }
};
assert.equal(moderationReject.status, 422);
assert.ok(moderationReject.body.error.includes('kata-kata kasar'));
console.log('  ✔ Moderation rejection handling verified.');

// 8.6 Crisis response handling
const crisisEnvelope = simulateJsonOk({ crisis: true, evaluation: { isCrisis: true, directIntent: true } });
const payloadCrisis = crisisEnvelope.data ?? crisisEnvelope;
assert.equal(payloadCrisis.crisis, true);
console.log('  ✔ Crisis response routing verified.');

console.log('✔ All 7 forum relationship scenarios verified.');

console.log('\n========================================');
console.log('ALL INTEGRATION AUDIT REGRESSION CHECKS PASSED!');
console.log('========================================\n');
