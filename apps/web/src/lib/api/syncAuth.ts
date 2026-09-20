import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const HEX_256 = /^[0-9a-f]{64}$/;

export function validBackupProof(
  key: string, backupId: string, version: number, blob: string, proof: string
): boolean {
  if (!HEX_256.test(key) || !HEX_256.test(backupId) || !HEX_256.test(proof) ||
      !Number.isSafeInteger(version) || version < 0) return false;
  const digest = createHash('sha256').update(blob).digest('hex');
  const expected = createHmac('sha256', Buffer.from(key, 'hex'))
    .update(`${backupId}\n${version}\n${digest}`).digest();
  return timingSafeEqual(expected, Buffer.from(proof, 'hex'));
}
