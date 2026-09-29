'use client';

import React, { useEffect, useState } from 'react';
import {
  CHAT_PROGRESS_STAGES,
  CHAT_PROGRESS_TOTAL_STEPS,
  chatProgressStageAt,
} from '@/lib/chatProgress';

/**
 * Menggantikan indikator "mengetik" yang statis. Setiap kali label berganti,
 * pembaca layar ikut mengumumkannya (role="status"). Animasi denyut dimatikan
 * untuk pengguna yang memilih reduced motion.
 */
export function ChatProgress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timers = CHAT_PROGRESS_STAGES.filter((stage) => stage.afterMs > 0).map((stage) =>
      setTimeout(() => setElapsed(Date.now() - started), stage.afterMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const stage = chatProgressStageAt(elapsed);

  return (
    <div className="flex items-start gap-3 pl-2" role="status" aria-live="polite">
      <div className="px-2 py-1 rounded border-2 border-ink bg-cobalt text-white font-black text-[11px] uppercase tracking-wider shadow-hard-sm shrink-0">
        DENGAR
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-ink/80 font-bold">{stage.label}</p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: CHAT_PROGRESS_TOTAL_STEPS }, (_, index) => {
            const number = index + 1;
            const done = stage.step === null || number < stage.step;
            const active = stage.step === number;
            return (
              <span
                key={number}
                className={`h-1.5 w-8 rounded-full border border-ink ${
                  done ? 'bg-ink' : active ? 'bg-cobalt animate-pulse motion-reduce:animate-none' : 'bg-paper'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
