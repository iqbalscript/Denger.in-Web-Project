import type { 
  ValidatedAIAction, 
  ValidationResult, 
  WhitelistedAIAction 
} from '@dengarin/types';

/**
 * STRICT ACTION SCHEMA & SAFETY VALIDATOR
 * 
 * Ensures that ANY response produced by an AI model conforms strictly to the
 * whitelisted action vocabulary.
 * AI cannot invent new verbs, cannot diagnose, cannot prescribe, and cannot advise on finance.
 */

export const ALLOWED_ACTIONS: readonly WhitelistedAIAction[] = [
  'chat',
  'suggest_mission',
  'open_journal_prompt',
  'suggest_forum',
  'adjust_path',
  'show_help_directory'
] as const;

export const STANDARD_DISCLAIMER =
  'Dengar.in adalah pendamping mandiri berbasis kecerdasan buatan, bukan pengganti tenaga profesional kesehatan jiwa.';

export function validateAIOutput(rawInput: unknown): ValidationResult {
  const errors: string[] = [];
  let sanitized = false;

  if (!rawInput || typeof rawInput !== 'object') {
    return {
      isValid: false,
      sanitized: false,
      errors: ['Output harus berupa objek JSON yang valid']
    };
  }

  const payload = rawInput as Record<string, unknown>;

  // 1. Action Whitelist Check
  const action = payload.action as string;
  if (!action || typeof action !== 'string') {
    return {
      isValid: false,
      sanitized: false,
      errors: ['Properti "action" wajib disertakan']
    };
  }

  if (!ALLOWED_ACTIONS.includes(action as WhitelistedAIAction)) {
    return {
      isValid: false,
      sanitized: false,
      errors: [`Aksi "${action}" ditolak: bukan aksi yang diizinkan dalam sistem`]
    };
  }

  // 2. Disclaimer Verification & Sanitization
  let disclaimer = payload.disclaimer as string | undefined;
  if (!disclaimer || typeof disclaimer !== 'string' || disclaimer.trim().length === 0) {
    disclaimer = STANDARD_DISCLAIMER;
    sanitized = true;
  }

  // Detect extra unexpected fields and sanitize them away
  const allowedKeysByAction: Record<WhitelistedAIAction, string[]> = {
    chat: ['action', 'message', 'disclaimer'],
    suggest_mission: ['action', 'missionId', 'reason', 'disclaimer'],
    open_journal_prompt: ['action', 'prompt', 'suggestedTags', 'disclaimer'],
    suggest_forum: ['action', 'topicSlug', 'disclaimer'],
    adjust_path: ['action', 'recommendedPace', 'reason', 'disclaimer'],
    show_help_directory: ['action', 'category', 'disclaimer']
  };

  const allowedKeys = allowedKeysByAction[action as WhitelistedAIAction] || [];
  const extraKeys = Object.keys(payload).filter(k => !allowedKeys.includes(k));
  if (extraKeys.length > 0) {
    sanitized = true;
  }

  // 3. Payload-Specific Structural Validations
  let validatedAction: ValidatedAIAction;

  switch (action as WhitelistedAIAction) {
    case 'chat': {
      const message = payload.message as string;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        errors.push('Aksi "chat" membutuhkan properti "message" non-kosong');
      }
      validatedAction = {
        action: 'chat',
        message: message ? message.trim() : '',
        disclaimer
      };
      break;
    }

    case 'suggest_mission': {
      const missionId = payload.missionId as string;
      const reason = (payload.reason as string) || 'Rekomendasi langkah kecil hari ini';
      if (!missionId || typeof missionId !== 'string') {
        errors.push('Aksi "suggest_mission" membutuhkan properti "missionId"');
      }
      validatedAction = {
        action: 'suggest_mission',
        missionId: missionId || '',
        reason,
        disclaimer
      };
      break;
    }

    case 'open_journal_prompt': {
      const prompt = payload.prompt as string;
      const suggestedTags = Array.isArray(payload.suggestedTags)
        ? (payload.suggestedTags as string[])
        : ['refleksi'];
      if (!prompt || typeof prompt !== 'string') {
        errors.push('Aksi "open_journal_prompt" membutuhkan properti "prompt"');
      }
      validatedAction = {
        action: 'open_journal_prompt',
        prompt: prompt || '',
        suggestedTags,
        disclaimer
      };
      break;
    }

    case 'suggest_forum': {
      const topicSlug = payload.topicSlug as string;
      if (!topicSlug || typeof topicSlug !== 'string') {
        errors.push('Aksi "suggest_forum" membutuhkan properti "topicSlug"');
      }
      validatedAction = {
        action: 'suggest_forum',
        topicSlug: topicSlug || '',
        disclaimer
      };
      break;
    }

    case 'adjust_path': {
      const pace = payload.recommendedPace as 'slower' | 'standard' | 'accelerated';
      const reason = payload.reason as string;
      if (!['slower', 'standard', 'accelerated'].includes(pace)) {
        errors.push('Aksi "adjust_path" membutuhkan recommendedPace yang valid');
      }
      validatedAction = {
        action: 'adjust_path',
        recommendedPace: pace || 'standard',
        reason: reason || 'Penyesuaian kecepatan langkah',
        disclaimer
      };
      break;
    }

    case 'show_help_directory': {
      const category = payload.category as 'counseling' | 'financial' | 'teen';
      if (!['counseling', 'financial', 'teen'].includes(category)) {
        errors.push('Aksi "show_help_directory" membutuhkan category yang valid');
      }
      validatedAction = {
        action: 'show_help_directory',
        category: category || 'counseling',
        disclaimer
      };
      break;
    }

    default:
      return {
        isValid: false,
        sanitized: false,
        errors: [`Aksi ${action} tidak didukung`]
      };
  }

  return {
    isValid: errors.length === 0,
    action: errors.length === 0 ? validatedAction : undefined,
    sanitized,
    errors
  };
}
