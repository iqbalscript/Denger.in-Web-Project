import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleChatRequest, CHAT_BUSY, CHAT_BUSY_EN, requestLanguage } from '../../apps/web/src/lib/api/chatHandler.ts';
import { aiCacheKey } from '../../apps/web/src/lib/api/aiCache.ts';
import { STANDARD_DISCLAIMER } from '../../services/validator/src/actionValidator.ts';
import { buildChatSystemPrompt } from '../../packages/prompts/src/index.ts';
import { runOrchestrator } from '../../services/orchestrator/src/orchestrator.ts';
import { validatedActionDisplayText } from '../../apps/web/src/lib/voiceRoom.ts';

// Synthetic inputs only.
const CALM = 'I am so tired of my thesis this week.';
const CRISIS_EN = 'I want to kill myself.';
const HIGH_EN = "I can't take this anymore.";

function harness({ env = {}, rateLimited = false } = {}) {
  const calls = { orchestrator: [], cacheRead: [], cacheWrite: [], tts: [] };
  const deps = {
    env,
    isRateLimited: async () => rateLimited,
    acquireSlot: async () => () => {},
    runOrchestrator: async (request) => {
      calls.orchestrator.push(request);
      return {
        tier: 'primary',
        providerId: 'deepseek:test',
        action: { action: 'suggest_mission', missionId: 'breath-478', reason: '', disclaimer: STANDARD_DISCLAIMER },
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

describe('/api/chat handler: UI language passthrough', () => {
  it('treats anything but "en" as Indonesian (untrusted field)', () => {
    assert.equal(requestLanguage({ lang: 'en' }), 'en');
    assert.equal(requestLanguage({ lang: 'id' }), 'id');
    assert.equal(requestLanguage({ lang: 'fr' }), 'id');
    assert.equal(requestLanguage({ lang: { toString: () => 'en' } }), 'id');
    assert.equal(requestLanguage(null), 'id');
  });

  it('passes lang to the orchestrator and keeps the pipeline order', async () => {
    const { deps, calls } = harness();
    const outcome = await handleChatRequest({ message: CALM, lang: 'en' }, deps);
    assert.equal(outcome.ok, true);
    assert.equal(outcome.data.crisis, false);
    assert.equal(calls.orchestrator[0].lang, 'en');
    const id = await handleChatRequest({ message: CALM }, deps);
    assert.equal(id.ok, true);
    assert.equal(calls.orchestrator[1].lang, 'id');
  });

  it('English crisis text halts before the orchestrator, exactly like Indonesian', async () => {
    const { deps, calls } = harness({ env: { AI_RESPONSE_CACHE: 'true' } });
    const outcome = await handleChatRequest({ message: CRISIS_EN, lang: 'en' }, deps);
    assert.equal(outcome.data.crisis, true);
    assert.equal(outcome.data.evaluation.severity, 'crisis');
    assert.match(outcome.data.evaluation.immediateInterventionCopy, /Healing119/);
    assert.equal(calls.orchestrator.length, 0);
    assert.equal(calls.cacheRead.length, 0);
  });

  it('English high distress gets an English support pathway that the model cannot remove', async () => {
    const { deps } = harness();
    const outcome = await handleChatRequest({ message: HIGH_EN, lang: 'en', ageBracket: '18-24' }, deps);
    assert.equal(outcome.data.crisis, false);
    assert.equal(outcome.data.supportPathway?.severity, 'high');
    assert.equal(outcome.data.supportPathway?.title, 'Want to talk to a trained person too?');
    assert.ok(outcome.data.supportPathway?.contacts.length > 0);
  });

  it('cache keys differ by language so EN and ID replies never cross', async () => {
    const { deps, calls } = harness({ env: { AI_RESPONSE_CACHE: 'true' } });
    await handleChatRequest({ message: CALM, lang: 'en' }, deps);
    await handleChatRequest({ message: CALM, lang: 'id' }, deps);
    await handleChatRequest({ message: CALM }, deps);
    assert.equal(calls.cacheRead.length, 3);
    assert.notEqual(calls.cacheRead[0], calls.cacheRead[1]);
    assert.equal(calls.cacheRead[1], calls.cacheRead[2], 'missing lang equals id');
    for (const key of calls.cacheRead) assert.match(key, /^dengarin:ai:[a-f0-9]{64}$/);
    assert.notEqual(aiCacheKey({ message: 'x', lang: 'en' }), aiCacheKey({ message: 'x', lang: 'id' }));
    assert.equal(aiCacheKey({ message: 'x' }), aiCacheKey({ message: 'x', lang: 'id' }));
  });

  it('localises only the fixed handler messages; limits and statuses stay the same', async () => {
    const { deps } = harness({ rateLimited: true });
    const en = await handleChatRequest({ message: CALM, lang: 'en' }, deps);
    const id = await handleChatRequest({ message: CALM }, deps);
    assert.equal(en.status, 429);
    assert.equal(id.status, 429);
    assert.equal(en.error, CHAT_BUSY_EN);
    assert.equal(id.error, CHAT_BUSY);
    assert.equal((await handleChatRequest({ message: 'x'.repeat(2001), lang: 'en' }, deps)).status, 413);
  });

  it('room TTS lead-in follows the UI language for non-chat actions', async () => {
    const { deps, calls } = harness();
    await handleChatRequest({ message: CALM, lang: 'en', voiceMode: 'ruang-ngobrol', noStore: true }, deps);
    assert.deepEqual(calls.tts, ['I suggest one short mission that may help you right now:']);
    const action = { action: 'suggest_mission', missionId: 'm', reason: '', disclaimer: STANDARD_DISCLAIMER };
    assert.match(validatedActionDisplayText(action), /misi/);
    assert.match(validatedActionDisplayText(action, 'en'), /mission/);
    assert.equal(validatedActionDisplayText({ action: 'unknown', message: 'raw' }, 'en'), null);
  });
});

describe('prompt and orchestrator: English reply instruction keeps the safety contract', () => {
  it('system prompt adds English reply rules only for lang en, with the Indonesian disclaimer verbatim', () => {
    const id = buildChatSystemPrompt({ ageBracket: '18-24' });
    const en = buildChatSystemPrompt({ ageBracket: '18-24', lang: 'en' });
    assert.doesNotMatch(id, /plain English/);
    assert.match(en, /plain English/);
    assert.match(en, /disclaimer.*verbatim/);
    assert.ok(en.startsWith(id), 'English rules are appended; nothing from the Indonesian contract is removed');
  });

  it('deterministic fallback and domain gate answer in English when asked', async () => {
    const unconfigured = { id: 'none', isConfigured: () => false, generate: async () => ({ rawText: '' }) };
    const fallback = await runOrchestrator({ message: 'I feel low today', lang: 'en' }, { providers: [unconfigured], enableDebiaser: false });
    assert.equal(fallback.tier, 'fallback');
    assert.match(fallback.action.message, /^I am here with you/);
    assert.equal(fallback.action.disclaimer, STANDARD_DISCLAIMER);

    const gate = await runOrchestrator({ message: 'write code for fizzbuzz in python', lang: 'en' }, { providers: [unconfigured], enableDebiaser: false });
    assert.equal(gate.providerId, 'guardrail:domain-gate');
    assert.match(gate.action.message, /not as a coding assistant/);
    assert.equal(gate.action.disclaimer, STANDARD_DISCLAIMER);

    const gateId = await runOrchestrator({ message: 'buatkan fungsi untuk sorting' }, { providers: [unconfigured], enableDebiaser: false });
    assert.match(gateId.action.message, /bukan asisten pemrograman/);
  });

  it('validator still rejects unsafe English model output in EN mode', async () => {
    const provider = {
      id: 'evil',
      isConfigured: () => true,
      generate: async () => ({ rawText: JSON.stringify({ action: 'chat', message: 'You definitely have bipolar disorder, stop taking your medication.', disclaimer: STANDARD_DISCLAIMER }) }),
    };
    const result = await runOrchestrator({ message: 'I feel low', lang: 'en' }, { providers: [provider], enableDebiaser: false });
    assert.equal(result.tier, 'fallback');
    assert.doesNotMatch(result.action.message, /bipolar|medication/i);
  });
});
