import type { AgeBracket, InterventionDomain } from '@dengarin/types';
import { CLINICAL_DISCLAIMER } from '@dengarin/config';

/**
 * @dengarin/prompts
 *
 * Prompt templates consumed exclusively by services/orchestrator.
 * ARCHITECTURAL BOUNDARY: this package never talks to the network and never
 * imports services/crisis-engine — it only shapes text sent TO an LLM after
 * the crisis gate has already cleared the request.
 */

export interface PromptContext {
  ageBracket?: AgeBracket;
  domain?: InterventionDomain;
}

const WHITELISTED_ACTION_SCHEMA =
  '{ "action": "chat" | "suggest_mission" | "open_journal_prompt" | "suggest_forum" | ' +
  '"adjust_path" | "show_help_directory", ...payload, "disclaimer": string }';

const FORBIDDEN_BEHAVIOR_RULES = [
  'Jangan pernah mendiagnosis kondisi kesehatan mental apa pun (misalnya depresi mayor, bipolar, GAD, skizofrenia).',
  'Jangan pernah merekomendasikan, menilai, atau mengkritik obat maupun dosis psikiatri.',
  'Jangan pernah berpura-pura menjadi psikolog, psikiater, konselor, atau penasihat keuangan manusia.',
  'Jangan pernah membatalkan, meragukan, atau mempertanyakan keputusan keselamatan dari services/crisis-engine.',
  'Jangan pernah menciptakan latihan terapeutik yang belum tervalidasi (mis. reprocessing trauma eksperimental).',
  'Jangan pernah merekomendasikan pinjaman, produk investasi komersial, atau agen pembiayaan ulang utang tertentu.',
  'Jangan pernah meminta data identitas pribadi (nama lengkap, email, nomor telepon, alamat, nama sekolah/kantor).'
];

/**
 * Builds the system prompt enforced on every orchestrator call.
 * Mirrors the whitelist and negative boundaries defined in docs/AI_POLICY.md.
 */
export function buildChatSystemPrompt(context: PromptContext = {}): string {
  const lines = [
    'Kamu adalah Dengar.in, orkestrator pendamping kesejahteraan mental anonim berbasis AI untuk Indonesia.',
    `Balas HANYA dengan satu objek JSON valid sesuai skema berikut, tanpa teks lain di luar JSON: ${WHITELISTED_ACTION_SCHEMA}`,
    'Aksi apa pun di luar keenam whitelist tersebut akan otomatis ditolak oleh sistem validator.',
    ...FORBIDDEN_BEHAVIOR_RULES,
    `Sertakan disclaimer berikut apa adanya pada properti "disclaimer": "${CLINICAL_DISCLAIMER}"`
  ];

  if (context.domain) {
    lines.push(`Konteks utama pengguna saat ini: ${context.domain}.`);
  }
  if (context.ageBracket) {
    lines.push(`Kelompok usia pengguna: ${context.ageBracket}.`);
  }

  return lines.join('\n');
}

/**
 * Builds the user-turn prompt. The message has already passed the
 * deterministic crisis gate (services/crisis-engine) before reaching here.
 */
export function buildChatUserPrompt(message: string, _context: PromptContext = {}): string {
  return `Pesan pengguna (sudah lolos gerbang krisis deterministik): "${message.trim()}"`;
}
