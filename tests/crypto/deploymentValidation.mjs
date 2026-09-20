// Explicit live-deployment validation. Requires DATABASE_URL and DATABASE_CA_FILE.
// Creates only random, temporary backup records and removes them afterward.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { buildPoolConfig } from '../../services/persistence/src/db/pool.ts';
import { generateRecoveryMnemonic } from '../../apps/web/src/lib/storage.ts';
import { deriveSyncCredentials, signBackupUpdate, encryptSessionData,
  decryptSessionData, hashMnemonic } from '../../apps/web/src/lib/crypto/e2ee.ts';

if (!process.env.DATABASE_URL || !process.env.DATABASE_CA_FILE) {
  throw new Error('Live validation requires explicit DATABASE_URL and DATABASE_CA_FILE.');
}

const port = await new Promise((resolve, reject) => {
  const listener = createServer();
  listener.once('error', reject);
  listener.listen(0, '127.0.0.1', () => {
    const selected = listener.address().port;
    listener.close(() => resolve(selected));
  });
});
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', 'apps/web', '-p', String(port)],
  { cwd: new URL('../..', import.meta.url), env: process.env, stdio: 'ignore', windowsHide: true });
const pool = new Pool(buildPoolConfig(process.env.DATABASE_URL));
let backupId;
let legacyHash;

try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error('App server exited before readiness.');
    try {
      const health = await fetch(`${base}/api/health`);
      if (health.ok) { ready = true; break; }
    } catch { /* server is starting */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.equal(ready, true, 'App server did not become ready.');

  const phrase = generateRecoveryMnemonic();
  ({ backupId } = await deriveSyncCredentials(phrase));
  const { writeKey } = await deriveSyncCredentials(phrase);
  assert.equal((await pool.query('SELECT 1 FROM synced_sessions_v2 WHERE backup_id=$1', [backupId])).rowCount, 0);
  const payload = { session: { recoveryMnemonic: phrase, userId: 'deployment-test' },
    checkins: [], journals: [{ content: 'temporary test entry' }] };
  const blob1 = await encryptSessionData(payload, phrase);
  const put = body => fetch(`${base}/api/sync`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  assert.equal((await put({ backupId, encryptedBlob: blob1, expectedVersion: 0 })).status, 400);
  const proof1 = await signBackupUpdate(writeKey, backupId, 0, blob1);
  assert.equal((await put({ backupId, encryptedBlob: blob1, expectedVersion: 0, writeProof: proof1,
    writeKey })).status, 200);
  let get = await fetch(`${base}/api/sync?backupId=${backupId}`, { cache: 'no-store' });
  assert.equal(get.status, 200);
  let record = (await get.json()).data.record;
  assert.equal(record.version, 1);
  assert.equal(Object.hasOwn(record, 'writeKey'), false);
  assert.deepEqual(await decryptSessionData(record.encryptedBlob, phrase), payload);
  assert.equal((await put({ backupId, encryptedBlob: blob1, expectedVersion: 1,
    writeProof: backupId })).status, 403);

  const blob2 = await encryptSessionData({ ...payload, backupAt: 'updated' }, phrase);
  const proof2 = await signBackupUpdate(writeKey, backupId, 1, blob2);
  assert.equal((await put({ backupId, encryptedBlob: blob2, expectedVersion: 1,
    writeProof: proof2 })).status, 200);
  assert.equal((await put({ backupId, encryptedBlob: blob1, expectedVersion: 1,
    writeProof: await signBackupUpdate(writeKey, backupId, 1, blob1) })).status, 409);
  get = await fetch(`${base}/api/sync?backupId=${backupId}`, { cache: 'no-store' });
  record = (await get.json()).data.record;
  assert.equal(record.version, 2);
  assert.equal((await decryptSessionData(record.encryptedBlob, phrase)).backupAt, 'updated');
  console.log('V2_CREATE_UPDATE_RESTORE_PASS');

  const words = ['samudra', 'lentera', 'harmoni', 'fajar', 'damai', 'teduh', 'kelana', 'mentari',
    'rimba', 'saujana', 'hening', 'aksara', 'melati', 'swara', 'embun', 'cakrawala'];
  const legacyPhrase = Array.from(randomBytes(12), b => words[b % words.length]).join(' ');
  legacyHash = await hashMnemonic(legacyPhrase);
  assert.equal((await pool.query('SELECT 1 FROM synced_sessions WHERE mnemonic_hash=$1', [legacyHash])).rowCount, 0);
  const legacyBlob = await encryptSessionData({ legacy: true }, legacyPhrase);
  await pool.query('INSERT INTO synced_sessions (mnemonic_hash,encrypted_blob) VALUES ($1,$2)',
    [legacyHash, legacyBlob]);
  const old = await fetch(`${base}/api/sync?mnemonicHash=${legacyHash}`, { cache: 'no-store' });
  assert.equal(old.status, 200);
  assert.deepEqual(await decryptSessionData((await old.json()).data.record.encryptedBlob,
    legacyPhrase), { legacy: true });
  assert.notEqual((await put({ mnemonicHash: legacyHash, encryptedBlob: 'overwrite' })).status, 200);
  console.log('LEGACY_RESTORE_READ_ONLY_PASS');
} finally {
  if (backupId) await pool.query('DELETE FROM synced_sessions_v2 WHERE backup_id=$1', [backupId]);
  if (legacyHash) await pool.query('DELETE FROM synced_sessions WHERE mnemonic_hash=$1', [legacyHash]);
  await pool.end();
  server.kill();
}
