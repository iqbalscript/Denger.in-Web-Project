import type { InterventionDomain, ValidatedAIAction } from '@dengarin/types';
import { CLINICAL_DISCLAIMER, DOMAIN_MISSION_TEMPLATES } from '@dengarin/config';

/**
 * TIER 3 — Deterministic Offline Fallback (docs/AI_POLICY.md).
 * Zero external HTTP calls, guaranteed instant response. Never leaves the
 * user with a broken screen when every AI tier is unreachable.
 */
export function buildDeterministicFallbackAction(
  domain: InterventionDomain = 'general',
  lang: 'id' | 'en' = 'id'
): ValidatedAIAction {
  const mission = DOMAIN_MISSION_TEMPLATES[domain] ?? DOMAIN_MISSION_TEMPLATES.general;

  return {
    action: 'chat',
    message: lang === 'en'
      // The mission step itself is Indonesian catalog text; the English lead-in
      // keeps the person oriented and the UI translates the mission on its page.
      ? `I am here with you. The AI service cannot be reached right now, so try one calm step first: breathe in slowly for a count of 4, hold for 4, breathe out for 4, and repeat 3 times.`
      : `Aku di sini menemanimu. Layanan AI sedang tidak bisa dihubungi, jadi coba langkah tenang ini dulu: ${mission.steps[0]}`,
    disclaimer: CLINICAL_DISCLAIMER
  };
}
