import type { 
  AgeBracket, 
  CrisisEvaluationResult, 
  CrisisSeverity, 
  EmergencyContact 
} from '@dengarin/types';

/**
 * PURE DETERMINISTIC CRISIS ENGINE
 * 
 * ARCHITECTURAL BOUNDARY:
 * This module has ZERO external AI/LLM/ML dependencies.
 * It does NOT import from orchestrator, prompts, DeepSeek, or OpenRouter.
 * It executes entirely synchronously in memory with zero network latency.
 */

// Normalized pattern definitions for Indonesian clinical & colloquial distress
interface PatternRule {
  id: string;
  pattern: RegExp;
  category: 'suicide' | 'self_harm' | 'acute_violence' | 'extreme_hopelessness';
  severity: CrisisSeverity;
}

const CRISIS_RULES: PatternRule[] = [
  // Explicit Suicidal Intent & Slang
  {
    id: 'explicit-suicide-phrase',
    pattern: /\b(bunuh\s*diri|bundir|akhiri\s*hidup|mengakhiri\s*hidup)\b/i,
    category: 'suicide',
    severity: 'crisis'
  },
  {
    id: 'death-wish-phrase',
    pattern: /\b(pengen\s*mati|mau\s*mati|ingin\s*mati|mati\s*aja|mending\s*mati|lebih\s*baik\s*mati)\b/i,
    category: 'suicide',
    severity: 'crisis'
  },
  {
    id: 'no-will-to-live',
    pattern: /\b(g(a|ak|k)\s*mau\s*hidup\s*lagi|tidak\s*mau\s*hidup\s*lagi|capek\s*hidup\s*pengen\s*ngilang\s*selamanya)\b/i,
    category: 'suicide',
    severity: 'crisis'
  },
  {
    id: 'farewell-will-phrase',
    pattern: /\b(surat\s*wasiat|pamit\s*selamanya|selamat\s*tinggal\s*semuanya|titip\s*pesan\s*terakhir|dunia\s*lebih\s*baik\s*tanpa(ku|aku))\b/i,
    category: 'extreme_hopelessness',
    severity: 'crisis'
  },

  // Acute Self-Harm & Lethal Means
  {
    id: 'self-cutting',
    pattern: /\b(sayat|nyayat|iris)\s*(tangan|nadi|lengan|urat|leher)\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    id: 'hanging-phrase',
    pattern: /\b(gantung\s*diri|menggantung\s*diri)\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    id: 'ingestion-poison',
    pattern: /\b(minum\s*(baygon|racun|pestisida|deterjen|cairan\s*pemutih))\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    id: 'jumping-phrases',
    pattern: /\b(loncat\s*dari\s*(gedung|jembatan|lantai|atap)|nabrakin\s*diri\s*ke\s*(kereta|truk|mobil))\b/i,
    category: 'suicide',
    severity: 'crisis'
  },

  // High Distress (Urgent but not explicit lethal intent)
  {
    id: 'severe-exhaustion-pain',
    pattern: /\b(sakit\s*banget\s*jiwaku|hancur\s*lebur|g(a|ak|k)\s*kuat\s*lagi\s*nanggung\s*hidup|teror\s*pinjol\s*bikin\s*gila)\b/i,
    category: 'extreme_hopelessness',
    severity: 'high'
  }
];

// Curated Emergency Contacts for Crisis Escalation
const STATIC_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'sejiwa-119',
    name: 'Kemenkes Sejiwa',
    category: 'national_emergency',
    phone: '119 ext 8',
    website: 'https://sejiwa.kemkes.go.id',
    availableHours: '24 Jam / 7 Hari',
    cost: 'gratis',
    description: 'Layanan darurat kesehatan jiwa resmi Kementerian Kesehatan RI.',
    targetAgeBrackets: ['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'lisa-crisis',
    name: 'Lisa Helpline (Love Inside Suicide Awareness)',
    category: 'crisis_hotline',
    phone: '021-3777-5472',
    whatsapp: '0811-381-5472',
    website: 'https://lisahelpline.org',
    availableHours: '24 Jam / 7 Hari',
    cost: 'tarif_standar',
    description: 'Pendampingan krisis emosional dan pencegahan bunuh diri.',
    targetAgeBrackets: ['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'teencare-kpai',
    name: 'Teencare & KPAI (Kemensos / KPAI)',
    category: 'teen_protection',
    phone: '1500-771',
    whatsapp: '0811-177-2273',
    website: 'https://kpai.go.id',
    availableHours: '24 Jam / 7 Hari',
    cost: 'gratis',
    description: 'Layanan perlindungan dan pendampingan khusus anak dan remaja di bawah 18 tahun.',
    targetAgeBrackets: ['15-17'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'yayasan-pulih-crisis',
    name: 'Yayasan Pulih',
    category: 'crisis_hotline',
    phone: '021-788-42580',
    whatsapp: '0811-8436-633',
    website: 'https://yayasanpulih.org',
    availableHours: 'Senin–Jumat (09:00–17:00 WIB)',
    cost: 'tarif_standar',
    description: 'Konseling trauma dan pemulihan psikologis.',
    targetAgeBrackets: ['18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  }
];

/**
 * Text Preprocessing / Normalization
 * Handles:
 * - Leetspeak substitution (b4yg0n -> baygon, bund1r -> bundir)
 * - Repeated character elongation ("matiiiii" -> "mati")
 * - Diacritic stripping
 */
export function normalizeIndonesianText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let normalized = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip accents

  // Common leetspeak substitutions
  normalized = normalized
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/8/g, 'b');

  // Collapse character elongation (e.g. "matiiiiii" -> "mati", "buuuundir" -> "bundir")
  normalized = normalized.replace(/(.)\1+/g, '$1');

  return normalized;
}

/**
 * Pure Deterministic Evaluation Function
 * Evaluates raw text against the curated Indonesian crisis rule catalog.
 */
export function evaluateCrisisInput(
  rawText: string,
  ageBracket: AgeBracket = '18-24'
): CrisisEvaluationResult {
  const normalized = normalizeIndonesianText(rawText);
  const matchedRules: PatternRule[] = [];

  for (const rule of CRISIS_RULES) {
    if (rule.pattern.test(normalized)) {
      matchedRules.push(rule);
    }
  }

  const isCrisis = matchedRules.some((r) => r.severity === 'crisis');
  const isHigh = matchedRules.some((r) => r.severity === 'high');

  let severity: CrisisSeverity = 'none';
  if (isCrisis) {
    severity = 'crisis';
  } else if (isHigh) {
    severity = 'high';
  }

  // Filter contacts by age bracket
  const relevantContacts = STATIC_EMERGENCY_CONTACTS.filter((c) =>
    c.targetAgeBrackets.includes(ageBracket)
  );

  // Age-tailored empathetic crisis intervention copy
  let interventionCopy = '';
  if (isCrisis) {
    if (ageBracket === '15-17') {
      interventionCopy =
        'Kami mendengar rasa sakitmu, dan kamu sangat berharga. Kamu tidak harus memikul beban ini sendirian. Silakan segera hubungi saluran perlindungan remaja atau Kemenkes Sejiwa di bawah ini. Ada orang yang siap mendengarkan dan melindungimu sekarang.';
    } else {
      interventionCopy =
        'Kami mendengar betapa beratnya situasi yang sedang kamu alami. Keselamatan dan hidupmu sangat berharga. Tolong luangkan satu langkah untuk menghubungi saluran darurat profesional di bawah ini. Layanan ini gratis, rahasia, dan ada konselor yang siap menemanimu saat ini.';
    }
  }

  return {
    isCrisis,
    severity,
    triggeredPatterns: matchedRules.map((r) => r.id),
    matchedDomain: matchedRules[0]?.category,
    emergencyContacts: relevantContacts,
    immediateInterventionCopy: interventionCopy
  };
}
