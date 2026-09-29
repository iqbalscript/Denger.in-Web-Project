import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatForumDate, formatForumDateTime } from '../../apps/web/src/lib/forumDate.ts';

const original = process.env.TZ;
const AT = '2026-09-29T09:55:00.000Z';

describe('Waktu forum mengikuti zona waktu perangkat', () => {
  afterEach(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });

  it('UTC (render server) tetap sama di zona waktu mana pun', () => {
    for (const tz of ['Asia/Jakarta', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      process.env.TZ = tz;
      assert.equal(formatForumDateTime(AT), '29 Sep, 09:55 UTC');
    }
  });

  it('lokal: WIB (UTC+7) menjadi 16:55 tanpa label UTC', () => {
    process.env.TZ = 'Asia/Jakarta';
    assert.equal(formatForumDateTime(AT, true), '29 Sep, 16:55');
  });

  it('lokal: Pacific (UTC-7) menjadi 02:55', () => {
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(formatForumDateTime(AT, true), '29 Sep, 02:55');
  });

  it('lokal: tanggal ikut bergeser melewati tengah malam', () => {
    process.env.TZ = 'Asia/Jakarta';
    assert.equal(formatForumDateTime('2026-09-29T20:30:00.000Z', true), '30 Sep, 03:30');
    assert.equal(formatForumDate('2026-09-29T20:30:00.000Z', true), '30 Sep');
    assert.equal(formatForumDate('2026-09-29T20:30:00.000Z'), '29 Sep');
    process.env.TZ = 'Pacific/Kiritimati';
    assert.equal(formatForumDateTime('2026-09-29T20:30:00.000Z', true), '30 Sep, 10:30');
  });

  it('timestamp tidak valid menghasilkan string kosong', () => {
    assert.equal(formatForumDateTime('bukan-tanggal', true), '');
    assert.equal(formatForumDate('', false), '');
  });
});
