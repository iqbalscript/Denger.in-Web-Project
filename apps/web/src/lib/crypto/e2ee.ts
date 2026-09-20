/**
 * Client-Side End-to-End Encryption (E2EE) Utility
 * Powered by Web Crypto API (crypto.subtle)
 *
 * Zero-Knowledge Architecture:
 * - The server only ever receives `mnemonicHash` (SHA-256) and `encryptedBlob` (AES-GCM 256).
 * - The server NEVER sees the 12-word recovery mnemonic, the encryption key, or plaintext data.
 */

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Normalizes a 12-word mnemonic (trimmed, lowercase, single-spaced).
 */
export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase().split(/\s+/).join(' ');
}

/**
 * Computes SHA-256 hash of the normalized mnemonic as an opaque lookup key for the server.
 */
export async function hashMnemonic(mnemonic: string): Promise<string> {
  const normalized = normalizeMnemonic(mnemonic);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/** Legacy lookup is retained only for reading backups created before v2. */
export function isModernRecoveryPhrase(mnemonic: string): boolean {
  return /^(?:[0-9a-f]{6} ){11}[0-9a-f]{6}$/.test(normalizeMnemonic(mnemonic));
}

async function deriveSyncBytes(mnemonic: string, purpose: string): Promise<ArrayBuffer> {
  if (!isModernRecoveryPhrase(mnemonic)) throw new Error('Kunci pemulihan baru tidak valid.');
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(normalizeMnemonic(mnemonic)), 'HKDF', false, ['deriveBits']
  );
  return crypto.subtle.deriveBits({
    name: 'HKDF', hash: 'SHA-256',
    salt: new TextEncoder().encode('dengarin-sync-v2'),
    info: new TextEncoder().encode(purpose)
  }, material, 256);
}

export async function deriveSyncCredentials(mnemonic: string): Promise<{ backupId: string; writeKey: string }> {
  const [lookup, write] = await Promise.all([
    deriveSyncBytes(mnemonic, 'lookup'), deriveSyncBytes(mnemonic, 'write')
  ]);
  return { backupId: bufferToHex(lookup), writeKey: bufferToHex(write) };
}

export async function signBackupUpdate(
  writeKey: string, backupId: string, expectedVersion: number, encryptedBlob: string
): Promise<string> {
  const key = await crypto.subtle.importKey('raw', Uint8Array.from(writeKey.match(/../g)!, x => parseInt(x, 16)),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = bufferToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(encryptedBlob)));
  const input = new TextEncoder().encode(`${backupId}\n${expectedVersion}\n${digest}`);
  return bufferToHex(await crypto.subtle.sign('HMAC', key, input));
}

/**
 * Derives an AES-GCM 256-bit key from the 12-word mnemonic using PBKDF2 (100,000 rounds).
 */
async function deriveAesKey(mnemonic: string, salt: Uint8Array): Promise<CryptoKey> {
  const normalized = normalizeMnemonic(mnemonic);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(normalized),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayloadBundle {
  version: 1;
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
}

/**
 * Encrypts arbitrary JSON-serializable data using AES-GCM 256-bit key derived from the mnemonic.
 */
export async function encryptSessionData<T>(data: T, mnemonic: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(mnemonic, salt);

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    plaintext
  );

  const bundle: EncryptedPayloadBundle = {
    version: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer)
  };

  return JSON.stringify(bundle);
}

/**
 * Decrypts an encrypted blob string back into the original data structure.
 * Throws an error if the mnemonic is invalid or the ciphertext has been tampered with.
 */
export async function decryptSessionData<T>(encryptedBlob: string, mnemonic: string): Promise<T> {
  let bundle: EncryptedPayloadBundle;
  try {
    bundle = JSON.parse(encryptedBlob);
  } catch {
    throw new Error('Format data terenkripsi tidak valid.');
  }

  if (bundle.version !== 1 || !bundle.salt || !bundle.iv || !bundle.ciphertext) {
    throw new Error('Skema paket enkripsi tidak dikenali.');
  }

  const salt = base64ToBuffer(bundle.salt);
  const iv = base64ToBuffer(bundle.iv);
  const ciphertext = base64ToBuffer(bundle.ciphertext);

  const key = await deriveAesKey(mnemonic, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error('Gagal mendekripsi data. Kunci pemulihan salah atau data telah rusak.');
  }
}
