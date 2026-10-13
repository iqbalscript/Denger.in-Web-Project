'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Mic, MessageSquare, RotateCcw, Square, Volume2 } from 'lucide-react';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';
import { SupportPathwayCard, readSupportPathway } from '@/components/SupportPathwayCard';
import type { SupportPathway } from '@/lib/api/crisisGate';
import {
  cancelSpeech,
  getFinalTranscript,
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  selectVoiceForLanguage,
  speakExpressively,
  speechRecognitionErrorMessage,
  type BrowserSpeechRecognition,
} from '@/lib/browserSpeech';
import {
  VOICE_ROOM_EXPIRY_WARNING_MS,
  VOICE_ROOM_MAX_SESSION_MS,
  appendVoiceRoomCaption,
  canTransitionVoiceRoom,
  screenVoiceRoomFinalTranscript,
  shouldResumeVoiceRoomListening,
  validatedActionDisplayText,
  // Teks pengungkapan privasi: VOICE_ROOM_PRIVACY_DISCLOSURE (ID) atau versi EN,
  // dipilih lewat voiceRoomPrivacyDisclosure(lang) dengan makna yang sama.
  voiceRoomPrivacyDisclosure,
  voiceRoomHistory,
  type VoiceRoomCaption,
  type VoiceRoomState,
} from '@/lib/voiceRoom';
import { Button, ContentColumn, PageContainer } from '@/components/ui';
import { LOCALE_TAG, useLanguage, useText, type Language } from '@/i18n';
import { ruangNgobrolText, type RuangNgobrolStatusKey } from '@/i18n/pages/ruangNgobrol';

type TimeoutHandle = ReturnType<typeof setTimeout>;

/**
 * Pesan status disimpan sebagai kunci kamus supaya ikut berganti saat bahasa
 * diganti; pesan dari browser/server disimpan sebagai teks apa adanya.
 */
type RoomStatus = { key: RuangNgobrolStatusKey } | { text: string };

const MAX_ROOM_AUDIO_BYTES = 1_500_000;
const MAX_ROOM_AUDIO_BASE64_CHARS = Math.ceil(MAX_ROOM_AUDIO_BYTES / 3) * 4;

interface RoomAudioPayload {
  data: string;
  mimeType: 'audio/wav';
}

function decodeRoomWav(base64: string): Uint8Array | null {
  if (!base64 || base64.length > MAX_ROOM_AUDIO_BASE64_CHARS || base64.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) return null;
  try {
    const decoded = window.atob(base64);
    if (decoded.length === 0 || decoded.length > MAX_ROOM_AUDIO_BYTES) return null;
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    const isWav = bytes.length >= 44
      && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WAVE'
      && String.fromCharCode(...bytes.slice(12, 16)) === 'fmt '
      && String.fromCharCode(...bytes.slice(36, 40)) === 'data'
      && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(20, true) === 1
      && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(22, true) === 1
      && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(24, true) === 24_000
      && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(34, true) === 16;
    return isWav ? bytes : null;
  } catch {
    return null;
  }
}

/**
 * Turn-based voice room. The browser never connects to a model provider: a
 * final transcript is screened locally, then sent only to the existing
 * server-side /api/chat safety pipeline.
 */
export default function RuangNgobrolPage() {
  const { ready, session } = useConsentGuard();
  const { lang } = useLanguage();
  const t = useText(ruangNgobrolText);
  const [roomState, setRoomState] = useState<VoiceRoomState>('IDLE');
  const [captions, setCaptions] = useState<VoiceRoomCaption[]>([]);
  const [status, setStatus] = useState<RoomStatus>({ key: 'initial' });
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [showPrivacyDisclosure, setShowPrivacyDisclosure] = useState(false);
  const [hasAcknowledgedDisclosure, setHasAcknowledgedDisclosure] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  /** Deterministic human-support pathway from /api/chat (crisis engine `high`), never model output. */
  const [supportPathway, setSupportPathway] = useState<SupportPathway | null>(null);

  const stateRef = useRef<VoiceRoomState>('IDLE');
  const mountedRef = useRef(true);
  const sessionActiveRef = useRef(false);
  const mutedRef = useRef(false);
  const processingRef = useRef(false);
  const generationRef = useRef(0);
  const speechGenerationRef = useRef(0);
  const captionsRef = useRef<VoiceRoomCaption[]>([]);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);
  const warningTimerRef = useRef<TimeoutHandle | null>(null);
  const expiryTimerRef = useRef<TimeoutHandle | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastSafeTurnRef = useRef<string | null>(null);
  const startListeningRef = useRef<() => void>(() => undefined);
  // Bahasa dibaca lewat ref di dalam callback agar rantai useCallback tidak berubah tiap ganti bahasa.
  const langRef = useRef<Language>(lang);
  langRef.current = lang;

  const setStatusKey = useCallback((key: RuangNgobrolStatusKey) => {
    if (mountedRef.current) setStatus({ key });
  }, []);
  const setStatusText = useCallback((text: string) => {
    if (mountedRef.current) setStatus({ text });
  }, []);

  const transitionTo = useCallback((next: VoiceRoomState) => {
    if (!canTransitionVoiceRoom(stateRef.current, next)) return false;
    stateRef.current = next;
    if (mountedRef.current) setRoomState(next);
    return true;
  }, []);

  const setMuted = useCallback((value: boolean) => {
    mutedRef.current = value;
    if (mountedRef.current) setIsMuted(value);
  }, []);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    warningTimerRef.current = null;
    expiryTimerRef.current = null;
    sessionStartedAtRef.current = null;
  }, []);

  const stopRecognition = useCallback((abort = false) => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    try {
      if (abort) recognition.abort();
      else recognition.stop();
    } catch {
      // Some browser implementations throw when recognition has already ended.
    }
  }, []);

  const stopRoomAudio = useCallback(() => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    const objectUrl = audioObjectUrlRef.current;
    audioObjectUrlRef.current = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, []);

  const clearCaptions = useCallback(() => {
    captionsRef.current = [];
    if (mountedRef.current) setCaptions([]);
  }, []);

  const appendCaption = useCallback((caption: VoiceRoomCaption) => {
    const next = appendVoiceRoomCaption(captionsRef.current, caption);
    captionsRef.current = next;
    if (mountedRef.current) setCaptions(next);
  }, []);

  const endRoom = useCallback((reason: 'ENDED' | 'CRISIS' = 'ENDED') => {
    generationRef.current += 1;
    speechGenerationRef.current += 1;
    sessionActiveRef.current = false;
    processingRef.current = false;
    setMuted(false);
    stopRecognition(true);
    stopRoomAudio();
    cancelSpeech(typeof window === 'undefined' ? undefined : window.speechSynthesis);
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    clearTimers();
    lastSafeTurnRef.current = null;
    clearCaptions();
    transitionTo(reason);
  }, [clearCaptions, clearTimers, setMuted, stopRecognition, stopRoomAudio, transitionTo]);

  const routeToCrisis = useCallback(() => {
    endRoom('CRISIS');
    if (typeof window !== 'undefined') window.location.assign('/crisis');
  }, [endRoom]);

  const sessionHasExpired = useCallback(() => {
    const started = sessionStartedAtRef.current;
    return started !== null && typeof performance !== 'undefined'
      && performance.now() - started >= VOICE_ROOM_MAX_SESSION_MS;
  }, []);

  const speakValidatedResponse = useCallback((text: string, generation: number) => {
    if (typeof window === 'undefined' || generation !== generationRef.current || !sessionActiveRef.current) return;
    if (!isSpeechSynthesisSupported(window)) {
      setMuted(true);
      setStatusKey('textOnly');
      transitionTo('IDLE');
      return;
    }

    stopRecognition(true);
    stopRoomAudio();
    const speechGeneration = speechGenerationRef.current + 1;
    speechGenerationRef.current = speechGeneration;

    const handleEnd = () => {
      if (speechGeneration !== speechGenerationRef.current || generation !== generationRef.current) return;
      if (shouldResumeVoiceRoomListening({
        sessionActive: sessionActiveRef.current,
        muted: mutedRef.current,
        currentGeneration: true,
        state: stateRef.current,
      })) {
        startListeningRef.current();
      } else if (sessionActiveRef.current && !mutedRef.current && stateRef.current === 'SPEAKING') {
        transitionTo('IDLE');
      }
    };
    const handleError = () => {
      if (speechGeneration !== speechGenerationRef.current || generation !== generationRef.current) return;
      setMuted(true);
      setStatusKey('speechFailed');
      transitionTo('IDLE');
    };

    if (!transitionTo('SPEAKING')) return;
    // Cadangan suara browser: per kalimat dengan intonasi yang mengikuti isi,
    // memakai suara dan bahasa sesuai pilihan antarmuka.
    const speechLang = langRef.current;
    speakExpressively(window.speechSynthesis, window.SpeechSynthesisUtterance, text, {
      lang: LOCALE_TAG[speechLang],
      voice: selectVoiceForLanguage(window.speechSynthesis.getVoices(), speechLang),
      onend: handleEnd,
      onerror: handleError,
    });
  }, [setMuted, setStatusKey, stopRecognition, stopRoomAudio, transitionTo]);

  const playGeminiAudio = useCallback((payload: RoomAudioPayload, displayText: string, generation: number) => {
    if (typeof window === 'undefined' || payload.mimeType !== 'audio/wav') {
      speakValidatedResponse(displayText, generation);
      return;
    }
    if (generation !== generationRef.current || !sessionActiveRef.current || stateRef.current === 'CRISIS' || stateRef.current === 'ENDED') return;
    const bytes = decodeRoomWav(payload.data);
    if (!bytes) {
      speakValidatedResponse(displayText, generation);
      return;
    }

    stopRecognition(true);
    cancelSpeech(window.speechSynthesis);
    stopRoomAudio();
    const speechGeneration = speechGenerationRef.current + 1;
    speechGenerationRef.current = speechGeneration;
    // Make an ArrayBuffer-owned copy; it is the only transient representation
    // retained by the browser while the response plays.
    const audioBytes = new Uint8Array(bytes.byteLength);
    audioBytes.set(bytes);
    const objectUrl = URL.createObjectURL(new Blob([audioBytes.buffer], { type: payload.mimeType }));
    const audio = new Audio(objectUrl);
    audioObjectUrlRef.current = objectUrl;
    audioRef.current = audio;

    audio.onended = () => {
      if (speechGeneration !== speechGenerationRef.current || generation !== generationRef.current) return;
      stopRoomAudio();
      if (shouldResumeVoiceRoomListening({
        sessionActive: sessionActiveRef.current,
        muted: mutedRef.current,
        currentGeneration: true,
        state: stateRef.current,
      })) {
        startListeningRef.current();
      } else if (sessionActiveRef.current && !mutedRef.current && stateRef.current === 'SPEAKING') {
        transitionTo('IDLE');
      }
    };
    audio.onerror = () => {
      if (speechGeneration !== speechGenerationRef.current || generation !== generationRef.current) return;
      stopRoomAudio();
      // Gemini audio is optional. The already-visible validated text is spoken
      // by the established browser fallback, never resubmitted to a server.
      speakValidatedResponse(displayText, generation);
    };

    if (!transitionTo('SPEAKING')) {
      stopRoomAudio();
      return;
    }
    void audio.play().catch(() => {
      if (speechGeneration !== speechGenerationRef.current || generation !== generationRef.current) return;
      stopRoomAudio();
      speakValidatedResponse(displayText, generation);
    });
  }, [speakValidatedResponse, stopRecognition, stopRoomAudio, transitionTo]);

  const submitFinalTurn = useCallback(async (rawTranscript: string, generation: number, addCaption = true) => {
    const screening = screenVoiceRoomFinalTranscript(rawTranscript, session?.ageBracket || '18-24');
    const transcript = screening.transcript;
    if (!transcript || !sessionActiveRef.current || generation !== generationRef.current || processingRef.current) return;
    if (sessionHasExpired()) {
      setStatusKey('expired');
      endRoom();
      return;
    }

    processingRef.current = true;
    stopRecognition(false);
    transitionTo('PROCESSING');

    // Mandatory client-side deterministic gate. No fetch, history mutation, or
    // provider path occurs before this decision.
    if (screening.isCrisis) {
      routeToCrisis();
      return;
    }

    const history = voiceRoomHistory(captionsRef.current);
    lastSafeTurnRef.current = transcript;
    if (addCaption) {
      appendCaption({ id: `user-${Date.now()}`, sender: 'user', text: transcript });
    }

    const controller = new AbortController();
    requestAbortRef.current = controller;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId: session?.userId,
          message: transcript,
          history,
          ageBracket: session?.ageBracket,
          domain: session?.primaryDomain,
          // Bahasa antarmuka: AI menjawab dalam bahasa ini; gerbang krisis tidak berubah.
          lang: langRef.current,
          // Opt out of the shared response cache: room captions remain memory-only.
          noStore: true,
          // This only requests the post-validation room enhancement. It cannot
          // provide text to synthesize or bypass either server crisis gate.
          voiceMode: 'ruang-ngobrol',
        }),
      });
      const json = await response.json().catch(() => null);
      if (generation !== generationRef.current || !sessionActiveRef.current) return;

      if (json?.data?.crisis) {
        routeToCrisis();
        return;
      }

      const pathway = readSupportPathway(json?.data?.supportPathway);
      if (pathway && mountedRef.current) setSupportPathway(pathway);

      if (!response.ok) {
        // Pesan sendiri per status HTTP; teks galat server hanya sebagai cadangan.
        if (response.status === 429) setStatusKey('busy');
        else if (response.status === 400 || response.status === 413) setStatusKey('invalid');
        else if (typeof json?.error === 'string' && json.error.trim()) setStatusText(json.error);
        else setStatusKey('responseFailed');
        transitionTo('ERROR');
        return;
      }

      const displayText = validatedActionDisplayText(json?.data?.action, langRef.current);
      if (!json?.ok || !displayText) {
        setStatusKey('responseUnsafe');
        transitionTo('ERROR');
        return;
      }

      appendCaption({ id: `assistant-${Date.now()}`, sender: 'assistant', text: displayText });
      const roomAudio = json?.data?.roomAudio;
      if (roomAudio && typeof roomAudio.data === 'string' && roomAudio.mimeType === 'audio/wav') {
        playGeminiAudio(roomAudio, displayText, generation);
      } else {
        speakValidatedResponse(displayText, generation);
      }
    } catch {
      if (controller.signal.aborted || generation !== generationRef.current || !sessionActiveRef.current) return;
      setStatusKey('connectionFailed');
      transitionTo('ERROR');
    } finally {
      if (generation === generationRef.current) {
        processingRef.current = false;
        requestAbortRef.current = null;
      }
    }
  }, [appendCaption, endRoom, playGeminiAudio, routeToCrisis, session?.ageBracket, session?.primaryDomain, session?.userId, sessionHasExpired, setStatusKey, setStatusText, speakValidatedResponse, stopRecognition, transitionTo]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined' || !sessionActiveRef.current || mutedRef.current || processingRef.current) return;
    if (sessionHasExpired()) {
      setStatusKey('expired');
      endRoom();
      return;
    }
    const Recognition = getSpeechRecognitionConstructor(window);
    if (!Recognition) {
      setStatusKey('unsupported');
      transitionTo('ERROR');
      return;
    }

    cancelSpeech(window.speechSynthesis);
    stopRoomAudio();
    stopRecognition(true);
    const generation = generationRef.current;
    const recognition = new Recognition();
    recognition.lang = LOCALE_TAG[langRef.current];
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      if (generation !== generationRef.current || stateRef.current !== 'LISTENING') return;
      const transcript = getFinalTranscript(event);
      // Interim results are intentionally ignored: they never enter memory or fetch.
      if (!transcript) return;
      void submitFinalTurn(transcript, generation);
    };
    recognition.onerror = (event) => {
      if (generation !== generationRef.current || !sessionActiveRef.current || stateRef.current !== 'LISTENING') return;
      recognitionRef.current = null;
      processingRef.current = false;
      setStatusText(speechRecognitionErrorMessage(event.error, langRef.current));
      transitionTo('ERROR');
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    if (!transitionTo('LISTENING')) return;
    try {
      recognition.start();
      setStatusKey('listening');
    } catch {
      recognitionRef.current = null;
      setStatusKey('startFailed');
      transitionTo('ERROR');
    }
  }, [endRoom, sessionHasExpired, setStatusKey, setStatusText, stopRecognition, stopRoomAudio, submitFinalTurn, transitionTo]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const activateSession = useCallback(() => {
    if (typeof window === 'undefined' || !isSpeechRecognitionSupported(window)) {
      setStatusKey('unsupported');
      transitionTo('ERROR');
      return;
    }
    generationRef.current += 1;
    speechGenerationRef.current += 1;
    sessionActiveRef.current = true;
    processingRef.current = false;
    setMuted(false);
    clearCaptions();
    lastSafeTurnRef.current = null;
    sessionStartedAtRef.current = performance.now();
    const generation = generationRef.current;
    warningTimerRef.current = setTimeout(() => {
      if (sessionActiveRef.current && generation === generationRef.current) {
        setStatusKey('expiringSoon');
      }
    }, VOICE_ROOM_MAX_SESSION_MS - VOICE_ROOM_EXPIRY_WARNING_MS);
    expiryTimerRef.current = setTimeout(() => {
      if (sessionActiveRef.current && generation === generationRef.current) {
        setStatusKey('expired');
        endRoom();
      }
    }, VOICE_ROOM_MAX_SESSION_MS);
    startListeningRef.current();
  }, [clearCaptions, endRoom, setMuted, setStatusKey, transitionTo]);

  const handleStart = useCallback(() => {
    if (!hasAcknowledgedDisclosure) {
      setShowPrivacyDisclosure(true);
      return;
    }
    activateSession();
  }, [activateSession, hasAcknowledgedDisclosure]);

  const handleMute = useCallback(() => {
    setMuted(true);
    stopRecognition(true);
    if (stateRef.current === 'LISTENING') transitionTo('IDLE');
    setStatusKey('muted');
  }, [setMuted, setStatusKey, stopRecognition, transitionTo]);

  const handleResume = useCallback(() => {
    if (!sessionActiveRef.current) {
      handleStart();
      return;
    }
    setMuted(false);
    startListeningRef.current();
  }, [handleStart, setMuted]);

  const handleRetry = useCallback(() => {
    if (!sessionActiveRef.current) {
      handleStart();
      return;
    }
    const lastTurn = lastSafeTurnRef.current;
    if (!lastTurn) {
      handleResume();
      return;
    }
    void submitFinalTurn(lastTurn, generationRef.current, false);
  }, [handleResume, handleStart, submitFinalTurn]);

  useEffect(() => {
    mountedRef.current = true;
    setSpeechRecognitionSupported(isSpeechRecognitionSupported(window));
    setSpeechSynthesisSupported(isSpeechSynthesisSupported(window));
    return () => {
      mountedRef.current = false;
      endRoom();
    };
  }, [endRoom]);

  const isActive = sessionActiveRef.current;
  const showResume = isActive && (isMuted || roomState === 'IDLE');
  const showMute = isActive && !isMuted;

  if (!ready) return <ConsentPending />;

  const statusMessage = 'key' in status ? t.status[status.key] : status.text;

  return (
    <div className="bg-[#FFF8EF] text-[#151515]">
      <PageContainer size="narrow">
        <ContentColumn size="sm" className="space-y-6">
          <header className="animate-reveal-up space-y-3">
            <Link href="/dashboard" className="inline-flex min-h-[44px] items-center text-base font-bold underline underline-offset-4 decoration-2 transition-colors duration-200 ease-spring hover:text-[#3357EE] rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2">
              {t.back}
            </Link>
            <p className="text-sm font-bold text-[#2B51E6]">{t.eyebrow}</p>
            <h1 className="text-[1.75rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-4xl">{t.title}</h1>
            <p className="text-lg leading-[1.5] text-[#4A453E]">{t.lede}</p>
          </header>

          <section className="animate-reveal-up [animation-delay:100ms] rounded-[8px] border-2 border-[#151515] bg-white p-5 shadow-[4px_4px_0px_#151515] sm:p-7" aria-labelledby="room-state">
            <p id="room-state" className="inline-block rounded-[4px] bg-[#3357EE] px-2.5 py-1 text-sm font-bold text-white" aria-live="polite">{t.statusLabel} {t.state[roomState]}</p>
            <p className="mt-4 text-base leading-relaxed" aria-live="polite">{statusMessage}</p>

            {!speechRecognitionSupported && (
              <p className="mt-4 border-l-4 border-[#FFD84D] bg-[#FFF8EF] p-3 text-base leading-relaxed" role="status">
                {t.unsupportedNote}
              </p>
            )}

            {showPrivacyDisclosure && (
              <div className="animate-reveal-up mt-5 rounded-[6px] border-2 border-[#151515] bg-[#FFF8EF] p-4" role="region" aria-label={t.privacyRegion}>
                <p className="text-base leading-relaxed">{voiceRoomPrivacyDisclosure(lang)}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => setShowPrivacyDisclosure(false)}>{t.cancel}</Button>
                  <Button
                    variant="lime"
                    onClick={() => {
                      setHasAcknowledgedDisclosure(true);
                      setShowPrivacyDisclosure(false);
                      activateSession();
                    }}
                    icon={<Mic size={18} aria-hidden="true" />}
                  >
                    {t.agree}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!isActive && (
                <Button
                  variant="lime"
                  size="lg"
                  onClick={handleStart}
                  disabled={!speechRecognitionSupported}
                  icon={<Mic size={20} aria-hidden="true" />}
                >
                  {t.start}
                </Button>
              )}
              {showMute && (
                <Button variant="secondary" onClick={handleMute} icon={<Volume2 size={18} aria-hidden="true" />}>
                  {t.mute}
                </Button>
              )}
              {showResume && (
                <Button variant="secondary" onClick={handleResume} icon={<Mic size={18} aria-hidden="true" />}>
                  {t.resume}
                </Button>
              )}
              {roomState === 'ERROR' && (
                <Button variant="secondary" onClick={handleRetry} icon={<RotateCcw size={18} aria-hidden="true" />}>
                  {t.retry}
                </Button>
              )}
              {isActive && (
                <Button variant="outline" onClick={() => endRoom()} icon={<Square size={17} aria-hidden="true" />}>
                  {t.end}
                </Button>
              )}
            </div>

            {!speechSynthesisSupported && speechRecognitionSupported && (
              <p className="mt-4 text-base leading-relaxed text-[#59544D]">{t.noSynthesis}</p>
            )}
          </section>

          {/* Static on purpose: support content is never animated. */}
          {supportPathway && <SupportPathwayCard pathway={supportPathway} />}

          {captions.length > 0 && (
            <section className="space-y-3" aria-label={t.captionsRegion} aria-live="polite">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold tracking-[-0.01em]">{t.captionsTitle}</h2>
                <button
                  type="button"
                  onClick={clearCaptions}
                  className="min-h-[44px] text-base font-bold underline underline-offset-4 decoration-2 transition-colors duration-200 ease-spring hover:text-[#3357EE] rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2"
                >
                  {t.clearCaptions}
                </button>
              </div>
              {captions.map((caption) => (
                <article key={caption.id} className={`animate-reveal-up ${caption.sender === 'user' ? 'border-l-4 border-[#D8D3C9] py-1 pl-4' : 'rounded-[6px] border-2 border-[#151515] bg-white p-4 shadow-[2px_2px_0px_#151515]'}`}>
                  <p className={`text-sm font-bold ${caption.sender === 'user' ? 'text-[#59544D]' : 'text-[#2B51E6]'}`}>{caption.sender === 'user' ? t.you : t.assistant}</p>
                  <p className="mt-2 whitespace-pre-wrap text-base leading-[1.6]">{caption.text}</p>
                </article>
              ))}
            </section>
          )}

          <section className="animate-reveal-up [animation-delay:200ms] border-t border-[#D8D3C9] pt-5">
            <Link href="/chat" className="inline-flex min-h-[44px] items-center gap-2 text-base font-bold underline underline-offset-4 decoration-2 transition-colors duration-200 ease-spring hover:text-[#3357EE] rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2">
              <MessageSquare size={18} aria-hidden="true" />
              {t.preferTyping}
            </Link>
            <p className="mt-3 text-base leading-relaxed text-[#59544D]">{t.footnote}</p>
          </section>
        </ContentColumn>
      </PageContainer>
    </div>
  );
}
