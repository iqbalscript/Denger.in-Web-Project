import { runOrchestrator as defaultRunOrchestrator } from '@dengarin/orchestrator';
import type { OrchestratorRequest, OrchestratorResult } from '@dengarin/orchestrator';
import { CLINICAL_DISCLAIMER } from '@dengarin/config';
import type { AgeBracket, CrisisEvaluationResult, InterventionDomain, ValidatedAIAction } from '@dengarin/types';
import { buildSupportPathway, runCrisisGate, type SupportPathway } from './crisisGate.ts';
import { CHAT_TURN_BUDGET_MS, chatInputWithinLimits } from './requestLimits.ts';
import { screenChatContext } from './chatHistory.ts';
import {
  aiCacheKey,
  isAiResponseCacheEnabled,
  readAiCache as defaultReadAiCache,
  writeAiCache as defaultWriteAiCache,
} from './aiCache.ts';
import { toPublicWarnings } from './publicWarnings.ts';
import { validatedActionDisplayText as displayTextForLanguage } from '../voiceRoom.ts';
import { isLanguage, type Language } from '../../i18n/language.ts';

/**
 * /api/chat HANDLER (framework-free, unit-tested with node:test; audit M9).
 *
 * The Next.js route only reads the size-bounded body, wires the real quota,
 * concurrency slot and TTS dependencies, and maps the outcome to HTTP.
 *
 * Order (docs/AI_POLICY.md, docs/SAFETY.md, docs/CAREBRIDGE_SAFETY_POLICY.md §1):
 *   0. Shape + size limits (requestLimits.ts, single source of truth).
 *   1. Deterministic crisis screen of message AND history. `crisis` halts here:
 *      no quota, no cache, no LLM.
 *   2. AI quota, then the deterministic gate on the message again.
 *   3. `high` distress: the AI may still answer, but the response ALWAYS carries
 *      a deterministic `supportPathway` built from the rule engine (audit H3).
 *      It is attached after the orchestrator, so model output can never remove
 *      or downgrade it.
 *   4. Optional response cache, OFF unless `AI_RESPONSE_CACHE=true` (audit H6),
 *      never for no-store requests or high-distress turns.
 *   5. Orchestrator within a per-turn time budget (audit M10).
 *   6. Public projection: provider warnings are sanitised before leaving.
 */

export interface ChatRequestBody {
  sessionId?: string;
  message?: string;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
  /** Untrusted UI hint; it enables a post-validation enhancement only. */
  voiceMode?: 'ruang-ngobrol';
  /**
   * Ruang Ngobrol keeps its conversation memory-only. This opt-out is checked
   * only after both deterministic crisis gates; it changes caching, never the
   * safety or provider pipeline.
   */
  noStore?: boolean;
  /**
   * UI language ('id' default). Changes only the reply language asked of the
   * model, the fixed wording of support/crisis copy, and the cache key. The
   * crisis gate, validator, quota and rate limits are identical for both.
   */
  lang?: Language;
}

export interface RoomAudio {
  data: string;
  mimeType: 'audio/wav';
}

type CachedResult = Pick<OrchestratorResult, 'tier' | 'providerId' | 'action' | 'warnings'>;

export interface ChatHandlerDeps {
  /** Shared anonymous AI quota for this caller. */
  isRateLimited: () => Promise<boolean>;
  /** Shared LLM concurrency slot; null when full. */
  acquireSlot: () => Promise<(() => void) | null>;
  runOrchestrator?: (request: OrchestratorRequest, deps?: { turnBudgetMs?: number }) => Promise<OrchestratorResult>;
  cache?: {
    read: (key: string) => Promise<CachedResult | null>;
    write: (key: string, result: OrchestratorResult) => Promise<void>;
  };
  /** Defaults to process.env; only `AI_RESPONSE_CACHE` is read here. */
  env?: Record<string, string | undefined>;
  /** Optional Ruang Ngobrol audio for an already validated display text. */
  synthesizeRoomAudio?: (displayText: string) => Promise<RoomAudio | undefined>;
  turnBudgetMs?: number;
}

export type ChatResponseData =
  | { crisis: true; evaluation: CrisisEvaluationResult }
  | {
      crisis: false;
      tier: OrchestratorResult['tier'];
      providerId: string;
      action: ValidatedAIAction;
      debiased: boolean;
      disclaimer: string;
      warnings: string[];
      cached: boolean;
      /** Present only for deterministic `high` distress; never model-controlled. */
      supportPathway?: SupportPathway;
      roomAudio?: RoomAudio;
    };

export type ChatHandlerOutcome =
  | { ok: true; data: ChatResponseData }
  | { ok: false; status: 400 | 413 | 429; error: string };

export const CHAT_INVALID = 'Permintaan tidak valid atau terlalu besar.';
export const CHAT_BUSY = 'Sedang cukup ramai. Tarik napas dulu, lalu coba lagi sebentar lagi, ya.';
export const CHAT_INVALID_EN = 'The request is invalid or too large.';
export const CHAT_BUSY_EN = 'It is a bit busy right now. Take a breath and try again in a moment.';

/** Untrusted body field: anything other than 'en' is treated as Indonesian. */
export function requestLanguage(body: unknown): Language {
  const lang = (body as { lang?: unknown } | null)?.lang;
  return isLanguage(lang) ? lang : 'id';
}

export async function handleChatRequest(rawBody: unknown, deps: ChatHandlerDeps): Promise<ChatHandlerOutcome> {
  const lang = requestLanguage(rawBody);
  const busyText = lang === 'en' ? CHAT_BUSY_EN : CHAT_BUSY;
  if (!chatInputWithinLimits(rawBody)) return { ok: false, status: 413, error: lang === 'en' ? CHAT_INVALID_EN : CHAT_INVALID };
  const body = rawBody as ChatRequestBody;
  const screened = screenChatContext(body?.message, body?.history, body?.ageBracket, lang);
  if (screened.error) return { ok: false, status: 400, error: screened.error };
  if (screened.evaluation) return { ok: true, data: { crisis: true, evaluation: screened.evaluation } };
  if (!body || typeof body.message !== 'string' || body.message.trim().length === 0) {
    return { ok: false, status: 400, error: lang === 'en' ? 'The "message" field is required.' : 'Properti "message" wajib diisi.' };
  }

  // Preserve local crisis guidance even when the shared anonymous AI quota is exhausted.
  if (await deps.isRateLimited()) return { ok: false, status: 429, error: busyText };

  const { cleared, evaluation } = runCrisisGate(body.message, body.ageBracket, lang);
  if (!cleared) {
    return { ok: true, data: { crisis: true, evaluation } };
  }

  // H3: deterministic, from the rule engine only (message first, then history).
  const supportPathway = buildSupportPathway(evaluation, lang) ?? buildSupportPathway(screened.highDistress, lang) ?? undefined;

  // BATAS KEAMANAN: cache dibaca SETELAH crisis gate, tidak pernah sebelumnya.
  // H6: cache balasan AI mati kecuali AI_RESPONSE_CACHE=true, dan tidak pernah
  // untuk permintaan noStore atau giliran high distress.
  const cacheEnabled = isAiResponseCacheEnabled(deps.env) && body.noStore !== true && !supportPathway;
  const cacheKey = cacheEnabled ? aiCacheKey({
    message: body.message,
    history: screened.history,
    ageBracket: body.ageBracket,
    domain: body.domain,
    lang
  }) : null;
  const readAiCache = deps.cache?.read ?? defaultReadAiCache;
  const writeAiCache = deps.cache?.write ?? defaultWriteAiCache;

  if (cacheKey) {
    const cached = await readAiCache(cacheKey);
    if (cached) {
      return {
        ok: true,
        data: {
          crisis: false,
          tier: cached.tier,
          providerId: cached.providerId,
          action: cached.action,
          debiased: false,
          disclaimer: CLINICAL_DISCLAIMER,
          warnings: toPublicWarnings(cached.warnings),
          cached: true
        }
      };
    }
  }

  const runOrchestrator = deps.runOrchestrator ?? defaultRunOrchestrator;
  const release = await deps.acquireSlot();
  if (!release) return { ok: false, status: 429, error: busyText };
  let result: OrchestratorResult;
  try {
    result = await runOrchestrator({
      message: body.message,
      history: screened.history,
      ageBracket: body.ageBracket,
      domain: body.domain,
      lang
    }, { turnBudgetMs: deps.turnBudgetMs ?? CHAT_TURN_BUDGET_MS });
  } finally { release(); }

  if (cacheKey) await writeAiCache(cacheKey, result);

  // This untrusted request flag never authorizes arbitrary text synthesis. It
  // merely asks for an optional enhancement after the canonical orchestrator
  // has returned a validated action. noStore is mandatory for room audio so no
  // response or audio is added to the shared Redis cache.
  const wantsRoomTts = body.voiceMode === 'ruang-ngobrol' && body.noStore === true;
  let roomAudio: RoomAudio | undefined;
  if (wantsRoomTts && deps.synthesizeRoomAudio) {
    // Same audited boundary (validated action -> display text); the UI language
    // only picks the fixed lead-in wording for non-chat actions.
    const validatedActionDisplayText = (action: ValidatedAIAction) => displayTextForLanguage(action, lang);
    const displayText = validatedActionDisplayText(result.action);
    if (displayText) roomAudio = await deps.synthesizeRoomAudio(displayText);
  }

  return {
    ok: true,
    data: {
      crisis: false,
      tier: result.tier,
      providerId: result.providerId,
      action: result.action,
      debiased: result.debiased === true,
      disclaimer: CLINICAL_DISCLAIMER,
      // Provider error bodies stay server-side; the client only learns which tier was used.
      warnings: toPublicWarnings(result.warnings),
      cached: false,
      ...(supportPathway ? { supportPathway } : {}),
      ...(roomAudio ? { roomAudio } : {})
    }
  };
}
