/**
 * Browser-native speech helpers. These functions intentionally do not call
 * network APIs, request permissions, persist data, or submit chat messages.
 */

import type { Language } from '../i18n/language.ts';

export const BROWSER_VOICE_PRIVACY_DISCLOSURE =
  'Suaramu diproses oleh fitur suara browser/perangkatmu. Dengar.in tidak menyimpan rekaman suara. Dukungan dan hasilnya bisa berbeda tiap browser.';
export const BROWSER_VOICE_PRIVACY_DISCLOSURE_EN =
  'Your voice is processed by your browser or device speech feature. Dengar.in does not store voice recordings. Support and results differ between browsers.';

/** Pengungkapan privasi fitur suara sesuai bahasa antarmuka (makna sama). */
export function browserVoicePrivacyDisclosure(lang: Language = 'id'): string {
  return lang === 'en' ? BROWSER_VOICE_PRIVACY_DISCLOSURE_EN : BROWSER_VOICE_PRIVACY_DISCLOSURE;
}

export interface BrowserSpeechRecognitionAlternative {
  transcript: string;
}

export interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: BrowserSpeechRecognitionAlternative;
}

export interface BrowserSpeechRecognitionResultList {
  length: number;
  [index: number]: BrowserSpeechRecognitionResult;
}

export interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: BrowserSpeechRecognitionResultList;
}

export interface BrowserSpeechRecognitionErrorEvent {
  error: string;
}

export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

export interface BrowserSpeechApiTarget {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  speechSynthesis?: Pick<SpeechSynthesis, 'cancel' | 'speak' | 'getVoices'>;
  SpeechSynthesisUtterance?: new (text?: string) => SpeechSynthesisUtterance;
}

export function getSpeechRecognitionConstructor(
  target: BrowserSpeechApiTarget | undefined
): BrowserSpeechRecognitionConstructor | undefined {
  return target?.SpeechRecognition ?? target?.webkitSpeechRecognition;
}

export function isSpeechRecognitionSupported(target: BrowserSpeechApiTarget | undefined): boolean {
  return Boolean(getSpeechRecognitionConstructor(target));
}

export function isSpeechSynthesisSupported(target: BrowserSpeechApiTarget | undefined): boolean {
  return Boolean(target?.speechSynthesis && target.SpeechSynthesisUtterance);
}

/** Append a final transcript without discarding text the person has already typed. */
export function appendTranscript(existingText: string, transcript: string): string {
  const existing = existingText.trim();
  const recognized = transcript.trim();
  if (!recognized) return existingText;
  return existing ? `${existing} ${recognized}` : recognized;
}

/**
 * The sole recognition-result mutation used by the chat UI. It deliberately
 * receives only an input setter, making submission, fetching, and rewards
 * impossible from the recognition callback.
 */
export function applyFinalTranscript(
  setInputText: (updater: (previous: string) => string) => void,
  transcript: string
): void {
  if (!transcript.trim()) return;
  setInputText((previous) => appendTranscript(previous, transcript));
}

export function getFinalTranscript(event: BrowserSpeechRecognitionEvent): string {
  const fragments: string[] = [];
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const alternative = result?.[0];
    if (result?.isFinal && alternative?.transcript) fragments.push(alternative.transcript);
  }
  return fragments.join(' ').trim();
}

// Suara "natural"/neural terdengar jauh lebih manusiawi daripada suara sistem lama.
const NATURAL_VOICE_HINT = /natural|neural|online|premium|enhanced|google|siri|gadis|damayanti|ardi/i;

function isIndonesian(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().replace('_', '-').startsWith('id');
}

/** Prefers id-ID, then any Indonesian voice; within each, natural/neural voices first. */
export function selectIndonesianVoice(
  voices: readonly SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  const indonesian = voices.filter(isIndonesian);
  const exact = indonesian.filter((voice) => voice.lang.toLowerCase().replace('_', '-') === 'id-id');
  return exact.find((voice) => NATURAL_VOICE_HINT.test(voice.name))
    ?? exact[0]
    ?? indonesian.find((voice) => NATURAL_VOICE_HINT.test(voice.name))
    ?? indonesian[0];
}

function isEnglish(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().replace('_', '-').startsWith('en');
}

/** Prefers en-US, then any English voice; within each, natural/neural voices first. */
export function selectEnglishVoice(
  voices: readonly SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  const english = voices.filter(isEnglish);
  const exact = english.filter((voice) => voice.lang.toLowerCase().replace('_', '-') === 'en-us');
  return exact.find((voice) => NATURAL_VOICE_HINT.test(voice.name))
    ?? exact[0]
    ?? english.find((voice) => NATURAL_VOICE_HINT.test(voice.name))
    ?? english[0];
}

/** Voice for the active UI language; undefined lets the browser pick its default. */
export function selectVoiceForLanguage(
  voices: readonly SpeechSynthesisVoice[],
  lang: Language
): SpeechSynthesisVoice | undefined {
  return lang === 'en' ? selectEnglishVoice(voices) : selectIndonesianVoice(voices);
}

export interface SpeechSegment {
  text: string;
  pitch: number;
  rate: number;
}

const BASE_RATE = 0.95;
const BASE_PITCH = 1;
const LONG_SENTENCE_CHARS = 180;
// Kalimat yang menenangkan dibaca lebih pelan dan lembut (ID dan EN).
const SOOTHING_WORDS: Record<Language, RegExp> = {
  id: /\b(tenang|pelan|perlahan|napas|nafas|tarik|embuskan|hembuskan|tidak apa|gak apa|nggak apa|aman|sendirian|istirahat|rehat|wajar|boleh)\b/i,
  en: /\b(calm|slow(?:ly)?|gently|gentle|breathe?|breathing|inhale|exhale|it'?s okay|it'?s alright|that'?s okay|safe|not alone|rest|normal|allowed|you can|take your time|no rush|easy)\b/i,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Cleans text so the synthesizer does not read symbols, markdown, emoji or URLs aloud. */
export function prepareSpeechText(text: string, lang: Language = 'id'): string {
  return text
    .replace(/https?:\/\/\S+/g, lang === 'en' ? 'link' : 'tautan')
    .replace(/[*_#`>~|]+/g, ' ')
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, ' ')
    .replace(/\bext\.?\s*(\d)/gi, lang === 'en' ? 'extension $1' : 'ekstensi $1')
    .replace(/\s*[\u2013\u2014]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text: string): string[] {
  const sentences = text.match(/[^.!?\u2026]+(?:[.!?\u2026]+["'\u201D\u2019)]*|$)/g) ?? [text];
  const parts: string[] = [];
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (sentence.length <= LONG_SENTENCE_CHARS) {
      parts.push(sentence);
      continue;
    }
    // Kalimat sangat panjang dipecah di koma/titik koma agar ada jeda napas.
    let current = '';
    for (const clause of sentence.split(/(?<=[,;:])\s+/)) {
      if (current && current.length + clause.length > LONG_SENTENCE_CHARS) {
        parts.push(current.trim());
        current = '';
      }
      current += `${clause} `;
    }
    if (current.trim()) parts.push(current.trim());
  }
  return parts;
}

/**
 * Plans sentence-by-sentence prosody so speech does not sound flat and robotic:
 * questions lift, exclamations brighten, soothing lines slow down and soften,
 * the closing line settles lower, and neighbouring sentences vary slightly.
 */
export function planExpressiveSpeech(text: string, lang: Language = 'id'): SpeechSegment[] {
  const sentences = splitSentences(prepareSpeechText(text, lang));
  const soothing = SOOTHING_WORDS[lang] ?? SOOTHING_WORDS.id;
  return sentences.map((sentence, index) => {
    let pitch = BASE_PITCH + (index % 2 === 0 ? 0.03 : -0.02);
    let rate = BASE_RATE + (index % 3 === 1 ? 0.03 : 0);
    const isLast = index === sentences.length - 1 && sentences.length > 1;

    if (index === 0) pitch += 0.03;
    if (/\?["'\u201D\u2019)]*$/.test(sentence)) {
      pitch += 0.1;
      rate += 0.02;
    } else if (/!["'\u201D\u2019)]*$/.test(sentence)) {
      pitch += 0.06;
      rate += 0.04;
    }
    if (soothing.test(sentence)) {
      pitch -= 0.04;
      rate -= 0.08;
    }
    if (isLast && !/\?["'\u201D\u2019)]*$/.test(sentence)) {
      pitch -= 0.04;
      rate -= 0.04;
    }

    return {
      text: sentence,
      pitch: Math.round(clamp(pitch, 0.85, 1.25) * 100) / 100,
      rate: Math.round(clamp(rate, 0.8, 1.1) * 100) / 100,
    };
  });
}

export interface ExpressiveSpeechOptions {
  /** BCP-47 tag for the utterances ('id-ID' default, 'en-US' for English). */
  lang?: string;
  voice?: SpeechSynthesisVoice;
  onend?: () => void;
  onerror?: () => void;
}

/**
 * Speaks text as a queue of expressive sentence utterances, replacing anything
 * already playing. `onend` fires once after the last sentence; `onerror` fires
 * once on the first failure and the rest of the queue is cancelled.
 */
export function speakExpressively(
  speechSynthesis: Pick<SpeechSynthesis, 'cancel' | 'speak'>,
  Utterance: new (text?: string) => SpeechSynthesisUtterance,
  text: string,
  options: ExpressiveSpeechOptions = {}
): SpeechSynthesisUtterance[] {
  const segments = planExpressiveSpeech(text, options.lang?.toLowerCase().startsWith('en') ? 'en' : 'id');
  const plan = segments.length > 0 ? segments : [{ text, pitch: BASE_PITCH, rate: BASE_RATE }];
  let settled = false;

  const utterances = plan.map((segment, index) => {
    const utterance = new Utterance(segment.text);
    utterance.lang = options.lang ?? 'id-ID';
    if (options.voice) utterance.voice = options.voice;
    utterance.pitch = segment.pitch;
    utterance.rate = segment.rate;
    if (index === plan.length - 1) {
      utterance.onend = () => {
        if (settled) return;
        settled = true;
        options.onend?.();
      };
    }
    utterance.onerror = () => {
      if (settled) return;
      settled = true;
      speechSynthesis.cancel();
      options.onerror?.();
    };
    return utterance;
  });

  speechSynthesis.cancel();
  for (const utterance of utterances) speechSynthesis.speak(utterance);
  return utterances;
}

const RECOGNITION_ERROR_TEXT: Record<Language, Record<'notAllowed' | 'noSpeech' | 'aborted' | 'network' | 'unknown', string>> = {
  id: {
    notAllowed: 'Izin mikrofon belum diberikan. Kamu tetap bisa menulis pesan.',
    noSpeech: 'Tidak ada suara yang terdengar. Coba lagi saat kamu siap.',
    aborted: 'Mendengarkan dihentikan.',
    network: 'Layanan pengenalan suara browser sedang tidak bisa dipakai. Kamu tetap bisa menulis pesan.',
    unknown: 'Pengenalan suara tidak dapat digunakan saat ini. Kamu tetap bisa menulis pesan.',
  },
  en: {
    notAllowed: 'Microphone permission was not given. You can still type your message.',
    noSpeech: 'No speech was heard. Try again when you are ready.',
    aborted: 'Listening stopped.',
    network: 'The browser speech service is not available right now. You can still type your message.',
    unknown: 'Speech recognition cannot be used right now. You can still type your message.',
  },
};

export function speechRecognitionErrorMessage(errorCode: string, lang: Language = 'id'): string {
  const text = RECOGNITION_ERROR_TEXT[lang] ?? RECOGNITION_ERROR_TEXT.id;
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return text.notAllowed;
    case 'no-speech':
      return text.noSpeech;
    case 'aborted':
      return text.aborted;
    case 'network':
      return text.network;
    default:
      return text.unknown;
  }
}

export function speakOneAtATime(
  speechSynthesis: Pick<SpeechSynthesis, 'cancel' | 'speak'>,
  utterance: SpeechSynthesisUtterance
): void {
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function cancelSpeech(speechSynthesis: Pick<SpeechSynthesis, 'cancel'> | undefined): void {
  speechSynthesis?.cancel();
}
