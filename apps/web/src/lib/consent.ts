import type { AnonymousUserSession } from '@dengarin/types';

/**
 * Consent routing helpers (H5). Pure functions only, so they can be unit
 * tested in Node and shared by the consent page and the consent guard hook.
 */

export const CONSENT_PATH = '/consent';
export const DEFAULT_AFTER_CONSENT = '/onboarding';

/** True only when the user explicitly agreed on /consent. */
export function hasConsent(session: AnonymousUserSession | null | undefined): boolean {
  return session?.consentGiven === true;
}

/**
 * Returns a safe internal path to continue to after consent, or `fallback`.
 * Rejects absolute URLs, protocol-relative (`//evil`), backslash tricks,
 * control characters, and a loop back to /consent itself.
 */
export function sanitizeNextPath(raw: string | null | undefined, fallback: string = DEFAULT_AFTER_CONSENT): string {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;
  if (value.length > 512) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(value, 'https://dengar.invalid');
  } catch {
    return fallback;
  }
  if (parsed.origin !== 'https://dengar.invalid') return fallback;
  if (parsed.pathname === CONSENT_PATH || parsed.pathname.startsWith(`${CONSENT_PATH}/`)) return fallback;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/** Where a page that needs consent sends a user who has not given it yet. */
export function buildConsentRedirect(currentPath: string): string {
  const next = sanitizeNextPath(currentPath, '');
  return next ? `${CONSENT_PATH}?next=${encodeURIComponent(next)}` : CONSENT_PATH;
}
