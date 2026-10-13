'use client';

import React, { useState, useEffect } from 'react';
import type { CelebrationData } from '@dengarin/types';
import { LEVEL_THRESHOLDS, BADGE_DEFINITIONS } from '@/lib/gamification';

interface CelebrationToastProps {
  celebration: CelebrationData | null;
  onDismiss?: () => void;
}

/**
 * Micro-celebration toast for Langkah awards.
 *
 * Design: brutalist card — bg-lime, border-2 border-ink, shadow-hard-sm.
 * Position: fixed bottom-right (above mobile dock).
 * Duration: 3.5s visible, respects prefers-reduced-motion.
 * Accessibility: role="status", aria-live="polite".
 *
 * CRISIS INVARIANT: This component is never rendered on /crisis.
 * Callers must ensure this.
 */
export function CelebrationToast({ celebration, onDismiss }: CelebrationToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!celebration) return;
    setVisible(true);
    setExiting(false);

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        setExiting(false);
        onDismiss?.();
      }, 200);
    }, 3500);

    return () => clearTimeout(timer);
  }, [celebration, onDismiss]);

  if (!visible || !celebration) return null;

  const lines: string[] = [];
  lines.push(`+${celebration.langkahAwarded} LANGKAH`);

  if (celebration.levelUp !== undefined) {
    const levelName = LEVEL_THRESHOLDS[celebration.levelUp]?.name ?? '';
    lines.push(`NAIK LEVEL: ${levelName.toUpperCase()}`);
  }

  if (celebration.newBadges && celebration.newBadges.length > 0) {
    const badgeNames = celebration.newBadges
      .map(id => BADGE_DEFINITIONS.find(b => b.id === id)?.name ?? id)
      .join(', ');
    lines.push(`BADGE BARU: ${badgeNames.toUpperCase()}`);
  }

  if (celebration.questCompleted) {
    lines.push('QUEST MINGGU INI SELESAI!');
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed bottom-24 lg:bottom-6 right-4 z-50 max-w-xs
        bg-[#B8F34A] border-2 border-[#151515] rounded-[6px] shadow-[3px_3px_0px_#151515]
        px-4 py-3 space-y-1
        transition-all duration-200
        motion-reduce:transition-none
        ${exiting ? 'opacity-0 translate-y-2 motion-reduce:translate-y-0' : 'opacity-100 translate-y-0'}
      `}
    >
      {lines.map((line, i) => (
        <p
          key={i}
          className={`text-[#151515] font-bold uppercase tracking-[0.05em] leading-tight ${
            i === 0 ? 'text-base tabular-nums' : 'text-xs'
          }`}
        >
          {line}
        </p>
      ))}
      <p className="text-[13px] text-[#151515] font-medium pt-0.5">
        Kecil, tapi kehitung.
      </p>
    </div>
  );
}
