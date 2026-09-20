import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPoolConfig } from '../../services/persistence/src/db/pool.ts';
import ConnectionParameters from 'pg/lib/connection-parameters.js';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
});
