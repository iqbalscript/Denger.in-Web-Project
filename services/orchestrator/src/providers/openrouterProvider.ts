import type { LLMProvider, LLMProviderRequest, LLMProviderResponse } from './types.ts';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'anthropic/claude-3.5-haiku';

interface OpenrouterChatCompletion {
  choices?: { message?: { content?: string } }[];
}

/**
 * TIER 2 — Secondary Cloud Fallback (docs/AI_POLICY.md).
 * Reads OPENROUTER_API_KEY from the environment by default; pass an explicit
 * key (or leave it undefined) to control configuration in tests.
 */
export function createOpenrouterProvider(
  apiKey: string | undefined = process.env.OPENROUTER_API_KEY
): LLMProvider {
  return {
    id: 'openrouter-claude-3.5-haiku',

    isConfigured(): boolean {
      return typeof apiKey === 'string' && apiKey.trim().length > 0;
    },

    async generate(request: LLMProviderRequest): Promise<LLMProviderResponse> {
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY belum dikonfigurasi');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

      try {
        const response = await fetch(OPENROUTER_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: request.systemPrompt },
              { role: 'user', content: request.userPrompt }
            ]
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`OpenRouter merespons dengan status ${response.status}`);
        }

        const data = (await response.json()) as OpenrouterChatCompletion;
        const rawText = data.choices?.[0]?.message?.content;
        if (!rawText) {
          throw new Error('OpenRouter tidak mengembalikan konten pesan');
        }

        return { rawText };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}
