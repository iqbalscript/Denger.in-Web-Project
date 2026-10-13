import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  applyFinalTranscript,
  appendTranscript,
  cancelSpeech,
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  planExpressiveSpeech,
  prepareSpeechText,
  selectIndonesianVoice,
  speakExpressively,
  speakOneAtATime,
  speechRecognitionErrorMessage,
} from '../../apps/web/src/lib/browserSpeech.ts';
import { evaluateCrisisInput } from '../../services/crisis-engine/src/crisisDetector.ts';

describe('Browser speech utility', () => {
  it('detects an unsupported SpeechRecognition browser', () => {
    assert.equal(getSpeechRecognitionConstructor({}), undefined);
    assert.equal(isSpeechRecognitionSupported({}), false);
  });

  it('detects the webkit SpeechRecognition compatibility alias', () => {
    class MockRecognition {}
    assert.equal(getSpeechRecognitionConstructor({ webkitSpeechRecognition: MockRecognition }), MockRecognition);
    assert.equal(isSpeechRecognitionSupported({ webkitSpeechRecognition: MockRecognition }), true);
  });

  it('detects an unsupported speechSynthesis browser', () => {
    assert.equal(isSpeechSynthesisSupported({}), false);
  });

  it('preserves typed text when appending a final transcript', () => {
    assert.equal(appendTranscript('Aku sudah mencoba menulis', 'dan ingin melanjutkan cerita'), 'Aku sudah mencoba menulis dan ingin melanjutkan cerita');
    assert.equal(appendTranscript('', 'Halo'), 'Halo');
    assert.equal(appendTranscript('Tetap sama', '   '), 'Tetap sama');
  });

  it('recognition success only updates input text; it does not submit, fetch, or award gamification', () => {
    let inputText = 'Aku merasa';
    let submitCalls = 0;
    let fetchCalls = 0;
    let gamificationCalls = 0;
    const previousFetch = globalThis.fetch;
    globalThis.fetch = () => {
      fetchCalls += 1;
      return Promise.reject(new Error('Unexpected fetch'));
    };

    try {
      applyFinalTranscript((updater) => { inputText = updater(inputText); }, 'sangat kewalahan');
      assert.equal(inputText, 'Aku merasa sangat kewalahan');
      assert.equal(submitCalls, 0);
      assert.equal(fetchCalls, 0);
      assert.equal(gamificationCalls, 0);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it('keeps the chat recognition callback isolated from submit, fetch, and gamification paths', () => {
    const chatSource = readFileSync(new URL('../../apps/web/src/app/chat/page.tsx', import.meta.url), 'utf8');
    const resultCallback = chatSource
      .split('recognition.onresult = (event) => {')[1]
      .split('recognition.onerror =')[0];

    assert.match(resultCallback, /applyFinalTranscript\(setInputText, getFinalTranscript\(event\)\)/);
    assert.doesNotMatch(resultCallback, /sendMessageWithText\s*\(/);
    assert.doesNotMatch(resultCallback, /fetch\s*\(/);
    assert.doesNotMatch(resultCallback, /awardLangkah\s*\(/);
  });

  it('maps recognition errors to actionable Indonesian text', () => {
    assert.match(speechRecognitionErrorMessage('not-allowed'), /Izin mikrofon/);
    assert.match(speechRecognitionErrorMessage('no-speech'), /Tidak ada suara/);
    assert.match(speechRecognitionErrorMessage('aborted'), /dihentikan/);
    assert.match(speechRecognitionErrorMessage('network'), /Layanan pengenalan suara/);
    assert.match(speechRecognitionErrorMessage('unknown'), /tidak dapat digunakan/);
  });

  it('prefers an id-ID voice, then Indonesian, then the browser default', () => {
    const voices = [
      { name: 'English', lang: 'en-US' },
      { name: 'Bahasa', lang: 'id' },
      { name: 'Indonesia', lang: 'id-ID' },
    ];
    assert.equal(selectIndonesianVoice(voices).name, 'Indonesia');
    assert.equal(selectIndonesianVoice(voices.slice(0, 2)).name, 'Bahasa');
    assert.equal(selectIndonesianVoice([{ name: 'English', lang: 'en-US' }]), undefined);
  });

  it('cancels any prior utterance before speaking and supports cleanup cancellation', () => {
    let cancelCalls = 0;
    let spokenUtterance = null;
    const synthesizer = {
      cancel: () => { cancelCalls += 1; },
      speak: (utterance) => { spokenUtterance = utterance; },
    };
    const utterance = { text: 'Respons aman' };

    speakOneAtATime(synthesizer, utterance);
    assert.equal(cancelCalls, 1);
    assert.equal(spokenUtterance, utterance);
    cancelSpeech(synthesizer);
    assert.equal(cancelCalls, 2);
  });

  it('prefers a natural/neural Indonesian voice over a robotic one', () => {
    const voices = [
      { name: 'Indonesian Compact', lang: 'id-ID' },
      { name: 'Microsoft Gadis Online (Natural)', lang: 'id-ID' },
    ];
    assert.equal(selectIndonesianVoice(voices).name, 'Microsoft Gadis Online (Natural)');
  });

  it('cleans symbols, emoji and URLs before speaking', () => {
    assert.equal(prepareSpeechText('**Halo** 🙂 cek https://contoh.id ya'), 'Halo cek tautan ya');
    assert.equal(prepareSpeechText('Telepon 119 ext 8'), 'Telepon 119 ekstensi 8');
  });

  it('varies pitch and rate per sentence instead of one flat delivery', () => {
    const plan = planExpressiveSpeech('Aku dengar kamu. Hari ini berat ya? Tarik napas pelan dulu. Aku tetap di sini.');
    assert.equal(plan.length, 4);
    const question = plan[1];
    const soothing = plan[2];
    assert.ok(question.pitch > plan[0].pitch - 0.05 && question.pitch > soothing.pitch, 'questions lift');
    assert.ok(soothing.rate < question.rate, 'soothing lines slow down');
    assert.ok(new Set(plan.map((segment) => `${segment.pitch}/${segment.rate}`)).size > 1, 'not monotone');
    for (const segment of plan) {
      assert.ok(segment.pitch >= 0.85 && segment.pitch <= 1.25);
      assert.ok(segment.rate >= 0.8 && segment.rate <= 1.1);
    }
  });

  it('queues sentence utterances after cancelling, and settles once', () => {
    const spoken = [];
    let cancelCalls = 0;
    const synthesizer = { cancel: () => { cancelCalls += 1; }, speak: (utterance) => { spoken.push(utterance); } };
    class FakeUtterance { constructor(text) { this.text = text; } }
    let ended = 0;
    let errored = 0;
    speakExpressively(synthesizer, FakeUtterance, 'Satu. Dua? Tiga.', { onend: () => { ended += 1; }, onerror: () => { errored += 1; } });
    assert.equal(cancelCalls, 1);
    assert.deepEqual(spoken.map((utterance) => utterance.text), ['Satu.', 'Dua?', 'Tiga.']);
    assert.equal(spoken[0].lang, 'id-ID');
    spoken[2].onend();
    spoken[2].onend();
    assert.equal(ended, 1);
    spoken[0].onerror();
    assert.equal(errored, 0, 'no error callback after the queue already finished');
  });

  it('keeps the existing crisis path intact after a person explicitly submits a transcript', () => {
    const transcript = appendTranscript('Aku', 'mau bunuh diri');
    const crisis = evaluateCrisisInput(transcript, '18-24');
    assert.equal(crisis.isCrisis, true);
  });
});
