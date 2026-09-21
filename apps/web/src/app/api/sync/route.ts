import type { NextRequest } from 'next/server';
import { syncRepository } from '@/lib/api/repositories';
import { jsonError, jsonOk } from '@/lib/api/response';
import { HEX_256, validBackupProof } from '@/lib/api/syncAuth';
import { isRateLimited } from '@/lib/api/rateLimit';
import { readJsonLimited } from '@/lib/api/requestLimits';

/**
 * Encrypted cross-device sync skeleton (README Roadmap — "Opsi sinkronisasi
 * antarperangkat terenkripsi menggunakan frasa 12-kata"). The server only
 * ever stores an opaque, client-encrypted blob keyed by a hash of the
 * recovery mnemonic — it never sees the mnemonic itself or plaintext session
 * data. TODO(Sprint 2+): real end-to-end encryption is implemented
 * client-side; this route only demonstrates the storage contract.
 */
export async function GET(request: NextRequest) {
  if (await isRateLimited('sync-read')) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
  const backupId = request.nextUrl.searchParams.get('backupId');
  if (backupId) {
    if (!HEX_256.test(backupId)) return jsonError('backupId tidak valid.');
    const record = await syncRepository.getSecure(backupId);
    if (!record) return jsonError('Cadangan tidak ditemukan.', 404);
    return jsonOk({ record: { backupId, encryptedBlob: record.encryptedBlob,
      version: record.version, updatedAt: record.updatedAt } });
  }
  const mnemonicHash = request.nextUrl.searchParams.get('mnemonicHash');
  if (!mnemonicHash || mnemonicHash.length > 128) {
    return jsonError('Query parameter "mnemonicHash" wajib diisi.');
  }

  const record = await syncRepository.get(mnemonicHash);
  if (!record) {
    return jsonError('Tidak ada data tersinkronisasi untuk mnemonic ini.', 404);
  }

  return jsonOk({ record });
}

interface SyncPutBody {
  backupId?: string;
  encryptedBlob?: string;
  expectedVersion?: number;
  writeProof?: string;
  writeKey?: string;
}

export async function PUT(request: NextRequest) {
  if (await isRateLimited('sync-write')) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
  const parsed = await readJsonLimited(request, 4 * 1024 * 1024);
  if (!parsed.ok) return jsonError('Permintaan tidak valid atau terlalu besar.', parsed.status);
  const body = parsed.value as SyncPutBody | null;
  if (!body || !body.backupId || !HEX_256.test(body.backupId) ||
      typeof body.encryptedBlob !== 'string' || !body.encryptedBlob ||
      !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion! < 0 ||
      typeof body.writeProof !== 'string') {
    return jsonError('Permintaan cadangan tidak valid.');
  }
  const expectedVersion = body.expectedVersion as number;
  const current = await syncRepository.getSecure(body.backupId);
  if (!current && expectedVersion !== 0) return jsonError('Cadangan tidak ditemukan.', 404);
  if (current && current.version !== expectedVersion) return jsonError('Versi cadangan sudah berubah.', 409);
  const key = current?.writeKey ?? body.writeKey;
  if (!key || !validBackupProof(key, body.backupId, expectedVersion, body.encryptedBlob, body.writeProof)) {
    return jsonError('Otorisasi cadangan gagal.', 403);
  }
  const record = { backupId: body.backupId, encryptedBlob: body.encryptedBlob,
    writeKey: key, version: expectedVersion + 1, updatedAt: new Date().toISOString() };
  const saved = current
    ? await syncRepository.updateSecure(record, expectedVersion)
    : await syncRepository.createSecure(record);
  if (!saved) return jsonError('Versi cadangan sudah berubah.', 409);
  return jsonOk({ record: { backupId: record.backupId, encryptedBlob: record.encryptedBlob,
    version: record.version, updatedAt: record.updatedAt } });
}
