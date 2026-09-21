import { Pool, type PoolConfig } from 'pg';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

let pool: Pool | undefined;

/**
 * Attempts to load environment variables from .env.local or .env if DATABASE_URL
 * is not already set in the current process environment.
 */
function ensureEnvLoaded(): void {
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
        } catch {
          // Ignore parse or access issues and continue
        }
      }
    }
  }
}

export const SUPABASE_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`;

/**
 * Builds a safe PoolConfig for PostgreSQL connections.
 * For Supabase and remote managed Postgres instances:
 * - Verifies remote TLS certificates using system trust, explicit CA, or built-in Supabase Root CA
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
  const explicitCa = process.env.DATABASE_CA_FILE
    ? readFileSync(process.env.DATABASE_CA_FILE, 'utf8')
    : process.env.DATABASE_CA_CERT;

  // Supabase's Transaction Pooler uses *.pooler.supabase.com while direct
  // database endpoints use *.supabase.co. Both present chains anchored by
  // the same Supabase root; keep certificate verification enabled in either
  // case rather than accepting an unverified TLS connection.
  const isSupabaseEndpoint = url.hostname.endsWith('.supabase.co') ||
    url.hostname.endsWith('.pooler.supabase.com');
  const ca = explicitCa || (isSupabaseEndpoint ? SUPABASE_ROOT_CA : undefined);

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
