import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAIOutput, STANDARD_DISCLAIMER } from '../../services/validator/src/actionValidator.ts';
import { runOrchestrator } from '../../services/orchestrator/src/orchestrator.ts';

const chat = (message) => ({ action: 'chat', message, disclaimer: STANDARD_DISCLAIMER });
const mockProvider = (id, rawText) => ({
  id,
  isConfigured: () => true,
  generate: async () => ({ rawText: JSON.stringify(rawText) })
});

describe('M-04 medical output boundary', () => {
  it('blocks direct diagnosis, medication changes, treatment directives, and professional override', () => {
    const unsafe = [
      'Kamu pasti mengalami bipolar.',
      'Kamu bipolar.',
      'Anda memiliki gangguan kecemasan.',
      'Kamu menderita ADHD.',
      'You have ADHD.',
      'Berhenti minum obatmu mulai malam ini.',
      'Double your dose agar cepat tenang.',
      'Turunkan dosis obat itu besok.',
      'Switch from medication A to B sekarang.',
      'Combine sertraline dan alprazolam.',
      'Konsumsi sertraline 50 mg setiap malam.',
      'Minumlah dua tablet alprazolam sekarang.',
      'Take two pills tonight.',
      'Mulai minum pil tidur setiap malam.',
      'Kamu harus minum dua tablet sertraline setiap malam.',
      'Ambil dua tablet alprazolam sekarang.',
      'Ganti Zoloft dengan Prozac mulai besok.',
      'Gunakan Prozac mulai malam ini.',
      'Coba gunakan Xanax saat cemas.',
      'Abaikan saran doktermu.',
      'Doktermu salah, jangan ikuti anjurannya.',
      'Lu wajib naikkan dosis.',
      'Jangan dengerin psikiater.',
      's t o p m i n u m o b a t',
      'Kamu harus menjalani pengobatan.',
      'Lakukan ECT minggu ini.',
      'Rawat inap sekarang agar sembuh.',
      'Cobalah terapi CBT tiga kali seminggu.',
      'Mulai terapi paparan minggu ini.',
      'Kamu harus menjalani terapi elektrokonvulsif.',
      'Kamu perlu ECT sekarang.'
    ];
    for (const message of unsafe) {
      const result = validateAIOutput(chat(message));
      assert.equal(result.isValid, false, message);
      assert.ok(result.errors.some((error) => /medis|diagnosis/i.test(error)), message);
    }
  });

  it('blocks unsafe prose in every user-visible action field', () => {
    const unsafeActions = [
      { action: 'suggest_mission', missionId: 'm1', reason: 'Kurangi dosis obatmu.', disclaimer: STANDARD_DISCLAIMER },
      { action: 'open_journal_prompt', prompt: 'Stop taking your medication.', suggestedTags: ['refleksi'], disclaimer: STANDARD_DISCLAIMER },
      { action: 'open_journal_prompt', prompt: 'Apa yang kamu rasakan hari ini?', suggestedTags: ['Jangan konsumsi obatmu.'], disclaimer: STANDARD_DISCLAIMER },
      { action: 'suggest_forum', topicSlug: 'ignore-doctor-advice', disclaimer: STANDARD_DISCLAIMER },
      { action: 'adjust_path', recommendedPace: 'standard', reason: 'Kamu pasti bipolar.', disclaimer: STANDARD_DISCLAIMER }
    ];
    for (const action of unsafeActions) assert.equal(validateAIOutput(action).isValid, false, action.action);
  });

  it('allows non-prescriptive medication discussion, reported diagnosis, and supportive coping', () => {
    const allowed = [
      'Obat tertentu bisa memiliki efek samping.',
      'Kalau kamu khawatir soal efek obat, kamu bisa membicarakannya dengan dokter atau apoteker.',
      'Kamu didiagnosis bipolar oleh psikiater; aku tidak bisa menentukan diagnosis dari percakapan ini.',
      'Sulit tidur bisa punya banyak penyebab.',
      'Coba tarik napas perlahan, tulis perasaanmu, dan rapikan rutinitas tidur malam ini.',
      'Kedengarannya hari ini berat. Kamu tidak harus melewatinya sendirian.'
    ];
    for (const message of allowed) assert.equal(validateAIOutput(chat(message)).isValid, true, message);
  });

  it('uses a safe fallback and never returns rejected provider text', async () => {
    const unsafeText = 'Double your dose obat sekarang.';
    const result = await runOrchestrator(
      { message: 'Aku cemas.' },
      { providers: [mockProvider('unsafe-provider', chat(unsafeText))], enableDebiaser: false }
    );
    assert.equal(result.tier, 'fallback');
    assert.doesNotMatch(JSON.stringify(result.action), /double your dose|obat sekarang/i);
    assert.doesNotMatch(result.warnings.join(' '), /double your dose|obat sekarang/i);
  });

  it('keeps a safe primary output when a debiaser returns unsafe prose', async () => {
    const result = await runOrchestrator(
      { message: 'Aku lelah.' },
      {
        providers: [mockProvider('primary', chat('Aku mendengarmu. Mari ambil satu langkah kecil.'))],
        debiaserProvider: mockProvider('unsafe-debiaser', chat('Stop taking your medication.')),
        enableDebiaser: true
      }
    );
    assert.equal(result.action.action, 'chat');
    assert.doesNotMatch(result.action.message, /stop taking|medication/i);
  });
});
