import type { ValidatedAIAction } from '@dengarin/types';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { AgeBracket } from '@dengarin/types';

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
  'Suaramu diproses oleh fitur suara browser/perangkatmu; dukungan dan pemrosesan dapat berbeda tergantung browser. Suara Dengar.in dibuat Google Gemini dari respons asisten yang sudah divalidasi. Dengar.in tidak sengaja menyimpan rekaman mikrofon atau audio suara yang dibuat.';

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

/**
 * Converts only known, validated action shapes into rendered text. Returning
 * null prevents an unexpected response payload from reaching browser TTS.
 */
export function validatedActionDisplayText(action: unknown): string | null {
  if (!action || typeof action !== 'object' || !('action' in action)) return null;
  const candidate = action as Partial<ValidatedAIAction> & Record<string, unknown>;

  switch (candidate.action) {
    case 'chat':
      return typeof candidate.message === 'string' && candidate.message.trim()
        ? candidate.message.trim()
        : null;
    case 'suggest_mission':
      return typeof candidate.reason === 'string' && candidate.reason.trim()
        ? candidate.reason.trim()
        : 'Aku menyarankan satu latihan singkat untuk membantumu saat ini:';
    case 'open_journal_prompt':
      return typeof candidate.prompt === 'string' && candidate.prompt.trim()
        ? candidate.prompt.trim()
        : 'Mungkin menuangkan isi pikiranmu ke jurnal bisa membantu melegakan rasa sesak:';
    case 'suggest_forum':
      return typeof candidate.topicSlug === 'string' && candidate.topicSlug.trim()
        ? `Banyak teman di komunitas Dengar.in yang juga menghadapi tantangan di topik ${candidate.topicSlug}. Kamu bisa membaca pengalaman mereka atau berbagi anonim:`
        : null;
    case 'show_help_directory':
      return 'Jika kamu merasa beban ini membutuhkan penanganan atau konsultasi lebih lanjut, kamu dapat mengecek direktori bantuan kami:';
    case 'adjust_path':
      return typeof candidate.reason === 'string' && candidate.reason.trim()
        ? candidate.reason.trim()
        : 'Kami menyarankan kamu mengatur ulang kecepatan langkahmu:';
    default:
      return null;
  }
}
