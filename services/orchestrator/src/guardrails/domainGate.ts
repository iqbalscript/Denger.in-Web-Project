import { CLINICAL_DISCLAIMER } from '@dengarin/config';
import type { ValidatedAIAction } from '@dengarin/types';

/**
 * DETERMINISTIC DOMAIN & CODING GATE (Pre-LLM Guardrail)
 *
 * Dengar.in is an anonymous emotional well-being companion, NOT a general-purpose
 * coding assistant, homework solver, or programming terminal.
 *
 * This gate detects pure technical/coding prompts that lack genuine emotional
 * distress, intercepting them instantly with an empathetic, non-judgmental redirection.
 */

// Regex patterns indicating technical programming / software engineering requests
const CODING_INTENT_PATTERNS: RegExp[] = [
  /\b(?:buatkan|bikin|tuliskan|generate|write|create)\s+(?:fungsi|function|kode|code|script|program|class|komponen|component|algoritma|query|api)\b/i,
  /\b(?:tolong|bisa)\s+(?:benerin|perbaiki|debug|fix|refactor|compile)\s+(?:kode|kodingan|code|script|error|syntax)\b/i,
  /\b(?:fizzbuzz|fibonacci|binary\s*search|quick\s*sort|bubble\s*sort|linked\s*list)\b/i,
  /\b(?:def\s+[a-zA-Z_]\w*\(|function\s+[a-zA-Z_]\w*\(|const\s+[a-zA-Z_]\w*\s*=\s*(?:=>|\()|import\s+.*\s+from\s+['"])/i,
  /\b(?:console\.log|print\(|public\s+static\s+void|SELECT\s+.*\s+FROM|INSERT\s+INTO)\b/i,
  /\b(?:buatkan|bikin)\s+(?:website|landing\s*page|aplikasi|app|navbar|database|rest\s*api)\b/i,
  /\b(?:apa\s+itu|jelaskan\s+tentang)\s+(?:polymorphism|inheritance|async\s+await|pointer\s+c\+\+|regex)\b/i
];

// Indicators that the user is actually sharing emotional strain/burnout related to tech work
const EMOTIONAL_DISTRESS_INDICATORS: RegExp[] = [
  /\b(?:stres|stress|lelah|capek|pusing|kewalahan|burnout|overthinking|cemas|panik|sedih|putus\s*asa|nangis|beban|muak|takut)\b/i,
  /\b(?:gak\s*kuat|ngga\s*kuat|capek\s*banget|butuh\s*teman|pengen\s*cerita|curhat)\b/i
];

export interface DomainGateResult {
  isOutOfDomain: boolean;
  action?: ValidatedAIAction;
  reason?: string;
}

export function evaluateDomainGate(message: string): DomainGateResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return { isOutOfDomain: false };
  }

  const hasEmotionalDistress = EMOTIONAL_DISTRESS_INDICATORS.some((pattern) => pattern.test(trimmed));
  if (hasEmotionalDistress) {
    // If the user is genuinely distressed ("aku stres tugas coding numpuk"), allow it to LLM
    // (LLM's strict instructions ensure it supports emotionally rather than generating code).
    return { isOutOfDomain: false };
  }

  const matchesCoding = CODING_INTENT_PATTERNS.some((pattern) => pattern.test(trimmed));
  if (matchesCoding) {
    return {
      isOutOfDomain: true,
      reason: 'Permintaan pemrograman/teknis di luar domain kesehatan mental',
      action: {
        action: 'chat',
        message:
          'Dengar.in hadir khusus sebagai ruang aman pendampingan emosional dan kesejahteraan mental, bukan asisten pemrograman teknis. Aku tidak dapat membuatkan kode, skrip, atau menyelesaikan tugas koding. Namun, jika pekerjaan atau tugas ini sedang membuatmu merasa tertekan, cemas, atau lelah, aku siap mendengarkan dan menemanimu.',
        disclaimer: CLINICAL_DISCLAIMER
      }
    };
  }

  return { isOutOfDomain: false };
}
