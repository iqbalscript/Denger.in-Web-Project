import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { moderateForumPost } from '../../services/validator/src/contentModerator.ts';

describe('Forum Automated Content Moderation Engine', () => {
  it('approves a clean, constructive story about campus pressure', () => {
    const result = moderateForumPost({
      title: 'Perjalanan panjang menyelesaikan skripsi bab 4',
      body: 'Rasanya lelah sekali bolak-balik revisi data penelitian dengan dosen pembimbing, tapi hari ini akhirnya selesai satu bab penting.',
      domain: 'campus'
    });

    assert.equal(result.status, 'approved');
    assert.ok(result.safetyScore >= 90);
    assert.ok(result.tags.includes('campus'));
    assert.ok(result.tags.includes('akademik'));
  });

  it('rejects submissions with titles that are too short', () => {
    const result = moderateForumPost({
      title: 'Hai',
      body: 'Ini cerita yang cukup panjang untuk diuji coba di sistem.',
      domain: 'work'
    });

    assert.equal(result.status, 'rejected');
    assert.match(result.reason, /judul/i);
  });

  it('rejects submissions with bodies that are too short', () => {
    const result = moderateForumPost({
      title: 'Sedang Merasa Lelah',
      body: 'Capek banget.',
      domain: 'general'
    });

    assert.equal(result.status, 'rejected');
    assert.match(result.reason, /cerita terlalu singkat/i);
  });

  it('rejects gambling, slot, and predatory scam promotion', () => {
    const gamblingResult = moderateForumPost({
      title: 'Cari hiburan malam ini',
      body: 'Main slot gacor maxwin zeus gacor gampang menang langsung daftar di sini kawan.',
      domain: 'finance'
    });
    assert.equal(gamblingResult.status, 'rejected');

    const scamResult = moderateForumPost({
      title: 'Solusi dana cepat tanpa ribet',
      body: 'Butuh dana cepat hubungi wa 0812345678 pinjol langsung cair tanpa jaminan aman terpercaya.',
      domain: 'finance'
    });
    assert.equal(scamResult.status, 'rejected');
  });

  it('rejects toxic insults and hate speech', () => {
    const result = moderateForumPost({
      title: 'Dasar kalian semua',
      body: 'Orang tua dan bos di kantor goblok banget anjing lu semua bikin hidup gue rusak.',
      domain: 'work'
    });

    assert.equal(result.status, 'rejected');
    assert.match(result.reason, /ujaran kebencian|promosi terlarang/i);
  });

  it('flags submissions with external contact links or sensitive distress for manual review', () => {
    const result = moderateForumPost({
      title: 'Mencari teman diskusi tentang karir',
      body: 'Jika ada yang mengalami hal yang sama silakan kontak saya via https://t.me/anonimdiskusi untuk ngobrol santai.',
      domain: 'work'
    });

    assert.equal(result.status, 'pending_review');
    assert.ok(result.safetyScore < 90);
  });

  it('correctly categorizes finance and sandwich generation tags', () => {
    const result = moderateForumPost({
      title: 'Belajar membagi gaji untuk adik dan orang tua',
      body: 'Menjadi generasi sandwich memang menantang, tiap bulan harus memikirkan cicilan hutang dan biaya sekolah adik.',
      domain: 'finance'
    });

    assert.equal(result.status, 'approved');
    assert.ok(result.tags.includes('finansial'));
  });
});
