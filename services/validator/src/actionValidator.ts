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
const MAX_ACTION_TEXT_LENGTH = 1500;
const MAX_SUGGESTED_TAGS = 8;

/**
 * Normalizes generated prose for deterministic safety checks without changing
 * the text delivered to the user. These checks target direct clinical advice,
 * not discussion of medication or general psychoeducation.
 */
function normalizeSafetyText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('id-ID')
    .replace(/\p{Cf}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function containsUnsafeMedicalAdvice(value: string): boolean {
  const text = normalizeSafetyText(value);
  const compact = text.replace(/\s+/g, '');
  const condition = '(?:bipolar|depresi(?:\\s+mayor)?|skizofrenia|gangguan\\s+kecemasan|anxiety\\s+disorder|adhd|gad|ocd|ptsd)';
  const medication = '(?:obat(?:ku|mu|nya)?|medikasi|medication|dosis(?:ku|mu|nya)?|dose|antidepresan|antipsikotik|xanax|sertraline|fluoxetine|alprazolam|zoloft|prozac|pil\\s+tidur|pills?|tablets?)';

  const definitiveDiagnosis = new RegExp(
    `\\b(?:kamu|anda|lu|loe|you)\\s+(?:(?:pasti|jelas|memang|definitely|certainly)\\s+)?(?:mengalami|menderita|mengidap|terkena|terdiagnosis|didiagnosis|memiliki|have|has|are)\\s+${condition}\\b|\\b(?:kamu|anda|lu|loe|you)\\s+(?:(?:pasti|jelas|definitely|certainly)\\s+|(?:adalah|itu)\\s+)?${condition}\\b`,
    'iu'
  );
  const medicationInstruction = new RegExp(
    `\\b(?:berhenti(?:lah)?|hentikan|stop|jangan\\s+(?:lagi\\s+)?(?:minum|konsumsi|consume|take)|mulai(?:lah)?|start|naikkan|tingkatkan|increase|turunkan|kurangi|reduce|double|ganti(?:kan)?|switch|ubah|gabungkan|kombinasikan|combine|mix|skip|lewati|minumlah|minum|konsumsi|consume|take|ambil(?:lah)?|gunakan|pakai)\\b(?:\\s+\\p{L}+){0,4}\\s+${medication}\\b`,
    'iu'
  );
  const clinician = '(?:dokter(?:ku|mu|nya)?|doctor(?:s)?|psikiater(?:ku|mu|nya)?|apoteker(?:ku|mu|nya)?|tenaga\\s+kesehatan|clinician)';
  const override = '(?:abaikan|ignore|jangan\\s+(?:ikuti|dengarkan|dengerin)|tak\\s+perlu\\s+ikuti|lawan)';
  const professionalOverride = new RegExp(`\\b${override}\\b.{0,48}\\b${clinician}\\b|\\b${clinician}\\b.{0,48}\\b${override}\\b`, 'iu');
  const medicalTreatmentDirective = /\b(?:(?:kamu|anda|lu|loe|you)?\s*(?:harus|perlu|wajib)\s+(?:(?:menjalani|mulai|minum)\s+)?|(?:lakukan|jalani|mulai|cobalah)\s+)(?:pengobatan|treatment|terapi\s+(?:medis|cbt|paparan|elektrokonvulsif)|rawat\s+inap|ect|terapi\s+kejut)\b|\brawat\s+inap\s+(?:sekarang|hari\s+ini|minggu\s+ini)\b/iu;

  const reportedByClinician = /\b(?:oleh|dari)\s+(?:dokter|psikiater|psikolog|tenaga\s+kesehatan)\b/iu.test(text);
  return (definitiveDiagnosis.test(text) && !reportedByClinician) || medicationInstruction.test(text) ||
    professionalOverride.test(text) || medicalTreatmentDirective.test(text) ||
    // Obvious spacing/punctuation evasions of high-risk medication directives.
    /(?:stop|minum|naikkan|turunkan|ganti|double)(?:minum|take)?(?:obat|medikasi|medication|dosis|dose)/iu.test(compact);
}

function validateGeneratedText(value: unknown, field: string, errors: string[], required = false, enforceMaxLength = true): void {
  if (value === undefined && !required) return;
  if (typeof value !== 'string' || (required && value.trim().length === 0)) {
    errors.push(`Aksi ditolak: ${field} harus berupa teks`);
    return;
  }
  if (enforceMaxLength && value.length > MAX_ACTION_TEXT_LENGTH) {
    errors.push(`Aksi ditolak: ${field} melebihi batas panjang`);
  }
  if (containsUnsafeMedicalAdvice(value)) {
    errors.push(`Aksi ditolak: ${field} memuat diagnosis psikiatris atau instruksi medis yang tidak aman`);
  }
}

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
  const suppliedDisclaimer = payload.disclaimer;
  const disclaimer = STANDARD_DISCLAIMER;
  if (suppliedDisclaimer !== STANDARD_DISCLAIMER) sanitized = true;

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

  // 3. Payload-Specific Structural Validations & Maximum Guardrails
  let validatedAction: ValidatedAIAction;

  switch (action as WhitelistedAIAction) {
    case 'chat': {
      let message = payload.message as string;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        errors.push('Aksi "chat" membutuhkan properti "message" non-kosong');
      } else {
        message = message.trim();

        // Guardrail: Anti-Code & Script Leak Blocker
        if (/```[\s\S]*?```/.test(message) || /<script[\s\S]*?>[\s\S]*?<\/script>/i.test(message)) {
          errors.push('Aksi "chat" ditolak: balasan memuat blok kode/skrip pemrograman (melanggar guardrail anti-koding)');
        }

        // Guardrail: contextual anti-diagnosis and anti-prescription boundary.
        // Preserve the established short-response behavior: inspect the full
        // message for unsafe advice, then truncate only safe chat prose.
        validateGeneratedText(message, 'message', errors, true, false);

        // Guardrail: Anti-Toxic Positivity & Invalidation Blocker
        const toxicPositivityPattern = /\b(?:kamu|anda)\s+(?:harus\s*lebih\s*bersyukur|kurang\s*bersyukur|lebay|cengeng)\b|\b(?:masalahmu\s*belum\s*seberapa|jangan\s*manja)\b/i;
        if (toxicPositivityPattern.test(message)) {
          errors.push('Aksi "chat" ditolak: balasan memuat toxic positivity atau meremehkan perasaan pengguna');
        }

        // Guardrail: PII Auto-Sanitization
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const phonePattern = /(?:\+62|62|08)[0-9]{8,12}\b/g;
        const nikPattern = /\b\d{16}\b/g;

        if (emailPattern.test(message) || phonePattern.test(message) || nikPattern.test(message)) {
          message = message
            .replace(emailPattern, '[EMAIL DIRAHASIAKAN]')
            .replace(phonePattern, '[NOMOR TELEPON DIRAHASIAKAN]')
            .replace(nikPattern, '[NIK DIRAHASIAKAN]');
          sanitized = true;
        }

        // Guardrail: Max Length Enforcer (prevent runaway walls of text)
        if (message.length > MAX_ACTION_TEXT_LENGTH) {
          message = message.slice(0, MAX_ACTION_TEXT_LENGTH).trim() + '...';
          sanitized = true;
        }
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
      const reason = payload.reason === undefined || payload.reason === '' ? 'Rekomendasi langkah kecil hari ini' : payload.reason as string;
      if (!missionId || typeof missionId !== 'string') {
        errors.push('Aksi "suggest_mission" membutuhkan properti "missionId"');
      }
      validateGeneratedText(missionId, 'missionId', errors, true);
      validateGeneratedText(reason, 'reason', errors, true);
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
      const suppliedTags = payload.suggestedTags;
      const suggestedTags = suppliedTags === undefined ? ['refleksi'] : suppliedTags as string[];
      if (!prompt || typeof prompt !== 'string') {
        errors.push('Aksi "open_journal_prompt" membutuhkan properti "prompt"');
      }
      validateGeneratedText(prompt, 'prompt', errors, true);
      if (!Array.isArray(suggestedTags) || suggestedTags.length > MAX_SUGGESTED_TAGS) {
        errors.push('Aksi "open_journal_prompt" membutuhkan suggestedTags yang valid');
      } else {
        for (const tag of suggestedTags) validateGeneratedText(tag, 'suggestedTags', errors, true);
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
      validateGeneratedText(topicSlug, 'topicSlug', errors, true);
      validatedAction = {
        action: 'suggest_forum',
        topicSlug: topicSlug || '',
        disclaimer
      };
      break;
    }

    case 'adjust_path': {
      const pace = payload.recommendedPace as 'slower' | 'standard' | 'accelerated';
      const reason = payload.reason === undefined || payload.reason === '' ? 'Penyesuaian kecepatan langkah' : payload.reason as string;
      if (!['slower', 'standard', 'accelerated'].includes(pace)) {
        errors.push('Aksi "adjust_path" membutuhkan recommendedPace yang valid');
      }
      validateGeneratedText(reason, 'reason', errors, true);
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
