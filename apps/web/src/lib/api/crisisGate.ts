import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { AgeBracket, CrisisEvaluationResult } from '@dengarin/types';

export interface CrisisGateResult {
  cleared: boolean;
  evaluation: CrisisEvaluationResult;
}

/**
 * Mandatory Step 0 for every API route that accepts free-form user text
 * (chat, forum submissions). Per docs/SAFETY.md, "AI is NEVER the crisis
 * gatekeeper" — this MUST run before any orchestrator/LLM call, and its
 * verdict can never be overridden downstream.
 */
export function runCrisisGate(text: string, ageBracket?: AgeBracket): CrisisGateResult {
  const evaluation = evaluateCrisisInput(text, ageBracket);
  return { cleared: !evaluation.isCrisis, evaluation };
}
