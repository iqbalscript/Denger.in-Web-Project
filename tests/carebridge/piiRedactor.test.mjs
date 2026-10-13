import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { containsPii, detectPii, redactPii } from '../../services/validator/src/piiRedactor.ts';

// All values below are synthetic test data, not real people or accounts.

function kinds(text) {
  return detectPii(text).map((finding) => finding.kind);
}

function assertOffsetsMatch(text) {
  for (const finding of detectPii(text)) {
    assert.equal(text.slice(finding.start, finding.end), finding.match, `offset mismatch for ${finding.kind}`);
  }
}

describe('PII detection and redaction (AMD-06)', () => {
  describe('each kind is detected and replaced', () => {
    const cases = [
      ['email', 'Kirim ke contoh@contoh.id ya.', 'Kirim ke [EMAIL] ya.'],
      ['phone', 'WA aku di 0812-0000-1234 kapan saja.', 'WA aku di [NOMOR_TELEPON] kapan saja.'],
      ['phone', 'Nomorku +62 812 0000 1234.', 'Nomorku [NOMOR_TELEPON].'],
      ['phone', 'Hubungi 6281200001234 kalau sempat.', 'Hubungi [NOMOR_TELEPON] kalau sempat.'],
      ['phone', 'telp 0812.0000.1234', 'telp [NOMOR_TELEPON]'],
      ['nik', 'NIK-ku 3273000000000001 hilang.', 'NIK-ku [NIK] hilang.'],
      ['card', 'Kartuku 4111 1111 1111 1111 diblokir.', 'Kartuku [NOMOR_KARTU] diblokir.'],
      ['url', 'Lihat https://contoh.id/profil/abc, isinya lengkap.', 'Lihat [TAUTAN], isinya lengkap.'],
      ['url', 'Buka www.contoh.com.', 'Buka [TAUTAN].'],
      ['handle', 'Follow @akun_contoh di IG.', 'Follow [AKUN_MEDSOS] di IG.'],
      ['address_hint', 'Rumahku di Jl. Melati No. 12, dekat pasar.', 'Rumahku di [ALAMAT], dekat pasar.'],
      ['address_hint', 'aku tinggal di jl. mawar indah no 7b sekarang', 'aku tinggal di [ALAMAT] sekarang'],
      ['address_hint', 'Di RT 03/RW 05 ramai sekali.', 'Di [ALAMAT] ramai sekali.'],
      ['address_hint', 'Pindah ke Kec. Sukamaju bulan lalu.', 'Pindah ke [ALAMAT] bulan lalu.'],
      ['person_name_hint', 'Halo, namaku Rara Contoh dan aku capek.', 'Halo, namaku [NAMA] dan aku capek.'],
      ['person_name_hint', 'Nama saya Bima, mahasiswa.', 'Nama saya [NAMA], mahasiswa.'],
      ['person_name_hint', 'Jadi aku Sekar dari kampus tadi.', 'Jadi aku [NAMA] dari kampus tadi.'],
    ];

    for (const [kind, input, expected] of cases) {
      it(`${kind}: ${expected}`, () => {
        assert.deepEqual(kinds(input), [kind]);
        assert.equal(redactPii(input).text, expected);
        assertOffsetsMatch(input);
      });
    }
  });

  it('Case D: synthetic phone + email redacted, stress complaint preserved', () => {
    const input =
      'Aku stres banget soal kerjaan dan susah tidur. Kalau perlu hubungi aku di 0812-0000-1234 atau contoh@contoh.id.';
    const findings = detectPii(input);
    assert.deepEqual(findings.map((f) => f.kind), ['phone', 'email']);

    const { text } = redactPii(input);
    assert.equal(
      text,
      'Aku stres banget soal kerjaan dan susah tidur. Kalau perlu hubungi aku di [NOMOR_TELEPON] atau [EMAIL].'
    );
    assert.ok(text.includes('stres banget soal kerjaan dan susah tidur'));
    assert.ok(!text.includes('0812'));
    assert.ok(!text.includes('contoh@'));
  });

  describe('false positives are not flagged', () => {
    const benign = [
      'Sudah 3 bulan aku merasa begini.',
      'Tadi jam 2 pagi aku masih bangun.',
      'Sejak 2024 sampai 2026 rasanya berat.',
      'Aku sempat telepon 119 ext 8 minggu lalu.',
      'Nilaiku turun 40% dan aku cemas.',
      'Tidurku cuma 4 jam, kadang 5 jam.',
      'Ada 12 tugas dan 3 ujian minggu depan.',
      'Aku jalan kaki 30 menit tiap hari.',
      'Aku ke jalan raya tadi sore.',
      'Aku Senang hari ini.',
      'Kalau deadline berdekatan, aku sulit fokus.',
      'Utangku 2.500.000 rupiah.',
      'Kamar nomor 14, lantai 3.',
      'Email kantor penuh dan aku kewalahan.',
    ];
    for (const input of benign) {
      it(input, () => {
        assert.deepEqual(detectPii(input), []);
        assert.equal(containsPii(input), false);
        assert.equal(redactPii(input).text, input);
      });
    }
  });

  it('a 16-digit number that is not grouped is treated as NIK, a Luhn-failing grouped number is ignored', () => {
    assert.deepEqual(kinds('ini 3273000000000001'), ['nik']);
    assert.deepEqual(kinds('kode 1234 5678 9012 3456'), []);
  });

  it('partial acceptance only redacts chosen findings', () => {
    const input = 'Namaku Rara, emailku contoh@contoh.id, nomorku 0812-0000-1234.';
    const findings = detectPii(input);
    assert.deepEqual(findings.map((f) => f.kind), ['person_name_hint', 'email', 'phone']);

    const onlyEmail = findings.filter((f) => f.kind === 'email');
    const { text, findings: applied } = redactPii(input, onlyEmail);
    assert.equal(text, 'Namaku Rara, emailku [EMAIL], nomorku 0812-0000-1234.');
    assert.deepEqual(applied.map((f) => f.kind), ['email']);

    assert.equal(redactPii(input, []).text, input);
  });

  it('stale findings that no longer match the text are skipped', () => {
    const input = 'Hubungi contoh@contoh.id.';
    const [finding] = detectPii(input);
    const { text, findings } = redactPii('Hubungi teman@contoh.id.', [finding]);
    assert.equal(text, 'Hubungi teman@contoh.id.');
    assert.deepEqual(findings, []);
  });

  it('findings are sorted, non-overlapping, and offsets refer to the original text', () => {
    const input =
      'Halo, nama saya Bima. Email bima@contoh.id, IG @bima_contoh, rumah Jl. Kenanga No. 3, HP +62 812 0000 1234, situs https://contoh.id.';
    const findings = detectPii(input);
    for (let i = 1; i < findings.length; i += 1) {
      assert.ok(findings[i - 1].end <= findings[i].start, 'findings overlap or are unsorted');
    }
    assertOffsetsMatch(input);
    assert.deepEqual(
      findings.map((f) => f.kind),
      ['person_name_hint', 'email', 'handle', 'address_hint', 'phone', 'url']
    );
  });

  it('is idempotent: redacted text has nothing left to find', () => {
    const inputs = [
      'Namaku Rara Contoh, 0812-0000-1234, contoh@contoh.id, @akun_contoh, Jl. Melati No. 12, RT 03/RW 05, NIK 3273000000000001, kartu 4111 1111 1111 1111, https://contoh.id/x',
    ];
    for (const input of inputs) {
      const once = redactPii(input).text;
      assert.deepEqual(detectPii(once), []);
      assert.equal(redactPii(once).text, once);
    }
  });
});
