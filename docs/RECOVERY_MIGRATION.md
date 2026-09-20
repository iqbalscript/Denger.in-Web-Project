# Legacy recovery to secure sync v2

The v2 migration adds `synced_sessions_v2` without changing or deleting the
legacy `synced_sessions` table. Apply the additive migration before deploying
the new API code. The v2 table has RLS enabled and no `anon` or
`authenticated` table access in the Supabase migration.

An existing 12-word recovery phrase can still look up and decrypt its legacy
backup. Legacy backups are read-only through the HTTP API. When a user with a
legacy phrase selects **Cadangkan Sekarang**, the browser generates a new
288-bit, 12-part recovery key, encrypts a new backup with it, and changes the
locally displayed key only after the v2 backup succeeds. The user must save
that newly displayed key to restore subsequent backups. A failed backup leaves
the old local key unchanged.

The old cloud copy remains available under the old phrase. It cannot be
securely deleted on proof of ownership: the legacy table stored only a fast
hash, which is itself the public read identifier, and no independent write or
delete verifier. Deleting by that identifier would let any holder of it erase
another person's backup; asking for the phrase server-side would break the
existing zero-knowledge promise. Operators must therefore treat legacy copies
as retaining the original low-entropy risk. Do not claim that rotation erases
or strengthens an existing legacy copy.

For remote PostgreSQL, supply the project's trusted CA via `DATABASE_CA_FILE`
or `DATABASE_CA_CERT`. Keep certificate and hostname verification enabled.
Supabase documents obtaining the CA from the project's Database Settings.
