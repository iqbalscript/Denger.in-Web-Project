import type { LLMProvider, LLMProviderRequest, LLMProviderResponse } from './types.ts';

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';

interface DeepseekChatCompletion {
  choices?: { message?: { content?: string } }[];
}

/**
 * TIER 1 — Primary Model (docs/AI_POLICY.md).
 * Reads DEEPSEEK_API_KEY from the environment by default; pass an explicit
 * key (or leave it undefined) to control configuration in tests.
 */
export function createDeepseekProvider(
  apiKey: string | undefined = process.env.DEEPSEEK_API_KEY
): LLMProvider {
  return {
    id: 'deepseek-v4-flash',

    isConfigured(): boolean {
      return typeof apiKey === 'string' && apiKey.trim().length > 0;
    },

    async generate(request: LLMProviderRequest): Promise<LLMProviderResponse> {
      if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY belum dikonfigurasi');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

      try {
        const response = await fetch(DEEPSEEK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: request.systemPrompt },
              { role: 'user', content: request.userPrompt }
            ]
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`DeepSeek merespons dengan status ${response.status}`);
        }

        const data = (await response.json()) as DeepseekChatCompletion;
        const rawText = data.choices?.[0]?.message?.content;
        if (!rawText) {
          throw new Error('DeepSeek tidak mengembalikan konten pesan');
        }

        return { rawText };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}
