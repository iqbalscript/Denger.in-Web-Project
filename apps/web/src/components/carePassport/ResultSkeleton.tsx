import React from 'react';
import { UrgentHelpLink } from './shared';

function Block({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-[#E7E1D6] rounded-[3px] animate-pulse`} aria-hidden="true" />;
}

function CardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-[8px] border-2 border-[#151515] bg-white p-5 sm:p-6 shadow-[3px_3px_0px_#151515] space-y-4">
      <Block w="w-1/3" h="h-5" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2 border-t border-[#D8D3C9] pt-3">
          <Block w={i % 2 ? 'w-5/6' : 'w-2/3'} h="h-5" />
          <Block w="w-1/2" h="h-3" />
        </div>
      ))}
    </div>
  );
}

/** Mirrors the review layout so nothing jumps when the real result lands. */
export function ResultSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3 w-full max-w-[38rem]">
          <Block w="w-32" h="h-6" />
          <Block w="w-3/4" h="h-10" />
          <Block w="w-full" h="h-5" />
          <p className="text-[15px] font-bold text-[#151515]">Menyusun catatan dari ceritamu. Biasanya kurang dari satu menit.</p>
        </div>
        <UrgentHelpLink className="shrink-0" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={1} />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <CardSkeleton rows={3} />
          <div className="rounded-[8px] border-2 border-[#151515] bg-[#FFF8EF] p-5 shadow-[2px_2px_0px_#151515] space-y-2">
            <Block w="w-1/2" h="h-4" />
            <Block w="w-full" h="h-3" />
            <Block w="w-5/6" h="h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
