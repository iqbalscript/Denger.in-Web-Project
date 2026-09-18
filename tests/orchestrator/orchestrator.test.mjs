import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runOrchestrator } from '../../services/orchestrator/src/orchestrator.ts';
import { STANDARD_DISCLAIMER } from '../../services/validator/src/actionValidator.ts';

function mockProvider(id, behavior) {
  return {
    id,
    isConfigured: () => true,
    generate: behavior
  };
}

describe('AI Orchestrator Tiered Pipeline', () => {
  describe('Tier 3 — Deterministic Fallback', () => {
    it('falls back to the deterministic action when no providers are configured', async () => {
      const result = await runOrchestrator(
        { message: 'Aku merasa kewalahan dengan tugas kuliah.', domain: 'campus' },
        { providers: [] }
      );

      assert.equal(result.tier, 'fallback');
      assert.equal(result.providerId, 'deterministic-fallback');
      assert.equal(result.action.action, 'chat');
      assert.equal(result.action.disclaimer.length > 0, true);
    });

    it('falls back when every configured provider throws or times out', async () => {
      const providers = [
        mockProvider('tier1-down', async () => {
          throw new Error('timeout');
        }),
        mockProvider('tier2-down', async () => {
          throw new Error('network error');
        })
      ];

      const result = await runOrchestrator(
        { message: 'Aku butuh teman bicara.', domain: 'general' },
        { providers }
      );

      assert.equal(result.tier, 'fallback');
      assert.ok(result.warnings.some((w) => w.includes('tier1-down')));
      assert.ok(result.warnings.some((w) => w.includes('tier2-down')));
    });

    it('falls back when a provider returns output the validator rejects', async () => {
      const providers = [
        mockProvider('tier1-invalid', async () => ({
          rawText: JSON.stringify({ action: 'diagnose_depression' })
        }))
      ];

      const result = await runOrchestrator(
        { message: 'Aku merasa cemas.', domain: 'work' },
        { providers }
      );

      assert.equal(result.tier, 'fallback');
      assert.ok(result.warnings.some((w) => w.includes('tier1-invalid')));
    });

    it('falls back when a provider returns malformed (non-JSON) text', async () => {
      const providers = [mockProvider('tier1-garbled', async () => ({ rawText: 'bukan json' }))];

      const result = await runOrchestrator({ message: 'Halo' }, { providers });

      assert.equal(result.tier, 'fallback');
    });
  });

  describe('Tier 1 / Tier 2 — Provider Success Path', () => {
    it('returns the validated action from the first configured provider (Tier 1)', async () => {
      const providers = [
        mockProvider('tier1-success', async () => ({
          rawText: JSON.stringify({
            action: 'chat',
            message: 'Aku mendengar bebanmu. Mari kita urai perlahan.',
            disclaimer: STANDARD_DISCLAIMER
          })
        })),
        mockProvider('tier2-unused', async () => {
          throw new Error('should not be called');
        })
      ];

      const result = await runOrchestrator({ message: 'Aku sedang stres berat.' }, { providers });

      assert.equal(result.tier, 'primary');
      assert.equal(result.providerId, 'tier1-success');
      assert.equal(result.action.action, 'chat');
    });

    it('moves to Tier 2 when Tier 1 is unconfigured', async () => {
      const providers = [
        { id: 'tier1-off', isConfigured: () => false, generate: async () => { throw new Error('unreachable'); } },
        mockProvider('tier2-success', async () => ({
          rawText: JSON.stringify({
            action: 'suggest_mission',
            missionId: 'mission-work-1',
            reason: 'Membantu menenangkan burnout',
            disclaimer: STANDARD_DISCLAIMER
          })
        }))
      ];

      const result = await runOrchestrator({ message: 'Aku burnout kerja.', domain: 'work' }, { providers });

      assert.equal(result.tier, 'secondary');
      assert.equal(result.providerId, 'tier2-success');
      assert.equal(result.action.action, 'suggest_mission');
    });
  });
});
