import type { AgeBracket, InterventionDomain, ValidatedAIAction } from '@dengarin/types';
import { validateAIOutput } from '@dengarin/validator';
import { buildChatSystemPrompt, buildChatUserPrompt } from '@dengarin/prompts';
import type { LLMProvider } from './providers/types.ts';
import { createDeepseekProvider } from './providers/deepseekProvider.ts';
import { createOpenrouterProvider } from './providers/openrouterProvider.ts';
import { createGeminiProvider } from './providers/geminiProvider.ts';
import { debiasCandidateAction } from './debiaser/debiaser.ts';
import { evaluateDomainGate } from './guardrails/domainGate.ts';
import { buildDeterministicFallbackAction } from './fallback/deterministicFallback.ts';

/**
 * PURE AI ORCHESTRATION PIPELINE (docs/AI_POLICY.md)
 *
 * ARCHITECTURAL BOUNDARY: callers MUST have already cleared the request
 * through services/crisis-engine (Step 0 of every pipeline). This module has
 * NO crisis-detection authority of its own and can never override that gate
 * — it only orchestrates LLM tiers, debiasing, and validates their output
 * against the whitelisted action schema and maximum guardrails before returning.
 */

export type OrchestratorTier = 'primary' | 'secondary' | 'tertiary' | 'fallback';

export interface ChatHistoryEntry {
  sender: 'user' | 'assistant';
  text: string;
}

export interface OrchestratorRequest {
  message: string;
  history?: ChatHistoryEntry[];
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
}

export interface OrchestratorResult {
  tier: OrchestratorTier;
  providerId: string;
  action: ValidatedAIAction;
  debiased?: boolean;
  warnings: string[];
}

export interface OrchestratorDependencies {
  /** Ordered provider tiers to attempt, e.g. [deepseek, gemini]. */
  providers?: LLMProvider[];
  /** Optional Second Brain debiaser provider (defaults to OpenRouter Nemotron). */
  debiaserProvider?: LLMProvider;
  /** Set to false to disable second brain debiasing pass. */
  enableDebiaser?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;
const TIER_LABELS: OrchestratorTier[] = ['primary', 'tertiary'];

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
  const warnings: string[] = [];

  // 1. PRE-LLM DETERMINISTIC DOMAIN & CODING GATE
  // Intercept pure technical/programming queries (e.g. coding requests) and redirect empathetically
  const domainCheck = evaluateDomainGate(request.message);
  if (domainCheck.isOutOfDomain && domainCheck.action) {
    return {
      tier: 'primary',
      providerId: 'guardrail:domain-gate',
      action: domainCheck.action,
      debiased: false,
      warnings: [domainCheck.reason ?? 'Dicegat oleh domain gate (bukan pertanyaan kesejahteraan mental)']
    };
  }

  const providers = deps.providers ?? [createDeepseekProvider(), createGeminiProvider()];
  const debiaserProvider = deps.debiaserProvider ?? createOpenrouterProvider();
  const enableDebiaser = deps.enableDebiaser !== false;

  const promptContext = { ageBracket: request.ageBracket, domain: request.domain };
  const systemPrompt = buildChatSystemPrompt(promptContext);
  
  const history = request.history ?? [];
  const historySummary = history.length > 0
    ? history.map((h) => `${h.sender === 'user' ? 'Pengguna' : 'Pendamping'}: ${h.text}`).join('\n')
    : undefined;
  const userPrompt = buildChatUserPrompt(request.message, promptContext, historySummary);

  const structuredMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((h) => ({
      role: h.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: h.sender === 'user' ? h.text : JSON.stringify({ action: 'chat', message: h.text })
    })),
    { role: 'user' as const, content: userPrompt }
  ];

  for (let i = 0; i < providers.length; i += 1) {
    const provider = providers[i];
    const tier = TIER_LABELS[i] ?? 'tertiary';

    if (!provider.isConfigured()) {
      warnings.push(`${provider.id} dilewati: belum dikonfigurasi`);
      continue;
    }

    try {
      const response = await provider.generate({
        systemPrompt,
        userPrompt,
        messages: structuredMessages,
        timeoutMs
      });
      const parsed = parseJsonSafely(response.rawText);
      const validation = validateAIOutput(parsed);

      if (validation.isValid && validation.action) {
        let finalAction = validation.action;
        let wasDebiased = false;

        // 2. SECOND BRAIN (OpenRouter Nemotron Debiasing & Guardrail Pass)
        if (enableDebiaser && debiaserProvider.isConfigured()) {
          const debiasResult = await debiasCandidateAction(
            finalAction,
            request.message,
            debiaserProvider,
            Math.min(timeoutMs, 10000)
          );
          finalAction = debiasResult.action;
          wasDebiased = debiasResult.debiased;
          warnings.push(...debiasResult.warnings);
        }

        return {
          tier,
          providerId: wasDebiased ? `${provider.id}+${debiaserProvider.id}` : provider.id,
          action: finalAction,
          debiased: wasDebiased,
          warnings
        };
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
    debiased: false,
    warnings
  };
}

