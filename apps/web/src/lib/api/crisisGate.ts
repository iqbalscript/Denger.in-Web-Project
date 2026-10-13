import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { AgeBracket, CrisisEvaluationResult, EmergencyContact } from '@dengarin/types';

export interface CrisisGateResult {
  cleared: boolean;
  evaluation: CrisisEvaluationResult;
  /**
   * Deterministic human-support pathway for `severity: 'high'` (audit H3).
   * Present whenever the gate is cleared but high distress was detected.
   */
  supportPathway?: SupportPathway;
}

/** Contact fields the chat UI needs; no internal metadata. */
export type SupportPathwayContact = Pick<
  EmergencyContact,
  'id' | 'name' | 'phone' | 'whatsapp' | 'website' | 'availableHours' | 'cost'
>;

/**
 * Human-support pathway attached to a chat reply when the deterministic crisis
 * engine reports `severity: 'high'` without a `crisis` match.
 *
 * Built ONLY from the rule engine's evaluation, never from model output, and
 * attached by the API after the orchestrator returns. The model therefore can
 * neither remove nor downgrade it (docs/CAREBRIDGE_SAFETY_POLICY.md §3–4:
 * deterministic gate first, AI may only escalate).
 */
export interface SupportPathway {
  kind: 'human_support';
  severity: 'high';
  /** Mirrors the existing whitelisted action, for clients that only know actions. */
  helpDirectoryAction: 'show_help_directory';
  title: string;
  message: string;
  contacts: SupportPathwayContact[];
  links: Array<{ href: '/resources' | '/crisis'; label: string }>;
}

export const SUPPORT_PATHWAY_TITLE = 'Mau ngobrol juga dengan manusia?';
export const SUPPORT_PATHWAY_MESSAGE =
  'Yang kamu ceritakan terdengar berat. Kamu tetap boleh lanjut ngobrol di sini, dan kalau kamu mau, ada orang terlatih yang bisa mendengarkan juga. Gratis atau bertarif standar, dan kamu yang pilih kapan.';

/**
 * Pure: returns a pathway for `high` distress, `null` otherwise. `crisis`
 * results never reach here because the AI path halts before it.
 */
export function buildSupportPathway(evaluation: CrisisEvaluationResult | undefined): SupportPathway | null {
  if (!evaluation || evaluation.isCrisis || evaluation.severity !== 'high') return null;
  return {
    kind: 'human_support',
    severity: 'high',
    helpDirectoryAction: 'show_help_directory',
    title: SUPPORT_PATHWAY_TITLE,
    message: SUPPORT_PATHWAY_MESSAGE,
    contacts: evaluation.emergencyContacts.slice(0, 3).map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      website: contact.website,
      availableHours: contact.availableHours,
      cost: contact.cost,
    })),
    links: [
      { href: '/resources', label: 'Lihat direktori bantuan' },
      { href: '/crisis', label: 'Butuh bantuan sekarang' },
    ],
  };
}

/**
 * Mandatory Step 0 for every API route that accepts free-form user text
 * (chat, forum submissions). Per docs/SAFETY.md, "AI is NEVER the crisis
 * gatekeeper" — this MUST run before any orchestrator/LLM call, and its
 * verdict can never be overridden downstream.
 */
export function runCrisisGate(text: string, ageBracket?: AgeBracket): CrisisGateResult {
  const evaluation = evaluateCrisisInput(text, ageBracket);
  const supportPathway = buildSupportPathway(evaluation);
  return supportPathway
    ? { cleared: !evaluation.isCrisis, evaluation, supportPathway }
    : { cleared: !evaluation.isCrisis, evaluation };
}
