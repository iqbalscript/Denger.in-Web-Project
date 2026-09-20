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
  const combined = `${title} ${body}`;

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
