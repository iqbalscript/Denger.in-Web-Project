import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  validateAIOutput, 
  ALLOWED_ACTIONS, 
  STANDARD_DISCLAIMER 
} from '../../services/validator/src/actionValidator.ts';

describe('AI Action Schema & Whitelist Validator Tests', () => {

  describe('Every Allowed Action (Must Pass Validation)', () => {
    it('validates a correct "chat" action', () => {
      const input = {
        action: 'chat',
        message: 'Saya mendengar beban yang kamu rasakan. Mari kita urai satu per satu.',
        disclaimer: STANDARD_DISCLAIMER
      };
      const result = validateAIOutput(input);
      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert.equal(result.action.action, 'chat');
      assert.equal(result.action.message, input.message);
    });

    it('validates a correct "suggest_mission" action', () => {
      const input = {
        action: 'suggest_mission',
        missionId: 'grounding-478-breath',
        reason: 'Membantu menstabilkan detak jantung saat cemas',
        disclaimer: STANDARD_DISCLAIMER
      };
      const result = validateAIOutput(input);
      assert.equal(result.isValid, true);
      assert.equal(result.action.action, 'suggest_mission');
      assert.equal(result.action.missionId, 'grounding-478-breath');
    });

    it('validates a correct "open_journal_prompt" action', () => {
      const input = {
        action: 'open_journal_prompt',
        prompt: 'Tuliskan 3 hal yang saat ini berada di luar kendalimu, dan 1 hal kecil yang masih bisa kamu kendalikan hari ini.',
        suggestedTags: ['kontrol', 'kecemasan'],
        disclaimer: STANDARD_DISCLAIMER
      };
      const result = validateAIOutput(input);
      assert.equal(result.isValid, true);
      assert.equal(result.action.action, 'open_journal_prompt');
      assert.deepEqual(result.action.suggestedTags, ['kontrol', 'kecemasan']);
    });

    it('validates a correct "suggest_forum" action', () => {
      const input = {
        action: 'suggest_forum',
        topicSlug: 'skripsi-burnout',
        disclaimer: STANDARD_DISCLAIMER
      };
      const result = validateAIOutput(input);
      assert.equal(result.isValid, true);
      assert.equal(result.action.action, 'suggest_forum');
      assert.equal(result.action.topicSlug, 'skripsi-burnout');
    });

    it('validates a correct "adjust_path" action', () => {
      const input = {
        action: 'adjust_path',
        recommendedPace: 'slower',
        reason: 'Menyesuaikan kecepatan karena beban tugas berat',
        disclaimer: STANDARD_DISCLAIMER
      };
      const result = validateAIOutput(input);
      assert.equal(result.isValid, true);
      assert.equal(result.action.action, 'adjust_path');
      assert.equal(result.action.recommendedPace, 'slower');
    });

    it('validates a correct "show_help_directory" action', () => {
      const input = {
        action: 'show_help_directory',
        category: 'financial',
        disclaimer: STANDARD_DISCLAIMER
      };
      const result = validateAIOutput(input);
      assert.equal(result.isValid, true);
      assert.equal(result.action.action, 'show_help_directory');
      assert.equal(result.action.category, 'financial');
    });
  });

  describe('Disclaimer Sanitization & Extra Fields Stripping', () => {
    it('automatically sanitizes and attaches standard disclaimer if omitted by model', () => {
      const inputWithoutDisclaimer = {
        action: 'chat',
        message: 'Tetap tenang, kita bisa lewati hari ini.'
      };
      const result = validateAIOutput(inputWithoutDisclaimer);
      assert.equal(result.isValid, true);
      assert.equal(result.sanitized, true);
      assert.equal(result.action.disclaimer, STANDARD_DISCLAIMER);
    });

    it('sanitizes away unexpected/extra fields not in schema', () => {
      const inputWithExtra = {
        action: 'chat',
        message: 'Mari kita mulai langkah kecil.',
        disclaimer: STANDARD_DISCLAIMER,
        unexpectedField: 'harmful_payload',
        adminOverride: true
      };
      const result = validateAIOutput(inputWithExtra);
      assert.equal(result.isValid, true);
      assert.equal(result.sanitized, true);
      assert.equal(result.action.unexpectedField, undefined);
      assert.equal(result.action.adminOverride, undefined);
    });
  });

  describe('Prohibited & Unknown Actions (Must Be REJECTED)', () => {
    const dangerousActions = [
      { action: 'diagnose_depression', payload: { disorder: 'MDD' } },
      { action: 'prescribe_medication', payload: { drug: 'Sertraline', dose: '50mg' } },
      { action: 'recommend_loan', payload: { provider: 'KTA Instan' } },
      { action: 'conduct_hypnosis', payload: { script: 'Tutup mata' } },
      { action: 'override_crisis_filter', payload: { force: true } },
      { action: 'unknown_custom_action', payload: {} }
    ];

    for (const testCase of dangerousActions) {
      it(`strictly rejects unauthorized or unknown action: "${testCase.action}"`, () => {
        const result = validateAIOutput(testCase);
        assert.equal(result.isValid, false);
        assert.ok(result.errors.length > 0);
        assert.ok(result.errors[0].includes('ditolak'));
      });
    }
  });

  describe('Missing Required Fields & Invalid Parameters', () => {
    it('rejects "chat" action with missing or empty message', () => {
      const result = validateAIOutput({ action: 'chat', message: '   ' });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('message')));
    });

    it('rejects "suggest_mission" without missionId', () => {
      const result = validateAIOutput({ action: 'suggest_mission' });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('missionId')));
    });

    it('rejects "suggest_forum" without topicSlug', () => {
      const result = validateAIOutput({ action: 'suggest_forum' });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('topicSlug')));
    });

    it('rejects "adjust_path" with invalid recommendedPace parameter', () => {
      const result = validateAIOutput({ 
        action: 'adjust_path', 
        recommendedPace: 'hyper_speed', 
        reason: 'test' 
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('recommendedPace')));
    });

    it('rejects "show_help_directory" with invalid category parameter', () => {
      const result = validateAIOutput({ 
        action: 'show_help_directory', 
        category: 'unapproved_category' 
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('category')));
    });
  });

  describe('Malformed JSON & Non-Object Inputs', () => {
    it('rejects null input', () => {
      assert.equal(validateAIOutput(null).isValid, false);
    });

    it('rejects string primitive input', () => {
      assert.equal(validateAIOutput('chat').isValid, false);
    });

    it('rejects undefined input', () => {
      assert.equal(validateAIOutput(undefined).isValid, false);
    });

    it('rejects number input', () => {
      assert.equal(validateAIOutput(12345).isValid, false);
    });

    it('rejects empty object without action', () => {
      const result = validateAIOutput({});
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('action')));
    });
  });
});
