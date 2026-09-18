import type { LLMProvider, LLMProviderRequest, LLMProviderResponse } from './types.ts';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// Overridable via OPENROUTER_MODEL. Defaults to a free-tier ("$0 :free"
// suffix) model so this "second brain" fallback costs nothing to run.
// OpenRouter's free catalog and rate limits change over time — check
// https://openrouter.ai/models?max_price=0 and swap the default (or set
// OPENROUTER_MODEL) if this particular slug is retired.
const DEFAULT_OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

interface OpenrouterChatCompletion {
  choices?: { message?: { content?: string } }[];
}

/**
 * TIER 2 — Secondary Cloud Fallback / "second brain" (docs/AI_POLICY.md).
 * Reads OPENROUTER_API_KEY (required) and OPENROUTER_MODEL (optional
 * override) from the environment by default; pass explicit values to
 * control configuration in tests. OPENROUTER_SITE_URL / OPENROUTER_SITE_NAME
 * are optional — OpenRouter uses them only for attribution on free-tier
 * usage, never required for requests to succeed.
 */
export function createOpenrouterProvider(
  apiKey: string | undefined = process.env.OPENROUTER_API_KEY,
  model: string = process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL
): LLMProvider {
  return {
    id: `openrouter:${model}`,

    isConfigured(): boolean {
      return typeof apiKey === 'string' && apiKey.trim().length > 0;
    },

    async generate(request: LLMProviderRequest): Promise<LLMProviderResponse> {
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY belum dikonfigurasi');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      };
      if (process.env.OPENROUTER_SITE_URL) {
        headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
      }
      if (process.env.OPENROUTER_SITE_NAME) {
        headers['X-Title'] = process.env.OPENROUTER_SITE_NAME;
      }

      const messages = request.messages && request.messages.length > 0
        ? request.messages
        : [
            { role: 'system' as const, content: request.systemPrompt },
            { role: 'user' as const, content: request.userPrompt }
          ];

      try {
        const response = await fetch(OPENROUTER_ENDPOINT, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            response_format: { type: 'json_object' },
            messages
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          throw new Error(`OpenRouter merespons dengan status ${response.status}: ${errBody}`);
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
