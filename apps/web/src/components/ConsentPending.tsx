import React from 'react';

/** Neutral placeholder while useConsentGuard checks consent or redirects to /consent. */
export function ConsentPending() {
  return (
    <div role="status" aria-live="polite" className="min-h-[40vh] flex items-center justify-center px-4">
      <p className="text-sm text-[#59544D] font-medium">Menyiapkan ruangmu...</p>
    </div>
  );
}
