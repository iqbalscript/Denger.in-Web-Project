import type { CarePassport, CarePassportProvenance, EmergencyContact } from '@dengarin/types';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import { getHelpDestination, type HelpDestinationId } from '@dengarin/config';
import { buildOpeningLinesSystemPrompt, buildOpeningLinesUserPrompt } from '@dengarin/prompts';
import {
  approvedFacts,
  approvedFactsText,
  buildOpeningLinesTemplate,
  validateOpeningLines,
  type OpeningLine,
} from '@dengarin/validator';
import type { LLMProvider } from './providers/types.ts';
import { createAmdProvider } from './providers/amdProvider.ts';
import { isUrgentHelpRequest } from './carePassportPipeline.ts';

/**
 * OPENING LINES PIPELINE (F-B "Kalimat Pembuka per Tujuan")
 *
 * Order, mirroring docs/CAREBRIDGE_SAFETY_POLICY.md §1:
 *   1. Deterministic crisis gate, re-run on the APPROVED passport text.
 *      Crisis -> no AI, no lines, emergency contacts only.
 *   2. AI-processing consent. Declined -> deterministic template, "tanpa AI".
 *   3. Inference on approved values only, provider by provider (AMD by default).
 *   4. Grounding validation; anything that fails -> deterministic template.
 *
 * Stateless: nothing here caches or logs user text.
 */

export type OpeningLinesState =
  /** Model sentences passed grounding; `lines` came from the provider in `provenance`. */
  | 'READY'
  /** Deterministic template built from approved values; no AI text is shown. */
  | 'FALLBACK_TEMPLATE'
  /** Crisis indicator in the approved text; no lines at all. */
  | 'IMMEDIATE_HELP_SCREEN';

export interface OpeningLinesPipelineInput {
  passport: CarePassport;
  destination: HelpDestinationId;
  aiConsent: boolean;
}

export interface OpeningLinesPipelineOptions {
  providers?: LLMProvider[];
  timeoutMs?: number;
  now?: () => number;
}

export interface OpeningLinesResult {
  state: OpeningLinesState;
  destination: HelpDestinationId;
  lines: OpeningLine[];
  provenance: CarePassportProvenance;
  /** Present only for IMMEDIATE_HELP_SCREEN. */
  emergencyContacts?: EmergencyContact[];
  /** Model sentences removed by the validator (0 on the template path). */
  droppedLines: number;
  warnings: string[];
}

const DEFAULT_TIMEOUT_MS = 12000;
const ADULT_AGE_BRACKET = '18-29';

function defaultProviders(): LLMProvider[] {
  const amd = createAmdProvider();
  return amd.isConfigured() ? [amd] : [];
}

function envTimeoutMs(): number | undefined {
  const parsed = Number(process.env.AMD_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function isAmdProvider(provider: LLMProvider): boolean {
  return (provider as LLMProvider & { isAmd?: unknown }).isAmd === true;
}

const NO_AI: CarePassportProvenance = { providerId: 'none', isAmd: false, isFallback: true };

export async function runOpeningLinesPipeline(
  input: OpeningLinesPipelineInput,
  options: OpeningLinesPipelineOptions = {}
): Promise<OpeningLinesResult> {
  const destination = getHelpDestination(input.destination);
  const providers = options.providers ?? defaultProviders();
  const timeoutMs = options.timeoutMs ?? envTimeoutMs() ?? DEFAULT_TIMEOUT_MS;
  const now = options.now ?? Date.now;
  const warnings: string[] = [];

  // 1. Crisis gate on the approved text, before consent or any model call.
  const approvedText = approvedFactsText(input.passport);
  const crisis = evaluateCrisisInput(approvedText, ADULT_AGE_BRACKET);
  if (crisis.isCrisis || isUrgentHelpRequest(approvedText)) {
    return {
      state: 'IMMEDIATE_HELP_SCREEN',
      destination: destination.id,
      lines: [],
      emergencyContacts: crisis.emergencyContacts,
      provenance: NO_AI,
      droppedLines: 0,
      warnings: crisis.isCrisis ? ['crisis_gate'] : ['urgent_help_requested'],
    };
  }

  const template = (): OpeningLinesResult => ({
    state: 'FALLBACK_TEMPLATE',
    destination: destination.id,
    lines: buildOpeningLinesTemplate(input.passport, destination),
    provenance: NO_AI,
    droppedLines: 0,
    warnings,
  });

  // 2. No consent -> template only, labelled as such.
  if (!input.aiConsent) {
    warnings.push('ai_consent_declined');
    return template();
  }

  const facts = approvedFacts(input.passport);
  if (facts.length === 0) {
    warnings.push('no_approved_facts');
    return template();
  }

  // 3. Inference on approved values only.
  const systemPrompt = buildOpeningLinesSystemPrompt();
  const userPrompt = buildOpeningLinesUserPrompt(facts, destination);

  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    const startedAt = now();
    let rawText: string;
    try {
      ({ rawText } = await provider.generate({ systemPrompt, userPrompt, timeoutMs }));
    } catch (error) {
      warnings.push(`${provider.id}: ${(error as Error).message}`);
      continue;
    }
    const latencyMs = now() - startedAt;

    // 4. Grounding: every surviving sentence traces to an approved field.
    const validation = validateOpeningLines(rawText, input.passport, destination);
    if (!validation.ok) {
      warnings.push(`${provider.id}: ${validation.errors.join('; ')}`);
      continue;
    }
    return {
      state: 'READY',
      destination: destination.id,
      lines: validation.lines,
      provenance: { providerId: provider.id, isAmd: isAmdProvider(provider), isFallback: false, latencyMs },
      droppedLines: validation.droppedLines,
      warnings: [...warnings, ...validation.warnings],
    };
  }

  // Every provider failed, was rejected, or none configured: never fabricate.
  if (providers.length === 0) warnings.push('no_provider_configured');
  else warnings.push('provider_rejected');
  return template();
}
