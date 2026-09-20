'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Tag
} from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { STANDARD_DISCLAIMER } from '@dengarin/validator';
import type { ValidatedAIAction } from '@dengarin/types';
import { getAnonymousSession } from '@/lib/storage';
import { PageContainer, ContentColumn, Button } from '@/components/ui';

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
      text: 'Halo. Aku Dengar.in, pendamping anonimmu. Kamu bisa menceritakan apa pun yang sedang terasa berat hari ini — baik soal tugas, pekerjaan, relasi, maupun beban finansial. Apa yang paling membebanimu saat ini?',
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

      // Server-side crisis redirect
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
          displayText = `Banyak teman di komunitas Dengar.in yang juga menghadapi tantangan di topik ${action.topicSlug}. Kamu bisa membaca pengalaman mereka atau berbagi anonim:`;
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
          <div className="mt-2.5 p-3 rounded-md bg-white border-2 border-ink shadow-hard-sm text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-ink">
              <Compass className="w-3.5 h-3.5 text-cobalt" />
              <span>Rekomendasi Misi Harian: {action.missionId}</span>
            </div>
            {action.reason && <p className="text-ink/80 text-[11px] leading-relaxed font-medium">{action.reason}</p>}
            <div className="pt-1">
              <Link href="/mission">
                <Button size="sm" variant="primary" className="text-xs py-1 px-2.5 h-7">
                  Buka Modul Misi →
                </Button>
              </Link>
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
              <Link href="/journal">
                <Button size="sm" variant="primary" className="text-xs py-1 px-2.5 h-7">
                  Tulis di Jurnal →
                </Button>
              </Link>
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
              <Link href="/forum">
                <Button size="sm" variant="primary" className="text-xs py-1 px-2.5 h-7">
                  Kunjungi Forum →
                </Button>
              </Link>
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
              <Link href="/resources">
                <Button size="sm" variant="primary" className="text-xs py-1 px-2.5 h-7">
                  Lihat Direktori Bantuan →
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'adjust_path':
        return (
          <div className="mt-2.5 p-3 rounded-md bg-white border-2 border-ink shadow-hard-sm text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-ink">
              <Sparkles className="w-3.5 h-3.5 text-cobalt" />
              <span>Penyesuaian Ritme Pemulihan: {action.recommendedPace}</span>
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
          <Link href="/dashboard" className="inline-block">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              KEMBALI KE DASHBOARD
            </Button>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 bg-yellow border-2 border-ink rounded shadow-hard-sm text-ink">
            <ShieldCheck className="w-3.5 h-3.5 text-ink" />
            <span>Filter Krisis Deterministik Aktif</span>
          </span>
        </div>

        {/* Chat Container */}
        <div className="flex flex-col h-[640px] bg-white border-2 border-ink rounded-lg shadow-hard overflow-hidden text-left">
          {/* Chat Header */}
          <div className="p-4 border-b-2 border-ink bg-paper flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-cobalt text-white flex items-center justify-center font-black text-sm border-2 border-ink shadow-hard-sm">
                AI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-ink uppercase tracking-wide">DENGAR.IN COMPANION</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-lime text-ink border border-ink">
                    MULTI-BRAIN LIVE
                  </span>
                </div>
                <p className="text-[11px] text-ink/70 font-medium">
                  Multi-Tier AI System with Live Verification & Deblasing
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
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
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

            {isTyping && (
              <div className="flex items-center gap-3 pl-2">
                <div className="px-2 py-1 rounded border-2 border-ink bg-cobalt text-white font-black text-[11px] uppercase tracking-wider shadow-hard-sm">
                  DENGAR
                </div>
                <span className="text-xs text-ink/70 font-bold uppercase tracking-wider">Sedang menyusun balasan...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
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
                  className="text-[11px] bg-white hover:bg-paper-dark text-ink border-2 border-ink rounded-md px-3 py-1.5 shadow-hard-sm text-left font-medium transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-ink bg-paper flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis apa yang kamu rasakan (dilindungi filter keselamatan deterministik)..."
              aria-label="Tulis pesan"
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 rounded-md border-2 border-ink text-xs sm:text-sm bg-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputText.trim() || isTyping}
              icon={<Send className="w-4 h-4" />}
            >
              KIRIM
            </Button>
          </form>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}


