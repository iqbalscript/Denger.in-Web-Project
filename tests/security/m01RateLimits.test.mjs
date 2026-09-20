import assert from 'node:assert/strict';
import { createRateLimiter, acquireChatSlot } from '../../apps/web/src/lib/api/rateLimit.ts';
import {
  CHAT_MAX_BYTES, CHAT_MAX_MESSAGE, CHAT_MAX_HISTORY_COUNT,
  CHAT_MAX_HISTORY_ENTRY, CHAT_MAX_HISTORY_TOTAL,
  chatInputWithinLimits, readJsonLimited
} from '../../apps/web/src/lib/api/requestLimits.ts';

let clock = 0;
const limiter = createRateLimiter(1000, 2, () => clock);
assert.equal(limiter.check('chat', 2), false);
assert.equal(limiter.check('chat', 2), false);
assert.equal(limiter.check('chat', 2), true);
// Request-controlled session and forwarding values have no part in the route key.
for (const variation of ['new-session', 'another-session', 'spoofed-x-forwarded-for']) {
  assert.equal(limiter.check('chat', 2), true, variation);
}
assert.equal(limiter.check('admin-login', 1), false);
assert.equal(limiter.check('new-key', 1), true);
assert.equal(limiter.size, 2);
for (let index = 0; index < 1000; index++) {
  assert.equal(limiter.check(`attacker-${index}`, 1), true);
  assert.equal(limiter.size, 2);
}
clock = 1000;
assert.equal(limiter.check('new-key', 1), false);
assert.equal(limiter.size, 1);
assert.equal(limiter.check('new-key', 1), true);

const slots = Array.from({ length: 4 }, () => acquireChatSlot());
assert.ok(slots.every(Boolean));
assert.equal(acquireChatSlot(), null);
slots[0]();
slots[0]();
assert.ok(acquireChatSlot());
for (const release of slots.slice(1)) release();

assert.equal(chatInputWithinLimits({ message: 'a'.repeat(CHAT_MAX_MESSAGE) }), true);
assert.equal(chatInputWithinLimits({ message: 'a'.repeat(CHAT_MAX_MESSAGE + 1) }), false);
assert.equal(chatInputWithinLimits({ message: 'hi', history: Array.from({ length: CHAT_MAX_HISTORY_COUNT }, () => ({ sender: 'user', text: 'a'.repeat(CHAT_MAX_HISTORY_ENTRY) })) }), false);
assert.equal(chatInputWithinLimits({ message: 'hi', history: Array.from({ length: CHAT_MAX_HISTORY_COUNT + 1 }, () => ({ sender: 'user', text: 'a' })) }), false);
assert.equal(chatInputWithinLimits({ message: 'hi', history: [{ sender: 'user', text: 'a'.repeat(CHAT_MAX_HISTORY_ENTRY + 1) }] }), false);
assert.equal(chatInputWithinLimits({ message: 'hi', history: Array.from({ length: 6 }, () => ({ sender: 'user', text: 'a'.repeat(CHAT_MAX_HISTORY_ENTRY) })) }), true);
assert.equal(CHAT_MAX_HISTORY_TOTAL, 6 * CHAT_MAX_HISTORY_ENTRY);
assert.equal(chatInputWithinLimits({ message: 'Halo', history: [{ sender: 'user', text: 'Apa kabar?' }] }), true);

const request = (body, headers) => new Request('http://local/api/chat', { method: 'POST', body, headers });
assert.equal((await readJsonLimited(request(JSON.stringify({ message: 'x' })), CHAT_MAX_BYTES)).ok, true);
assert.deepEqual(await readJsonLimited(request('x'.repeat(CHAT_MAX_BYTES + 1)), CHAT_MAX_BYTES), { ok: false, status: 413 });
assert.deepEqual(await readJsonLimited(request('{'), CHAT_MAX_BYTES), { ok: false, status: 400 });
assert.deepEqual(await readJsonLimited(request('{}', { 'content-length': String(CHAT_MAX_BYTES + 1) }), CHAT_MAX_BYTES), { ok: false, status: 413 });

console.log('M-01 rate, concurrency, input boundary, and byte limit tests passed.');
