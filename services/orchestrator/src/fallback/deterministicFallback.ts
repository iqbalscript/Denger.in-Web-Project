import type { InterventionDomain, ValidatedAIAction } from '@dengarin/types';
import { CLINICAL_DISCLAIMER, DOMAIN_MISSION_TEMPLATES } from '@dengarin/config';

/**
 * TIER 3 — Deterministic Offline Fallback (docs/AI_POLICY.md).
 * Zero external HTTP calls, guaranteed instant response. Never leaves the
 * user with a broken screen when every AI tier is unreachable.
 */
export function buildDeterministicFallbackAction(
  domain: InterventionDomain = 'general'
): ValidatedAIAction {
  const mission = DOMAIN_MISSION_TEMPLATES[domain] ?? DOMAIN_MISSION_TEMPLATES.general;

  return {
    action: 'chat',
    message:
      `Aku di sini menemanimu. Layanan AI sedang tidak dapat dijangkau, jadi coba langkah tenang ini dulu: ${mission.steps[0]}`,
    disclaimer: CLINICAL_DISCLAIMER
  };
}
