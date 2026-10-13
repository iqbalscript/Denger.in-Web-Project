import type { AgeBracket, InterventionDomain, ValidatedAIAction } from '@dengarin/types';
import { STANDARD_DISCLAIMER, validateAIOutput } from '@dengarin/validator';
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

export type ReplyLanguage = 'id' | 'en';

export interface OrchestratorRequest {
  message: string;
  history?: ChatHistoryEntry[];
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
  /** UI language; the model is asked to reply in it. Safety pipeline is identical. */
  lang?: ReplyLanguage;
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
  /** Per-provider ceiling; each call also gets no more than the turn budget left. */
  timeoutMs?: number;
  /**
   * Overall wall-clock budget for ONE chat turn (audit M10): provider tiers and
   * the optional debiaser share it. Defaults to DEFAULT_TURN_BUDGET_MS.
   */
  turnBudgetMs?: number;
  /** Clock injection for tests. */
  now?: () => number;
  /** Environment for the `DENGARIN_DEBIASER=off` kill switch (defaults to process.env). */
  env?: Record<string, string | undefined>;
}

const DEFAULT_TIMEOUT_MS = 15000;
/** Overall time budget for one turn (primary + fallback tiers + debiaser). */
export const DEFAULT_TURN_BUDGET_MS = 18000;
/** Debiaser never waits longer than this, even with budget to spare. */
export const DEBIASER_MAX_TIMEOUT_MS = 10000;
/** Below this much remaining budget the debiaser is skipped, not squeezed. */
export const DEBIASER_MIN_BUDGET_MS = 3000;
/** Below this much remaining budget a further provider tier is not attempted. */
export const PROVIDER_MIN_BUDGET_MS = 2000;

/**
 * Pure budget rule for the optional Second Brain pass (audit M10).
 * Returns the timeout to give the debiaser, or null to skip it because the
 * primary call already used most of the turn budget.
 */
export function planDebiasTimeout(
  remainingMs: number,
  maxMs: number = DEBIASER_MAX_TIMEOUT_MS,
  minMs: number = DEBIASER_MIN_BUDGET_MS
): number | null {
  if (!Number.isFinite(remainingMs) || remainingMs < minMs) return null;
  return Math.min(maxMs, Math.floor(remainingMs));
}

/** Pure budget rule for a provider tier: its timeout, or null to skip it. */
export function planProviderTimeout(
  remainingMs: number,
  maxMs: number = DEFAULT_TIMEOUT_MS,
  minMs: number = PROVIDER_MIN_BUDGET_MS
): number | null {
  if (!Number.isFinite(remainingMs) || remainingMs < minMs) return null;
  return Math.min(maxMs, Math.floor(remainingMs));
}

/** `DENGARIN_DEBIASER=off|false|0` disables the second LLM pass (e.g. for demos). */
export function isDebiaserDisabledByEnv(env: Record<string, string | undefined> = process.env): boolean {
  const value = env.DENGARIN_DEBIASER?.trim().toLowerCase();
  return value === 'off' || value === 'false' || value === '0';
}
const TIER_LABELS: OrchestratorTier[] = ['primary', 'tertiary'];

function safeDeterministicAction(lang: ReplyLanguage = 'id'): ValidatedAIAction {
  return {
    action: 'chat',
    message: lang === 'en'
      ? 'I am here with you. Take one slow breath and pick one small step that feels safe right now.'
      : 'Aku di sini menemanimu. Coba tarik satu napas pelan dan pilih satu langkah kecil yang terasa aman sekarang.',
    disclaimer: STANDARD_DISCLAIMER
  };
}

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
  const now = deps.now ?? Date.now;
  const deadline = now() + (deps.turnBudgetMs ?? DEFAULT_TURN_BUDGET_MS);
  const remaining = () => deadline - now();
  const warnings: string[] = [];

  // 1. PRE-LLM DETERMINISTIC DOMAIN & CODING GATE
  // Intercept pure technical/programming queries (e.g. coding requests) and redirect empathetically
  const lang: ReplyLanguage = request.lang === 'en' ? 'en' : 'id';
  const domainCheck = evaluateDomainGate(request.message, lang);
  if (domainCheck.isOutOfDomain && domainCheck.action) {
    const validation = validateAIOutput(domainCheck.action);
    return {
      tier: 'primary',
      providerId: 'guardrail:domain-gate',
      action: validation.isValid && validation.action ? validation.action : safeDeterministicAction(lang),
      debiased: false,
      warnings: [domainCheck.reason ?? 'Dicegat oleh domain gate (bukan pertanyaan kesejahteraan mental)']
    };
  }

  const providers = deps.providers ?? [createDeepseekProvider(), createGeminiProvider()];
  const debiaserProvider = deps.debiaserProvider ?? createOpenrouterProvider();
  const enableDebiaser = deps.enableDebiaser !== false && !isDebiaserDisabledByEnv(deps.env);

  const promptContext = { ageBracket: request.ageBracket, domain: request.domain, lang };
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

    const providerTimeoutMs = planProviderTimeout(remaining(), timeoutMs);
    if (providerTimeoutMs === null) {
      warnings.push(`${provider.id} dilewati: anggaran waktu giliran habis`);
      continue;
    }

    try {
      const response = await provider.generate({
        systemPrompt,
        userPrompt,
        messages: structuredMessages,
        timeoutMs: providerTimeoutMs
      });
      const parsed = parseJsonSafely(response.rawText);
      const validation = validateAIOutput(parsed);

      if (validation.isValid && validation.action) {
        let finalAction = validation.action;
        let wasDebiased = false;

        // 2. SECOND BRAIN (OpenRouter Nemotron Debiasing & Guardrail Pass)
        // Budget-aware (audit M10): skipped when the primary call already used
        // most of the turn budget, so one turn never pays primary + full debiaser.
        if (enableDebiaser && debiaserProvider.isConfigured()) {
          const debiasTimeoutMs = planDebiasTimeout(remaining(), Math.min(timeoutMs, DEBIASER_MAX_TIMEOUT_MS));
          if (debiasTimeoutMs === null) {
            warnings.push(`Second Brain (${debiaserProvider.id}) dilewati: anggaran waktu giliran hampir habis`);
          } else {
            const debiasResult = await debiasCandidateAction(
              finalAction,
              request.message,
              debiaserProvider,
              debiasTimeoutMs,
              lang
            );
            finalAction = debiasResult.action;
            wasDebiased = debiasResult.debiased;
            warnings.push(...debiasResult.warnings);
          }
        }

        // A transformed candidate must cross the same final validation boundary
        // before it becomes user-visible.
        const finalValidation = validateAIOutput(finalAction);
        if (!finalValidation.isValid || !finalValidation.action) {
          warnings.push(`${provider.id} menghasilkan output akhir tidak aman: ${finalValidation.errors.join('; ')}`);
          continue;
        }

        return {
          tier,
          providerId: wasDebiased ? `${provider.id}+${debiaserProvider.id}` : provider.id,
          action: finalValidation.action,
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

  const fallback = buildDeterministicFallbackAction(request.domain, lang);
  const fallbackValidation = validateAIOutput(fallback);
  return {
    tier: 'fallback',
    providerId: 'deterministic-fallback',
    action: fallbackValidation.isValid && fallbackValidation.action ? fallbackValidation.action : safeDeterministicAction(lang),
    debiased: false,
    warnings
  };
}

export * from './carePassportPipeline.ts';
export * from './openingLinesPipeline.ts';
