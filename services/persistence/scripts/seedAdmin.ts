import { hashPassword } from '../../auth/src/index.ts';
import { createAdminRepository } from '../src/factory.ts';
import { closePool, isDatabaseConfigured } from '../src/db/pool.ts';

/**
 * Idempotently creates (or confirms) the first admin/moderator account.
 * Reads ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD from the environment —
 * there is deliberately no HTTP signup endpoint for admin accounts (this is
 * an operator account, not part of the anonymous end-user product surface).
 *
 * Usage: DATABASE_URL=postgres://... ADMIN_SEED_USERNAME=admin \
 *        ADMIN_SEED_PASSWORD=change-me npm run db:seed-admin
 */
async function main(): Promise<void> {
  const username = process.env.ADMIN_SEED_USERNAME;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!username || !password) {
    throw new Error('ADMIN_SEED_USERNAME dan ADMIN_SEED_PASSWORD wajib diisi di environment');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_SEED_PASSWORD harus minimal 12 karakter');
  }
  if (!isDatabaseConfigured()) {
    console.warn('DATABASE_URL belum diset — admin akan dibuat di repository in-memory (hilang saat proses berhenti).');
  }

  const adminRepository = createAdminRepository();
  const existing = await adminRepository.findByUsername(username);
  if (existing) {
    console.log(`Admin "${username}" sudah ada (id: ${existing.id}). Tidak ada perubahan.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const created = await adminRepository.create({ username, passwordHash });
  console.log(`Admin "${created.username}" berhasil dibuat (id: ${created.id}).`);
}

main()
  .catch((error) => {
    console.error('Gagal membuat admin:', error);
    process.exitCode = 1;
  })
  .finally(() => closePool());
