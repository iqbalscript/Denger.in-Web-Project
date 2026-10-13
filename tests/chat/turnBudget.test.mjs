import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  runOrchestrator,
  planDebiasTimeout,
  planProviderTimeout,
  isDebiaserDisabledByEnv,
  DEFAULT_TURN_BUDGET_MS,
  DEBIASER_MAX_TIMEOUT_MS,
  DEBIASER_MIN_BUDGET_MS,
} from '../../services/orchestrator/src/orchestrator.ts';
import { STANDARD_DISCLAIMER } from '../../services/validator/src/actionValidator.ts';
import { CHAT_TURN_BUDGET_MS, CHAT_CLIENT_TIMEOUT_MS } from '../../apps/web/src/lib/api/requestLimits.ts';

// Audit M10: one chat turn must not pay primary (15 s) + debiaser (10 s).

const ACTION = (message) => JSON.stringify({ action: 'chat', message, disclaimer: STANDARD_DISCLAIMER });

function fakeClock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms) => { t += ms; } };
}

function provider(id, generate) {
  const calls = [];
  return { id, calls, isConfigured: () => true, generate: async (req) => { calls.push(req); return generate(req); } };
}

describe('Turn budget rules (pure)', () => {
  it('planDebiasTimeout skips below the minimum and caps at the maximum', () => {
    assert.equal(planDebiasTimeout(DEBIASER_MIN_BUDGET_MS - 1), null);
    assert.equal(planDebiasTimeout(0), null);
    assert.equal(planDebiasTimeout(-500), null);
    assert.equal(planDebiasTimeout(Number.NaN), null);
    assert.equal(planDebiasTimeout(DEBIASER_MIN_BUDGET_MS), DEBIASER_MIN_BUDGET_MS);
    assert.equal(planDebiasTimeout(6_500), 6_500);
    assert.equal(planDebiasTimeout(60_000), DEBIASER_MAX_TIMEOUT_MS);
  });

  it('planProviderTimeout never exceeds what is left of the budget', () => {
    assert.equal(planProviderTimeout(18_000, 15_000), 15_000);
    assert.equal(planProviderTimeout(4_000, 15_000), 4_000);
    assert.equal(planProviderTimeout(1_000, 15_000), null);
  });

  it('DENGARIN_DEBIASER=off|false|0 disables the second pass; anything else keeps it', () => {
    for (const value of ['off', 'OFF', 'false', '0', ' off ']) assert.equal(isDebiaserDisabledByEnv({ DENGARIN_DEBIASER: value }), true);
    for (const value of [undefined, '', 'on', 'true']) assert.equal(isDebiaserDisabledByEnv({ DENGARIN_DEBIASER: value }), false);
  });

  it('server budget stays below the browser timeout', () => {
    assert.ok(CHAT_TURN_BUDGET_MS < CHAT_CLIENT_TIMEOUT_MS);
    assert.ok(DEFAULT_TURN_BUDGET_MS < CHAT_CLIENT_TIMEOUT_MS);
  });
});

describe('Orchestrator honours the turn budget', () => {
  it('skips the debiaser when the primary call used most of the budget', async () => {
    const clock = fakeClock();
    const primary = provider('primary', async () => { clock.advance(16_000); return { rawText: ACTION('Aku dengar kamu.') }; });
    const debiaser = provider('debiaser', async () => ({ rawText: ACTION('Versi debiased.') }));
    const result = await runOrchestrator(
      { message: 'Aku capek kerja.' },
      { providers: [primary], debiaserProvider: debiaser, now: clock.now, turnBudgetMs: 18_000, env: {} }
    );
    assert.equal(debiaser.calls.length, 0);
    assert.equal(result.debiased, false);
    assert.equal(result.providerId, 'primary');
    assert.equal(result.action.message, 'Aku dengar kamu.');
    assert.ok(result.warnings.some((w) => /anggaran waktu/.test(w)));
  });

  it('runs the debiaser with no more than the remaining budget when there is room', async () => {
    const clock = fakeClock();
    const primary = provider('primary', async () => { clock.advance(12_000); return { rawText: ACTION('Draf.') }; });
    const debiaser = provider('debiaser', async () => ({ rawText: ACTION('Versi debiased.') }));
    const result = await runOrchestrator(
      { message: 'Aku capek kerja.' },
      { providers: [primary], debiaserProvider: debiaser, now: clock.now, turnBudgetMs: 18_000, env: {} }
    );
    assert.equal(debiaser.calls.length, 1);
    assert.equal(debiaser.calls[0].timeoutMs, 6_000);
    assert.equal(result.debiased, true);
  });

  it('caps the debiaser at its own maximum with a fast primary', async () => {
    const clock = fakeClock();
    const primary = provider('primary', async () => { clock.advance(500); return { rawText: ACTION('Draf.') }; });
    const debiaser = provider('debiaser', async () => ({ rawText: ACTION('Versi debiased.') }));
    await runOrchestrator(
      { message: 'Halo' },
      { providers: [primary], debiaserProvider: debiaser, now: clock.now, turnBudgetMs: 60_000, env: {} }
    );
    assert.equal(debiaser.calls[0].timeoutMs, DEBIASER_MAX_TIMEOUT_MS);
  });

  it('gives each provider tier only what is left, and skips a tier once the budget is spent', async () => {
    const clock = fakeClock();
    const first = provider('first', async () => { clock.advance(17_000); throw new Error('timeout'); });
    const second = provider('second', async () => ({ rawText: ACTION('tidak dipakai') }));
    const result = await runOrchestrator(
      { message: 'Halo' },
      { providers: [first, second], now: clock.now, turnBudgetMs: 18_000, enableDebiaser: false, env: {} }
    );
    assert.equal(first.calls[0].timeoutMs, 15_000);
    assert.equal(second.calls.length, 0);
    assert.equal(result.tier, 'fallback');
    assert.ok(result.warnings.some((w) => w.startsWith('second dilewati')));
  });

  it('a second tier gets the shortened remaining budget', async () => {
    const clock = fakeClock();
    const first = provider('first', async () => { clock.advance(10_000); throw new Error('boom'); });
    const second = provider('second', async () => ({ rawText: ACTION('Aku di sini.') }));
    const result = await runOrchestrator(
      { message: 'Halo' },
      { providers: [first, second], now: clock.now, turnBudgetMs: 18_000, enableDebiaser: false, env: {} }
    );
    assert.equal(second.calls[0].timeoutMs, 8_000);
    assert.equal(result.providerId, 'second');
  });

  it('respects the DENGARIN_DEBIASER=off kill switch', async () => {
    const primary = provider('primary', async () => ({ rawText: ACTION('Draf.') }));
    const debiaser = provider('debiaser', async () => ({ rawText: ACTION('Versi debiased.') }));
    const result = await runOrchestrator(
      { message: 'Halo' },
      { providers: [primary], debiaserProvider: debiaser, env: { DENGARIN_DEBIASER: 'off' } }
    );
    assert.equal(debiaser.calls.length, 0);
    assert.equal(result.debiased, false);
  });
});
