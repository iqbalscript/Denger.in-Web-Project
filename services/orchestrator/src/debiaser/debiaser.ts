import type { ValidatedAIAction } from '@dengarin/types';
import { validateAIOutput } from '@dengarin/validator';
import type { LLMProvider } from '../providers/types.ts';
import { createOpenrouterProvider } from '../providers/openrouterProvider.ts';

const DEBIASER_SYSTEM_PROMPT = `Kamu adalah Second Brain & Guardrail Alignment Evaluator untuk Dengar.in, platform kesehatan emosional dan mental anonim Indonesia.
Tugas utamamu adalah mengevaluasi draf respons AI primer (DeepSeek) terhadap pesan pengguna untuk memastikan kepatuhan guardrails maksimum:

1. ANTI-BIAS & NETRALITAS EMOSIONAL:
   - Netralkan segala bias kognitif, kultural, sosio-ekonomi, atau gender.
   - Jangan biarkan ada nada menghakimi atau menyudutkan pengguna.

2. ANTI-TOXIC POSITIVITY & ANTI-VICTIM BLAMING:
   - Hapus kalimat invalidasi meremehkan (contoh: "kamu harusnya bersyukur", "jangan lebay", "masalahmu belum seberapa", "jangan cengeng").
   - Ganti dengan validasi emosi yang hangat, membumi, dan tidak memaksa.

3. ANTI-CODING & STRICT OUT-OF-DOMAIN ENFORCEMENT:
   - Dengar.in BUKAN asisten koding atau chatbot serba bisa!
   - JIKA draf AI primer berisi blok kode pemrograman (\`\`\`), skrip, fungsi, atau tutorial teknis, HAPUS SELURUH KODE TERSEBUT dan ganti pesan dengan penolakan empatik bahwa Dengar.in hadir khusus mendampingi emosional dan tidak dapat membuat kode, namun siap mendengarkan jika tugas itu membuatnya stres.

4. ANTI-DIAGNOSIS PSIKIATRIS:
   - Pastikan tidak ada label diagnostik klinis (misal: "kamu menderita depresi mayor", "ini gejala bipolar", atau anjuran obat medis).

5. PRESERVASI FORMAT JSON:
   - Balas HANYA dengan satu objek JSON valid sesuai skema aksi yang sama dengan draf (harus memiliki "action", payload sesuai aksi, dan "disclaimer"). Tanpa teks lain di luar JSON.`;

export interface DebiasResult {
  action: ValidatedAIAction;
  debiased: boolean;
  warnings: string[];
}

export async function debiasCandidateAction(
  candidateAction: ValidatedAIAction,
  userMessage: string,
  provider: LLMProvider = createOpenrouterProvider(),
  timeoutMs: number = 8000
): Promise<DebiasResult> {
  if (!provider.isConfigured()) {
    return {
      action: candidateAction,
      debiased: false,
      warnings: [`Second Brain (${provider.id}) dilewati: belum dikonfigurasi`]
    };
  }

  const prompt = `Pesan Pengguna: "${userMessage.trim()}"\n\nDraf Respons AI Primer:\n${JSON.stringify(candidateAction, null, 2)}\n\nLakukan evaluasi alignment, debiasing, dan pastikan nol konten koding teknis. Balas HANYA dengan satu objek JSON valid:`;

  try {
    const response = await provider.generate({
      systemPrompt: DEBIASER_SYSTEM_PROMPT,
      userPrompt: prompt,
      timeoutMs
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.rawText);
    } catch {
      return {
        action: candidateAction,
        debiased: false,
        warnings: [`Second Brain (${provider.id}) mengembalikan teks non-JSON; mempertahankan draf primer`]
      };
    }

    const validation = validateAIOutput(parsed);
    if (validation.isValid && validation.action) {
      return {
        action: validation.action,
        debiased: true,
        warnings: []
      };
    }

    return {
      action: candidateAction,
      debiased: false,
      warnings: [`Second Brain (${provider.id}) menghasilkan skema tidak valid: ${validation.errors.join('; ')}`]
    };
  } catch (err) {
    return {
      action: candidateAction,
      debiased: false,
      warnings: [`Second Brain (${provider.id}) gagal: ${err instanceof Error ? err.message : String(err)}`]
    };
  }
}
