import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { AgeBracket, CrisisEvaluationResult, EmergencyContact } from '@dengarin/types';
import type { Language } from '../../i18n/language.ts';

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

export const SUPPORT_PATHWAY_TITLE = 'Mau ngobrol juga dengan orang terlatih?';
export const SUPPORT_PATHWAY_MESSAGE =
  'Yang kamu ceritakan terdengar berat. Kamu tetap boleh lanjut ngobrol di sini. Kalau kamu mau, ada orang terlatih yang bisa mendengarkan juga, gratis atau tarif telepon biasa, dan kamu yang pilih kapan.';

const SUPPORT_PATHWAY_TEXT: Record<Language, { title: string; message: string; resources: string; crisis: string }> = {
  id: {
    title: SUPPORT_PATHWAY_TITLE,
    message: SUPPORT_PATHWAY_MESSAGE,
    resources: 'Lihat daftar bantuan',
    crisis: 'Butuh bantuan sekarang',
  },
  en: {
    title: 'Want to talk to a trained person too?',
    message:
      'What you shared sounds heavy. You can keep talking here. If you want, a trained person can listen as well, free or at standard call rates, and you choose when.',
    resources: 'See the help directory',
    crisis: 'I need help now',
  },
};

/**
 * Pure: returns a pathway for `high` distress, `null` otherwise. `crisis`
 * results never reach here because the AI path halts before it. `lang` only
 * picks the fixed wording; contacts and links are the same in both languages.
 */
export function buildSupportPathway(evaluation: CrisisEvaluationResult | undefined, lang: Language = 'id'): SupportPathway | null {
  if (!evaluation || evaluation.isCrisis || evaluation.severity !== 'high') return null;
  const text = SUPPORT_PATHWAY_TEXT[lang] ?? SUPPORT_PATHWAY_TEXT.id;
  return {
    kind: 'human_support',
    severity: 'high',
    helpDirectoryAction: 'show_help_directory',
    title: text.title,
    message: text.message,
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
      { href: '/resources', label: text.resources },
      { href: '/crisis', label: text.crisis },
    ],
  };
}

/**
 * Mandatory Step 0 for every API route that accepts free-form user text
 * (chat, forum submissions). Per docs/SAFETY.md, "AI is NEVER the crisis
 * gatekeeper" — this MUST run before any orchestrator/LLM call, and its
 * verdict can never be overridden downstream.
 */
export function runCrisisGate(text: string, ageBracket?: AgeBracket, lang: Language = 'id'): CrisisGateResult {
  const evaluation = evaluateCrisisInput(text, ageBracket, lang);
  const supportPathway = buildSupportPathway(evaluation, lang);
  return supportPathway
    ? { cleared: !evaluation.isCrisis, evaluation, supportPathway }
    : { cleared: !evaluation.isCrisis, evaluation };
}
