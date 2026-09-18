export interface LLMProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
}

export interface LLMProviderResponse {
  rawText: string;
}

/**
 * Contract every AI provider tier (DeepSeek, OpenRouter, ...) must implement.
 * Providers only ever produce raw text; validation against the whitelisted
 * action schema happens centrally in the orchestrator via @dengarin/validator.
 */
export interface LLMProvider {
  readonly id: string;
  isConfigured(): boolean;
  generate(request: LLMProviderRequest): Promise<LLMProviderResponse>;
}
