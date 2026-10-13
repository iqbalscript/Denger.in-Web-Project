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
    pattern: /\b(bunuh\s*diri|bundir|akhiri\s*hidup(?:ku|nya)?|mengakhiri\s*hidup(?:ku|nya)?)\b/i,
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
    id: 'self-harm-intent',
    pattern: /\b(?:menyakiti|melukai|mencelakai)\s*diri(?:ku| sendiri)?\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    id: 'first-person-euphemism',
    pattern: /\b(?:aku|saya|gue|gw)\s+(?:ingin|mau|pengen|akan)\s+(?:tidur\s*selamanya|menghilang\s*selamanya|ga\s*bangun\s*lagi)\b/i,
    category: 'suicide',
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

// Curated Emergency Contacts for Crisis Escalation.
// KEEP IN SYNC with packages/config EMERGENCY_CONTACTS (phone, whatsapp, website,
// availableHours, cost) and use the same ids. tests/crisis/emergencyContactsConsistency.test.mjs
// fails when the two lists drift.
const STATIC_EMERGENCY_CONTACTS: EmergencyContact[] = [
  // Sources for every field: see the comment block above EMERGENCY_CONTACTS in
  // packages/config/src/index.ts (official pages, accessed 2026-10-14).
  {
    id: 'healing119-kemenkes',
    name: 'Healing119 (Kemenkes)',
    category: 'national_emergency',
    phone: '119 ext 8',
    website: 'https://healing119.id',
    availableHours: 'Pagi hingga malam',
    cost: 'gratis',
    description: 'Hotline kesehatan mental dan pencegahan bunuh diri Kementerian Kesehatan RI. Chat WhatsApp tersedia lewat healing119.id.',
    targetAgeBrackets: ['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'lisa-helpline',
    name: 'LISA Helpline (Bali Bersama Bisa Foundation)',
    category: 'crisis_hotline',
    whatsapp: '0811-3855-472',
    website: 'https://bisahelpline.org',
    availableHours: 'Sesi online terjadwal, bisa masuk daftar tunggu (ID / EN)',
    cost: 'gratis',
    description: 'Dukungan emosional dan pencegahan bunuh diri lewat WhatsApp oleh pendengar terlatih.',
    targetAgeBrackets: ['15-17', '18-29', '30-49', '50+', '18-24', '25-34', '35-54'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'tepsa-kemensos',
    name: 'TePSA Kemensos (Telepon Pelayanan Sosial Anak)',
    category: 'teen_protection',
    phone: '1500-771',
    website: 'https://kemensos.go.id',
    availableHours: 'Jam layanan: tanyakan saat menelepon',
    cost: 'gratis',
    description: 'Layanan telepon khusus anak dan remaja di bawah 18 tahun dari Kementerian Sosial.',
    targetAgeBrackets: ['15-17'],
    verificationStatus: 'verified_official'
  },
  {
    id: 'kpai-pengaduan',
    name: 'KPAI (Komisi Perlindungan Anak Indonesia)',
    category: 'teen_protection',
    phone: '021-3190-1556',
    whatsapp: '0811-177-2273',
    website: 'https://kpai.go.id',
    availableHours: 'Jam layanan: tanyakan saat menghubungi',
    cost: 'tarif_standar',
    description: 'Saluran pengaduan resmi untuk perlindungan anak di bawah 18 tahun.',
    targetAgeBrackets: ['15-17'],
    verificationStatus: 'todo_human_verification'
  },
  {
    id: 'yayasan-pulih',
    name: 'Yayasan Pulih',
    category: 'crisis_hotline',
    phone: '021-788-42580',
    whatsapp: '0811-8436-633',
    availableHours: 'Hari dan jam kerja',
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
    .normalize('NFKD')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
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
  // Preserve normal doubled letters (e.g. "nanggung") while reducing elongation.
  normalized = normalized.replace(/(.)\1{2,}/g, '$1');
  normalized = normalized.replace(/\bb[\s._-]*u[\s._-]*n[\s._-]*u[\s._-]*h[\s._-]*d[\s._-]*i[\s._-]*r[\s._-]*i\b/g, 'bunuh diri');

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
  // Only wholly explicit denial or clearly framed third-person discussion is
  // exempt. Mixed or ambiguous statements still take the safer crisis path.
  const hasFirstPerson = /\b(?:aku|saya|gue|gw|diriku|hidupku)\b/i.test(normalized);
  const contextualDiscussion =
    /^(?:aku|saya)\s+(?:tidak|ga|gak)\s+(?:mau|ingin|akan)\s+(?:bunuh\s*diri|mati)\s*[.!]?$/i.test(normalized.trim()) ||
    (!hasFirstPerson && /^(?:dalam\s+(?:film|berita|pelajaran|artikel)\s+(?:itu\s+)?|di\s+(?:film|berita)\s+(?:itu\s+)?)(?:tokoh|dia|mereka)\b[^.!?]*(?:bunuh\s*diri|mau\s*mati)[^.!?]*[.!]?$/i.test(normalized.trim()));
  const matchedRules: PatternRule[] = [];

  for (const rule of contextualDiscussion ? [] : CRISIS_RULES) {
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

  // Filter contacts by age bracket. The bracket is caller-supplied (an API
  // body field), so an unknown value must never produce an EMPTY contact list
  // on a crisis result: fall back to the full catalog instead.
  const bracketContacts = STATIC_EMERGENCY_CONTACTS.filter((c) =>
    c.targetAgeBrackets.includes(ageBracket)
  );
  const relevantContacts = bracketContacts.length > 0 ? bracketContacts : STATIC_EMERGENCY_CONTACTS;

  // Age-tailored empathetic crisis intervention copy
  let interventionCopy = '';
  if (isCrisis) {
    if (ageBracket === '15-17') {
      interventionCopy =
        'Kami mendengar rasa sakitmu, dan kamu sangat berharga. Kamu tidak harus memikul beban ini sendirian. Silakan segera hubungi saluran perlindungan remaja atau Healing119 (Kemenkes) di bawah ini. Ada orang yang siap mendengarkan dan melindungimu sekarang.';
    } else {
      interventionCopy =
        'Kami mendengar betapa beratnya situasi yang sedang kamu alami. Keselamatan dan hidupmu sangat berharga. Tolong luangkan satu langkah untuk menghubungi saluran darurat profesional di bawah ini. Healing119 dari Kemenkes gratis dan bisa dihubungi tanpa menyebut nama.';
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
