import type { ValidatedAIAction } from '@dengarin/types';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { AgeBracket } from '@dengarin/types';
import type { Language } from '../i18n/language.ts';

/**
 * Pure state and display helpers for the turn-based Ruang Ngobrol controller.
 * They deliberately contain no browser, storage, network, provider, or reward
 * side effects.
 */
export const VOICE_ROOM_MAX_SESSION_MS = 10 * 60 * 1000;
export const VOICE_ROOM_EXPIRY_WARNING_MS = 60 * 1000;
export const VOICE_ROOM_MAX_CAPTIONS = 8;
export const VOICE_ROOM_MAX_HISTORY = 6;
export const VOICE_ROOM_PRIVACY_DISCLOSURE =
  'Suaramu diproses oleh fitur suara browser/perangkatmu; dukungan dan hasilnya bisa berbeda tiap browser. Suara Dengar.in dibuat Google Gemini dari balasan yang sudah dicek aman. Dengar.in tidak menyimpan rekaman mikrofon atau audio suara yang dibuat.';
export const VOICE_ROOM_PRIVACY_DISCLOSURE_EN =
  'Your voice is processed by your browser or device speech feature; support and results differ between browsers. The Dengar.in voice is made by Google Gemini from a reply that has already passed safety checks. Dengar.in does not store microphone recordings or the generated audio.';

/** Pengungkapan privasi ruang suara sesuai bahasa antarmuka (makna sama di kedua bahasa). */
export function voiceRoomPrivacyDisclosure(lang: Language = 'id'): string {
  return lang === 'en' ? VOICE_ROOM_PRIVACY_DISCLOSURE_EN : VOICE_ROOM_PRIVACY_DISCLOSURE;
}

export type VoiceRoomState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'ERROR'
  | 'CRISIS'
  | 'ENDED';

const ALLOWED_TRANSITIONS: Record<VoiceRoomState, readonly VoiceRoomState[]> = {
  IDLE: ['LISTENING', 'ERROR', 'ENDED'],
  LISTENING: ['PROCESSING', 'IDLE', 'ERROR', 'CRISIS', 'ENDED'],
  PROCESSING: ['SPEAKING', 'IDLE', 'ERROR', 'CRISIS', 'ENDED'],
  SPEAKING: ['LISTENING', 'IDLE', 'ERROR', 'CRISIS', 'ENDED'],
  ERROR: ['IDLE', 'LISTENING', 'PROCESSING', 'CRISIS', 'ENDED'],
  CRISIS: ['ENDED'],
  ENDED: ['IDLE', 'LISTENING', 'ERROR'],
};

export function canTransitionVoiceRoom(
  from: VoiceRoomState,
  to: VoiceRoomState
): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

export interface VoiceRoomCaption {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export function appendVoiceRoomCaption(
  captions: readonly VoiceRoomCaption[],
  caption: VoiceRoomCaption
): VoiceRoomCaption[] {
  return [...captions, caption].slice(-VOICE_ROOM_MAX_CAPTIONS);
}

export function voiceRoomHistory(
  captions: readonly VoiceRoomCaption[]
): Array<{ sender: 'user' | 'assistant'; text: string }> {
  return captions.slice(-VOICE_ROOM_MAX_HISTORY).map(({ sender, text }) => ({ sender, text }));
}

/**
 * The room's client-side defense-in-depth gate. It is intentionally a thin
 * wrapper around the canonical deterministic crisis engine, not a new model
 * or classifier.
 */
export function screenVoiceRoomFinalTranscript(rawTranscript: string, ageBracket?: AgeBracket): {
  transcript: string;
  isCrisis: boolean;
} {
  const transcript = rawTranscript.trim();
  return {
    transcript,
    isCrisis: Boolean(transcript) && evaluateCrisisInput(transcript, ageBracket).isCrisis,
  };
}

export function shouldResumeVoiceRoomListening(input: {
  sessionActive: boolean;
  muted: boolean;
  currentGeneration: boolean;
  state: VoiceRoomState;
}): boolean {
  return input.sessionActive
    && !input.muted
    && input.currentGeneration
    && input.state === 'SPEAKING';
}

const ACTION_FALLBACK_TEXT = {
  id: {
    suggest_mission: 'Aku menyarankan satu misi singkat untuk membantumu saat ini:',
    open_journal_prompt: 'Mungkin menulis isi pikiranmu di jurnal bisa membantu melegakan:',
    suggest_forum: (topic: string) =>
      `Banyak teman di Ruang Cerita Dengar.in yang juga menghadapi hal serupa di topik ${topic}. Kamu bisa membaca cerita mereka atau ikut bercerita secara anonim:`,
    show_help_directory: 'Kalau beban ini terasa butuh bantuan profesional, kamu bisa melihat daftar bantuan kami:',
    adjust_path: 'Kami menyarankan kamu mengatur ulang kecepatan langkahmu:',
  },
  en: {
    suggest_mission: 'I suggest one short mission that may help you right now:',
    open_journal_prompt: 'Writing what is on your mind in your journal might bring some relief:',
    suggest_forum: (topic: string) =>
      `Many people in the Dengar.in Story Room are going through something similar under the topic ${topic}. You can read their stories or share yours anonymously:`,
    show_help_directory: 'If this feels like it needs professional help, you can look at our help directory:',
    adjust_path: 'We suggest adjusting the pace of your steps:',
  },
} as const;

/**
 * Converts only known, validated action shapes into rendered text. Returning
 * null prevents an unexpected response payload from reaching browser TTS.
 * `lang` only changes the fixed lead-in sentences; model text is passed as is.
 */
export function validatedActionDisplayText(action: unknown, lang: Language = 'id'): string | null {
  if (!action || typeof action !== 'object' || !('action' in action)) return null;
  const candidate = action as Partial<ValidatedAIAction> & Record<string, unknown>;
  const text = ACTION_FALLBACK_TEXT[lang] ?? ACTION_FALLBACK_TEXT.id;

  switch (candidate.action) {
    case 'chat':
      return typeof candidate.message === 'string' && candidate.message.trim()
        ? candidate.message.trim()
        : null;
    case 'suggest_mission':
      return typeof candidate.reason === 'string' && candidate.reason.trim()
        ? candidate.reason.trim()
        : text.suggest_mission;
    case 'open_journal_prompt':
      return typeof candidate.prompt === 'string' && candidate.prompt.trim()
        ? candidate.prompt.trim()
        : text.open_journal_prompt;
    case 'suggest_forum':
      return typeof candidate.topicSlug === 'string' && candidate.topicSlug.trim()
        ? text.suggest_forum(candidate.topicSlug)
        : null;
    case 'show_help_directory':
      return text.show_help_directory;
    case 'adjust_path':
      return typeof candidate.reason === 'string' && candidate.reason.trim()
        ? candidate.reason.trim()
        : text.adjust_path;
    default:
      return null;
  }
}
