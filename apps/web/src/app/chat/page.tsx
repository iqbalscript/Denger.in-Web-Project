'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  ShieldCheck,
  ArrowLeft,
  Bot,
  User,
  PhoneCall,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Compass,
  BookOpen,
  MessageSquare,
  ExternalLink,
  Zap,
  Tag
} from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { STANDARD_DISCLAIMER } from '@dengarin/validator';
import type { ValidatedAIAction } from '@dengarin/types';
import { getAnonymousSession } from '@/lib/storage';
import { PageContainer, ContentColumn, SoftCard, Button, Badge } from '@/components/ui';

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
}

const STARTER_PROMPTS = [
  'Pekerjaan dan tugas menumpuk, kepala terasa mau pecah',
  'Cemas mikirin masa depan dan ekspektasi orang sekitar',
  'Pengeluaran tak terduga bikin overthinking dan susah tidur',
  'Hanya butuh tempat aman untuk curhat tanpa dihakimi'
];

export default function ChatPage() {
  const session = getAnonymousSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Halo. Aku Dengar.in, pendamping anonimmu yang didukung oleh DeepSeek AI Platform, Second Brain NVIDIA Nemotron, dan Gemini 3.1 Flash-Lite. Kamu bisa menceritakan apa pun yang sedang terasa berat hari ini — baik soal tugas, pekerjaan, relasi, maupun beban finansial. Apa yang paling membebanimu saat ini?',
      disclaimer: STANDARD_DISCLAIMER,
      tier: 'primary',
      providerId: 'deepseek:deepseek-flash'
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text: 'Halo kembali. Percakapan sudah diatur ulang. Ceritakan apa yang sedang kamu rasakan saat ini.',
        disclaimer: STANDARD_DISCLAIMER,
        tier: 'primary',
        providerId: 'deepseek:deepseek-flash'
      }
    ]);
  };

  const sendMessageWithText = async (textToSend: string) => {
    const userText = textToSend.trim();
    if (!userText || isTyping) return;

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

      const json = await res.json();

      // Rate-limited
      if (res.status === 429) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: json?.error ?? 'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
            isError: true,
          },
        ]);
        setIsTyping(false);
        return;
      }

      // Server-side crisis redirect (belt-and-suspenders with client gate)
      if (json?.data?.crisis) {
        window.location.href = '/crisis';
        return;
      }

      // Successful AI action response
      if (json?.ok && json?.data?.action) {
        const { action, tier, providerId, debiased, disclaimer } = json.data;

        // Resolve display text depending on action type
        let displayText = '';
        if (action.action === 'chat') {
          displayText = action.message;
        } else if (action.action === 'suggest_mission') {
          displayText = action.reason || 'Aku menyarankan satu latihan terarah untuk membantumu saat ini:';
        } else if (action.action === 'open_journal_prompt') {
          displayText = action.prompt || 'Mungkin menuangkan isi pikiranmu ke jurnal bisa membantu melegakan rasa sesak:';
        } else if (action.action === 'suggest_forum') {
          displayText = `Banyak teman sebaya di komunitas Dengar.in yang juga menghadapi tantangan di topik ${action.topicSlug}. Kamu bisa membaca pengalaman mereka atau berbagi anonim:`;
        } else if (action.action === 'show_help_directory') {
          displayText = 'Jika kamu merasa beban ini membutuhkan penanganan atau konsultasi lebih lanjut, kamu dapat mengecek direktori bantuan kami:';
        } else if (action.action === 'adjust_path') {
          displayText = action.reason || 'Kami menyarankan penyesuaian ritme langkah pemulihanmu:';
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
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: 'Maaf, terjadi kendala saat memproses respons. Silakan coba kirim kembali.',
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
          text: 'Koneksi terputus. Pastikan kamu terhubung ke internet dan coba lagi.',
          isError: true,
        },
      ]);
    } finally {
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
          <div className="mt-2.5 p-3 rounded-xl bg-calm-50/80 border border-calm-200/80 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-calm-900">
              <Compass className="w-3.5 h-3.5 text-calm-700" />
              <span>Rekomendasi Misi Harian: {action.missionId}</span>
            </div>
            {action.reason && <p className="text-calm-800 text-[11px] leading-relaxed">{action.reason}</p>}
            <div className="pt-1">
              <Link href="/mission">
                <Button size="sm" variant="secondary" className="text-xs py-1 px-2.5 h-7">
                  Buka Modul Misi
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'open_journal_prompt':
        return (
          <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Prompt Refleksi Jurnal</span>
            </div>
            <p className="text-amber-950 font-medium italic text-xs">&ldquo;{action.prompt}&rdquo;</p>
            {action.suggestedTags && action.suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {action.suggestedTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800">
                    <Tag className="w-2.5 h-2.5" />
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="pt-1">
              <Link href="/journal">
                <Button size="sm" variant="secondary" className="text-xs py-1 px-2.5 h-7">
                  Tulis di Jurnal
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'suggest_forum':
        return (
          <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-700" />
              <span>Diskusi Komunitas: #{action.topicSlug}</span>
            </div>
            <p className="text-indigo-950 text-[11px]">
              Temukan cerita dan saling menyemangati dengan teman sebaya yang memahami situasi serupa.
            </p>
            <div className="pt-1">
              <Link href="/forum">
                <Button size="sm" variant="secondary" className="text-xs py-1 px-2.5 h-7">
                  Kunjungi Forum
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'show_help_directory':
        return (
          <div className="mt-2.5 p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-rose-900">
              <ExternalLink className="w-3.5 h-3.5 text-rose-700" />
              <span>Direktori Bantuan Profesional ({action.category})</span>
            </div>
            <p className="text-rose-950 text-[11px]">
              Akses daftar layanan konseling, hotline, dan pendampingan resmi yang telah dikurasi.
            </p>
            <div className="pt-1">
              <Link href="/resources">
                <Button size="sm" variant="secondary" className="text-xs py-1 px-2.5 h-7">
                  Lihat Direktori Bantuan
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'adjust_path':
        return (
          <div className="mt-2.5 p-3 rounded-xl bg-sand-100 border border-sand-300 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-sand-900">
              <Sparkles className="w-3.5 h-3.5 text-calm-700" />
              <span>Penyesuaian Ritme Pemulihan: {action.recommendedPace}</span>
            </div>
            {action.reason && <p className="text-sand-700 text-[11px]">{action.reason}</p>}
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
          <Link href="/dashboard" className="inline-block">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Kembali ke Dashboard
            </Button>
          </Link>

          <Badge variant="calm" size="sm" className="gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-calm-700" />
            <span>Filter Krisis Deterministik Aktif</span>
          </Badge>
        </div>

        {/* Chat Container */}
        <SoftCard
          variant="white"
          elevation="medium"
          className="flex flex-col h-[640px] overflow-hidden border-sand-200"
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-sand-200 bg-sand-50/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-calm-700 text-white flex items-center justify-center shadow-soft-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-sand-900">Dengar.in Companion</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Multi-Brain AI Live
                  </span>
                </div>
                <p className="text-[11px] text-sand-600 font-medium">
                  DeepSeek Platform • NVIDIA Nemotron Anti-Bias • Gemini 3.1 • Guardrails Maksimum
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetChat}
                title="Mulai percakapan baru"
                className="text-xs text-sand-600 hover:text-sand-900 px-2 h-8"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Reset</span>
              </Button>

              <Link
                href="/crisis"
                className="text-xs font-bold text-crisis hover:underline flex items-center gap-1.5 focus-visible:outline-crisis rounded-lg p-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bantuan Segera?</span>
              </Link>
            </div>
          </div>

          {/* Message History */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-soft-xs ${
                      msg.isError
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-calm-100 text-calm-800'
                    }`}
                  >
                    {msg.isError ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[75%] space-y-1.5">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-calm-700 text-white rounded-br-none shadow-soft-xs'
                        : msg.isError
                          ? 'bg-amber-50 text-amber-900 rounded-bl-none border border-amber-200'
                          : 'bg-sand-100 text-sand-900 rounded-bl-none border border-sand-200'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Action Cards (Missions, Journals, Forums, etc.) */}
                    {msg.action && renderActionCard(msg.action)}
                  </div>

                  {msg.sender === 'assistant' && !msg.isError && (
                    <div className="flex items-center gap-2 px-1">
                      {msg.providerId === 'guardrail:domain-gate' ? (
                        <span className="text-[9px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 inline-flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
                          Guardrail Domain Gate
                        </span>
                      ) : msg.debiased || msg.providerId?.includes('nemotron') ? (
                        <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          DeepSeek + 🛡️ Nemotron Verified
                        </span>
                      ) : msg.tier === 'tertiary' || msg.providerId?.includes('gemini') ? (
                        <span className="text-[9px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60 inline-flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Gemini 3.1 Flash-Lite
                        </span>
                      ) : msg.tier === 'primary' ? (
                        <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          DeepSeek Platform
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                          🛡️ Mode Cadangan
                        </span>
                      )}
                    </div>
                  )}

                  {msg.disclaimer && (
                    <p className="text-[10px] text-sand-500 px-1 italic leading-tight">
                      * {msg.disclaimer}
                    </p>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-sand-200 text-sand-800 flex items-center justify-center shrink-0 mt-1 shadow-soft-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-3 pl-10">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-calm-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-calm-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-calm-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-sand-500">DeepSeek AI sedang menyusun balasan...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips (Shown when only welcome message exists) */}
          {messages.length === 1 && !isTyping && (
            <div className="px-4 py-2.5 bg-sand-50/80 border-t border-sand-200 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-sand-500 font-medium mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-calm-600" />
                Mulai dengan:
              </span>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessageWithText(prompt)}
                  className="text-[11px] bg-white hover:bg-calm-50 text-sand-800 hover:text-calm-900 border border-sand-200 hover:border-calm-300 rounded-full px-2.5 py-1 transition shadow-xs text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-sand-200 bg-sand-50/50 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis apa yang kamu rasakan (dilindungi filter keselamatan deterministik)..."
              aria-label="Tulis pesan"
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 rounded-xl border border-sand-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-calm-700/30 focus:border-calm-700 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputText.trim() || isTyping}
              icon={<Send className="w-4 h-4" />}
            >
              Kirim
            </Button>
          </form>
        </SoftCard>
      </ContentColumn>
    </PageContainer>
  );
}


