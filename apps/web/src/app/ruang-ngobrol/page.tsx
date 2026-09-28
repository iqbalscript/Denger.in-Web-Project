'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Mic, MessageSquare, RotateCcw, Square, Volume2 } from 'lucide-react';
import { getAnonymousSession } from '@/lib/storage';
import {
  BROWSER_VOICE_PRIVACY_DISCLOSURE,
  cancelSpeech,
  getFinalTranscript,
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  selectIndonesianVoice,
  speakOneAtATime,
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
  voiceRoomHistory,
  type VoiceRoomCaption,
  type VoiceRoomState,
} from '@/lib/voiceRoom';
import { Button, ContentColumn, PageContainer } from '@/components/ui';

type TimeoutHandle = ReturnType<typeof setTimeout>;

const STATE_LABELS: Record<VoiceRoomState, string> = {
  IDLE: 'SIAP NGOBROL',
  LISTENING: 'MENDENGARKAN...',
  PROCESSING: 'LAGI MIKIR...',
  SPEAKING: 'DENGAR.IN LAGI NGOMONG...',
  ERROR: 'ADA KENDALA',
  CRISIS: 'BANTUAN DARURAT',
  ENDED: 'SELESAI',
};

/**
 * Turn-based voice room. The browser never connects to a model provider: a
 * final transcript is screened locally, then sent only to the existing
 * server-side /api/chat safety pipeline.
 */
export default function RuangNgobrolPage() {
  const session = getAnonymousSession();
  const [roomState, setRoomState] = useState<VoiceRoomState>('IDLE');
  const [captions, setCaptions] = useState<VoiceRoomCaption[]>([]);
  const [statusMessage, setStatusMessage] = useState('Tekan MULAI NGOBROL saat kamu siap.');
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [showPrivacyDisclosure, setShowPrivacyDisclosure] = useState(false);
  const [hasAcknowledgedDisclosure, setHasAcknowledgedDisclosure] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
  const warningTimerRef = useRef<TimeoutHandle | null>(null);
  const expiryTimerRef = useRef<TimeoutHandle | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastSafeTurnRef = useRef<string | null>(null);
  const startListeningRef = useRef<() => void>(() => undefined);

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
    cancelSpeech(typeof window === 'undefined' ? undefined : window.speechSynthesis);
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    clearTimers();
    lastSafeTurnRef.current = null;
    clearCaptions();
    transitionTo(reason);
  }, [clearCaptions, clearTimers, setMuted, stopRecognition, transitionTo]);

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
      setStatusMessage('Respons aman sudah tampil sebagai teks. Tekan LANJUT DENGERIN untuk melanjutkan tanpa suara.');
      transitionTo('IDLE');
      return;
    }

    stopRecognition(true);
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    const voice = selectIndonesianVoice(window.speechSynthesis.getVoices());
    if (voice) utterance.voice = voice;
    const speechGeneration = speechGenerationRef.current + 1;
    speechGenerationRef.current = speechGeneration;

    utterance.onend = () => {
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
    utterance.onerror = () => {
      if (speechGeneration !== speechGenerationRef.current || generation !== generationRef.current) return;
      setMuted(true);
      setStatusMessage('Respons aman tetap tersedia sebagai teks. Suara browser tidak dapat diputar; kamu dapat melanjutkan mendengarkan secara manual.');
      transitionTo('IDLE');
    };

    if (!transitionTo('SPEAKING')) return;
    speakOneAtATime(window.speechSynthesis, utterance);
  }, [setMuted, stopRecognition, transitionTo]);

  const submitFinalTurn = useCallback(async (rawTranscript: string, generation: number, addCaption = true) => {
    const screening = screenVoiceRoomFinalTranscript(rawTranscript, session?.ageBracket || '18-24');
    const transcript = screening.transcript;
    if (!transcript || !sessionActiveRef.current || generation !== generationRef.current || processingRef.current) return;
    if (sessionHasExpired()) {
      setStatusMessage('Ruang ngobrol ini sudah selesai. Kamu dapat memulai ruang baru saat siap.');
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
          // Opt out of the shared response cache: room captions remain memory-only.
          noStore: true,
        }),
      });
      const json = await response.json().catch(() => null);
      if (generation !== generationRef.current || !sessionActiveRef.current) return;

      if (json?.data?.crisis) {
        routeToCrisis();
        return;
      }

      if (!response.ok) {
        setStatusMessage(json?.error || 'Respons belum dapat diproses. Coba lagi atau buka chat teks.');
        transitionTo('ERROR');
        return;
      }

      const displayText = validatedActionDisplayText(json?.data?.action);
      if (!json?.ok || !displayText) {
        setStatusMessage('Respons belum dapat diproses dengan aman. Coba lagi atau buka chat teks.');
        transitionTo('ERROR');
        return;
      }

      appendCaption({ id: `assistant-${Date.now()}`, sender: 'assistant', text: displayText });
      speakValidatedResponse(displayText, generation);
    } catch {
      if (controller.signal.aborted || generation !== generationRef.current || !sessionActiveRef.current) return;
      setStatusMessage('Koneksi sedang bermasalah. Coba lagi saat kamu siap atau gunakan chat teks.');
      transitionTo('ERROR');
    } finally {
      if (generation === generationRef.current) {
        processingRef.current = false;
        requestAbortRef.current = null;
      }
    }
  }, [appendCaption, endRoom, routeToCrisis, session?.ageBracket, session?.primaryDomain, session?.userId, sessionHasExpired, speakValidatedResponse, stopRecognition, transitionTo]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined' || !sessionActiveRef.current || mutedRef.current || processingRef.current) return;
    if (sessionHasExpired()) {
      setStatusMessage('Ruang ngobrol ini sudah selesai. Kamu dapat memulai ruang baru saat siap.');
      endRoom();
      return;
    }
    const Recognition = getSpeechRecognitionConstructor(window);
    if (!Recognition) {
      setStatusMessage('Browser ini belum mendukung pengenalan suara. Kamu tetap bisa menggunakan chat teks.');
      transitionTo('ERROR');
      return;
    }

    cancelSpeech(window.speechSynthesis);
    stopRecognition(true);
    const generation = generationRef.current;
    const recognition = new Recognition();
    recognition.lang = 'id-ID';
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
      setStatusMessage(speechRecognitionErrorMessage(event.error));
      transitionTo('ERROR');
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    if (!transitionTo('LISTENING')) return;
    try {
      recognition.start();
      setStatusMessage('Aku lagi dengerin. Kamu bisa bicara pelan-pelan.');
    } catch {
      recognitionRef.current = null;
      setStatusMessage('Pengenalan suara belum dapat dimulai. Coba lagi saat kamu siap.');
      transitionTo('ERROR');
    }
  }, [endRoom, sessionHasExpired, stopRecognition, submitFinalTurn, transitionTo]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const activateSession = useCallback(() => {
    if (typeof window === 'undefined' || !isSpeechRecognitionSupported(window)) {
      setStatusMessage('Browser ini belum mendukung pengenalan suara. Kamu tetap bisa menggunakan chat teks.');
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
        setStatusMessage('Sebentar lagi ruang ngobrol ini selesai.');
      }
    }, VOICE_ROOM_MAX_SESSION_MS - VOICE_ROOM_EXPIRY_WARNING_MS);
    expiryTimerRef.current = setTimeout(() => {
      if (sessionActiveRef.current && generation === generationRef.current) {
        setStatusMessage('Ruang ngobrol ini sudah selesai. Kamu dapat memulai ruang baru saat siap.');
        endRoom();
      }
    }, VOICE_ROOM_MAX_SESSION_MS);
    startListeningRef.current();
  }, [clearCaptions, endRoom, setMuted, transitionTo]);

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
    setStatusMessage('Pendengaran dijeda. Tekan LANJUT DENGERIN saat kamu siap.');
  }, [setMuted, stopRecognition, transitionTo]);

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

  return (
    <main className="min-h-screen bg-[#FFF8EF] text-[#151515]">
      <PageContainer size="narrow">
        <ContentColumn size="sm" className="space-y-6">
          <header className="space-y-3">
            <Link href="/dashboard" className="inline-flex min-h-[44px] items-center text-sm font-bold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF] focus-visible:ring-offset-2">
              ← KEMBALI
            </Link>
            <p className="text-xs font-bold tracking-[0.12em] text-[#4169FF]">RUANG NGOBROL</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Gak perlu nyusun kata-kata dengan sempurna.</h1>
            <p className="text-base leading-relaxed">Cerita aja pelan-pelan. Kamu tetap memegang kendali untuk mulai, jeda, atau selesai.</p>
          </header>

          <section className="border-2 border-[#151515] bg-white p-5 shadow-[3px_3px_0px_#151515] sm:p-6" aria-labelledby="room-state">
            <p id="room-state" className="text-sm font-bold tracking-[0.08em]" aria-live="polite">{STATE_LABELS[roomState]}</p>
            <p className="mt-3 text-sm leading-relaxed" aria-live="polite">{statusMessage}</p>

            {!speechRecognitionSupported && (
              <p className="mt-4 border-l-4 border-[#FFD84D] bg-[#FFF8EF] p-3 text-sm" role="status">
                Pengenalan suara belum tersedia di browser ini. Chat teks tetap bisa digunakan.
              </p>
            )}

            {showPrivacyDisclosure && (
              <div className="mt-5 border-2 border-[#151515] bg-[#FFF8EF] p-4" role="region" aria-label="Privasi fitur suara">
                <p className="text-sm leading-relaxed">{BROWSER_VOICE_PRIVACY_DISCLOSURE}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => setShowPrivacyDisclosure(false)}>BATAL</Button>
                  <Button
                    variant="lime"
                    onClick={() => {
                      setHasAcknowledgedDisclosure(true);
                      setShowPrivacyDisclosure(false);
                      activateSession();
                    }}
                    icon={<Mic size={18} aria-hidden="true" />}
                  >
                    LANJUTKAN
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
                  aria-label="Mulai ngobrol dengan suara"
                >
                  MULAI NGOBROL
                </Button>
              )}
              {showMute && (
                <Button variant="secondary" onClick={handleMute} icon={<Volume2 size={18} aria-hidden="true" />} aria-label="Jeda pendengaran mikrofon">
                  MUTE
                </Button>
              )}
              {showResume && (
                <Button variant="secondary" onClick={handleResume} icon={<Mic size={18} aria-hidden="true" />} aria-label="Lanjut dengarkan suara">
                  LANJUT DENGERIN
                </Button>
              )}
              {roomState === 'ERROR' && (
                <Button variant="secondary" onClick={handleRetry} icon={<RotateCcw size={18} aria-hidden="true" />} aria-label="Coba lagi">
                  COBA LAGI
                </Button>
              )}
              {isActive && (
                <Button variant="outline" onClick={() => endRoom()} icon={<Square size={17} aria-hidden="true" />} aria-label="Selesai ruang ngobrol">
                  SELESAI
                </Button>
              )}
            </div>

            {!speechSynthesisSupported && speechRecognitionSupported && (
              <p className="mt-4 text-xs leading-relaxed text-[#4B4740]">Browser ini akan menampilkan respons sebagai teks; suara balasan tidak tersedia.</p>
            )}
          </section>

          {captions.length > 0 && (
            <section className="space-y-3" aria-label="Caption percakapan" aria-live="polite">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-bold tracking-[0.08em]">PERCAKAPAN SAAT INI</h2>
                <button
                  type="button"
                  onClick={clearCaptions}
                  className="min-h-[44px] text-sm font-bold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF] focus-visible:ring-offset-2"
                >
                  Hapus tampilan percakapan
                </button>
              </div>
              {captions.map((caption) => (
                <article key={caption.id} className={`border-2 border-[#151515] p-4 ${caption.sender === 'user' ? 'bg-[#FFF8EF]' : 'bg-white shadow-[2px_2px_0px_#151515]'}`}>
                  <p className="text-xs font-bold tracking-[0.1em]">{caption.sender === 'user' ? 'KAMU' : 'DENGAR.IN'}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{caption.text}</p>
                </article>
              ))}
            </section>
          )}

          <section className="border-t-2 border-[#151515] pt-5">
            <Link href="/chat" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF] focus-visible:ring-offset-2">
              <MessageSquare size={18} aria-hidden="true" />
              Lebih nyaman ngetik? Buka chat teks.
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-[#4B4740]">Ruang ini berhenti otomatis setelah 10 menit. Tidak ada poin, Langkah, atau pencapaian dari percakapan suara.</p>
          </section>
        </ContentColumn>
      </PageContainer>
    </main>
  );
}
