'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AnonymousUserSession } from '@dengarin/types';
import { getAnonymousSession } from './storage.ts';
import { buildConsentRedirect, hasConsent } from './consent.ts';

export interface ConsentGuardResult {
  /** True once the session is read on the client and consent is confirmed. */
  ready: boolean;
  session: AnonymousUserSession | null;
}

/**
 * Pages that store or process the user's data call this (H5). Without an
 * explicit consent record, the user is sent to /consent?next=<this page>
 * instead of a session being created silently. Reads storage only inside
 * an effect, so server and first client render match (L9).
 */
export function useConsentGuard(): ConsentGuardResult {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<ConsentGuardResult>({ ready: false, session: null });

  useEffect(() => {
    const session = getAnonymousSession();
    if (!hasConsent(session)) {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      router.replace(buildConsentRedirect(`${pathname || '/'}${search}`));
      return;
    }
    setState({ ready: true, session });
  }, [router, pathname]);

  return state;
}
