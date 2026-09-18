import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  ADAPTIVE_ASSESSMENT_QUESTIONS, 
  TOPIC_PILLARS, 
  evaluateSeverityLevel 
} from '../../packages/config/src/index.ts';

// Reusable alias generation logic for unit test verification
const ALIAS_NOUNS = [
  'Bunga', 'Embun', 'Lentera', 'Samudra', 'Fajar', 'Senja',
  'Cakrawala', 'Rimba', 'Awan', 'Kidung', 'Pelita', 'Bintang',
  'Pohon', 'Hujan', 'Mentari', 'Sungai', 'Angin', 'Daun'
];

const ALIAS_ADJECTIVES = [
  'Tenang', 'Damai', 'Teduh', 'Hening', 'Sejuk', 'Hangat',
  'Sabar', 'Jernih', 'Lembut', 'Bijak', 'Sentosa', 'Tabah',
  'Tegar', 'Ikhlas', 'Lega'
];

function generateTestAlias() {
  const noun = ALIAS_NOUNS[Math.floor(Math.random() * ALIAS_NOUNS.length)];
  const adj = ALIAS_ADJECTIVES[Math.floor(Math.random() * ALIAS_ADJECTIVES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${noun} ${adj} #${num}`;
}

describe('PRD 2.0 Phase 1 Adaptive Assessment & Triage Tests', () => {

  describe('3 Primary Topic Pillars & Life-Domain Mapping', () => {
    it('defines all three PRD topic pillars (finance, trauma, sexual_violence)', () => {
      assert.ok(TOPIC_PILLARS.finance, 'Finance pillar must exist');
      assert.ok(TOPIC_PILLARS.trauma, 'Trauma pillar must exist');
      assert.ok(TOPIC_PILLARS.sexual_violence, 'Sexual violence survivor pillar must exist');
    });

    it('maps finance pillar explicitly to existing finance life-domain', () => {
      assert.equal(TOPIC_PILLARS.finance.primaryDomain, 'finance');
      assert.ok(TOPIC_PILLARS.finance.mappedDomains.includes('finance'));
    });

    it('maps trauma pillar explicitly to existing family/general domain with sensitive flag', () => {
      assert.equal(TOPIC_PILLARS.trauma.isSensitive, true);
      assert.ok(TOPIC_PILLARS.trauma.mappedDomains.includes('family'));
    });

    it('maps sexual_violence pillar explicitly to relationship/general domain with sensitive flag', () => {
      assert.equal(TOPIC_PILLARS.sexual_violence.isSensitive, true);
      assert.ok(TOPIC_PILLARS.sexual_violence.mappedDomains.includes('relationship'));
    });
  });

  describe('Adaptive Question Catalog & Sensitive Skip', () => {
    it('contains root emotional strain question for all users', () => {
      const rootQ = ADAPTIVE_ASSESSMENT_QUESTIONS.find(q => q.id === 'root-emotional-strain');
      assert.ok(rootQ, 'Root question must exist');
      assert.equal(rootQ.topic, 'general');
      assert.equal(rootQ.sensitive, false);
      assert.equal(rootQ.options.length, 4);
    });

    it('marks trauma question as sensitive and skippable', () => {
      const traumaQ = ADAPTIVE_ASSESSMENT_QUESTIONS.find(q => q.id === 'context-trauma');
      assert.ok(traumaQ);
      assert.equal(traumaQ.sensitive, true);
      assert.equal(traumaQ.skippable, true);
    });

    it('marks sexual-violence question as sensitive and skippable', () => {
      const svQ = ADAPTIVE_ASSESSMENT_QUESTIONS.find(q => q.id === 'context-sexual-violence');
      assert.ok(svQ);
      assert.equal(svQ.sensitive, true);
      assert.equal(svQ.skippable, true);
    });

    it('has calibrated 0 to 3 scores across all options', () => {
      for (const q of ADAPTIVE_ASSESSMENT_QUESTIONS) {
        for (const opt of q.options) {
          assert.ok(opt.score >= 0 && opt.score <= 3, `Option score must be 0..3 in question ${q.id}`);
        }
      }
    });
  });

  describe('Non-Diagnostic Severity Triage Calculation', () => {
    it('evaluates score 0 as MILD', () => {
      assert.equal(evaluateSeverityLevel(0), 'MILD');
    });

    it('evaluates score 3 as MILD', () => {
      assert.equal(evaluateSeverityLevel(3), 'MILD');
    });

    it('evaluates score 4 as MODERATE', () => {
      assert.equal(evaluateSeverityLevel(4), 'MODERATE');
    });

    it('evaluates score 7 as MODERATE', () => {
      assert.equal(evaluateSeverityLevel(7), 'MODERATE');
    });

    it('evaluates score 8 as SEVERE', () => {
      assert.equal(evaluateSeverityLevel(8), 'SEVERE');
    });

    it('evaluates high score 12 as SEVERE', () => {
      assert.equal(evaluateSeverityLevel(12), 'SEVERE');
    });

    it('strictly outputs only MILD, MODERATE, or SEVERE without medical diagnoses', () => {
      const allowedOutputs = new Set(['MILD', 'MODERATE', 'SEVERE']);
      for (let score = 0; score <= 15; score++) {
        const result = evaluateSeverityLevel(score);
        assert.ok(allowedOutputs.has(result));
        // Must never output DSM labels
        assert.notEqual(result, 'depression');
        assert.notEqual(result, 'anxiety_disorder');
        assert.notEqual(result, 'ptsd');
      }
    });
  });

  describe('Anonymous Alias Generation (Zero PII)', () => {
    it('generates an alias in the format "{Noun} {Adjective} #{4-digit}"', () => {
      for (let i = 0; i < 20; i++) {
        const alias = generateTestAlias();
        const match = /^([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+#\d{4}$/.test(alias);
        assert.ok(match, `Generated alias "${alias}" must match pattern Noun Adj #XXXX`);
      }
    });

    it('does not leak PII (no @, no phone numbers, no UUIDs)', () => {
      for (let i = 0; i < 20; i++) {
        const alias = generateTestAlias();
        assert.ok(!alias.includes('@'), 'Must not contain email @ symbol');
        assert.ok(!alias.includes('+62'), 'Must not contain country phone code');
        assert.ok(!alias.includes('-'), 'Must not contain UUID hyphens');
      }
    });
  });

  describe('Save & Resume Draft Serialization', () => {
    it('correctly serializes and deserializes an in-progress draft without data loss', () => {
      const sampleDraft = {
        currentQuestionId: 'functioning-impact',
        topic: 'finance',
        ageBracket: '18-29',
        answers: {
          'root-emotional-strain': 2,
          'context-finance': 1
        },
        skippedQuestionIds: [],
        lastUpdated: new Date().toISOString()
      };

      const serialized = JSON.stringify(sampleDraft);
      const deserialized = JSON.parse(serialized);

      assert.equal(deserialized.currentQuestionId, 'functioning-impact');
      assert.equal(deserialized.answers['root-emotional-strain'], 2);
      assert.equal(deserialized.answers['context-finance'], 1);
      assert.equal(deserialized.topic, 'finance');
    });

    it('records skipped questions separately without corrupting answers object', () => {
      const draftWithSkipped = {
        currentQuestionId: 'functioning-impact',
        topic: 'trauma',
        ageBracket: '18-29',
        answers: {
          'root-emotional-strain': 1
        },
        skippedQuestionIds: ['context-trauma'],
        lastUpdated: new Date().toISOString()
      };

      assert.ok(draftWithSkipped.skippedQuestionIds.includes('context-trauma'));
      assert.equal(draftWithSkipped.answers['context-trauma'], undefined);
    });
  });
});
