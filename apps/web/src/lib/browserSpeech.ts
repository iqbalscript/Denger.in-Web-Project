/**
 * Browser-native speech helpers. These functions intentionally do not call
 * network APIs, request permissions, persist data, or submit chat messages.
 */

export const BROWSER_VOICE_PRIVACY_DISCLOSURE =
  'Suaramu diproses oleh fitur suara browser/perangkatmu. Dengar.in tidak menyimpan rekaman suara. Dukungan dan pemrosesan dapat berbeda tergantung browser.';

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

export interface SpeechSegment {
  text: string;
  pitch: number;
  rate: number;
}

const BASE_RATE = 0.95;
const BASE_PITCH = 1;
const LONG_SENTENCE_CHARS = 180;
// Kalimat yang menenangkan dibaca lebih pelan dan lembut.
const SOOTHING_WORDS = /\b(tenang|pelan|perlahan|napas|nafas|tarik|embuskan|hembuskan|tidak apa|gak apa|nggak apa|aman|sendirian|istirahat|rehat|wajar|boleh)\b/i;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Cleans text so the synthesizer does not read symbols, markdown, emoji or URLs aloud. */
export function prepareSpeechText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, 'tautan')
    .replace(/[*_#`>~|]+/g, ' ')
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, ' ')
    .replace(/\bext\.?\s*(\d)/gi, 'ekstensi $1')
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
export function planExpressiveSpeech(text: string): SpeechSegment[] {
  const sentences = splitSentences(prepareSpeechText(text));
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
    if (SOOTHING_WORDS.test(sentence)) {
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
  const segments = planExpressiveSpeech(text);
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

export function speechRecognitionErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Izin mikrofon belum diberikan. Kamu tetap bisa menulis pesan.';
    case 'no-speech':
      return 'Tidak ada suara yang terdeteksi. Coba lagi saat kamu siap.';
    case 'aborted':
      return 'Pendengaran dihentikan.';
    case 'network':
      return 'Layanan pengenalan suara browser sedang tidak tersedia. Kamu tetap bisa menulis pesan.';
    default:
      return 'Pengenalan suara tidak dapat digunakan saat ini. Kamu tetap bisa menulis pesan.';
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
