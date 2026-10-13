'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Square, ArrowRight, Lock } from 'lucide-react';
import { grantConsent } from '@/lib/storage';
import { sanitizeNextPath } from '@/lib/consent';
import { PageContainer, SplitLayout, Button, Badge } from '@/components/ui';
import { useText } from '@/i18n';
import { consentText } from '@/i18n/pages/consent';

export default function ConsentPage() {
  const router = useRouter();
  const t = useText(consentText);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);

  const canProceed = agreedTerms && agreedDisclaimer;

  const handleStart = () => {
    if (!canProceed) return;
    grantConsent();
    // Return to the page that asked for consent (internal paths only).
    const next = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next')
      : null;
    router.push(sanitizeNextPath(next));
  };

  const strong = 'text-ink font-bold';

  // Makna dan fakta tiap poin sama persis di kedua bahasa (lihat i18n/pages/consent.ts).
  const principles = [
    {
      number: '01',
      tone: 'bg-cobalt text-white',
      title: t.p1Title,
      body: t.p1Body,
    },
    {
      number: '02',
      tone: 'bg-yellow text-ink',
      title: t.p2Title,
      body: (
        <>
          {t.p2A} <strong className={strong}>{t.p2Strong}</strong>.
        </>
      ),
    },
    {
      number: '03',
      tone: 'bg-[#D32F2F] text-white',
      title: t.p3Title,
      body: t.p3Body,
    },
    {
      number: '04',
      tone: 'bg-lime text-ink',
      title: t.p4Title,
      body: (
        <ul className="space-y-2 list-disc pl-5 marker:text-ink">
          <li><strong className={strong}>{t.p4Local}</strong> {t.p4LocalBody}</li>
          <li><strong className={strong}>{t.p4Chat}</strong> {t.p4ChatBody}</li>
          <li><strong className={strong}>{t.p4Voice}</strong> {t.p4VoiceBody}</li>
          <li><strong className={strong}>{t.p4Passport}</strong> {t.p4PassportBody}</li>
          <li><strong className={strong}>{t.p4Forum}</strong> {t.p4ForumBody}</li>
          <li><strong className={strong}>{t.p4Backup}</strong> {t.p4BackupBody}</li>
          <li>
            {/* True while the chat AI-response cache stays off by default (lib/api/aiCache.ts, AI_RESPONSE_CACHE). */}
            <strong className={strong}>{t.p4Cache}</strong> {t.p4CacheBody}
          </li>
        </ul>
      ),
    },
  ];

  const leftContent = (
    <div className="space-y-6">
      <div className="space-y-3 animate-reveal-up">
        <Badge variant="calm" size="md">
          <Lock className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
          {t.badge}
        </Badge>
        <h1 className="text-[2rem] sm:text-5xl lg:text-[3.5rem] font-bold text-ink tracking-[-0.03em] leading-[1.05]">
          {t.title}
        </h1>
        <p className="text-lg sm:text-xl text-[#4A453E] leading-[1.45] max-w-[34rem] font-medium">
          {t.lede}
        </p>
      </div>

      <ol className="space-y-6 pt-2">
        {principles.map((item, index) => (
          <li
            key={item.number}
            style={{ animationDelay: `${160 + index * 80}ms` }}
            className="animate-reveal-up flex items-start gap-4 border-t-2 border-ink pt-5"
          >
            <span
              className={`w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 border-2 border-ink font-bold text-base tabular-nums ${item.tone}`}
              aria-hidden="true"
            >
              {item.number}
            </span>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-ink tracking-[-0.01em] leading-[1.25]">{item.title}</h2>
              <div className="text-base sm:text-base text-[#4A453E] leading-relaxed">{item.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );

  const checkboxClass = (checked: boolean) =>
    `flex items-start gap-3.5 text-left w-full cursor-pointer select-none rounded-md p-4 border-2 border-ink transition-[transform,box-shadow,background-color] duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2 ${
      checked
        ? 'bg-[#E6ECFF] shadow-hard-sm'
        : 'bg-paper hover:bg-[#F7F0E6] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-sm active:translate-x-0 active:translate-y-0 active:shadow-none'
    }`;

  const rightContent = (
    <div className="animate-reveal-up [animation-delay:120ms] bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-6 shadow-hard-lg lg:sticky lg:top-24">
      <div className="space-y-1.5 border-b border-[#D8D3C9] pb-4">
        <h2 id="judul-persetujuan" className="font-bold text-xl text-ink tracking-[-0.01em] leading-[1.25]">{t.checksTitle}</h2>
        <p className="text-base text-[#59544D] leading-relaxed">{t.checksLede}</p>
      </div>

      <div className="space-y-3" role="group" aria-labelledby="judul-persetujuan">
        <button
          type="button"
          role="checkbox"
          aria-checked={agreedTerms}
          onClick={() => setAgreedTerms(!agreedTerms)}
          className={checkboxClass(agreedTerms)}
        >
          {agreedTerms ? (
            <CheckSquare className="w-7 h-7 text-cobalt shrink-0" aria-hidden="true" />
          ) : (
            <Square className="w-7 h-7 text-[#59544D] shrink-0" aria-hidden="true" />
          )}
          <span className="text-base text-ink leading-snug font-medium">{t.check1}</span>
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={agreedDisclaimer}
          onClick={() => setAgreedDisclaimer(!agreedDisclaimer)}
          className={checkboxClass(agreedDisclaimer)}
        >
          {agreedDisclaimer ? (
            <CheckSquare className="w-7 h-7 text-cobalt shrink-0" aria-hidden="true" />
          ) : (
            <Square className="w-7 h-7 text-[#59544D] shrink-0" aria-hidden="true" />
          )}
          <span className="text-base text-ink leading-snug font-medium">{t.check2}</span>
        </button>
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canProceed}
          onClick={handleStart}
          iconPosition="end"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {t.agree}
        </Button>
        {!canProceed && (
          <p className="text-sm text-[#59544D] text-center leading-relaxed pt-2" aria-live="polite">
            {t.agreeHint}
          </p>
        )}
      </div>

      <p className="text-sm text-[#59544D] text-center leading-relaxed">{t.keyNote}</p>
    </div>
  );

  return (
    <PageContainer size="default" className="sm:py-16 lg:py-20">
      <SplitLayout left={leftContent} right={rightContent} ratio="7-5" />
    </PageContainer>
  );
}
