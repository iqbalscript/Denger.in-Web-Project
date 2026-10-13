import type { LLMProvider, LLMProviderRequest, LLMProviderResponse } from './types.ts';

/**
 * AMD provider (AMD Developer Hackathon ACT III, Track 2).
 *
 * Talks to an OpenAI-compatible chat-completions endpoint served by vLLM on
 * AMD Developer Cloud (Instinct / ROCm), usually reached through an SSH tunnel
 * such as http://127.0.0.1:8000/v1. The endpoint URL and model must come from
 * the team's own approved AMD workspace; nothing here assumes a public URL.
 *
 * JSON mode (`response_format`) is OFF by default because vLLM support depends
 * on the model and server flags. Run `probeAmdEndpoint()` first and only set
 * AMD_JSON_MODE=true when the probe reports `jsonModeOk: true`. Callers must
 * still validate the output (see @dengarin/validator carePassport).
 */

export interface AmdProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  jsonMode?: boolean;
  fetchImpl?: typeof fetch;
}

export interface AmdProbeResult {
  ok: boolean;
  models: string[];
  chatOk: boolean;
  jsonModeOk: boolean | null;
  latencyMs: number | null;
  error?: string;
}

interface ChatCompletion {
  choices?: { message?: { content?: string | null } }[];
}

interface ModelList {
  data?: { id?: string }[];
}

const PROBE_TIMEOUT_MS = 15000;

interface ResolvedConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  jsonMode: boolean;
  fetchImpl: typeof fetch;
}

function resolveConfig(config: AmdProviderConfig = {}): ResolvedConfig {
  return {
    baseUrl: (config.baseUrl ?? process.env.AMD_BASE_URL ?? '').trim(),
    apiKey: (config.apiKey ?? process.env.AMD_API_KEY ?? '').trim(),
    model: (config.model ?? process.env.AMD_MODEL ?? '').trim(),
    jsonMode: config.jsonMode ?? process.env.AMD_JSON_MODE === 'true',
    fetchImpl: config.fetchImpl ?? fetch,
  };
}

/**
 * Normalises any of `http://host:8000`, `http://host:8000/`, `http://host:8000/v1`,
 * `http://host:8000/v1/` or a full `.../v1/chat/completions` URL to the `/v1` root.
 */
export function normalizeAmdBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  url = url.replace(/\/chat\/completions$/i, '').replace(/\/models$/i, '');
  if (!/\/v1$/i.test(url)) url = `${url}/v1`;
  return url;
}

function buildHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

/** Strips the key from any text we put in an error message or log. */
function redactSecret(text: string, apiKey: string): string {
  let safe = text.replace(/Bearer\s+[^\s"',]+/gi, 'Bearer [redacted]');
  if (apiKey) safe = safe.split(apiKey).join('[redacted]');
  return safe.slice(0, 300);
}

async function readErrorMessage(response: Response, apiKey: string): Promise<string> {
  const body = await response.text().catch(() => '');
  let message = body;
  try {
    const json = JSON.parse(body);
    message = json?.error?.message ?? json?.message ?? body;
  } catch {
    // Non-JSON body; keep the raw text.
  }
  return redactSecret(String(message), apiKey);
}

interface ChatCallOptions {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  jsonMode: boolean;
  timeoutMs: number;
  maxTokens: number;
}

async function callChat(cfg: ResolvedConfig, options: ChatCallOptions): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    let response: Response;
    try {
      response = await cfg.fetchImpl(`${normalizeAmdBaseUrl(cfg.baseUrl)}/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(cfg.apiKey),
        body: JSON.stringify({
          model: cfg.model,
          ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
          temperature: 0.2,
          max_tokens: options.maxTokens,
          messages: options.messages,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(`AMD endpoint tidak merespons dalam ${options.timeoutMs} ms`);
      }
      throw new Error(`AMD endpoint tidak dapat dihubungi: ${redactSecret((error as Error).message ?? String(error), cfg.apiKey)}`);
    }

    if (!response.ok) {
      throw new Error(`AMD endpoint merespons dengan status ${response.status}: ${await readErrorMessage(response, cfg.apiKey)}`);
    }

    const data = (await response.json()) as ChatCompletion;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      throw new Error('AMD endpoint tidak mengembalikan konten pesan');
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * TIER 0 for Track 2 Care Passport extraction: the team's own model on AMD.
 * Reads AMD_BASE_URL, AMD_API_KEY (optional for loopback-only endpoints),
 * AMD_MODEL and AMD_JSON_MODE by default; pass explicit values in tests.
 */
export function createAmdProvider(config?: AmdProviderConfig): LLMProvider & { readonly isAmd: true } {
  const cfg = resolveConfig(config);

  return {
    id: `amd:${cfg.model}`,
    isAmd: true,

    isConfigured(): boolean {
      return cfg.baseUrl.length > 0 && cfg.model.length > 0;
    },

    async generate(request: LLMProviderRequest): Promise<LLMProviderResponse> {
      if (!cfg.baseUrl || !cfg.model) {
        throw new Error('AMD_BASE_URL dan AMD_MODEL belum dikonfigurasi');
      }

      const messages = request.messages && request.messages.length > 0
        ? request.messages
        : [
            { role: 'system' as const, content: request.systemPrompt },
            { role: 'user' as const, content: request.userPrompt },
          ];

      const rawText = await callChat(cfg, {
        messages,
        jsonMode: cfg.jsonMode,
        timeoutMs: request.timeoutMs,
        maxTokens: 1024,
      });
      return { rawText };
    },
  };
}

/**
 * Capability probe for AMD-02: lists models, sends one tiny chat completion
 * (timed), then retries with `response_format: json_object` to learn whether
 * JSON mode actually works on this endpoint. Never throws.
 */
export async function probeAmdEndpoint(config?: AmdProviderConfig): Promise<AmdProbeResult> {
  const cfg = resolveConfig(config);
  const result: AmdProbeResult = { ok: false, models: [], chatOk: false, jsonModeOk: null, latencyMs: null };

  if (!cfg.baseUrl) {
    return { ...result, error: 'AMD_BASE_URL belum dikonfigurasi' };
  }
  const base = normalizeAmdBaseUrl(cfg.baseUrl);

  // 1. Model list
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const response = await cfg.fetchImpl(`${base}/models`, {
        method: 'GET',
        headers: buildHeaders(cfg.apiKey),
        signal: controller.signal,
      });
      if (!response.ok) {
        return { ...result, error: `GET /models gagal (${response.status}): ${await readErrorMessage(response, cfg.apiKey)}` };
      }
      const data = (await response.json()) as ModelList;
      result.models = (data.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === 'string');
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return { ...result, error: `GET /models gagal: ${redactSecret((error as Error).message ?? String(error), cfg.apiKey)}` };
  }

  const model = cfg.model || result.models[0] || '';
  if (!model) {
    return { ...result, error: 'Tidak ada model yang dilaporkan endpoint dan AMD_MODEL kosong' };
  }
  const chatCfg = { ...cfg, model };

  // 2. Plain chat completion, timed
  const started = Date.now();
  try {
    await callChat(chatCfg, {
      messages: [{ role: 'user', content: 'Balas dengan satu kata: siap' }],
      jsonMode: false,
      timeoutMs: PROBE_TIMEOUT_MS,
      maxTokens: 8,
    });
    result.chatOk = true;
    result.latencyMs = Date.now() - started;
  } catch (error) {
    return { ...result, error: `Chat completion gagal: ${(error as Error).message}` };
  }

  // 3. JSON mode
  try {
    const content = await callChat(chatCfg, {
      messages: [{ role: 'user', content: 'Balas hanya dengan JSON: {"status":"siap"}' }],
      jsonMode: true,
      timeoutMs: PROBE_TIMEOUT_MS,
      maxTokens: 32,
    });
    JSON.parse(content);
    result.jsonModeOk = true;
  } catch {
    result.jsonModeOk = false;
  }

  result.ok = true;
  return result;
}
