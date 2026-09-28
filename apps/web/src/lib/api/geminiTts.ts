/**
 * Server-only Gemini unary TTS helper for Ruang Ngobrol. The caller must pass
 * only display text derived from a ValidatedAIAction; this module never sees a
 * browser request body, microphone audio, or raw model output.
 */

export const GEMINI_TTS_MODEL = 'gemini-3.8-flash-lite-tts';
export const GEMINI_TTS_VOICE = 'Vindemiatrix';
export const GEMINI_TTS_MIME_TYPE = 'audio/wav';
export const GEMINI_TTS_SAMPLE_RATE = 24_000;
export const GEMINI_TTS_MAX_TEXT_CHARS = 400;
export const GEMINI_TTS_MAX_AUDIO_BYTES = 1_500_000;
export const GEMINI_TTS_MAX_BASE64_CHARS = Math.ceil(GEMINI_TTS_MAX_AUDIO_BYTES / 3) * 4;
const GEMINI_TTS_TIMEOUT_MS = 10_000;
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

type TtsFailureReason = 'unavailable' | 'text-too-large' | 'timeout' | 'provider-error' | 'malformed-audio' | 'audio-too-large';

export type GeminiTtsResult =
  | { ok: true; data: string; mimeType: typeof GEMINI_TTS_MIME_TYPE; model: typeof GEMINI_TTS_MODEL; voice: typeof GEMINI_TTS_VOICE }
  | { ok: false; reason: TtsFailureReason };

interface GeminiAudioContent {
  type?: string;
  data?: string;
  mime_type?: string;
}

interface GeminiTtsResponse {
  steps?: Array<{ content?: GeminiAudioContent[] }>;
}

type FetchLike = typeof fetch;

function isWav(bytes: Uint8Array): boolean {
  if (bytes.length < 44
    || String.fromCharCode(...bytes.subarray(0, 4)) !== 'RIFF'
    || String.fromCharCode(...bytes.subarray(8, 12)) !== 'WAVE'
    || String.fromCharCode(...bytes.subarray(12, 16)) !== 'fmt '
    || String.fromCharCode(...bytes.subarray(36, 40)) !== 'data') return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // V1 accepts only the documented unary format: PCM, mono, 24 kHz, 16-bit.
  return view.getUint16(20, true) === 1
    && view.getUint16(22, true) === 1
    && view.getUint32(24, true) === GEMINI_TTS_SAMPLE_RATE
    && view.getUint16(34, true) === 16;
}

function decodeValidatedWav(base64: string): Uint8Array | null {
  if (!base64 || base64.length > GEMINI_TTS_MAX_BASE64_CHARS || base64.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) return null;
  try {
    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length === 0 || bytes.length > GEMINI_TTS_MAX_AUDIO_BYTES || !isWav(bytes)) return null;
    return bytes;
  } catch {
    return null;
  }
}

function findAudioContent(payload: GeminiTtsResponse): GeminiAudioContent | undefined {
  for (const step of payload.steps ?? []) {
    for (const content of step.content ?? []) {
      if (content.type === 'audio' && typeof content.data === 'string') return content;
    }
  }
  return undefined;
}

/** Creates a narrowly configured, stateless Gemini TTS client for server use. */
export function createGeminiTtsProvider(
  apiKey: string | undefined = process.env.GEMINI_API_KEY,
  fetchImpl: FetchLike = fetch,
  timeoutMs = GEMINI_TTS_TIMEOUT_MS
) {
  return {
    async synthesizeValidatedText(text: string, requestSignal?: AbortSignal): Promise<GeminiTtsResult> {
      const safeText = text.trim();
      if (!apiKey) return { ok: false, reason: 'unavailable' };
      if (!safeText || safeText.length > GEMINI_TTS_MAX_TEXT_CHARS) {
        return { ok: false, reason: 'text-too-large' };
      }

      const timeout = new AbortController();
      const timeoutId = setTimeout(() => timeout.abort(), timeoutMs);
      const onRequestAbort = () => timeout.abort();
      requestSignal?.addEventListener('abort', onRequestAbort, { once: true });

      try {
        const response = await fetchImpl(GEMINI_INTERACTIONS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            model: GEMINI_TTS_MODEL,
            // Explicitly disable Interactions API conversation-state storage.
            store: false,
            input: [{
              type: 'user_input',
              content: [{
                type: 'text',
                text: safeText,
                annotations: [{ type: 'speech_metadata', style: 'calm, clear, neutral delivery' }],
              }],
            }],
            response_format: {
              type: 'audio',
              mime_type: GEMINI_TTS_MIME_TYPE,
              sample_rate: GEMINI_TTS_SAMPLE_RATE,
            },
            generation_config: {
              speech_config: [{ voice: GEMINI_TTS_VOICE }],
            },
          }),
          signal: timeout.signal,
        });
        if (!response.ok) return { ok: false, reason: 'provider-error' };

        const payload = await response.json().catch(() => null) as GeminiTtsResponse | null;
        const audio = payload ? findAudioContent(payload) : undefined;
        if (!audio || typeof audio.data !== 'string' || (audio.mime_type !== undefined && audio.mime_type !== GEMINI_TTS_MIME_TYPE)) {
          return { ok: false, reason: 'malformed-audio' };
        }
        const audioData = audio.data;
        if (audioData.length > GEMINI_TTS_MAX_BASE64_CHARS) return { ok: false, reason: 'audio-too-large' };
        if (!decodeValidatedWav(audioData)) return { ok: false, reason: 'malformed-audio' };

        return {
          ok: true,
          data: audioData,
          mimeType: GEMINI_TTS_MIME_TYPE,
          model: GEMINI_TTS_MODEL,
          voice: GEMINI_TTS_VOICE,
        };
      } catch {
        return { ok: false, reason: timeout.signal.aborted ? 'timeout' : 'provider-error' };
      } finally {
        clearTimeout(timeoutId);
        requestSignal?.removeEventListener('abort', onRequestAbort);
      }
    },
  };
}
