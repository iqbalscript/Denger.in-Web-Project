import { Pool, type PoolConfig } from 'pg';
import { existsSync, readFileSync } from 'node:fs';
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
 * - Verifies remote TLS certificates using system trust or an explicitly supplied CA
 * - Sets connection pooling limits suitable for serverless / hosted Supabase instances
 */
export function buildPoolConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  // pg may let connection-string SSL parameters override the explicit config.
  for (const name of ['sslmode', 'ssl', 'sslcert', 'sslkey', 'sslrootcert']) {
    if (url.searchParams.has(name)) throw new Error('Atur TLS database melalui konfigurasi server, bukan URL.');
  }
  if (process.env.DATABASE_CA_CERT && process.env.DATABASE_CA_FILE) {
    throw new Error('Pilih satu sumber CA database.');
  }
  const ca = process.env.DATABASE_CA_FILE
    ? readFileSync(process.env.DATABASE_CA_FILE, 'utf8')
    : process.env.DATABASE_CA_CERT;

  return {
    connectionString,
    ssl: isLocalhost ? false : {
      rejectUnauthorized: true,
      servername: url.hostname,
      ...(ca ? { ca } : {})
    },
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
