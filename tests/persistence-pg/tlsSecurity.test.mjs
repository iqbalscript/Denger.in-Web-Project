import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { X509Certificate } from 'node:crypto';
import { buildPoolConfig, SUPABASE_ROOT_CA } from '../../services/persistence/src/db/pool.ts';
import ConnectionParameters from 'pg/lib/connection-parameters.js';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import tls from 'node:tls';

describe('PostgreSQL TLS configuration', () => {
  it('enforces certificate verification for remote hosts in effective pg config', () => {
    const config = buildPoolConfig('postgres://user:pass@db.example.test:5432/app');
    assert.equal(config.ssl.rejectUnauthorized, true);
    assert.equal(new ConnectionParameters(config).ssl.rejectUnauthorized, true);
  });
  it('uses exact loopback host matching and rejects URL TLS overrides', () => {
    assert.equal(buildPoolConfig('postgres://user:pass@localhost:5432/app').ssl, false);
    assert.equal(buildPoolConfig('postgres://localhost:pass@db.example.test:5432/app').ssl.rejectUnauthorized, true);
    assert.throws(() => buildPoolConfig('postgres://user:pass@db.example.test/app?sslmode=no-verify'));
  });
  it('accepts a trusted CA from configuration without disabling verification', () => {
    const previous = process.env.DATABASE_CA_CERT;
    process.env.DATABASE_CA_CERT = 'configured-ca-fixture';
    try {
      const ssl = new ConnectionParameters(buildPoolConfig('postgres://user:pass@db.example.test/app')).ssl;
      assert.equal(ssl.ca, 'configured-ca-fixture');
      assert.equal(ssl.rejectUnauthorized, true);
    } finally {
      if (previous === undefined) delete process.env.DATABASE_CA_CERT;
      else process.env.DATABASE_CA_CERT = previous;
    }
  });
  it('accepts a trusted certificate and rejects an untrusted certificate', async (t) => {
    const probe = spawnSync('openssl', ['version'], { encoding: 'utf8' });
    if (probe.error) return t.skip('OpenSSL unavailable for local TLS fixture');
    const dir = mkdtempSync(path.join(tmpdir(), 'dengarin-tls-'));
    const key = path.join(dir, 'key.pem');
    const cert = path.join(dir, 'cert.pem');
    try {
      const generated = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
        '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=db.example.test',
        '-addext', 'subjectAltName=DNS:db.example.test'], { stdio: 'ignore' });
      assert.equal(generated.status, 0);
      const server = tls.createServer({ key: readFileSync(key), cert: readFileSync(cert) }, socket => socket.end());
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const port = server.address().port;
        const connect = ssl => new Promise((resolve, reject) => {
          const socket = tls.connect({ host: '127.0.0.1', port, ...ssl });
          socket.once('secureConnect', () => { socket.destroy(); resolve(); });
          socket.once('error', reject);
        });
        const verified = buildPoolConfig('postgres://user:pass@db.example.test/app').ssl;
        await connect({ ...verified, ca: readFileSync(cert) });
        await assert.rejects(connect(verified), /self-signed|certificate|verify/i);
      } finally { await new Promise(resolve => server.close(resolve)); }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('restricts the bundled Supabase Root CA to official direct and Transaction Pooler hosts', () => {
    for (const host of [
      'db.twpyaxxydupowpjubdns.supabase.co',
      'aws-0-ap-northeast-1.pooler.supabase.com'
    ]) {
      const supabaseConfig = buildPoolConfig(`postgres://user:pass@${host}:5432/postgres`);
      assert.equal(supabaseConfig.ssl.rejectUnauthorized, true);
      assert.equal(supabaseConfig.ssl.servername, host);
      assert.equal(supabaseConfig.ssl.ca, SUPABASE_ROOT_CA);
      const x509 = new X509Certificate(supabaseConfig.ssl.ca);
      assert.ok(x509.subject.includes('Supabase Root 2021 CA'), 'Must use bundled Supabase Root CA');
    }

    // Lookalike and attacker hosts must NEVER get the bundled CA
    for (const host of [
      'attacker-supabase.co',
      'supabase.co.attacker.test',
      'db.twpyaxxydupowpjubdns.supabase.co.evil.org',
      'evilsupabase.co',
      'db.example.test'
    ]) {
      const config = buildPoolConfig(`postgres://user:pass@${host}:5432/postgres`);
      assert.equal(config.ssl.rejectUnauthorized, true);
      assert.equal(config.ssl.servername, host);
      assert.equal(config.ssl.ca, undefined, `Host ${host} must not receive bundled Supabase CA`);
    }
  });

  it('DATABASE_CA_CERT takes precedence over bundled Supabase CA', () => {
    const previous = process.env.DATABASE_CA_CERT;
    process.env.DATABASE_CA_CERT = 'custom-user-ca-fixture';
    try {
      const config = buildPoolConfig('postgres://user:pass@db.twpyaxxydupowpjubdns.supabase.co:5432/postgres');
      assert.equal(config.ssl.rejectUnauthorized, true);
      assert.equal(config.ssl.ca, 'custom-user-ca-fixture', 'Explicit DATABASE_CA_CERT must take precedence');
    } finally {
      if (previous === undefined) delete process.env.DATABASE_CA_CERT;
      else process.env.DATABASE_CA_CERT = previous;
    }
  });

  it('DATABASE_CA_FILE takes precedence over bundled Supabase CA', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'dengarin-ca-file-'));
    const caFile = path.join(dir, 'custom-ca.pem');
    try {
      writeFileSync(caFile, 'custom-file-ca-fixture', 'utf8');
      const previous = process.env.DATABASE_CA_FILE;
      process.env.DATABASE_CA_FILE = caFile;
      try {
        const config = buildPoolConfig('postgres://user:pass@db.twpyaxxydupowpjubdns.supabase.co:5432/postgres');
        assert.equal(config.ssl.rejectUnauthorized, true);
        assert.equal(config.ssl.ca, 'custom-file-ca-fixture', 'Explicit DATABASE_CA_FILE must take precedence');
      } finally {
        if (previous === undefined) delete process.env.DATABASE_CA_FILE;
        else process.env.DATABASE_CA_FILE = previous;
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a certificate valid for another hostname (hostname verification)', async (t) => {
    const probe = spawnSync('openssl', ['version'], { encoding: 'utf8' });
    if (probe.error) return t.skip('OpenSSL unavailable for local TLS fixture');
    const dir = mkdtempSync(path.join(tmpdir(), 'dengarin-tls-mismatch-'));
    const key = path.join(dir, 'key.pem');
    const cert = path.join(dir, 'cert.pem');
    try {
      // Cert is issued for 'another.host.test', not 'db.example.test'
      const generated = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
        '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=another.host.test',
        '-addext', 'subjectAltName=DNS:another.host.test'], { stdio: 'ignore' });
      assert.equal(generated.status, 0);
      const server = tls.createServer({ key: readFileSync(key), cert: readFileSync(cert) }, socket => socket.end());
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const port = server.address().port;
        const connect = ssl => new Promise((resolve, reject) => {
          const socket = tls.connect({ host: '127.0.0.1', port, ...ssl });
          socket.once('secureConnect', () => { socket.destroy(); resolve(); });
          socket.once('error', reject);
        });
        // We configure connection for 'db.example.test' but trust the cert's CA
        const verified = buildPoolConfig('postgres://user:pass@db.example.test/app').ssl;
        // Even with the cert provided as CA, hostname mismatch must fail
        await assert.rejects(
          connect({ ...verified, ca: readFileSync(cert) }),
          /altname|hostname|does not match|ERR_TLS_CERT_ALTNAME_INVALID/i
        );
      } finally { await new Promise(resolve => server.close(resolve)); }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
