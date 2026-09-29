import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CHAT_PROGRESS_STAGES, chatProgressStageAt } from '../../apps/web/src/lib/chatProgress.ts';

describe('Chat progress semantik', () => {
  it('mulai dari "Memahami ceritamu..." begitu pesan dikirim', () => {
    assert.equal(chatProgressStageAt(0).label, 'Memahami ceritamu...');
    assert.equal(chatProgressStageAt(0).step, 1);
  });

  it('berjalan berurutan: memahami -> menyiapkan -> memeriksa keamanan', () => {
    assert.equal(chatProgressStageAt(2_499).label, 'Memahami ceritamu...');
    assert.equal(chatProgressStageAt(2_500).label, 'Menyiapkan respons...');
    assert.equal(chatProgressStageAt(6_999).label, 'Menyiapkan respons...');
    assert.equal(chatProgressStageAt(7_000).label, 'Memeriksa keamanan respons...');
    assert.deepEqual([1, 2, 3].map((n) => CHAT_PROGRESS_STAGES.find((s) => s.step === n)?.label), [
      'Memahami ceritamu...', 'Menyiapkan respons...', 'Memeriksa keamanan respons...',
    ]);
  });

  it('kalau lama, memberi tahu masih berjalan (bukan tampak hang) dan tidak mundur', () => {
    const slow = chatProgressStageAt(16_000);
    assert.equal(slow.step, null);
    assert.match(slow.label, /Masih dikerjakan/);
    assert.match(chatProgressStageAt(60_000).label, /Lebih lama dari biasanya/);
    let previous = -1;
    for (let ms = 0; ms <= 60_000; ms += 250) {
      const index = CHAT_PROGRESS_STAGES.indexOf(chatProgressStageAt(ms));
      assert.ok(index >= previous, `tahap tidak boleh mundur di ${ms}ms`);
      previous = index;
    }
  });

  it('tahap diurutkan naik dan mulai dari 0 ms', () => {
    assert.equal(CHAT_PROGRESS_STAGES[0].afterMs, 0);
    for (let i = 1; i < CHAT_PROGRESS_STAGES.length; i += 1) {
      assert.ok(CHAT_PROGRESS_STAGES[i].afterMs > CHAT_PROGRESS_STAGES[i - 1].afterMs);
    }
  });
});
