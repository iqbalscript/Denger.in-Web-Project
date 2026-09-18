import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../services/auth/src/password.ts';
import { createSessionToken, verifySessionToken } from '../../services/auth/src/sessionToken.ts';

describe('Password Hashing (@dengarin/auth)', () => {
  it('hashes a password into a salt:hash pair distinct from the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    assert.match(hash, /^[0-9a-f]+:[0-9a-f]+$/);
    assert.notEqual(hash, 'correct horse battery staple');
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('super-secret-password-123');
    assert.equal(await verifyPassword('super-secret-password-123', hash), true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('super-secret-password-123');
    assert.equal(await verifyPassword('wrong-password', hash), false);
  });

  it('produces different hashes for the same password (random salt per call)', async () => {
    const hashA = await hashPassword('same-password');
    const hashB = await hashPassword('same-password');
    assert.notEqual(hashA, hashB);
    assert.equal(await verifyPassword('same-password', hashA), true);
    assert.equal(await verifyPassword('same-password', hashB), true);
  });

  it('rejects malformed stored hashes instead of throwing', async () => {
    assert.equal(await verifyPassword('anything', 'not-a-valid-hash'), false);
    assert.equal(await verifyPassword('anything', ''), false);
  });
});

describe('Admin Session Tokens (@dengarin/auth)', () => {
  const secret = 'test-secret-do-not-use-in-production';

  it('creates a token that verifies back to the same username', () => {
    const token = createSessionToken('admin', secret);
    const payload = verifySessionToken(token, secret);
    assert.ok(payload);
    assert.equal(payload.sub, 'admin');
    assert.ok(payload.exp > payload.iat);
  });

  it('rejects a token verified with the wrong secret', () => {
    const token = createSessionToken('admin', secret);
    assert.equal(verifySessionToken(token, 'a-different-secret'), null);
  });

  it('rejects a tampered payload segment', () => {
    const token = createSessionToken('admin', secret);
    const [payloadSegment, signature] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'attacker', iat: 0, exp: 9_999_999_999 }),
      'utf8'
    ).toString('base64url');
    const tampered = `${tamperedPayload}.${signature}`;
    assert.equal(verifySessionToken(tampered, secret), null);
  });

  it('rejects an expired token', () => {
    const token = createSessionToken('admin', secret, -10); // already expired
    assert.equal(verifySessionToken(token, secret), null);
  });

  it('rejects a malformed token', () => {
    assert.equal(verifySessionToken('not-a-real-token', secret), null);
    assert.equal(verifySessionToken('', secret), null);
    assert.equal(verifySessionToken('a.b.c', secret), null);
  });
});
