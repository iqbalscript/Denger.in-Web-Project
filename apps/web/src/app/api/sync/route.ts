import type { NextRequest } from 'next/server';
import { syncRepository } from '@/lib/api/repositories';
import { jsonError, jsonOk } from '@/lib/api/response';

/**
 * Encrypted cross-device sync skeleton (README Roadmap — "Opsi sinkronisasi
 * antarperangkat terenkripsi menggunakan frasa 12-kata"). The server only
 * ever stores an opaque, client-encrypted blob keyed by a hash of the
 * recovery mnemonic — it never sees the mnemonic itself or plaintext session
 * data. TODO(Sprint 2+): real end-to-end encryption is implemented
 * client-side; this route only demonstrates the storage contract.
 */
export async function GET(request: NextRequest) {
  const mnemonicHash = request.nextUrl.searchParams.get('mnemonicHash');
  if (!mnemonicHash) {
    return jsonError('Query parameter "mnemonicHash" wajib diisi.');
  }

  const record = await syncRepository.get(mnemonicHash);
  if (!record) {
    return jsonError('Tidak ada data tersinkronisasi untuk mnemonic ini.', 404);
  }

  return jsonOk({ record });
}

interface SyncPutBody {
  mnemonicHash?: string;
  encryptedBlob?: string;
}

export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SyncPutBody | null;
  if (!body || !body.mnemonicHash || !body.encryptedBlob) {
    return jsonError('Properti "mnemonicHash" dan "encryptedBlob" wajib diisi.');
  }

  const record = await syncRepository.upsert({
    mnemonicHash: body.mnemonicHash,
    encryptedBlob: body.encryptedBlob,
    updatedAt: new Date().toISOString()
  });

  return jsonOk({ record });
}
