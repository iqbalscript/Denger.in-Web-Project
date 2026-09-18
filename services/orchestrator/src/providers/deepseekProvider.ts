import type { LLMProvider, LLMProviderRequest, LLMProviderResponse } from './types.ts';

// Direct DeepSeek Platform (platform.deepseek.com), NOT via OpenRouter.
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

// Overridable via DEEPSEEK_MODEL — DeepSeek occasionally renames/retires
// model slugs on their platform, so this is not hardcoded blind. Default
// targets DeepSeek V4.1 Flash per product direction; verify the exact slug
// at https://api-docs.deepseek.com/quick_start/pricing if requests 404.
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4.1-flash';

interface DeepseekChatCompletion {
  choices?: { message?: { content?: string } }[];
}

/**
 * TIER 1 — Primary Model (docs/AI_POLICY.md), called directly against the
 * DeepSeek Platform (api.deepseek.com), not through OpenRouter.
 * Reads DEEPSEEK_API_KEY (required) and DEEPSEEK_MODEL (optional override)
 * from the environment by default; pass explicit values to control
 * configuration in tests.
 */
export function createDeepseekProvider(
  apiKey: string | undefined = process.env.DEEPSEEK_API_KEY,
  model: string = process.env.DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL
): LLMProvider {
  return {
    id: `deepseek:${model}`,

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
            model,
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
