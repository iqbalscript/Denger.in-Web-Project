import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { AgeBracket, CrisisEvaluationResult } from '@dengarin/types';
import { CHAT_MAX_HISTORY_COUNT, CHAT_MAX_HISTORY_ENTRY } from './requestLimits.ts';
import type { Language } from '../../i18n/language.ts';

export interface ScreenedChatContext {
  error?: string;
  /** Present only when a deterministic `crisis` rule matched (AI must not run). */
  evaluation?: CrisisEvaluationResult;
  /**
   * Present when no crisis rule matched but some entry (message or history)
   * hit a `high` distress rule. Used to attach the human-support pathway.
   */
  highDistress?: CrisisEvaluationResult;
  history?: Array<{ sender: 'user'; text: string }>;
}

export function screenChatContext(message: unknown, history: unknown, ageBracket?: AgeBracket, lang: Language = 'id'): ScreenedChatContext {
  // Limits come from requestLimits.ts (single source of truth, audit L1).
  if (history !== undefined && (!Array.isArray(history) || history.length > CHAT_MAX_HISTORY_COUNT)) {
    return { error: 'Riwayat percakapan tidak valid.' };
  }
  const accepted: Array<{ sender: 'user'; text: string }> = [];
  const texts: string[] = [];
  for (const entry of (history ?? []) as unknown[]) {
    if (!entry || typeof entry !== 'object') return { error: 'Riwayat percakapan tidak valid.' };
    const item = entry as Record<string, unknown>;
    if ((item.sender !== 'user' && item.sender !== 'assistant') ||
        typeof item.text !== 'string' || item.text.length > CHAT_MAX_HISTORY_ENTRY) {
      return { error: 'Riwayat percakapan tidak valid.' };
    }
    texts.push(item.text);
    // Preserve conversation context as untrusted user-role quotations only.
    accepted.push({ sender: 'user', text: item.sender === 'assistant'
      ? `Unverified earlier assistant reply: ${item.text}` : item.text });
  }
  let highDistress: CrisisEvaluationResult | undefined;
  for (const text of [...texts, message]) {
    if (typeof text === 'string') {
      const evaluation = evaluateCrisisInput(text, ageBracket, lang);
      if (evaluation.isCrisis) return { evaluation, history: accepted };
      if (evaluation.severity === 'high') highDistress = evaluation;
    }
  }
  return highDistress ? { history: accepted, highDistress } : { history: accepted };
}
