import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Minimal stateless, signed session token for the admin operator dashboard
 * (login -> httpOnly cookie -> verified on every admin request). Deliberately
 * NOT the full JWT spec (no alg negotiation, no external `jsonwebtoken`
 * dependency) — just a compact HMAC-SHA256-signed JSON payload, which is all
 * a single-issuer, single-audience admin session needs.
 *
 * Format: base64url(json payload) + "." + base64url(hmac-sha256 signature)
 */

export interface AdminSessionPayload {
  sub: string; // admin username
  iat: number; // issued-at, unix seconds
  exp: number; // expiry, unix seconds
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(payloadSegment: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadSegment).digest('base64url');
}

export function createSessionToken(
  username: string,
  secret: string,
  ttlSeconds = 60 * 60 * 8 // 8 hours
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = { sub: username, iat: now, exp: now + ttlSeconds };
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadSegment, secret);
  return `${payloadSegment}.${signature}`;
}

export function verifySessionToken(token: string, secret: string): AdminSessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [payloadSegment, signature] = parts;

  const expectedSignature = sign(payloadSegment, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: AdminSessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadSegment)) as AdminSessionPayload;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) {
    return null;
  }

  return payload;
}
