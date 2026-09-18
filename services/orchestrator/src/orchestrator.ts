import type { AgeBracket, InterventionDomain, ValidatedAIAction } from '@dengarin/types';
import { validateAIOutput } from '@dengarin/validator';
import { buildChatSystemPrompt, buildChatUserPrompt } from '@dengarin/prompts';
import type { LLMProvider } from './providers/types.ts';
import { createDeepseekProvider } from './providers/deepseekProvider.ts';
import { createOpenrouterProvider } from './providers/openrouterProvider.ts';
import { buildDeterministicFallbackAction } from './fallback/deterministicFallback.ts';

/**
 * PURE AI ORCHESTRATION PIPELINE (docs/AI_POLICY.md)
 *
 * ARCHITECTURAL BOUNDARY: callers MUST have already cleared the request
 * through services/crisis-engine (Step 0 of every pipeline). This module has
 * NO crisis-detection authority of its own and can never override that gate
 * — it only orchestrates LLM tiers and validates their output against the
 * whitelisted action schema before returning.
 */

export type OrchestratorTier = 'primary' | 'secondary' | 'fallback';

export interface OrchestratorRequest {
  message: string;
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
}

export interface OrchestratorResult {
  tier: OrchestratorTier;
  providerId: string;
  action: ValidatedAIAction;
  warnings: string[];
}

export interface OrchestratorDependencies {
  /** Ordered provider tiers to attempt, e.g. [deepseek, openrouter]. Defaults to the real Tier 1/Tier 2 providers. */
  providers?: LLMProvider[];
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 4000;
const TIER_LABELS: OrchestratorTier[] = ['primary', 'secondary'];

function parseJsonSafely(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    return undefined;
  }
}

export async function runOrchestrator(
  request: OrchestratorRequest,
  deps: OrchestratorDependencies = {}
): Promise<OrchestratorResult> {
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const providers = deps.providers ?? [createDeepseekProvider(), createOpenrouterProvider()];
  const warnings: string[] = [];

  const promptContext = { ageBracket: request.ageBracket, domain: request.domain };
  const systemPrompt = buildChatSystemPrompt(promptContext);
  const userPrompt = buildChatUserPrompt(request.message, promptContext);

  for (let i = 0; i < providers.length; i += 1) {
    const provider = providers[i];
    const tier = TIER_LABELS[i] ?? 'secondary';

    if (!provider.isConfigured()) {
      warnings.push(`${provider.id} dilewati: belum dikonfigurasi`);
      continue;
    }

    try {
      const response = await provider.generate({ systemPrompt, userPrompt, timeoutMs });
      const parsed = parseJsonSafely(response.rawText);
      const validation = validateAIOutput(parsed);

      if (validation.isValid && validation.action) {
        return { tier, providerId: provider.id, action: validation.action, warnings };
      }

      warnings.push(`${provider.id} menghasilkan output tidak valid: ${validation.errors.join('; ')}`);
    } catch (error) {
      warnings.push(`${provider.id} gagal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  warnings.push('Seluruh tier AI gagal atau tidak dikonfigurasi; menggunakan fallback deterministik.');

  return {
    tier: 'fallback',
    providerId: 'deterministic-fallback',
    action: buildDeterministicFallbackAction(request.domain),
    warnings
  };
}
