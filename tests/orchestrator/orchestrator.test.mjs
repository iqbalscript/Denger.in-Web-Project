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

    it('moves to Tertiary tier (Gemini) when Primary tier is unconfigured', async () => {
      const providers = [
        { id: 'tier1-off', isConfigured: () => false, generate: async () => { throw new Error('unreachable'); } },
        mockProvider('tertiary-gemini', async () => ({
          rawText: JSON.stringify({
            action: 'suggest_mission',
            missionId: 'mission-work-1',
            reason: 'Membantu menenangkan burnout',
            disclaimer: STANDARD_DISCLAIMER
          })
        }))
      ];

      const result = await runOrchestrator(
        { message: 'Aku burnout kerja.', domain: 'work' },
        { providers, enableDebiaser: false }
      );

      assert.equal(result.tier, 'tertiary');
      assert.equal(result.providerId, 'tertiary-gemini');
      assert.equal(result.action.action, 'suggest_mission');
    });

    it('passes multi-turn conversation history into provider messages', async () => {
      let capturedRequest = null;
      const providers = [
        mockProvider('tier1-history', async (req) => {
          capturedRequest = req;
          return {
            rawText: JSON.stringify({
              action: 'chat',
              message: 'Aku mengerti konteks sebelumnya.',
              disclaimer: STANDARD_DISCLAIMER
            })
          };
        })
      ];

      const result = await runOrchestrator(
        {
          message: 'Bagaimana solusinya?',
          history: [
            { sender: 'user', text: 'Tugasku menumpuk' },
            { sender: 'assistant', text: 'Apa tugas yang paling mendesak?' }
          ]
        },
        { providers, enableDebiaser: false }
      );

      assert.equal(result.tier, 'primary');
      assert.ok(capturedRequest);
      assert.ok(capturedRequest.messages);
      assert.equal(capturedRequest.messages.length, 4); // system, user, assistant, user
      assert.equal(capturedRequest.messages[1].content, 'Tugasku menumpuk');
    });

    it('intercepts pure coding requests at the Pre-LLM domain gate', async () => {
      const providers = [
        mockProvider('should-not-be-called', async () => {
          throw new Error('LLM should not be called for pure coding request');
        })
      ];

      const result = await runOrchestrator(
        { message: 'Tolong buatkan fungsi fizzbuzz di python' },
        { providers }
      );

      assert.equal(result.providerId, 'guardrail:domain-gate');
      assert.equal(result.action.action, 'chat');
      assert.ok(result.action.message.includes('bukan asisten pemrograman'));
    });

    it('applies Second Brain debiasing when debiaser provider is configured', async () => {
      const providers = [
        mockProvider('tier1-deepseek', async () => ({
          rawText: JSON.stringify({
            action: 'chat',
            message: 'Beban kerja seperti itu hal yang biasa terjadi.',
            disclaimer: STANDARD_DISCLAIMER
          })
        }))
      ];

      const debiaserProvider = mockProvider('second-brain-nemotron', async () => ({
        rawText: JSON.stringify({
          action: 'chat',
          message: 'Aku mendengar lelahnya beban kerjamu saat ini.',
          disclaimer: STANDARD_DISCLAIMER
        })
      }));

      const result = await runOrchestrator(
        { message: 'Aku stres kerjaan numpuk.' },
        { providers, debiaserProvider, enableDebiaser: true }
      );

      assert.equal(result.tier, 'primary');
      assert.equal(result.debiased, true);
      assert.ok(result.providerId.includes('second-brain-nemotron'));
      assert.equal(result.action.message, 'Aku mendengar lelahnya beban kerjamu saat ini.');
    });
  });
});

