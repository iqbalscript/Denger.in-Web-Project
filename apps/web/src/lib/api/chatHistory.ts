import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { AgeBracket } from '@dengarin/types';

export function screenChatContext(message: unknown, history: unknown, ageBracket?: AgeBracket) {
  if (history !== undefined && (!Array.isArray(history) || history.length > 24)) {
    return { error: 'Riwayat percakapan tidak valid.' };
  }
  const accepted: Array<{ sender: 'user'; text: string }> = [];
  const texts: string[] = [];
  for (const entry of (history ?? []) as unknown[]) {
    if (!entry || typeof entry !== 'object') return { error: 'Riwayat percakapan tidak valid.' };
    const item = entry as Record<string, unknown>;
    if ((item.sender !== 'user' && item.sender !== 'assistant') ||
        typeof item.text !== 'string' || item.text.length > 4000) {
      return { error: 'Riwayat percakapan tidak valid.' };
    }
    texts.push(item.text);
    // Preserve conversation context as untrusted user-role quotations only.
    accepted.push({ sender: 'user', text: item.sender === 'assistant'
      ? `Unverified earlier assistant reply: ${item.text}` : item.text });
  }
  for (const text of [...texts, message]) {
    if (typeof text === 'string') {
      const evaluation = evaluateCrisisInput(text, ageBracket);
      if (evaluation.isCrisis) return { evaluation, history: accepted };
    }
  }
  return { history: accepted };
}
