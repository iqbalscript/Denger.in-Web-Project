# Migrations (canonical schema)

This folder is the **canonical** source of the Dengar.in database schema.

- Applied by `npm run db:migrate` (`services/persistence/scripts/migrate.ts`):
  every `*.sql` file, in filename order, on every run. There is no tracking
  table, so **every file must be idempotent** (`IF NOT EXISTS`, no `DROP`).
- Name new files `NNN_description.sql` (next is `005_…`).
- This is what the real-database tests (`npm run test:persistence-pg`) run
  against, so schema changes are written and verified here first.
- Plain PostgreSQL has no `anon`/`authenticated` roles: files here only
  `REVOKE … FROM PUBLIC`. Row Level Security is not enabled here because the
  app connects as the table owner and there is no browser-facing Data API.

## Supabase twin

Every file here has a twin in `supabase/migrations/` (timestamp-named for the
Supabase CLI) with the **same schema statements** plus Supabase-only hardening
(`ENABLE ROW LEVEL SECURITY`, `REVOKE … FROM anon, authenticated`). When adding
a migration, add both files. `tests/persistence/migrations.test.mjs` fails if
the shared schema of a pair drifts.

| Here | Supabase |
| --- | --- |
| `001_init.sql` | `20260920000000_init.sql` |
| `002_secure_sync.sql` | `20260920000001_secure_sync.sql` |
| `003_forum_replies.sql` | `20261014000000_forum_replies.sql` |
| `004_lock_legacy_tables.sql` | `20261014000001_lock_legacy_tables.sql` |

`docs/forum-replies-migration.sql` is the earlier copy-paste version of 003 for
the Supabase SQL Editor; it is safe to have run it already (003 is idempotent).
