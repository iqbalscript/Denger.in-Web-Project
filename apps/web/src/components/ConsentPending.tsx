'use client';

import React from 'react';
import { commonText, useText } from '@/i18n';

/** Neutral placeholder while useConsentGuard checks consent or redirects to /consent. */
export function ConsentPending() {
  const t = useText(commonText);
  return (
    <div role="status" aria-live="polite" className="min-h-[40vh] flex items-center justify-center px-4">
      <p className="text-base text-[#59544D] font-medium">{t.preparingRoom}</p>
    </div>
  );
}
