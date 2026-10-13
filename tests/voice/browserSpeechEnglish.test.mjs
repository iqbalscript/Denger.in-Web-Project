import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  browserVoicePrivacyDisclosure,
  planExpressiveSpeech,
  prepareSpeechText,
  selectEnglishVoice,
  selectIndonesianVoice,
  selectVoiceForLanguage,
  speakExpressively,
  speechRecognitionErrorMessage,
} from '../../apps/web/src/lib/browserSpeech.ts';
import { voiceRoomPrivacyDisclosure, VOICE_ROOM_PRIVACY_DISCLOSURE } from '../../apps/web/src/lib/voiceRoom.ts';
import { LOCALE_TAG, parseLanguageCookie, languageCookieValue, LANGUAGE_INIT_SCRIPT } from '../../apps/web/src/i18n/language.ts';

describe('Browser speech: English path', () => {
  it('maps recognition errors to English when lang is en, Indonesian otherwise', () => {
    assert.match(speechRecognitionErrorMessage('not-allowed', 'en'), /Microphone permission/);
    assert.match(speechRecognitionErrorMessage('no-speech', 'en'), /No speech/);
    assert.match(speechRecognitionErrorMessage('aborted', 'en'), /stopped/);
    assert.match(speechRecognitionErrorMessage('network', 'en'), /speech service/);
    assert.match(speechRecognitionErrorMessage('unknown', 'en'), /cannot be used/);
    assert.match(speechRecognitionErrorMessage('not-allowed'), /Izin mikrofon/);
    assert.match(speechRecognitionErrorMessage('not-allowed', 'id'), /Izin mikrofon/);
  });

  it('prefers an en-US natural voice, then any English voice, never an Indonesian one', () => {
    const voices = [
      { name: 'Indonesia', lang: 'id-ID' },
      { name: 'English UK', lang: 'en-GB' },
      { name: 'English Compact', lang: 'en-US' },
      { name: 'Microsoft Aria Online (Natural)', lang: 'en-US' },
    ];
    assert.equal(selectEnglishVoice(voices).name, 'Microsoft Aria Online (Natural)');
    assert.equal(selectEnglishVoice(voices.slice(0, 2)).name, 'English UK');
    assert.equal(selectEnglishVoice([{ name: 'Indonesia', lang: 'id-ID' }]), undefined);
    assert.equal(selectVoiceForLanguage(voices, 'en').name, 'Microsoft Aria Online (Natural)');
    assert.equal(selectVoiceForLanguage(voices, 'id').name, 'Indonesia');
    assert.equal(selectIndonesianVoice(voices).name, 'Indonesia');
  });

  it('reads links and extensions in English and slows down on English soothing words', () => {
    assert.equal(prepareSpeechText('Call 119 ext 8 or open https://healing119.id', 'en'), 'Call 119 extension 8 or open link');
    assert.equal(prepareSpeechText('Telepon 119 ext 8'), 'Telepon 119 ekstensi 8');
    const plan = planExpressiveSpeech('I hear you. Was today heavy? Take a slow breath first. I am still here.', 'en');
    assert.equal(plan.length, 4);
    assert.ok(plan[1].pitch > plan[2].pitch, 'questions lift above soothing lines');
    assert.ok(plan[2].rate < plan[1].rate, 'English soothing lines slow down');
    for (const segment of plan) {
      assert.ok(segment.pitch >= 0.85 && segment.pitch <= 1.25);
      assert.ok(segment.rate >= 0.8 && segment.rate <= 1.1);
    }
  });

  it('speaks English utterances with en-US and keeps id-ID as the default', () => {
    const spoken = [];
    const synthesizer = { cancel: () => {}, speak: (utterance) => { spoken.push(utterance); } };
    class FakeUtterance { constructor(text) { this.text = text; } }
    speakExpressively(synthesizer, FakeUtterance, 'One. Two? Three.', { lang: LOCALE_TAG.en });
    assert.deepEqual(spoken.map((u) => u.text), ['One.', 'Two?', 'Three.']);
    assert.ok(spoken.every((u) => u.lang === 'en-US'));
    spoken.length = 0;
    speakExpressively(synthesizer, FakeUtterance, 'Satu. Dua.');
    assert.ok(spoken.every((u) => u.lang === 'id-ID'));
  });

  it('privacy disclosures keep the same facts in both languages', () => {
    for (const [id, en] of [
      [browserVoicePrivacyDisclosure('id'), browserVoicePrivacyDisclosure('en')],
      [voiceRoomPrivacyDisclosure('id'), voiceRoomPrivacyDisclosure('en')],
    ]) {
      assert.match(id, /tidak menyimpan/);
      assert.match(en, /does not store/);
      assert.doesNotMatch(`${id}${en}`, /[–—]/);
    }
    assert.equal(voiceRoomPrivacyDisclosure(), VOICE_ROOM_PRIVACY_DISCLOSURE);
    assert.match(voiceRoomPrivacyDisclosure('en'), /Google Gemini/);
  });
});

describe('Language cookie helpers', () => {
  it('parses only id/en from the dengarin-lang cookie and defaults to id', () => {
    assert.equal(parseLanguageCookie('a=b; dengarin-lang=en; c=d'), 'en');
    assert.equal(parseLanguageCookie('dengarin-lang=id'), 'id');
    assert.equal(parseLanguageCookie('dengarin-lang=fr'), 'id');
    assert.equal(parseLanguageCookie('other-lang=en'), 'id');
    assert.equal(parseLanguageCookie(undefined), 'id');
  });

  it('writes a one-year, SameSite=Lax, path-wide cookie and an init script without eval', () => {
    assert.match(languageCookieValue('en'), /^dengarin-lang=en; Path=\/; Max-Age=31536000; SameSite=Lax$/);
    assert.match(LANGUAGE_INIT_SCRIPT, /documentElement\.lang/);
    assert.doesNotMatch(LANGUAGE_INIT_SCRIPT, /eval|Function\(/);
  });
});
