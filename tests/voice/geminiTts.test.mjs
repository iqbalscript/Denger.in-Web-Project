import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  GEMINI_TTS_MAX_TEXT_CHARS,
  GEMINI_TTS_MAX_BASE64_CHARS,
  GEMINI_TTS_MODEL,
  GEMINI_TTS_VOICE,
  createGeminiTtsProvider,
} from '../../apps/web/src/lib/api/geminiTts.ts';
import { acquireTtsSlot } from '../../apps/web/src/lib/api/rateLimit.ts';

const routeSource = readFileSync(new URL('../../apps/web/src/app/api/chat/route.ts', import.meta.url), 'utf8');
const roomSource = readFileSync(new URL('../../apps/web/src/app/ruang-ngobrol/page.tsx', import.meta.url), 'utf8');
function createValidWav() {
  const wav = Buffer.alloc(44);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(24000, 24);
  wav.writeUInt32LE(48000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  return wav.toString('base64');
}

const validWav = createValidWav();

function providerWith(responseFactory) {
  const calls = [];
  const provider = createGeminiTtsProvider('server-only-key', async (...args) => {
    calls.push(args);
    return responseFactory();
  });
  return { provider, calls };
}

describe('Gemini TTS room enhancement', () => {
  it('uses the fixed GA model, calm prebuilt voice, unary WAV, and stateless interaction request', async () => {
    const { provider, calls } = providerWith(() => new Response(JSON.stringify({
      steps: [{ content: [{ type: 'audio', mime_type: 'audio/wav', data: validWav }] }],
    })));
    const result = await provider.synthesizeValidatedText('Respons aman yang sudah divalidasi.');
    assert.equal(result.ok, true);
    assert.equal(result.model, GEMINI_TTS_MODEL);
    assert.equal(result.voice, GEMINI_TTS_VOICE);
    assert.equal(calls.length, 1);
    const request = JSON.parse(calls[0][1].body);
    assert.equal(request.model, 'gemini-3.8-flash-lite-tts');
    assert.equal(request.store, false);
    assert.equal(request.response_format.mime_type, 'audio/wav');
    assert.equal(request.response_format.sample_rate, 24000);
    assert.equal(request.generation_config.speech_config[0].voice, 'Vindemiatrix');
    assert.equal(request.input[0].content[0].text, 'Respons aman yang sudah divalidasi.');
  });

  it('rejects malformed, oversized, and oversized-text outputs without a provider retry', async () => {
    const malformed = providerWith(() => new Response(JSON.stringify({
      steps: [{ content: [{ type: 'audio', mime_type: 'audio/wav', data: 'not-base64' }] }],
    })));
    assert.deepEqual(await malformed.provider.synthesizeValidatedText('Aman.'), { ok: false, reason: 'malformed-audio' });
    assert.equal(malformed.calls.length, 1);

    const oversized = providerWith(() => new Response(JSON.stringify({
      steps: [{ content: [{ type: 'audio', mime_type: 'audio/wav', data: 'A'.repeat(GEMINI_TTS_MAX_BASE64_CHARS + 4) }] }],
    })));
    assert.deepEqual(await oversized.provider.synthesizeValidatedText('Aman.'), { ok: false, reason: 'audio-too-large' });
    assert.equal(oversized.calls.length, 1);

    const oversizedText = providerWith(() => { throw new Error('must not call'); });
    assert.deepEqual(await oversizedText.provider.synthesizeValidatedText('x'.repeat(GEMINI_TTS_MAX_TEXT_CHARS + 1)), { ok: false, reason: 'text-too-large' });
    assert.equal(oversizedText.calls.length, 0);
  });

  it('returns an enhancement failure for provider errors rather than retrying', async () => {
    const { provider, calls } = providerWith(() => new Response('no', { status: 503 }));
    assert.deepEqual(await provider.synthesizeValidatedText('Aman.'), { ok: false, reason: 'provider-error' });
    assert.equal(calls.length, 1);
  });

  it('times out once and has a separate process-local synthesis concurrency guard', async () => {
    let calls = 0;
    const slowProvider = createGeminiTtsProvider('server-only-key', async (_url, init) => {
      calls += 1;
      await new Promise((resolve) => init.signal.addEventListener('abort', resolve, { once: true }));
      throw new Error('aborted');
    }, 1);
    assert.deepEqual(await slowProvider.synthesizeValidatedText('Aman.'), { ok: false, reason: 'timeout' });
    assert.equal(calls, 1);

    const first = acquireTtsSlot();
    const second = acquireTtsSlot();
    assert.ok(first);
    assert.equal(second, null);
    first();
    const afterRelease = acquireTtsSlot();
    assert.ok(afterRelease);
    afterRelease();
  });

  it('keeps normal chat from invoking TTS and prevents browser-supplied synthesis text', () => {
    assert.match(routeSource, /body\.voiceMode === 'ruang-ngobrol' && body\.noStore === true/);
    assert.match(routeSource, /validatedActionDisplayText\(result\.action\)/);
    assert.doesNotMatch(routeSource, /ttsText|audioText|synthesisText/);
    assert.doesNotMatch(routeSource, /export async function.*tts/i);
    assert.doesNotMatch(roomSource, /synthesizeValidatedText|generativelanguage\.googleapis\.com|WebSocket/);
  });

  it('keeps audio transient and prevents stale callbacks from restarting playback or listening', () => {
    assert.match(roomSource, /URL\.createObjectURL/);
    assert.match(roomSource, /URL\.revokeObjectURL/);
    assert.match(roomSource, /generation !== generationRef\.current/);
    assert.match(roomSource, /stopRecognition\(true\)/);
    assert.match(roomSource, /audio\.onended/);
    assert.match(roomSource, /speakValidatedResponse\(displayText, generation\)/);
    assert.doesNotMatch(roomSource, /localStorage|sessionStorage|indexedDB/);
  });
});
