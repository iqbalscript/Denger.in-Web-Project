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

// Normalized pattern definitions for Indonesian and English clinical & colloquial distress
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

  // Coverage gaps found in manual testing: wishing to end everything, overdose,
  // cutting phrased with a verb prefix/suffix, and "life is not worth living".
  {
    id: 'end-everything-phrase',
    pattern: /\b(?:ingin|mau|pengen|akan)?\s*(?:mengakhiri|akhiri|menyudahi|sudahi)\s*(?:semuanya|semua\s*ini|segalanya)\b/i,
    category: 'suicide',
    severity: 'crisis'
  },
  {
    id: 'overdose-intent',
    pattern: /\b(?:(?:mau|ingin|pengen|akan|udah|sudah|berencana)\s*overdosis|overdosis\s*obat|minum\s*obat\s*(?:sebanyak\s*(?:mungkin|mungkin\s*biar)|banyak\s*banget\s*biar|segenggam|sekaligus\s*(?:semua|sebotol))|nelen\s*obat\s*(?:semua|sebotol|segenggam))\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    id: 'self-cutting-affixed',
    pattern: /\b(?:menyayat|nyayat|sayat|mengiris|ngiris|iris|nyilet|menyilet|silet)\s*(?:pergelangan\s*)?(?:tangan|nadi|lengan|urat|leher|paha)(?:ku|nya)?\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    id: 'life-not-worth-living',
    pattern: /\b(?:hidup(?:ku)?\s*(?:ini\s*)?(?:tidak|gak|ga|nggak|enggak)\s*layak\s*(?:dijalani|untuk\s*dijalani)|(?:gak|ga|nggak|tidak)\s*ada\s*gunanya\s*(?:aku\s*)?hidup|buat\s*apa\s*(?:aku\s*)?hidup\s*lagi)\b/i,
    category: 'suicide',
    severity: 'crisis'
  },

  // High Distress (Urgent but not explicit lethal intent)
  {
    id: 'cannot-bear-anymore',
    pattern: /\b(?:(?:g(?:a|ak|k)|nggak|enggak|tidak|udah\s*(?:gak|ga|nggak|tidak))\s*(?:kuat|sanggup|tahan)\s*lagi|bunuh\s*(?:aku|saya|gue|gw)\s*(?:aja|saja)?)\b/i,
    category: 'extreme_hopelessness',
    severity: 'high'
  },
  {
    id: 'severe-exhaustion-pain',
    pattern: /\b(sakit\s*banget\s*jiwaku|hancur\s*lebur|g(a|ak|k)\s*kuat\s*lagi\s*nanggung\s*hidup|teror\s*pinjol\s*bikin\s*gila)\b/i,
    category: 'extreme_hopelessness',
    severity: 'high'
  },

  // ENGLISH COVERAGE (UI language EN). These rules run for EVERY input, in
  // addition to the Indonesian catalog above, so a mixed-language message is
  // screened by both. Equivalent coverage: explicit suicidal ideation, death
  // wish, self-harm, lethal means/plan, farewell notes, high distress.
  {
    id: 'en-explicit-suicide',
    pattern: /\b(?:kill(?:ing)?\s*myself|suicid(?:e|al)|take\s*my\s*(?:own\s*)?life|end(?:ing)?\s*my\s*(?:own\s*)?life|end\s*it\s*all|unalive\s*myself|off\s*myself|\bkms)\b/i,
    category: 'suicide',
    severity: 'crisis'
  },
  {
    id: 'en-death-wish',
    pattern: /\b(?:(?:want|wanna|wish|wished|wanted|hope|hoping)\s*(?:to\s*)?(?:be\s*)?(?:die|dead|to\s*die)|wish\s*i\s*(?:was|were|had)\s*(?:dead|never\s*born)|better\s*off\s*dead|rather\s*be\s*dead|(?:don'?t|do\s*not)\s*(?:want|wanna)\s*to\s*(?:live|be\s*alive|exist|wake\s*up)(?:\s*anymore)?|no\s*reason\s*to\s*(?:live|go\s*on|keep\s*going)|can'?t\s*go\s*on\s*(?:living|anymore)|ready\s*to\s*die)\b/i,
    category: 'suicide',
    severity: 'crisis'
  },
  {
    id: 'en-self-harm',
    pattern: /\b(?:(?:hurt(?:ing)?|harm(?:ing)?|cut(?:ting)?|burn(?:ing)?|injur(?:e|ing)|punish(?:ing)?)\s*myself|self[\s-]*harm(?:ing)?|self[\s-]*injur(?:y|ing)|slit(?:ting)?\s*my\s*wrists?|cut(?:ting)?\s*my\s*(?:wrists?|arms?|veins?|thighs?))\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    id: 'en-lethal-means',
    pattern: /\b(?:hang(?:ing)?\s*myself|(?:take|took|taking)\s*(?:an\s*)?overdose|overdos(?:e|ing)\s*(?:on\s*)?(?:pills|meds|medication|myself)|od\s*on\s*(?:pills|meds)|jump(?:ing)?\s*(?:off|from)\s*(?:a|the|this)?\s*(?:bridge|building|roof|window|balcony|cliff)|drink(?:ing)?\s*(?:bleach|poison)|swallow(?:ing)?\s*(?:all\s*)?(?:the|my)?\s*pills|shoot(?:ing)?\s*myself|drown(?:ing)?\s*myself|step(?:ping)?\s*in\s*front\s*of\s*(?:a|the)\s*(?:train|truck|car|bus))\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    id: 'en-farewell-note',
    pattern: /\b(?:goodbye\s*(?:everyone|forever|world|all)|this\s*is\s*(?:my\s*)?(?:goodbye|last\s*message|final\s*message|suicide\s*note)|(?:writing|wrote|written)\s*(?:my\s*)?(?:suicide|goodbye)\s*(?:note|letter)|(?:world|everyone|everybody|they)\s*(?:is|are|would\s*be|will\s*be)\s*better\s*(?:off\s*)?without\s*me|(?:want|wanna|wish|hope|like)\s*to\s*(?:sleep\s*forever|disappear\s*forever|never\s*wake\s*up|not\s*wake\s*up))\b/i,
    category: 'extreme_hopelessness',
    severity: 'crisis'
  },
  {
    // Ending everything with a plan/time, or wanting to stop existing.
    id: 'en-end-everything',
    pattern: /\b(?:end(?:ing)?\s*(?:it|everything|things|my\s*pain\s*for\s*good)\s*(?:all|tonight|today|now|for\s*good|soon)|(?:want|wanna|going\s*to|gonna|plan(?:ning)?\s*to|ready\s*to|about\s*to|decided\s*to)\s*end\s*everything|(?:want|wanna)\s*to\s*stop\s*(?:existing|living|being\s*alive)|(?:don'?t|do\s*not|can'?t)\s*see\s*(?:the|any)\s*point\s*(?:in|of)\s*(?:living|life|being\s*alive|going\s*on|staying\s*alive)|(?:i'?m|im|i\s*am)\s*(?:so\s*)?done\s*with\s*(?:life|living|being\s*alive)\b(?!\s*admin)|life\s*(?:is\s*)?not\s*worth\s*living|hopeless[^.!?]*\b(?:want|wanna)\s*to\s*end\s*it|(?:nobody|no\s*one|no-one)\s*would\s*(?:miss|care\s*about|notice)\s*(?:me\s*)?if\s*i\s*(?:was|were|died|disappeared|(?:was|were)\s*gone|killed\s*myself))\b/i,
    category: 'suicide',
    severity: 'crisis'
  },
  {
    // Overdose plans or having already taken many pills, and acquired means.
    id: 'en-overdose-means',
    pattern: /\b(?:(?:plan(?:ning)?\s*to|going\s*to|gonna|want\s*to|wanna|will|about\s*to|ready\s*to|trying\s*to)\s*(?:overdose|od\b)|(?:took|taken|swallowed|just\s*took)\s*(?:a\s*lot\s*of|all\s*(?:of\s*)?(?:my|the)|too\s*many|a\s*bunch\s*of|so\s*many|a\s*whole\s*(?:bottle|pack)\s*of|handfuls?\s*of)\s*(?:pills|meds|tablets|medication|medicine|sleeping\s*pills|painkillers)|(?:bought|got|have|found|made|tied)\s*(?:a\s*)?(?:rope|noose)\b|\bnoose\b|(?:stockpil\w*|saving\s*up|hoarding)\s*(?:my\s*)?(?:pills|meds|tablets|medication))\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    // Ongoing self-harm described without "myself".
    id: 'en-self-harm-ongoing',
    pattern: /\b(?:(?:been|started|keep|kept|still)\s*(?:self[\s-]*)?(?:cutting|burning\s*my\s*skin)(?:\s*again)?|cutting\s*again|relapsed\s*(?:on|into|with)\s*(?:cutting|self[\s-]*harm))\b/i,
    category: 'self_harm',
    severity: 'crisis'
  },
  {
    // Ambiguous wishes (often hyperbole): show the human-support card, not a redirect.
    id: 'en-ambiguous-distress',
    pattern: /^kill\s*me[\s.!]*$|\b(?:(?:please|someone|somebody|just)\s*kill\s*me|i\s*(?:just\s*)?want\s*(?:it|this|everything)\s*to\s*(?:stop|end)|(?:i\s*)?can'?t\s*go\s*on|(?:want|wanna)\s*to\s*end\s*it)\b/i,
    category: 'extreme_hopelessness',
    severity: 'high'
  },
  {
    id: 'en-severe-distress',
    pattern: /\b(?:can'?t\s*(?:take|handle|do|bear)\s*(?:this|it|life)\s*anymore|(?:i|i'?ve)\s*give(?:n)?\s*up\s*on\s*(?:life|everything|living)|nothing\s*matters\s*anymore|(?:i|i'?m|i\s*am|i\s*feel)\s*(?:completely\s*|totally\s*)?hopeless|no\s*way\s*out|i\s*hate\s*my\s*life|life\s*is\s*(?:pointless|not\s*worth\s*(?:it|living)))\b/i,
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
    .replace(/[\u2018\u2019\u02bc\u2032]/g, "'") // curly apostrophes (English contractions)
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
/** UI language for the intervention copy only; detection is language-independent. */
export type CrisisCopyLanguage = 'id' | 'en';

export function evaluateCrisisInput(
  rawText: string,
  ageBracket: AgeBracket = '18-24',
  lang: CrisisCopyLanguage = 'id'
): CrisisEvaluationResult {
  const normalized = normalizeIndonesianText(rawText);
  // Only wholly explicit denial or clearly framed third-person discussion is
  // exempt. Mixed or ambiguous statements still take the safer crisis path.
  const hasFirstPerson = /\b(?:aku|saya|gue|gw|diriku|hidupku|i|i'm|im|me|my|myself)\b/i.test(normalized);
  const trimmed = normalized.trim();
  const contextualDiscussion =
    /^(?:aku|saya)\s+(?:tidak|ga|gak)\s+(?:mau|ingin|akan)\s+(?:bunuh\s*diri|mati)\s*[.!]?$/i.test(trimmed) ||
    (!hasFirstPerson && /^(?:dalam\s+(?:film|berita|pelajaran|artikel)\s+(?:itu\s+)?|di\s+(?:film|berita)\s+(?:itu\s+)?)(?:tokoh|dia|mereka)\b[^.!?]*(?:bunuh\s*diri|mau\s*mati)[^.!?]*[.!]?$/i.test(trimmed)) ||
    // English: only a whole-sentence explicit denial, or a clearly third-person
    // story with no first-person pronoun, is exempt (mirrors the Indonesian rule).
    /^(?:i|i'm|i\s*am)\s+(?:do\s*not|don't|dont|am\s*not|not)\s+(?:going\s*to\s*|gonna\s*)?(?:want(?:ing)?\s*to\s*|wanna\s*)?(?:kill\s*myself|die|commit\s*suicide|hurt\s*myself)\s*[.!]?$/i.test(trimmed) ||
    (!hasFirstPerson && /^in\s+(?:the|that|a|this)\s+(?:movie|film|news|article|book|show|story|class)\s*,?\s*(?:the\s+)?(?:character|he|she|they|someone|a\s*man|a\s*woman|the\s*hero)\b[^.!?]*(?:kill(?:ed|s)?\s*(?:him|her|them)sel(?:f|ves)|suicide|wanted\s*to\s*die|die[sd]?)[^.!?]*[.!]?$/i.test(trimmed));
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
    if (lang === 'en') {
      interventionCopy = ageBracket === '15-17'
        ? 'We hear your pain, and you matter. You do not have to carry this alone. Please contact the youth protection line or Healing119 (Ministry of Health) below right away. Someone is ready to listen and protect you now.'
        : 'We hear how heavy things are for you right now. Your safety and your life matter. Please take one step and contact a professional emergency line below. Healing119 from the Ministry of Health is free and you do not have to give your name.';
    } else if (ageBracket === '15-17') {
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
