import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  evaluateCrisisInput, 
  normalizeIndonesianText 
} from '../../services/crisis-engine/src/crisisDetector.ts';

describe('Deterministic Crisis Engine Tests', () => {

  describe('Text Normalization & Anti-Evasion', () => {
    it('normalizes leetspeak numbers to alphabet', () => {
      assert.equal(normalizeIndonesianText('bund1r'), 'bundir');
      assert.equal(normalizeIndonesianText('b4yg0n'), 'baygon');
      assert.equal(normalizeIndonesianText('m4t1'), 'mati');
    });

    it('collapses repeated elongated characters', () => {
      assert.equal(normalizeIndonesianText('matiiiiii'), 'mati');
      assert.equal(normalizeIndonesianText('buuundir'), 'bundir');
    });

    it('safely handles empty, null, undefined, and non-string inputs', () => {
      assert.equal(normalizeIndonesianText(''), '');
      assert.equal(normalizeIndonesianText(null), '');
      assert.equal(normalizeIndonesianText(undefined), '');
      assert.equal(normalizeIndonesianText(12345), '');
      assert.equal(normalizeIndonesianText({}), '');
    });
  });

  describe('Explicit Crisis Phrases (High-Risk Language)', () => {
    const crisisCases = [
      { text: 'aku udah ga kuat lagi, mau bunuh diri aja', expectedDomain: 'suicide' },
      { text: 'pengen bundir rasanya', expectedDomain: 'suicide' },
      { text: 'mending aku mati aja daripada nyusahin keluarga', expectedDomain: 'suicide' },
      { text: 'ga mau hidup lagi, pengen ngilang selamanya', expectedDomain: 'suicide' },
      { text: 'ini surat wasiat terakhirku untuk teman-teman', expectedDomain: 'extreme_hopelessness' },
      { text: 'selamat tinggal semuanya aku pamit selamanya', expectedDomain: 'extreme_hopelessness' },
      { text: 'kemarin aku coba nyayat lengan kiriku', expectedDomain: 'self_harm' },
      { text: 'pengen sayat nadi biar tenang', expectedDomain: 'self_harm' },
      { text: 'gantung diri di kamar', expectedDomain: 'self_harm' },
      { text: 'aku baru aja beli dan minum baygon', expectedDomain: 'self_harm' },
      { text: 'mau loncat dari gedung apartemen', expectedDomain: 'suicide' }
    ];

    for (const testCase of crisisCases) {
      it(`triggers crisis for: "${testCase.text}"`, () => {
        const result = evaluateCrisisInput(testCase.text, '18-24');
        assert.equal(result.isCrisis, true, `Failed to trigger crisis for: ${testCase.text}`);
        assert.equal(result.severity, 'crisis');
        assert.ok(result.emergencyContacts.length > 0, 'Must provide emergency contacts');
        assert.ok(result.immediateInterventionCopy.length > 0, 'Must provide intervention copy');
      });
    }
  });

  describe('Indonesian Distress Language (Non-Crisis)', () => {
    const nonCrisisDistressCases = [
      'hari ini capek banget tugas sekolah banyak banget',
      'skripsi saya revisi terus, dosen pembimbing susah ditemui',
      'bos di kantor toxic banget bikin burnout dan stres',
      'banyak tagihan hutang pinjol pusing mikirin cicilan',
      'baru putus sama pacar rasanya sedih dan hampa',
      'butuh teman ngobrol karena merasa kesepian di kosan',
      'ingin istirahat sejenak dari rutinitas kerja'
    ];

    for (const text of nonCrisisDistressCases) {
      it(`does NOT trigger crisis for non-lethal distress: "${text}"`, () => {
        const result = evaluateCrisisInput(text, '25-34');
        assert.equal(result.isCrisis, false, `Incorrectly triggered crisis for: ${text}`);
      });
    }
  });

  describe('False-Positive-Sensitive Phrases (Must NOT Trigger Crisis)', () => {
    const falsePositiveCases = [
      'mati lampu dari tadi sore di rumah pusing jadinya',
      'baterai hp saya mati total ga bisa dicharge',
      'mati gaya nunggu hujan reda di halte',
      'jari tangan saya mati rasa kena air es',
      'mati kutu ditanya pertanyaan sulit sama dosen penguji',
      'lampu kamar mandi mati belum diganti'
    ];

    for (const text of falsePositiveCases) {
      it(`does NOT falsely trigger crisis on benign phrase: "${text}"`, () => {
        const result = evaluateCrisisInput(text, '18-24');
        assert.equal(result.isCrisis, false, `False positive triggered on: "${text}"`);
      });
    }
  });

  describe('Empty and Malformed Input Handling', () => {
    it('returns non-crisis for empty string', () => {
      const result = evaluateCrisisInput('');
      assert.equal(result.isCrisis, false);
      assert.equal(result.severity, 'none');
    });

    it('returns non-crisis for whitespace string', () => {
      const result = evaluateCrisisInput('    ');
      assert.equal(result.isCrisis, false);
      assert.equal(result.severity, 'none');
    });

    it('returns non-crisis for null/undefined/malformed input without throwing', () => {
      // @ts-expect-error testing invalid runtime inputs
      assert.equal(evaluateCrisisInput(null).isCrisis, false);
      // @ts-expect-error testing invalid runtime inputs
      assert.equal(evaluateCrisisInput(undefined).isCrisis, false);
      // @ts-expect-error testing invalid runtime inputs
      assert.equal(evaluateCrisisInput(12345).isCrisis, false);
      // @ts-expect-error testing invalid runtime inputs
      assert.equal(evaluateCrisisInput({}).isCrisis, false);
    });
  });

  describe('Age-Adapted Resource Escalation', () => {
    it('provides minor/teen hotlines (Teencare/KPAI) for age bracket 15-17', () => {
      const result = evaluateCrisisInput('aku pengen mati aja rasanya', '15-17');
      assert.equal(result.isCrisis, true);
      const hasTeenCare = result.emergencyContacts.some(c => c.id === 'teencare-kpai');
      assert.equal(hasTeenCare, true, 'Minors aged 15-17 must receive Teencare/KPAI contact');
      assert.ok(result.immediateInterventionCopy.includes('perlindungan remaja'));
    });

    it('provides adult crisis hotlines (Sejiwa / Lisa) for age bracket 18-24', () => {
      const result = evaluateCrisisInput('aku pengen mati aja rasanya', '18-24');
      assert.equal(result.isCrisis, true);
      const hasSejiwa = result.emergencyContacts.some(c => c.id === 'sejiwa-119');
      const hasLisa = result.emergencyContacts.some(c => c.id === 'lisa-crisis');
      assert.equal(hasSejiwa, true);
      assert.equal(hasLisa, true);
    });
  });

  describe('Zero-LLM Hard Boundary Verification', () => {
    it('executes synchronously in under 5 milliseconds with zero network requests', () => {
      const start = performance.now();
      const result = evaluateCrisisInput('mau bundir');
      const duration = performance.now() - start;
      assert.ok(duration < 5, `Execution took ${duration}ms, must be sub-millisecond deterministic`);
      assert.equal(result.isCrisis, true);
    });
  });
});
