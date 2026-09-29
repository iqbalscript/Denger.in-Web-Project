import type { InterventionDomain } from '@dengarin/types';

export interface ModerationResult {
  status: 'approved' | 'pending_review' | 'rejected';
  reason?: string;
  tags: string[];
  safetyScore: number; // 0 to 100
}

export interface ForumPostContent {
  title: string;
  body: string;
  domain: InterventionDomain;
  authorPseudonym?: string;
}

export const MAX_FORUM_PSEUDONYM_LENGTH = 50;
export const MAX_FORUM_REPLY_LENGTH = 800;

export interface ForumReplyContent { body: string; }

/** Normalize only for inspection; the displayed alias is never silently rewritten. */
function pseudonymForInspection(value: string): string {
  return value.normalize('NFKC').replace(/\p{Cf}/gu, '');
}

function hasPseudonymContactOrMarkup(value: string): boolean {
  const normalized = pseudonymForInspection(value);
  return /\p{Cf}/u.test(value) ||
    !/^[\p{L}\p{M}\p{N} #'’-]+$/u.test(normalized) ||
    (normalized.match(/\d/gu)?.length ?? 0) > 4 ||
    /\b(?:https?|hxxps?):\s*\/\s*\/|\bwww\./iu.test(normalized) ||
    /\b(?:[\p{L}\p{N}-]+\.)+[\p{L}]{2,}\b/iu.test(normalized) ||
    /\b[\p{L}\p{N}-]+\s+(?:dot|titik)\s+(?:com|net|org|id|co|io|me|xyz)\b/iu.test(normalized) ||
    /(?:^|\D)(?:\+?62[\s().-]*|0)8(?:[\s().-]*\d){8,12}(?!\d)/u.test(normalized) ||
    /\b(?:whats\s*app|telegram|instagram|tiktok|ig|wa|line)\b/iu.test(normalized);
}

// Patterns that trigger instant rejection (toxic, scam, harassment, gambling)
const REJECT_PATTERNS: RegExp[] = [
  // Gambling & Slot promotion
  /\b(slot\s*gacor|judi\s*online|zeus\s*gacor|pragmatic\s*play|maxwin|depo\s*pulsa|togel|bandar\s*taruhan)\b/i,
  // Illegal predatory loan marketing / scammers
  /\b(dana\s*cair\s*cepat|pinjol\s*langsung\s*cair|hubungi\s*wa\s*08|joki\s*pinjol|gestun|jasa\s*pelunasan)\b/i,
  // Direct hate attacks & severe insults
  /\b(anjing\s*lu|mati\s*aja\s*lo|goblok\s*banget|tolol\s*lu|bangsat|lonte|pelacur)\b/i,
  // Dangerous chemical/prescription instructions
  /\b(minum\s*racun|dosis\s*tinggi\s*(obat|pil)|beli\s*xanax\s*bebas|obat\s*penenang\s*tanpa\s*resep)\b/i
];

// Patterns that flag for human review rather than instant reject
const SENSITIVE_REVIEW_PATTERNS: RegExp[] = [
  /\b(putus\s*asa\s*banget|tidak\s*ada\s*harapan|sakit\s*hati\s*mendalam|trauma\s*masa\s*kecil|kekerasan\s*dalam\s*rumah\s*tangga)\b/i,
  /\b(kontak\s*saya|hubungi\s*aku|dm\s*ke|telepon\s*ke)\b/i,
  /(?:https?:\/\/|www\.)\S+/i
];

/**
 * Evaluates an anonymous forum submission for safety, toxicity, and constructive quality.
 * Layer 1 filter in the forum intake pipeline (Layer 0 is the Deterministic Crisis Gate).
 */
export function moderateForumPost(input: ForumPostContent): ModerationResult {
  const title = input.title.trim();
  const body = input.body.trim();
  const pseudonym = input.authorPseudonym?.trim() ?? 'Sahabat Anonim';
  const pseudonymScan = pseudonymForInspection(pseudonym).replace(/[._-]+/g, ' ');
  const combined = `${title} ${body} ${pseudonymScan}`;

  if (pseudonym.length > MAX_FORUM_PSEUDONYM_LENGTH) {
    return { status: 'rejected', reason: 'Nama samaran terlalu panjang (maksimum 50 karakter).', tags: [], safetyScore: 0 };
  }
  if (hasPseudonymContactOrMarkup(pseudonym)) {
    return { status: 'rejected', reason: 'Nama samaran mengandung karakter, kontak, atau tautan yang tidak diizinkan.', tags: [], safetyScore: 0 };
  }

  // 1. Basic length & quality constraints
  if (title.length < 5) {
    return {
      status: 'rejected',
      reason: 'Judul cerita terlalu pendek (minimal 5 karakter).',
      tags: [],
      safetyScore: 0
    };
  }

  if (body.length < 20) {
    return {
      status: 'rejected',
      reason: 'Cerita terlalu singkat (minimal 20 karakter agar bermakna bagi sesama pengguna).',
      tags: [],
      safetyScore: 0
    };
  }

  if (body.length > 2500) {
    return {
      status: 'rejected',
      reason: 'Cerita melebihi batas maksimal (maksimum 2500 karakter).',
      tags: [],
      safetyScore: 0
    };
  }

  // 2. Reject checks: Gambling, Scam, Hate, Dangerous prescriptions
  for (const pattern of REJECT_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        status: 'rejected',
        reason: 'Konten terdeteksi memuat promosi terlarang, ujaran kebencian, atau instruksi berbahaya.',
        tags: [],
        safetyScore: 0
      };
    }
  }

  // 3. Extract domain tags
  const tags: string[] = [input.domain];
  if (/\b(skripsi|sidang|dosen|tugas\s*akhir|wisuda|kuliah|kampus)\b/i.test(combined)) {
    tags.push('akademik');
  }
  if (/\b(hutang|pinjol|gaji|tabungan|finansial|ekonomi|sandwich)\b/i.test(combined)) {
    tags.push('finansial');
  }
  if (/\b(burnout|lembur|atasan|kantor|resign|kerjaan|beban\s*kerja)\b/i.test(combined)) {
    tags.push('karir');
  }
  if (/\b(orang\s*tua|keluarga|ayah|ibu|kakak|adik|rumah)\b/i.test(combined)) {
    tags.push('keluarga');
  }
  if (/\b(pasangan|pacar|putus|cinta|kesepian|teman)\b/i.test(combined)) {
    tags.push('relasi');
  }

  // 4. Check for borderline/sensitive patterns that need manual moderator eyes
  for (const pattern of SENSITIVE_REVIEW_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        status: 'pending_review',
        reason: 'Cerita memuat tautan atau topik emosional mendalam yang memerlukan peninjauan kurasi moderator sebelum tampil publik.',
        tags: Array.from(new Set(tags)),
        safetyScore: 65
      };
    }
  }

  // 5. High confidence clean & constructive story -> Auto-Approved!
  return {
    status: 'approved',
    tags: Array.from(new Set(tags)),
    safetyScore: 95
  };
}

/** Strict deterministic policy for targeted peer-to-peer replies. No model is used. */
export function moderateForumReply(input: ForumReplyContent): ModerationResult {
  const body = input.body.trim();
  const normalized = body.normalize('NFKC').replace(/\p{Cf}/gu, '');
  const compact = normalized.replace(/[._-]+/g, ' ');
  if (body.length < 3) return { status: 'rejected', reason: 'Balasan terlalu singkat (minimal 3 karakter).', tags: [], safetyScore: 0 };
  if (body.length > MAX_FORUM_REPLY_LENGTH) return { status: 'rejected', reason: 'Balasan melebihi batas maksimum 800 karakter.', tags: [], safetyScore: 0 };
  if (/<\/?[a-z][^>]*>|javascript:|data:text\/html|on\w+\s*=/iu.test(normalized)) return { status: 'rejected', reason: 'Markup atau kode tidak diizinkan.', tags: [], safetyScore: 0 };
  if (/(?:https?:\/\/|www\.|\b[\p{L}\p{N}-]+\.(?:com|net|org|id|co|io|me|xyz)\b|\b[\p{L}\p{N}-]+\s+(?:dot|titik)\s+(?:com|net|org|id|co|io|me|xyz)\b)/iu.test(compact) || /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/u.test(compact) || /(?:^|\D)(?:\+?62[\s().-]*|0)8(?:[\s().-]*\d){8,12}(?!\d)/u.test(compact) || /\b(?:wa|whats\s*app|telegram|instagram|tiktok|line|dm)\b/iu.test(compact)) return { status: 'rejected', reason: 'Kontak, tautan, atau ajakan pindah percakapan tidak diizinkan.', tags: [], safetyScore: 0 };
  if (/\b(?:mati\s*aja|bunuh\s*diri\s*aja|sayat|gantung\s*diri|loncat\s*dari|minum\s*(?:racun|baygon)|biar\s*dia\s*mati)\b/iu.test(compact)) return { status: 'rejected', reason: 'Dorongan menyakiti diri atau orang lain tidak diizinkan.', tags: [], safetyScore: 0 };
  if (/\b(?:mulai|berhenti|naikkan|turunkan|gandakan)\s+(?:minum\s+)?(?:obat|pil|antidepresan|penenang)|\b(?:dosis|resep)\s+(?:obat|pil|antidepresan|penenang)\b/iu.test(compact)) return { status: 'rejected', reason: 'Instruksi pengobatan tidak diizinkan.', tags: [], safetyScore: 0 };
  if (/\b(?:anjing\s*lu|goblok|tolol|bangsat|lonte|pelacur|memalukan|lemah\s*banget|cari\s*perhatian)\b/iu.test(compact)) return { status: 'rejected', reason: 'Penghinaan atau perundungan tidak diizinkan.', tags: [], safetyScore: 0 };
  if (/\b(?:pacar\s*aku\s*aja|rahasia\s*kita|foto\s*(?:kamu|mu)|umur\s*(?:kamu|mu)|ketemu\s*yuk|seks|telanjang)\b/iu.test(compact)) return { status: 'rejected', reason: 'Konten seksual, grooming, atau paksaan tidak diizinkan.', tags: [], safetyScore: 0 };
  if (/\b(?:slot\s*gacor|judi\s*online|pinjol\s*langsung\s*cair|transfer\s*dulu|investasi\s*pasti|aku\s*(?:admin|dokter|psikolog))\b/iu.test(compact)) return { status: 'rejected', reason: 'Penipuan, promosi, atau penyamaran tidak diizinkan.', tags: [], safetyScore: 0 };
  if (/\b(?:trauma|kekerasan|pelecehan|putus\s*asa|tidak\s*ada\s*harapan|kdrt)\b/iu.test(compact)) return { status: 'pending_review', reason: 'Balasan memerlukan peninjauan keamanan.', tags: [], safetyScore: 60 };
  return { status: 'approved', tags: ['supportive_reply'], safetyScore: 95 };
}
