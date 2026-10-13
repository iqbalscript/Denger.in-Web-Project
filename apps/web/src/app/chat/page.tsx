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
  Volume2,
  ArrowRight
} from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { ValidatedAIAction } from '@dengarin/types';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';
import { SupportPathwayCard, readSupportPathway } from '@/components/SupportPathwayCard';
import { buildSupportPathway, type SupportPathway } from '@/lib/api/crisisGate';
import { CHAT_CLIENT_HISTORY_ENTRIES, CHAT_CLIENT_TIMEOUT_MS } from '@/lib/api/requestLimits';
import {
  applyFinalTranscript,
  browserVoicePrivacyDisclosure,
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
import { validatedActionDisplayText } from '@/lib/voiceRoom';
import { PageContainer, ContentColumn, Button, ChatProgress } from '@/components/ui';
import { LOCALE_TAG, commonText, useLanguage, useText } from '@/i18n';
import { chatText } from '@/i18n/pages/chat';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  /** Show the standard disclaimer (rendered from the UI dictionary, same meaning as the server text). */
  disclaimer?: boolean;
  tier?: 'primary' | 'secondary' | 'tertiary' | 'fallback' | string;
  providerId?: string;
  debiased?: boolean;
  action?: ValidatedAIAction;
  isError?: boolean;
  /** Only server-validated assistant output is eligible for browser TTS. */
  ttsEligible?: boolean;
  /** Static greeting: no AI call happened, so no provider badge and not sent as history. */
  isWelcome?: boolean;
  /** Which greeting to render from the dictionary (so it follows the active language). */
  welcomeKind?: 'first' | 'again';
  /** Deterministic human-support pathway (crisis engine `high`), never from model output. */
  supportPathway?: SupportPathway;
}

export default function ChatPage() {
  const { ready, session } = useConsentGuard();
  const { lang, locale } = useLanguage();
  const t = useText(chatText);
  const common = useText(commonText);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const hasMountedRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '',
      disclaimer: true,
      isWelcome: true,
      welcomeKind: 'first'
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
  // Mulai ulang percakapan memerlukan konfirmasi supaya tidak terhapus karena salah ketuk.
  const [confirmReset, setConfirmReset] = useState(false);
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
    setVoiceStatus(t.voiceStopped);
    setIsListening(false);
    try {
      recognition.stop();
    } catch {
      recognition.abort();
    }
  }, [t]);

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor(window);
    if (!Recognition) {
      setVoiceStatus(t.voiceUnsupported);
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = LOCALE_TAG[lang];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      // Recognition may only update the editable text field. It has no submit,
      // fetch, crisis-routing, or gamification side effect.
      applyFinalTranscript(setInputText, getFinalTranscript(event));
      setVoiceStatus(t.voiceAdded);
    };
    recognition.onerror = (event) => {
      setVoiceStatus(speechRecognitionErrorMessage(event.error, lang));
      setIsListening(false);
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setVoiceStatus(t.voiceListening);
    setIsListening(true);
    try {
      // This is reached only from the person explicitly choosing "Mulai bicara".
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus(t.voiceCannotStart);
    }
  }, [lang, t]);

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

    const finish = () => {
      if (activeSpeechMessageIdRef.current === message.id) {
        activeSpeechMessageIdRef.current = null;
        setSpeakingMessageId(null);
      }
    };
    activeSpeechMessageIdRef.current = message.id;
    setSpeakingMessageId(message.id);
    // Dibacakan per kalimat dengan nada dan tempo yang mengikuti isi, bukan datar.
    speakExpressively(window.speechSynthesis, Utterance, message.text, {
      lang: LOCALE_TAG[lang],
      voice: selectVoiceForLanguage(window.speechSynthesis.getVoices(), lang),
      onend: finish,
      onerror: finish,
    });
  }, [lang]);

  const handleResetChat = () => {
    stopSpeaking();
    setConfirmReset(false);
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text: '',
        disclaimer: true,
        isWelcome: true,
        welcomeKind: 'again'
      }
    ]);
  };

  const sendMessageWithText = async (textToSend: string) => {
    const userText = textToSend.trim();
    if (!userText || isTyping || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // 1. DETERMINISTIC SAFETY GATE (Step 0, client-side pre-check, ZERO AI)
    const crisisCheck = evaluateCrisisInput(userText, session?.ageBracket || '18-24');
    if (crisisCheck.isCrisis) {
      window.location.href = '/crisis';
      return;
    }
    // High distress (not crisis): the chat continues, but a human-support card is
    // always shown. The server attaches the same deterministic pathway; this local
    // copy keeps it visible even if the request fails.
    const localPathway = buildSupportPathway(crisisCheck) ?? undefined;

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Build multi-turn history from previous messages (bounded by requestLimits.ts)
    const historyPayload = messages
      .filter((m) => !m.isError && !m.isWelcome)
      .slice(-CHAT_CLIENT_HISTORY_ENTRIES)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    // 2. CALL /api/chat. The server enforces a per-turn budget; the browser also
    // stops waiting after CHAT_CLIENT_TIMEOUT_MS and says so clearly.
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CHAT_CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.userId,
          message: userText,
          history: historyPayload,
          ageBracket: session?.ageBracket,
          domain: session?.primaryDomain,
          lang,
        }),
      });

      const json = await res.json().catch(() => null);

      // Server-side crisis redirect check
      if (json?.data?.crisis) {
        window.location.href = '/crisis';
        return;
      }

      // Handle non-OK status codes (413, 429, 400, etc.). Known statuses use the
      // dictionary (follows the active language); server text is only a fallback.
      if (!res.ok) {
        const errorText =
          res.status === 413
            ? t.errorTooLong
            : res.status === 429
              ? t.errorBusy
              : res.status === 400
                ? t.errorInvalid
                : (typeof json?.error === 'string' && json.error) || t.errorGeneric;

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: errorText,
            isError: true,
            supportPathway: localPathway,
          },
        ]);
        return;
      }

      // Successful AI action response
      if (json?.ok && json?.data?.action) {
        const { action, tier, providerId, debiased } = json.data;
        // Server pathway wins; the local deterministic one is the floor. Neither
        // can be removed by anything the model returns.
        const supportPathway = readSupportPathway(json.data.supportPathway) ?? localPathway;

        // This action originated from the existing server validation pipeline.
        // The shared mapper still refuses unknown shapes before they can render.
        const displayText = validatedActionDisplayText(action, lang);
        if (!displayText) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: t.errorGeneric,
              isError: true,
              supportPathway,
            },
          ]);
          return;
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: displayText,
          disclaimer: true,
          tier,
          providerId,
          debiased,
          action,
          ttsEligible: true,
          supportPathway,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: t.errorGeneric,
            isError: true,
            supportPathway: localPathway,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: controller.signal.aborted ? t.errorTimeout : t.errorOffline,
          isError: true,
          supportPathway: localPathway,
        },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
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
          <div className="mt-2.5 p-3 rounded-md bg-white border-2 border-ink shadow-hard-sm text-base space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-base text-ink leading-snug">
              <Compass className="w-4 h-4 text-cobalt shrink-0" aria-hidden="true" />
              <span>{t.actionMission(action.missionId)}</span>
            </div>
            {action.reason && <p className="text-[#59544D] text-base leading-relaxed">{action.reason}</p>}
            <div className="pt-1">
              <Button href="/mission" size="sm" variant="primary" iconPosition="end" icon={<ArrowRight className="w-4 h-4" />}>
                {t.openMission}
              </Button>
            </div>
          </div>
        );

      case 'open_journal_prompt':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-[#FAFAFA] border-2 border-ink shadow-hard-sm text-base space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-base text-ink leading-snug">
              <BookOpen className="w-4 h-4 text-ink shrink-0" aria-hidden="true" />
              <span>{t.actionJournal}</span>
            </div>
            <p className="text-ink font-semibold italic text-base leading-relaxed">&ldquo;{action.prompt}&rdquo;</p>
            {action.suggestedTags && action.suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {action.suggestedTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 text-sm font-semibold px-1.5 py-0.5 rounded bg-white border border-ink text-ink">
                    <Tag className="w-3 h-3" aria-hidden="true" />
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="pt-1">
              <Button href="/journal" size="sm" variant="primary" iconPosition="end" icon={<ArrowRight className="w-4 h-4" />}>
                {t.writeJournal}
              </Button>
            </div>
          </div>
        );

      case 'suggest_forum':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-white border-2 border-ink shadow-hard-sm text-base space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-base text-ink leading-snug">
              <MessageSquare className="w-4 h-4 text-cobalt shrink-0" aria-hidden="true" />
              <span>{t.actionForum(action.topicSlug)}</span>
            </div>
            <p className="text-[#59544D] text-base leading-relaxed">{t.actionForumBody}</p>
            <div className="pt-1">
              <Button href="/forum" size="sm" variant="primary" iconPosition="end" icon={<ArrowRight className="w-4 h-4" />}>
                {t.openForum}
              </Button>
            </div>
          </div>
        );

      case 'show_help_directory':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-[#FFEBEB] border-2 border-ink shadow-hard-sm text-base space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-base text-[#B3261E] leading-snug">
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.actionHelp}</span>
            </div>
            <p className="text-[#59544D] text-base leading-relaxed">{t.actionHelpBody}</p>
            <div className="pt-1">
              <Button href="/resources" size="sm" variant="primary" iconPosition="end" icon={<ArrowRight className="w-4 h-4" />}>
                {t.openHelp}
              </Button>
            </div>
          </div>
        );

      case 'adjust_path':
        return (
          <div className="mt-3 pt-3 border-t border-[#D8D3C9] text-base space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-base text-ink leading-snug">
              <Sparkles className="w-4 h-4 text-cobalt shrink-0" aria-hidden="true" />
              <span>{t.actionPace(t.pace[action.recommendedPace] ?? action.recommendedPace)}</span>
            </div>
            {action.reason && <p className="text-[#59544D] text-base leading-relaxed">{action.reason}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-6">
        {/* Top Navigation & Safety Indicator */}
        <div className="animate-reveal-up flex flex-wrap items-center justify-between gap-3">
          <Button
            href="/dashboard"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t.backHome}
          </Button>

          <span className="inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 bg-white border-2 border-ink rounded shadow-hard-sm text-ink">
            <ShieldCheck className="w-4 h-4 text-cobalt" aria-hidden="true" />
            <span>{t.crisisCheckActive}</span>
          </span>
        </div>

        <h1 className="sr-only">{t.pageTitle}</h1>

        {/* Chat Container */}
        <div className="animate-reveal-up [animation-delay:80ms] flex flex-col h-[calc(100dvh-240px)] min-h-[520px] max-h-[680px] sm:h-[680px] bg-white border-2 border-ink rounded-lg shadow-hard overflow-hidden text-left">
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b-2 border-ink bg-paper space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-md bg-cobalt text-white flex items-center justify-center font-bold text-base border-2 border-ink shadow-hard-sm shrink-0" aria-hidden="true">
                  AI
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-ink tracking-[-0.01em] leading-tight">{t.headerTitle}</h2>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-lime text-ink border border-ink">
                      {t.headerStatus}
                    </span>
                  </div>
                  <p className="text-sm text-[#59544D] leading-snug">{t.headerSubtitle}</p>
                </div>
              </div>

              <Link
                href="/crisis"
                className="shrink-0 min-h-[44px] text-sm font-bold text-white bg-[#D32F2F] hover:bg-[#B3261E] px-3 rounded border-2 border-ink shadow-hard-sm inline-flex items-center gap-1.5 transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
              >
                <PhoneCall className="w-[18px] h-[18px]" aria-hidden="true" />
                <span>{t.emergency}</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/ruang-ngobrol" className="min-h-[44px] text-sm font-bold text-ink px-3 rounded border-2 border-ink bg-white inline-flex items-center gap-1.5 shadow-hard-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">
                <Mic className="w-4 h-4" aria-hidden="true" />
                <span>{t.voiceRoom}</span>
              </Link>
              {confirmReset ? (
                <span className="inline-flex flex-wrap items-center gap-2 text-sm font-semibold text-ink" role="group" aria-label={t.confirmResetGroup}>
                  <span>{t.confirmResetQuestion}</span>
                  <Button variant="crisis" size="sm" onClick={handleResetChat}>
                    {t.confirmResetYes}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>
                    {t.cancel}
                  </Button>
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReset(true)}
                  icon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
                >
                  {t.newChat}
                </Button>
              )}
            </div>
          </div>

          {/* Message History */}
          <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5" role="log" aria-live="polite" aria-relevant="additions" aria-label={t.historyLabel}>
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${index === messages.length - 1 && index > 0 && !msg.supportPathway ? 'animate-reveal-up' : ''}`}
              >
                {msg.sender === 'assistant' && (
                  <div
                    aria-hidden="true"
                    className={`px-2 py-1 rounded border-2 border-ink font-bold text-xs shadow-hard-sm shrink-0 mt-1 ${msg.isError
                        ? 'bg-yellow text-ink'
                        : 'bg-cobalt text-white'
                      }`}
                  >
                    {t.assistantBadge}
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[75%] space-y-1.5">
                  <div
                    className={`p-4 rounded-md border-2 border-ink text-base leading-[1.6] shadow-hard-sm ${msg.sender === 'user'
                        ? 'bg-white text-ink'
                        : msg.isError
                          ? 'bg-[#FFF3C4] text-ink'
                          : 'bg-paper text-ink'
                      }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.isWelcome ? (msg.welcomeKind === 'again' ? t.welcomeAgain : t.welcome) : msg.text}
                    </div>

                    {/* Action Cards (Missions, Journals, Forums, etc.) */}
                    {msg.action && renderActionCard(msg.action)}
                  </div>

                  {msg.supportPathway && <SupportPathwayCard pathway={msg.supportPathway} />}

                  {msg.sender === 'assistant' && !msg.isError && !msg.isWelcome && msg.providerId && (
                    <div className="flex items-center gap-2 px-1">
                      {msg.providerId === 'guardrail:domain-gate' ? (
                        <span className="text-xs font-bold text-[#2B51E6] bg-white px-1.5 py-0.5 rounded border border-ink inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          {t.badgeDomainGate}
                        </span>
                      ) : msg.debiased || msg.providerId?.includes('nemotron') ? (
                        <span className="text-xs font-bold text-ink bg-lime px-1.5 py-0.5 rounded border border-ink inline-flex items-center gap-1" title="Verified & Debiased">
                          <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                          {t.badgeDebiased}
                        </span>
                      ) : msg.tier === 'tertiary' || msg.providerId?.includes('gemini') ? (
                        <span className="text-xs font-bold text-white bg-cobalt px-1.5 py-0.5 rounded border border-ink inline-flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                          {t.badgeSecondary}
                        </span>
                      ) : msg.tier === 'primary' ? (
                        <span className="text-xs font-bold text-ink bg-yellow px-1.5 py-0.5 rounded border border-ink inline-flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                          {t.badgePrimary}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-ink bg-paper px-1.5 py-0.5 rounded border border-ink">
                          {t.badgeFallback}
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
                        aria-label={speakingMessageId === msg.id ? t.stopReading : t.readAloud}
                        aria-pressed={speakingMessageId === msg.id}
                        icon={speakingMessageId === msg.id ? <Square className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
                      >
                        {speakingMessageId === msg.id ? t.stop : t.read}
                      </Button>
                    </div>
                  )}

                  {msg.disclaimer && (
                    <p className="text-sm text-[#59544D] px-1 leading-snug">
                      {common.disclaimer}
                    </p>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="px-2 py-1 rounded border-2 border-ink bg-ink text-white font-bold text-xs shadow-hard-sm shrink-0 mt-1" aria-hidden="true">
                    {t.userBadge}
                  </div>
                )}
              </div>
            ))}

            {isTyping && <ChatProgress />}

          </div>

          {/* Quick Starter Chips */}
          {messages.length === 1 && !isTyping && (
            <div className="animate-reveal-up [animation-delay:160ms] px-4 py-3 bg-paper border-t-2 border-ink flex flex-wrap gap-2 items-center">
              <span className="text-sm text-ink font-bold mr-1 flex items-center gap-1 w-full sm:w-auto">
                <Sparkles className="w-4 h-4 text-cobalt" aria-hidden="true" />
                {t.starterIntro}
              </span>
              {t.starters.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessageWithText(prompt)}
                  className="text-base bg-white text-ink border-2 border-ink rounded-md px-3.5 py-2 shadow-hard-sm text-left font-medium transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-ink bg-paper space-y-2">
            {showVoiceDisclosure && (
              <div className="animate-reveal-up border-2 border-ink rounded-md bg-white p-3 text-base leading-relaxed shadow-hard-sm" role="status">
                <p>{browserVoicePrivacyDisclosure(lang)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVoiceDisclosure(false)}
                  >
                    {t.voiceDisclosureCancel}
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
                  >
                    {t.voiceDisclosureStart}
                  </Button>
                </div>
              </div>
            )}

            <p className="sr-only" role="status" aria-live="polite">{voiceStatus}</p>
            {!speechRecognitionSupported && (
              <p className="text-sm text-[#59544D]" aria-live="polite">
                {t.voiceUnsupported}
              </p>
            )}
            {speechRecognitionSupported && voiceStatus && (
              <p className="text-sm text-[#59544D] font-semibold" aria-hidden="true">
                {voiceStatus}
              </p>
            )}

            <label htmlFor="pesan-chat" className="block text-sm font-bold text-ink">{t.inputLabel}</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="pesan-chat"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.inputPlaceholder}
                lang={locale}
                disabled={isTyping}
                autoComplete="off"
                className="min-h-[48px] flex-1 px-4 py-2.5 rounded-md border-2 border-ink text-base bg-white placeholder:text-[#6B665E] shadow-[2px_2px_0px_#151515] transition-shadow duration-200 ease-spring focus:outline-none focus:shadow-[3px_3px_0px_#3357EE] focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2 disabled:bg-[#D8D3C9]/40 disabled:cursor-not-allowed"
              />
              <div className="flex gap-2">
                {speechRecognitionSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isListening ? stopListening : requestListening}
                    disabled={isTyping}
                    aria-label={isListening ? t.micStop : t.micStart}
                    aria-pressed={isListening}
                    className="min-h-[48px] flex-1 sm:flex-none"
                    icon={isListening ? <Square className="w-4 h-4" aria-hidden="true" /> : <Mic className="w-4 h-4" aria-hidden="true" />}
                  >
                    {isListening ? t.micStopShort : t.micStartShort}
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!inputText.trim() || isTyping}
                  icon={<Send className="w-4 h-4" />}
                  className="min-h-[48px] flex-1 sm:flex-none"
                >
                  {t.send}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}


