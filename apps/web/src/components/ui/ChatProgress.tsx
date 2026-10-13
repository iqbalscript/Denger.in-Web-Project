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
      <div className="px-2 py-1 rounded-[4px] border-2 border-ink bg-cobalt text-white font-bold text-xs uppercase tracking-[0.05em] shadow-hard-sm shrink-0" aria-hidden="true">
        DENGAR
      </div>
      <div className="space-y-1.5">
        <p className="text-sm text-[#4A453E] font-semibold">{stage.label}</p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: CHAT_PROGRESS_TOTAL_STEPS }, (_, index) => {
            const number = index + 1;
            const done = stage.step === null || number < stage.step;
            const active = stage.step === number;
            return (
              <span
                key={number}
                className={`h-1.5 w-8 rounded-[2px] border border-ink transition-colors duration-200 ${
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
