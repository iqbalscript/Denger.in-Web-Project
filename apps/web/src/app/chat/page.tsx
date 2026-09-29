'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Send,
  ShieldCheck,
  ArrowLeft,
  PhoneCall,
  Sparkles,
  RotateCcw,
  Compass,
  BookOpen,
  MessageSquare,
  ExternalLink,
  Zap,
  Tag,
  Mic,
  Square,
  Volume2
} from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { STANDARD_DISCLAIMER } from '@dengarin/validator';
import type { ValidatedAIAction } from '@dengarin/types';
import { getAnonymousSession } from '@/lib/storage';
import {
  BROWSER_VOICE_PRIVACY_DISCLOSURE,
  applyFinalTranscript,
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
import { validatedActionDisplayText } from '@/lib/voiceRoom';
import { PageContainer, ContentColumn, Button, ChatProgress } from '@/components/ui';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  disclaimer?: string;
  tier?: 'primary' | 'secondary' | 'tertiary' | 'fallback' | string;
  providerId?: string;
  debiased?: boolean;
  action?: ValidatedAIAction;
  isError?: boolean;
  /** Only server-validated assistant output is eligible for browser TTS. */
  ttsEligible?: boolean;
}

const STARTER_PROMPTS = [
  'Tugas dan pekerjaan menumpuk, aku kewalahan',
  'Aku cemas mikirin masa depan dan ekspektasi orang sekitar',
  'Pengeluaran tak terduga bikin aku overthinking dan susah tidur',
  'Aku cuma butuh tempat aman buat cerita tanpa dihakimi'
];

export default function ChatPage() {
  const session = getAnonymousSession();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const hasMountedRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Halo, aku Dengar.in, teman bicara anonimmu. Di sini kamu boleh bercerita apa saja tanpa dihakimi, entah soal tugas, pekerjaan, hubungan, atau uang. Tidak perlu rapi, dan tidak perlu buru-buru. Apa yang lagi paling terasa berat buatmu sekarang?',
      disclaimer: STANDARD_DISCLAIMER,
      tier: 'primary',
      providerId: 'deepseek:deepseek-flash'
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [showVoiceDisclosure, setShowVoiceDisclosure] = useState(false);
  const [hasAcknowledgedVoiceDisclosure, setHasAcknowledgedVoiceDisclosure] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const activeSpeechMessageIdRef = useRef<string | null>(null);

  // Auto-scroll hanya untuk kotak pesan, BUKAN halaman. scrollIntoView() menggulung
  // semua ancestor termasuk window, sehingga halaman tiba-tiba lompat ke bawah
  // (juga saat pertama kali dibuka). Aturannya:
  //  - jangan scroll saat render pertama;
  //  - pesan milik pengguna / mulai menunggu balasan: selalu ke bawah;
  //  - balasan AI: ke bawah hanya bila pengguna memang sedang di dasar, supaya
  //    yang sedang membaca pesan lama tidak ditarik paksa.
  const lastMessage = messages[messages.length - 1];
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const container = messagesContainerRef.current;
    if (!container) return;
    const ownAction = isTyping || lastMessage?.sender === 'user';
    if (!ownAction && !isNearBottomRef.current) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ top: container.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
    isNearBottomRef.current = true;
  }, [messages.length, isTyping, lastMessage?.sender]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    isNearBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  };

  // Browser APIs are inspected only after hydration. Both capabilities degrade
  // independently, so text chat never depends on either one being available.
  useEffect(() => {
    setSpeechRecognitionSupported(isSpeechRecognitionSupported(window));
    setSpeechSynthesisSupported(isSpeechSynthesisSupported(window));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      activeSpeechMessageIdRef.current = null;
      cancelSpeech(window.speechSynthesis);
    };
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setVoiceStatus('Pendengaran dihentikan. Periksa dan edit teks sebelum mengirim.');
    setIsListening(false);
    try {
      recognition.stop();
    } catch {
      recognition.abort();
    }
  }, []);

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor(window);
    if (!Recognition) {
      setVoiceStatus('Fitur Bicara belum didukung oleh browser ini. Kamu tetap bisa menulis pesan.');
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      // Recognition may only update the editable text field. It has no submit,
      // fetch, crisis-routing, or gamification side effect.
      applyFinalTranscript(setInputText, getFinalTranscript(event));
      setVoiceStatus('Teks suara sudah ditambahkan. Periksa dan edit teks sebelum mengirim.');
    };
    recognition.onerror = (event) => {
      setVoiceStatus(speechRecognitionErrorMessage(event.error));
      setIsListening(false);
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setVoiceStatus('● LAGI DENGERIN...');
    setIsListening(true);
    try {
      // This is reached only from the person explicitly choosing "Mulai bicara".
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus('Pengenalan suara tidak dapat dimulai. Kamu tetap bisa menulis pesan.');
    }
  }, []);

  const requestListening = useCallback(() => {
    if (!hasAcknowledgedVoiceDisclosure) {
      setShowVoiceDisclosure(true);
      return;
    }
    startListening();
  }, [hasAcknowledgedVoiceDisclosure, startListening]);

  const stopSpeaking = useCallback(() => {
    activeSpeechMessageIdRef.current = null;
    cancelSpeech(window.speechSynthesis);
    setSpeakingMessageId(null);
  }, []);

  const speakMessage = useCallback((message: Message) => {
    if (!isSpeechSynthesisSupported(window)) return;
    const Utterance = window.SpeechSynthesisUtterance;
    if (!Utterance || !window.speechSynthesis) return;

    const utterance = new Utterance(message.text);
    utterance.lang = 'id-ID';
    const indonesianVoice = selectIndonesianVoice(window.speechSynthesis.getVoices());
    if (indonesianVoice) utterance.voice = indonesianVoice;
    activeSpeechMessageIdRef.current = message.id;
    setSpeakingMessageId(message.id);
    utterance.onend = () => {
      if (activeSpeechMessageIdRef.current === message.id) {
        activeSpeechMessageIdRef.current = null;
        setSpeakingMessageId(null);
      }
    };
    utterance.onerror = () => {
      if (activeSpeechMessageIdRef.current === message.id) {
        activeSpeechMessageIdRef.current = null;
        setSpeakingMessageId(null);
      }
    };
    speakOneAtATime(window.speechSynthesis, utterance);
  }, []);

  const handleResetChat = () => {
    stopSpeaking();
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text: 'Halo lagi. Kita mulai percakapan baru, ya. Aku di sini kalau kamu mau bercerita, kapan pun kamu siap.',
        disclaimer: STANDARD_DISCLAIMER,
        tier: 'primary',
        providerId: 'deepseek:deepseek-flash'
      }
    ]);
  };

  const sendMessageWithText = async (textToSend: string) => {
    const userText = textToSend.trim();
    if (!userText || isTyping || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // 1. DETERMINISTIC SAFETY GATE (Step 0 — client-side pre-check, ZERO AI)
    const crisisCheck = evaluateCrisisInput(userText, session?.ageBracket || '18-24');
    if (crisisCheck.isCrisis) {
      window.location.href = '/crisis';
      return;
    }

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Build multi-turn history from previous messages (up to 6 turns)
    const historyPayload = messages
      .filter((m) => !m.isError && m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    // 2. CALL /api/chat — real DeepSeek Platform orchestrator pipeline
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.userId,
          message: userText,
          history: historyPayload,
          ageBracket: session?.ageBracket,
          domain: session?.primaryDomain,
        }),
      });

      const json = await res.json().catch(() => null);

      // Server-side crisis redirect check
      if (json?.data?.crisis) {
        window.location.href = '/crisis';
        return;
      }

      // Handle non-OK status codes (413, 429, 400, etc.)
      if (!res.ok) {
        const errorText =
          json?.error ||
          (res.status === 413
            ? 'Pesanmu terlalu panjang untuk sekali kirim (maksimum 2.000 karakter). Boleh dipecah jadi beberapa bagian, ya.'
            : res.status === 429
              ? 'Sedang cukup ramai. Tarik napas dulu, lalu coba lagi sebentar lagi, ya.'
              : 'Maaf, ada kendala di sisi kami dan pesanmu belum terbalas. Bukan salahmu. Coba kirim lagi sebentar lagi, ya.');

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: errorText,
            isError: true,
          },
        ]);
        return;
      }

      // Successful AI action response
      if (json?.ok && json?.data?.action) {
        const { action, tier, providerId, debiased, disclaimer } = json.data;

        // This action originated from the existing server validation pipeline.
        // The shared mapper still refuses unknown shapes before they can render.
        const displayText = validatedActionDisplayText(action);
        if (!displayText) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: 'Maaf, ada kendala di sisi kami dan pesanmu belum terbalas. Bukan salahmu. Coba kirim lagi sebentar lagi, ya.',
              isError: true,
            },
          ]);
          return;
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: displayText,
          disclaimer: disclaimer ?? action.disclaimer ?? STANDARD_DISCLAIMER,
          tier,
          providerId,
          debiased,
          action,
          ttsEligible: true,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: 'Maaf, ada kendala di sisi kami dan pesanmu belum terbalas. Bukan salahmu. Coba kirim lagi sebentar lagi, ya.',
            isError: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Koneksimu sepertinya terputus. Periksa internetmu, lalu coba kirim lagi, ya.',
          isError: true,
        },
      ]);
    } finally {
      isSubmittingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageWithText(inputText);
  };

  const renderActionCard = (action: ValidatedAIAction) => {
    switch (action.action) {
      case 'suggest_mission':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-white border-2 border-ink shadow-hard-sm text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-ink">
              <Compass className="w-3.5 h-3.5 text-cobalt" />
              <span>Rekomendasi Misi Harian: {action.missionId}</span>
            </div>
            {action.reason && <p className="text-ink/80 text-[11px] leading-relaxed font-medium">{action.reason}</p>}
            <div className="pt-1">
              <Button href="/mission" size="sm" variant="primary" className="text-xs py-1 px-2.5 h-7">
                Buka Modul Misi →
              </Button>
            </div>
          </div>
        );

      case 'open_journal_prompt':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-yellow/20 border-2 border-ink shadow-hard-sm text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-ink">
              <BookOpen className="w-3.5 h-3.5 text-ink" />
              <span>Prompt Refleksi Jurnal</span>
            </div>
            <p className="text-ink font-bold italic text-xs">&ldquo;{action.prompt}&rdquo;</p>
            {action.suggestedTags && action.suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {action.suggestedTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-ink text-ink">
                    <Tag className="w-2.5 h-2.5" />
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="pt-1">
              <Button href="/journal" size="sm" variant="primary" className="text-xs py-1 px-2.5 h-7">
                Tulis di Jurnal →
              </Button>
            </div>
          </div>
        );

      case 'suggest_forum':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-white border-2 border-ink shadow-hard-sm text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-ink">
              <MessageSquare className="w-3.5 h-3.5 text-cobalt" />
              <span>Diskusi Komunitas: #{action.topicSlug}</span>
            </div>
            <p className="text-ink/80 text-[11px] font-medium">
              Temukan cerita dan saling menyemangati dengan teman sebaya yang memahami situasi serupa.
            </p>
            <div className="pt-1">
              <Button href="/forum" size="sm" variant="primary" className="text-xs py-1 px-2.5 h-7">
                Kunjungi Forum →
              </Button>
            </div>
          </div>
        );

      case 'show_help_directory':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-coral/10 border-2 border-ink shadow-hard-sm text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-coral">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Direktori Bantuan Profesional ({action.category})</span>
            </div>
            <p className="text-ink/80 text-[11px] font-medium">
              Akses daftar layanan konseling, hotline, dan pendampingan resmi yang telah dikurasi.
            </p>
            <div className="pt-1">
              <Button href="/resources" size="sm" variant="primary" className="text-xs py-1 px-2.5 h-7">
                Lihat Direktori Bantuan →
              </Button>
            </div>
          </div>
        );

      case 'adjust_path':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-white border-2 border-ink shadow-hard-sm text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-ink">
              <Sparkles className="w-3.5 h-3.5 text-cobalt" />
              <span>Saran Kecepatan: {action.recommendedPace}</span>
            </div>
            {action.reason && <p className="text-ink/80 text-[11px] font-medium">{action.reason}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-6">
        {/* Top Navigation & Safety Indicator */}
        <div className="flex items-center justify-between gap-3">
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            KEMBALI KE DASHBOARD
          </Button>

          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 bg-yellow border-2 border-ink rounded shadow-hard-sm text-ink">
            <ShieldCheck className="w-3.5 h-3.5 text-ink" />
            <span>Pemeriksa Krisis Aktif (Tanpa AI)</span>
          </span>
        </div>

        {/* Chat Container */}
        <div className="flex flex-col h-[calc(100dvh-220px)] min-h-[480px] max-h-[640px] sm:h-[640px] bg-white border-2 border-ink rounded-lg shadow-hard overflow-hidden text-left">
          {/* Chat Header */}
          <div className="p-4 border-b-2 border-ink bg-paper flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-cobalt text-white flex items-center justify-center font-black text-sm border-2 border-ink shadow-hard-sm">
                AI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-ink uppercase tracking-wide">TEMAN BICARA DENGAR.IN</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-lime text-ink border border-ink">
                    AKTIF
                  </span>
                </div>
                <p className="text-[11px] text-ink/70 font-medium">
                  Teman bicara berbasis AI yang mendengarkan tanpa menghakimi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetChat}
                title="Mulai percakapan baru"
                className="text-xs px-2 h-8"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Reset</span>
              </Button>

              <Link
                href="/crisis"
                className="text-xs font-black uppercase tracking-wider text-white bg-coral px-2.5 py-1 rounded border-2 border-ink shadow-hard-sm flex items-center gap-1.5 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bantuan Segera</span>
              </Link>
            </div>
          </div>

          {/* Message History */}
          <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div
                    className={`px-2 py-1 rounded border-2 border-ink font-black text-[11px] uppercase tracking-wider shadow-hard-sm shrink-0 mt-1 ${msg.isError
                        ? 'bg-yellow text-ink'
                        : 'bg-cobalt text-white'
                      }`}
                  >
                    DENGAR
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[75%] space-y-1.5">
                  <div
                    className={`p-4 rounded-md border-2 border-ink text-xs sm:text-sm leading-relaxed shadow-hard-sm font-medium ${msg.sender === 'user'
                        ? 'bg-white text-ink'
                        : msg.isError
                          ? 'bg-yellow/20 text-ink'
                          : 'bg-paper text-ink'
                      }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Action Cards (Missions, Journals, Forums, etc.) */}
                    {msg.action && renderActionCard(msg.action)}
                  </div>

                  {msg.sender === 'assistant' && !msg.isError && (
                    <div className="flex items-center gap-2 px-1">
                      {msg.providerId === 'guardrail:domain-gate' ? (
                        <span className="text-[9px] font-black uppercase text-cobalt bg-white px-1.5 py-0.5 rounded border border-ink inline-flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Guardrail Domain Gate
                        </span>
                      ) : msg.debiased || msg.providerId?.includes('nemotron') ? (
                        <span className="text-[9px] font-black uppercase text-ink bg-lime px-1.5 py-0.5 rounded border border-ink inline-flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          Verified & Deblased
                        </span>
                      ) : msg.tier === 'tertiary' || msg.providerId?.includes('gemini') ? (
                        <span className="text-[9px] font-black uppercase text-white bg-cobalt px-1.5 py-0.5 rounded border border-ink inline-flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Fallback
                        </span>
                      ) : msg.tier === 'primary' ? (
                        <span className="text-[9px] font-black uppercase text-ink bg-yellow px-1.5 py-0.5 rounded border border-ink inline-flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          Main
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-ink bg-paper px-1.5 py-0.5 rounded border border-ink">
                          Subs
                        </span>
                      )}
                    </div>
                  )}

                  {msg.sender === 'assistant' && msg.ttsEligible && speechSynthesisSupported && (
                    <div className="px-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => speakingMessageId === msg.id ? stopSpeaking() : speakMessage(msg)}
                        aria-label={speakingMessageId === msg.id ? 'Berhenti membacakan respons' : 'Dengarkan respons'}
                        aria-pressed={speakingMessageId === msg.id}
                        className="min-h-[44px] px-3 text-xs"
                      >
                        {speakingMessageId === msg.id ? (
                          <><Square className="w-3.5 h-3.5" /> Berhenti</>
                        ) : (
                          <><Volume2 className="w-3.5 h-3.5" /> Dengarkan</>
                        )}
                      </Button>
                    </div>
                  )}

                  {msg.disclaimer && (
                    <p className="text-[10px] text-ink/60 px-1 italic leading-tight font-medium">
                      * {msg.disclaimer}
                    </p>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="px-2 py-1 rounded border-2 border-ink bg-ink text-white font-black text-[11px] uppercase tracking-wider shadow-hard-sm shrink-0 mt-1">
                    KAMU
                  </div>
                )}
              </div>
            ))}

            {isTyping && <ChatProgress />}

          </div>

          {/* Quick Starter Chips */}
          {messages.length === 1 && !isTyping && (
            <div className="px-4 py-3 bg-paper border-t-2 border-ink flex flex-wrap gap-2 items-center">
              <span className="text-[11px] text-ink font-black uppercase tracking-wider mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cobalt" />
                Mulai dengan:
              </span>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessageWithText(prompt)}
                  className="text-[11px] bg-white hover:bg-paper-dark text-ink border-2 border-ink rounded-md px-3 py-1.5 shadow-hard-sm text-left font-medium transition-all min-h-[44px] sm:min-h-[36px] flex items-center"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-ink bg-paper space-y-2">
            {showVoiceDisclosure && (
              <div className="border-2 border-ink bg-white p-3 text-xs font-medium leading-relaxed shadow-hard-sm" role="status">
                <p>{BROWSER_VOICE_PRIVACY_DISCLOSURE}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVoiceDisclosure(false)}
                    className="min-h-[44px]"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="calm-subtle"
                    size="sm"
                    onClick={() => {
                      setHasAcknowledgedVoiceDisclosure(true);
                      setShowVoiceDisclosure(false);
                      startListening();
                    }}
                    className="min-h-[44px]"
                  >
                    Mulai bicara
                  </Button>
                </div>
              </div>
            )}

            <p className="sr-only" role="status" aria-live="polite">{voiceStatus}</p>
            {!speechRecognitionSupported && (
              <p className="text-[11px] text-ink/70 font-medium" aria-live="polite">
                Fitur Bicara belum didukung oleh browser ini. Kamu tetap bisa menulis pesan.
              </p>
            )}
            {speechRecognitionSupported && voiceStatus && (
              <p className="text-[11px] text-ink/70 font-bold uppercase tracking-wide" aria-live="polite">
                {voiceStatus}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tulis apa yang kamu rasakan... (dijaga filter keselamatan tanpa AI)"
                aria-label="Tulis pesan"
                disabled={isTyping}
                className="min-h-[44px] flex-1 px-4 py-2.5 rounded-md border-2 border-ink text-xs sm:text-sm bg-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              />
              <div className="flex gap-2">
                {speechRecognitionSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isListening ? stopListening : requestListening}
                    disabled={isTyping}
                    aria-label={isListening ? 'Berhenti mendengarkan' : 'Bicara menggunakan mikrofon'}
                    aria-pressed={isListening}
                    className="min-h-[44px] flex-1 sm:flex-none"
                  >
                    {isListening ? (
                      <><Square className="w-3.5 h-3.5" /> Berhenti</>
                    ) : (
                      <><Mic className="w-3.5 h-3.5" /> Bicara</>
                    )}
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!inputText.trim() || isTyping}
                  icon={<Send className="w-4 h-4" />}
                  className="min-h-[44px] flex-1 sm:flex-none"
                >
                  KIRIM
                </Button>
              </div>
            </div>
          </form>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}


