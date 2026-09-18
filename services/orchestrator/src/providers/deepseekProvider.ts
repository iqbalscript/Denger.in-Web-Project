import type { LLMProvider, LLMProviderRequest, LLMProviderResponse } from './types.ts';

// Direct DeepSeek Platform (platform.deepseek.com), NOT via OpenRouter.
const DEFAULT_DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

// Default targets deepseek-flash per .env.local configuration, with fallback to deepseek-chat.
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';

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
  model: string = process.env.DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL,
  endpoint: string = process.env.DEEPSEEK_BASE_URL ?? process.env.DEEPSEEK_API_URL ?? DEFAULT_DEEPSEEK_ENDPOINT
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

      const messages = request.messages && request.messages.length > 0
        ? request.messages
        : [
            { role: 'system' as const, content: request.systemPrompt },
            { role: 'user' as const, content: request.userPrompt }
          ];

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            response_format: { type: 'json_object' },
            temperature: 0.6,
            max_tokens: 1024,
            messages
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          let parsedErrorMsg = '';
          try {
            const errJson = JSON.parse(errBody);
            parsedErrorMsg = errJson?.error?.message ?? errJson?.message ?? errBody;
          } catch {
            parsedErrorMsg = errBody;
          }
          throw new Error(`DeepSeek merespons dengan status ${response.status}: ${parsedErrorMsg}`);
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

