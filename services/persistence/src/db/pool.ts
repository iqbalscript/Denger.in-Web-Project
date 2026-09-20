import { Pool, type PoolConfig } from 'pg';
import { existsSync } from 'node:fs';
import path from 'node:path';

let pool: Pool | undefined;

/**
 * Attempts to load environment variables from .env.local or .env if DATABASE_URL
 * is not already set in the current process environment.
 */
function ensureEnvLoaded(): void {
  if (process.env.DATABASE_URL) return;

  const candidateDirs = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '..', '..'),
    path.resolve(process.cwd(), 'apps', 'web'),
  ];

  for (const dir of candidateDirs) {
    for (const file of ['.env.local', '.env']) {
      const fullPath = path.join(dir, file);
      if (existsSync(fullPath)) {
        try {
          process.loadEnvFile?.(fullPath);
          if (process.env.DATABASE_URL) return;
        } catch {
          // Ignore parse or access issues and continue
        }
      }
    }
  }
}

/**
 * Builds a safe PoolConfig for PostgreSQL connections.
 * For Supabase and remote managed Postgres instances:
 * - Enables SSL with rejectUnauthorized: false (required for Supabase pooler and direct connections)
 * - Sets connection pooling limits suitable for serverless / hosted Supabase instances
 */
export function buildPoolConfig(connectionString: string): PoolConfig {
  const isLocalhost =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1') ||
    connectionString.includes('::1');

  return {
    connectionString,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

/**
 * Lazily-created singleton connection pool, read from DATABASE_URL.
 */
export function getPool(): Pool {
  ensureEnvLoaded();
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL belum dikonfigurasi');
    }
    pool = new Pool(buildPoolConfig(connectionString));
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
  ensureEnvLoaded();
  return typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim().length > 0;
}
