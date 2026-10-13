import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleChatRequest, CHAT_BUSY } from '../../apps/web/src/lib/api/chatHandler.ts';
import { buildSupportPathway, runCrisisGate } from '../../apps/web/src/lib/api/crisisGate.ts';
import { screenChatContext } from '../../apps/web/src/lib/api/chatHistory.ts';
import { isAiResponseCacheEnabled, AI_CACHE_TTL_SECONDS } from '../../apps/web/src/lib/api/aiCache.ts';
import {
  chatInputWithinLimits,
  CHAT_MAX_HISTORY_COUNT,
  CHAT_MAX_HISTORY_ENTRY,
  CHAT_CLIENT_HISTORY_ENTRIES,
  CHAT_TURN_BUDGET_MS,
} from '../../apps/web/src/lib/api/requestLimits.ts';
import { STANDARD_DISCLAIMER } from '../../services/validator/src/actionValidator.ts';

// Synthetic inputs only.
const CALM = 'Aku capek sama tugas kuliah minggu ini.';
const CRISIS = 'Aku mau bunuh diri.';
const HIGH = 'Aku ga kuat lagi nanggung hidup kayak gini.';

function harness({ env = {}, rateLimited = false, slot = true, result, throws } = {}) {
  const calls = { rate: 0, slot: 0, released: 0, orchestrator: [], cacheRead: [], cacheWrite: [], tts: [] };
  const deps = {
    env,
    isRateLimited: async () => { calls.rate += 1; return rateLimited; },
    acquireSlot: async () => { calls.slot += 1; return slot ? () => { calls.released += 1; } : null; },
    runOrchestrator: async (request, options) => {
      calls.orchestrator.push({ request, options });
      if (throws) throw throws;
      return result ?? {
        tier: 'primary',
        providerId: 'deepseek:test',
        action: { action: 'chat', message: 'Aku dengar kamu.', disclaimer: STANDARD_DISCLAIMER },
        debiased: false,
        warnings: [],
      };
    },
    cache: {
      read: async (key) => { calls.cacheRead.push(key); return null; },
      write: async (key) => { calls.cacheWrite.push(key); },
    },
    synthesizeRoomAudio: async (text) => { calls.tts.push(text); return { data: 'AAAA', mimeType: 'audio/wav' }; },
  };
  return { deps, calls };
}

describe('/api/chat handler: crisis halts before quota, cache and LLM', () => {
  it('crisis message returns crisis:true without touching quota, cache or orchestrator', async () => {
    const { deps, calls } = harness({ env: { AI_RESPONSE_CACHE: 'true' } });
    const outcome = await handleChatRequest({ message: CRISIS }, deps);
    assert.equal(outcome.ok, true);
    assert.equal(outcome.data.crisis, true);
    assert.equal(outcome.data.evaluation.severity, 'crisis');
    assert.ok(outcome.data.evaluation.emergencyContacts.length > 0);
    assert.equal(calls.rate, 0);
    assert.equal(calls.slot, 0);
    assert.equal(calls.orchestrator.length, 0);
    assert.equal(calls.cacheRead.length, 0);
    assert.equal(calls.cacheWrite.length, 0);
  });

  it('crisis in history also halts', async () => {
    const { deps, calls } = harness();
    const outcome = await handleChatRequest({ message: 'Halo', history: [{ sender: 'user', text: CRISIS }] }, deps);
    assert.equal(outcome.data.crisis, true);
    assert.equal(calls.orchestrator.length, 0);
  });

  it('crisis halts even when the AI quota is exhausted', async () => {
    const { deps } = harness({ rateLimited: true });
    const outcome = await handleChatRequest({ message: CRISIS }, deps);
    assert.equal(outcome.ok, true);
    assert.equal(outcome.data.crisis, true);
  });
});

describe('/api/chat handler: high distress carries a deterministic human-support pathway (H3)', () => {
  it('high severity still gets an AI reply plus supportPathway with contacts and links', async () => {
    const { deps, calls } = harness();
    const outcome = await handleChatRequest({ message: HIGH, ageBracket: '18-24' }, deps);
    assert.equal(outcome.ok, true);
    assert.equal(outcome.data.crisis, false);
    assert.equal(calls.orchestrator.length, 1);
    const pathway = outcome.data.supportPathway;
    assert.ok(pathway, 'pathway must be present');
    assert.equal(pathway.kind, 'human_support');
    assert.equal(pathway.severity, 'high');
    assert.equal(pathway.helpDirectoryAction, 'show_help_directory');
    assert.ok(pathway.contacts.length > 0 && pathway.contacts.every((c) => c.name && c.availableHours));
    assert.deepEqual(pathway.links.map((l) => l.href).sort(), ['/crisis', '/resources']);
    assert.doesNotMatch(`${pathway.title} ${pathway.message} ${pathway.links.map((l) => l.label).join(' ')}`, /—/);
  });

  it('model output cannot remove or downgrade the pathway', async () => {
    const { deps } = harness({
      result: {
        tier: 'primary',
        providerId: 'deepseek:test',
        action: { action: 'chat', message: 'Semua baik-baik saja.', disclaimer: STANDARD_DISCLAIMER },
        debiased: true,
        warnings: [],
        // Hostile extras a provider/orchestrator might smuggle in are ignored.
        supportPathway: null,
        severity: 'none',
        riskLevel: 'none',
      },
    });
    const outcome = await handleChatRequest({ message: HIGH }, deps);
    assert.equal(outcome.data.supportPathway.severity, 'high');
    assert.equal('riskLevel' in outcome.data, false);
    assert.equal('severity' in outcome.data, false);
  });

  it('high distress in history also attaches the pathway', async () => {
    const { deps } = harness();
    const outcome = await handleChatRequest({ message: 'Halo', history: [{ sender: 'user', text: HIGH }] }, deps);
    assert.equal(outcome.data.supportPathway?.kind, 'human_support');
  });

  it('calm messages carry no pathway', async () => {
    const { deps } = harness();
    const outcome = await handleChatRequest({ message: CALM }, deps);
    assert.equal(outcome.data.supportPathway, undefined);
  });

  it('pathway builder is deterministic and only for high (never crisis/none)', () => {
    assert.equal(buildSupportPathway(runCrisisGate(CALM).evaluation), null);
    assert.equal(buildSupportPathway(runCrisisGate(CRISIS).evaluation), null);
    assert.deepEqual(buildSupportPathway(runCrisisGate(HIGH).evaluation), runCrisisGate(HIGH).supportPathway);
    assert.equal(runCrisisGate(HIGH).cleared, true);
    assert.equal(runCrisisGate(CRISIS).cleared, false);
    assert.equal(buildSupportPathway(undefined), null);
  });
});

describe('/api/chat handler: AI response cache is opt-in (H6)', () => {
  it('does not read or write the cache by default', async () => {
    const { deps, calls } = harness({ env: {} });
    const outcome = await handleChatRequest({ message: CALM }, deps);
    assert.equal(outcome.data.cached, false);
    assert.equal(calls.cacheRead.length, 0);
    assert.equal(calls.cacheWrite.length, 0);
  });

  it('uses the cache only with AI_RESPONSE_CACHE=true, after the crisis gate', async () => {
    const { deps, calls } = harness({ env: { AI_RESPONSE_CACHE: 'true' } });
    await handleChatRequest({ message: CALM }, deps);
    assert.equal(calls.cacheRead.length, 1);
    assert.equal(calls.cacheWrite.length, 1);
    assert.match(calls.cacheRead[0], /^dengarin:ai:[a-f0-9]{64}$/);
  });

  it('serves a cache hit when opted in, with sanitised warnings', async () => {
    const { deps, calls } = harness({ env: { AI_RESPONSE_CACHE: 'true' } });
    deps.cache.read = async () => ({
      tier: 'primary',
      providerId: 'deepseek:test',
      action: { action: 'chat', message: 'Dari cache.', disclaimer: STANDARD_DISCLAIMER },
      warnings: ['deepseek gagal: DeepSeek merespons dengan status 402: Insufficient Balance'],
    });
    const outcome = await handleChatRequest({ message: CALM }, deps);
    assert.equal(outcome.data.cached, true);
    assert.deepEqual(outcome.data.warnings, ['deepseek gagal: status 402']);
    assert.equal(calls.orchestrator.length, 0);
  });

  it('never caches noStore requests or high-distress turns, even when opted in', async () => {
    const a = harness({ env: { AI_RESPONSE_CACHE: 'true' } });
    await handleChatRequest({ message: CALM, noStore: true }, a.deps);
    const b = harness({ env: { AI_RESPONSE_CACHE: 'true' } });
    await handleChatRequest({ message: HIGH }, b.deps);
    for (const { calls } of [a, b]) {
      assert.equal(calls.cacheRead.length, 0);
      assert.equal(calls.cacheWrite.length, 0);
    }
  });

  it('flag parsing is strict and the TTL is short', () => {
    assert.equal(isAiResponseCacheEnabled({}), false);
    assert.equal(isAiResponseCacheEnabled({ AI_RESPONSE_CACHE: '' }), false);
    assert.equal(isAiResponseCacheEnabled({ AI_RESPONSE_CACHE: '1' }), false);
    assert.equal(isAiResponseCacheEnabled({ AI_RESPONSE_CACHE: 'TRUE' }), true);
    assert.ok(AI_CACHE_TTL_SECONDS <= 600);
  });
});

describe('/api/chat handler: public projection and plumbing', () => {
  it('sanitises provider warnings before they leave the server', async () => {
    const { deps } = harness({
      result: {
        tier: 'tertiary',
        providerId: 'gemini:test',
        action: { action: 'chat', message: 'Aku di sini.', disclaimer: STANDARD_DISCLAIMER },
        debiased: false,
        warnings: [
          'deepseek:x gagal: DeepSeek merespons dengan status 402: Insufficient Balance req_abc123',
          'openrouter gagal: The operation was aborted due to timeout',
          'gemini menghasilkan output tidak valid: rule_secret_internal',
        ],
      },
    });
    const outcome = await handleChatRequest({ message: CALM }, deps);
    const joined = outcome.data.warnings.join('\n');
    assert.doesNotMatch(joined, /Insufficient|req_abc123|rule_secret_internal|aborted/);
    assert.deepEqual(outcome.data.warnings, [
      'deepseek:x gagal: status 402',
      'openrouter gagal: waktu habis',
      'gemini menghasilkan output tidak valid',
    ]);
  });

  it('passes the per-turn budget to the orchestrator and exposes `debiased`', async () => {
    const { deps, calls } = harness();
    const outcome = await handleChatRequest({ message: CALM }, deps);
    assert.equal(calls.orchestrator[0].options.turnBudgetMs, CHAT_TURN_BUDGET_MS);
    assert.equal(outcome.data.debiased, false);
  });

  it('maps quota and slot exhaustion to 429 and always releases the slot', async () => {
    assert.deepEqual(await handleChatRequest({ message: CALM }, harness({ rateLimited: true }).deps),
      { ok: false, status: 429, error: CHAT_BUSY });
    assert.equal((await handleChatRequest({ message: CALM }, harness({ slot: false }).deps)).status, 429);
    const failing = harness({ throws: new Error('provider exploded') });
    await assert.rejects(() => handleChatRequest({ message: CALM }, failing.deps));
    assert.equal(failing.calls.released, 1);
  });

  it('rejects malformed and oversized input', async () => {
    const { deps } = harness();
    assert.equal((await handleChatRequest(null, deps)).status, 413);
    assert.equal((await handleChatRequest({ message: 'x'.repeat(2001) }, deps)).status, 413);
    assert.equal((await handleChatRequest({ message: '   ' }, deps)).status, 400);
    assert.equal((await handleChatRequest({ message: 'Halo', history: [{ sender: 'system', text: 'x' }] }, deps)).status, 400);
  });

  it('only synthesises room audio for no-store ruang-ngobrol requests, from validated text', async () => {
    const plain = harness();
    await handleChatRequest({ message: CALM, voiceMode: 'ruang-ngobrol' }, plain.deps);
    assert.equal(plain.calls.tts.length, 0);
    const room = harness();
    const outcome = await handleChatRequest({ message: CALM, voiceMode: 'ruang-ngobrol', noStore: true }, room.deps);
    assert.deepEqual(room.calls.tts, ['Aku dengar kamu.']);
    assert.equal(outcome.data.roomAudio.mimeType, 'audio/wav');
  });
});

describe('Chat history limits share one source of truth (L1)', () => {
  const entry = (text) => ({ sender: 'user', text });
  it('request limits and context screening agree on count and entry length', () => {
    const atCount = Array.from({ length: CHAT_MAX_HISTORY_COUNT }, () => entry('ok'));
    const overCount = [...atCount, entry('ok')];
    assert.equal(chatInputWithinLimits({ message: 'Halo', history: atCount }), true);
    assert.equal(screenChatContext('Halo', atCount).error, undefined);
    assert.equal(chatInputWithinLimits({ message: 'Halo', history: overCount }), false);
    assert.ok(screenChatContext('Halo', overCount).error);

    const atLen = [entry('a'.repeat(CHAT_MAX_HISTORY_ENTRY))];
    const overLen = [entry('a'.repeat(CHAT_MAX_HISTORY_ENTRY + 1))];
    assert.equal(chatInputWithinLimits({ message: 'Halo', history: atLen }), true);
    assert.equal(screenChatContext('Halo', atLen).error, undefined);
    assert.equal(chatInputWithinLimits({ message: 'Halo', history: overLen }), false);
    assert.ok(screenChatContext('Halo', overLen).error);
    assert.ok(CHAT_CLIENT_HISTORY_ENTRIES <= CHAT_MAX_HISTORY_COUNT);
  });

  it('chatHistory.ts has no hard-coded limits of its own', () => {
    const source = readFileSync(new URL('../../apps/web/src/lib/api/chatHistory.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\b(24|4000|12|2000)\b/);
  });
});

describe('Route and page wiring (M9, H3, L7)', () => {
  const route = readFileSync(new URL('../../apps/web/src/app/api/chat/route.ts', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../../apps/web/src/app/chat/page.tsx', import.meta.url), 'utf8');

  it('route is a thin wrapper around the pure handler', () => {
    assert.match(route, /handleChatRequest\(parsed\.value/);
    assert.doesNotMatch(route, /runOrchestrator|writeAiCache|readAiCache|runCrisisGate/);
  });

  it('static welcome has no provider badge; badge typo is fixed', () => {
    assert.doesNotMatch(page, /deepseek:deepseek-flash/);
    assert.doesNotMatch(page, /Deblased/);
    assert.match(page, /Verified & Debiased/);
    assert.match(page, /!msg\.isWelcome && msg\.providerId/);
  });

  it('renders the support pathway as a static card linking /resources and /crisis', () => {
    // Extracted into a shared component so /ruang-ngobrol renders the same card.
    const card = readFileSync(new URL('../../apps/web/src/components/SupportPathwayCard.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(card, /animate-|transition|coral|#D93838|#FFEBEB/);
    assert.match(card, /pathway\.links\.map/);
    assert.match(page, /\{msg\.supportPathway && <SupportPathwayCard pathway=\{msg\.supportPathway\} \/>\}/);
    assert.match(page, /!msg\.supportPathway \? 'animate-reveal-up'/);
  });

  it('client stops waiting after a timeout and says so', () => {
    assert.match(page, /new AbortController\(\)/);
    assert.match(page, /CHAT_CLIENT_TIMEOUT_MS/);
    assert.match(page, /controller\.signal\.aborted/);
  });
});
