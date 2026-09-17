'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, ShieldCheck, ArrowLeft, Bot, User, PhoneCall } from 'lucide-react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { validateAIOutput, STANDARD_DISCLAIMER } from '@dengarin/validator';
import { getAnonymousSession } from '@/lib/storage';
import { PageContainer, ContentColumn, SoftCard, Button, Badge } from '@/components/ui';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  disclaimer?: string;
  suggestedAction?: string;
}

export default function ChatPage() {
  const session = getAnonymousSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Halo. Aku Dengar.in, pendamping anonimmu. Kamu bisa menceritakan apa yang sedang terasa berat hari ini — baik soal tugas, pekerjaan, maupun beban finansial. Apa yang paling membebanimu saat ini?',
      disclaimer: STANDARD_DISCLAIMER,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const userText = inputText.trim();
    if (!userText) return;

    // 1. DETERMINISTIC SAFETY GATE (Step 0 - ZERO AI)
    const crisisCheck = evaluateCrisisInput(userText, session?.ageBracket || '18-24');
    if (crisisCheck.isCrisis) {
      window.location.href = '/crisis';
      return;
    }

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // 2. SPRINT 0 SAFE ORCHESTRATOR SIMULATION (Validated Schema)
    setTimeout(() => {
      // Create response strictly through the action validator
      const simulatedOutput = {
        action: 'chat',
        message: `Terima kasih sudah berbagi. Aku memahami betapa menguras energinya menghadapi situasi tersebut. Untuk saat ini, jangan paksa dirimu menyelesaikan semuanya sekaligus. Cobalah tarik napas perlahan dan fokus pada satu hal kecil yang masih bisa kamu kendalikan hari ini.`,
        disclaimer: STANDARD_DISCLAIMER,
      };

      const validation = validateAIOutput(simulatedOutput);
      if (validation.isValid && validation.action && validation.action.action === 'chat') {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: validation.action.message,
          disclaimer: validation.action.disclaimer,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
      setIsTyping(false);
    }, 600);
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
        className="flex flex-col h-[600px] overflow-hidden border-sand-200"
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-sand-200 bg-sand-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-calm-700 text-white flex items-center justify-center shadow-soft-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sand-900">Dengar.in Companion</h2>
              <p className="text-[11px] text-calm-800 font-medium">
                Orkestrator Aksi Terbatasi • Non-Diagnostik
              </p>
            </div>
          </div>

          <Link
            href="/crisis"
            className="text-xs font-bold text-crisis hover:underline flex items-center gap-1.5 focus-visible:outline-crisis rounded-lg p-1"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Butuh Bantuan Segera?</span>
          </Link>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-calm-100 text-calm-800 flex items-center justify-center shrink-0 mt-1 shadow-soft-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="max-w-[85%] sm:max-w-[75%] space-y-1.5">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-calm-700 text-white rounded-br-none shadow-soft-xs'
                      : 'bg-sand-100 text-sand-900 rounded-bl-none border border-sand-200'
                  }`}
                >
                  {msg.text}
                </div>

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
            <div className="flex items-center gap-2 text-xs text-sand-500 pl-10">
              <span className="animate-pulse">Mengetik balasan pendampingan...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-sand-200 bg-sand-50/50 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tulis apa yang kamu rasakan (dilindungi filter keselamatan)..."
            aria-label="Tulis pesan"
            className="flex-1 px-4 py-2.5 rounded-xl border border-sand-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-calm-700/30 focus:border-calm-700"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputText.trim()}
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
