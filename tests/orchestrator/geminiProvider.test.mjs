import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGeminiProvider } from '../../services/orchestrator/src/providers/geminiProvider.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function captureFetch(reply) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(reply), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return calls;
}

describe('Gemini provider credential handling', () => {
  it('sends the API key as a header, never inside the request URL', async () => {
    const calls = captureFetch({ candidates: [{ content: { parts: [{ text: '{"action":"chat"}' }] } }] });
    const provider = createGeminiProvider('SECRET-KEY-123', 'gemini-test');

    const result = await provider.generate({ systemPrompt: 'sys', userPrompt: 'halo', timeoutMs: 1000 });

    assert.equal(result.rawText, '{"action":"chat"}');
    assert.equal(calls.length, 1);
    assert.doesNotMatch(calls[0].url, /SECRET-KEY-123|[?&]key=/);
    assert.equal(calls[0].init.headers['x-goog-api-key'], 'SECRET-KEY-123');
    assert.match(calls[0].url, /\/models\/gemini-test:generateContent$/);
  });

  it('reports unconfigured when the key is empty', () => {
    assert.equal(createGeminiProvider('', 'gemini-test').isConfigured(), false);
    assert.equal(createGeminiProvider('   ', 'gemini-test').isConfigured(), false);
    assert.equal(createGeminiProvider('k', 'gemini-test').isConfigured(), true);
  });
});
