import { Pool } from 'pg';

let pool: Pool | undefined;

/**
 * Lazily-created singleton connection pool, read from DATABASE_URL.
 * TODO(Sprint 2+): tune pool size / SSL options for the target deployment
 * (e.g. `ssl: { rejectUnauthorized: false }` is commonly required by managed
 * Postgres providers behind a proxy).
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL belum dikonfigurasi');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

/** For tests/scripts that need a clean shutdown instead of leaking the pool. */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export function isDatabaseConfigured(): boolean {
  return typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim().length > 0;
}
