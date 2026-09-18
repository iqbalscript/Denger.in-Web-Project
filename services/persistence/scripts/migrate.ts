import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getPool, closePool } from '../src/db/pool.ts';

/**
 * Runs every .sql file in services/persistence/migrations, in filename
 * order, against DATABASE_URL. Each file is expected to be idempotent
 * (CREATE TABLE IF NOT EXISTS, etc.) — there is no migration-tracking table
 * yet; this is a skeleton runner, not a full migration framework.
 *
 * Usage: DATABASE_URL=postgres://... npm run db:migrate
 */
async function main(): Promise<void> {
  const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log('Tidak ada file migrasi ditemukan di', migrationsDir);
    return;
  }

  const pool = getPool();
  try {
    for (const file of files) {
      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      console.log(`Menjalankan migrasi: ${file}`);
      await pool.query(sql);
    }
    console.log(`Selesai. ${files.length} file migrasi dijalankan.`);
  } finally {
    await closePool();
  }
}

main().catch((error) => {
  console.error('Migrasi gagal:', error);
  process.exitCode = 1;
});
