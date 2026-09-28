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

export function selectIndonesianVoice(
  voices: readonly SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  return voices.find((voice) => voice.lang.toLowerCase() === 'id-id')
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('id'));
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
