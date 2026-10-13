import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactWarning, toPublicWarnings } from '../../apps/web/src/lib/api/publicWarnings.ts';

describe('public projection of orchestrator warnings', () => {
  it('strips upstream provider error bodies but keeps the HTTP status', () => {
    const raw = 'deepseek:deepseek-flash gagal: DeepSeek merespons dengan status 402: Insufficient Balance (req_8f3a, key sk-abc…)';
    assert.equal(redactWarning(raw), 'deepseek:deepseek-flash gagal: status 402');
  });

  it('collapses network/timeout failures to a generic reason', () => {
    assert.equal(redactWarning('gemini:gemini-3.1-flash-lite gagal: This operation was aborted'), 'gemini:gemini-3.1-flash-lite gagal: waktu habis');
    assert.equal(redactWarning('deepseek:x gagal: fetch failed ECONNREFUSED 10.0.0.5:443'), 'deepseek:x gagal: kesalahan penyedia');
  });

  it('drops validator rule lists but keeps the summary', () => {
    assert.equal(
      redactWarning('deepseek:x menghasilkan output tidak valid: Aksi "diagnose" ditolak: bukan aksi yang diizinkan dalam sistem'),
      'deepseek:x menghasilkan output tidak valid'
    );
    assert.equal(
      redactWarning('Second Brain (openrouter:m) menghasilkan skema tidak valid: Aksi ditolak: message memuat diagnosis'),
      'Second Brain (openrouter:m) menghasilkan skema tidak valid'
    );
  });

  it('keeps informational warnings that carry no provider detail', () => {
    for (const w of [
      'deepseek:deepseek-flash dilewati: belum dikonfigurasi',
      'Seluruh tier AI gagal atau tidak dikonfigurasi; menggunakan fallback deterministik.',
      'Permintaan pemrograman/teknis di luar domain kesehatan mental'
    ]) {
      assert.equal(redactWarning(w), w.replace(/\s:.*$/, ''));
    }
  });

  it('never echoes secrets or user text embedded in an upstream message', () => {
    const leaks = ['sk-live-ABC', 'nama saya Budi 08123456789', 'https://api.deepseek.com/v1'];
    for (const leak of leaks) {
      const out = redactWarning(`deepseek:x gagal: upstream said ${leak}`);
      assert.doesNotMatch(out, new RegExp(leak.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  it('tolerates non-array input and empty strings', () => {
    assert.deepEqual(toPublicWarnings(undefined), []);
    assert.deepEqual(toPublicWarnings(['', '  ', 'a dilewati: belum dikonfigurasi']), ['a dilewati: belum dikonfigurasi']);
  });
});
