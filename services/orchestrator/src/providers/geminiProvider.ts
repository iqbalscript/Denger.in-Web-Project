import type { LLMProvider, LLMProviderRequest, LLMProviderResponse } from './types.ts';

const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/**
 * TIER 3 — Tertiary Generative Fallback Brain (Google Gemini).
 * Invoked when primary (DeepSeek) and secondary (OpenRouter) tiers fail
 * or are unconfigured. Reads GEMINI_API_KEY and GEMINI_MODEL from environment.
 */
export function createGeminiProvider(
  apiKey: string | undefined = process.env.GEMINI_API_KEY,
  model: string = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL
): LLMProvider {
  return {
    id: `gemini:${model}`,

    isConfigured(): boolean {
      return typeof apiKey === 'string' && apiKey.trim().length > 0;
    },

    async generate(request: LLMProviderRequest): Promise<LLMProviderResponse> {
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY belum dikonfigurasi');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

      // Translate multi-turn history into Gemini's contents schema
      let contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (request.messages && request.messages.length > 0) {
        contents = request.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
            parts: [{ text: m.content }]
          }));
      }

      if (contents.length === 0) {
        contents = [{ role: 'user', parts: [{ text: request.userPrompt }] }];
      }

      const endpoint = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: request.systemPrompt }]
            },
            contents,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.6,
              maxOutputTokens: 1024
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          let parsedErrorMsg = '';
          try {
            const errJson = JSON.parse(errBody);
            parsedErrorMsg = errJson?.error?.message ?? errBody;
          } catch {
            parsedErrorMsg = errBody;
          }
          throw new Error(`Gemini API merespons dengan status ${response.status}: ${parsedErrorMsg}`);
        }

        const data = (await response.json()) as GeminiGenerateContentResponse;
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          throw new Error('Gemini tidak mengembalikan konten respons');
        }

        return { rawText };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}
