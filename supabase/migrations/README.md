# Supabase migrations (derived)

The **canonical** schema lives in `services/persistence/migrations/` (applied
by `npm run db:migrate` and verified by `npm run test:persistence-pg`). This
folder is its Supabase twin, applied with `npm run supabase:db:push`.

Why two trees: the Supabase CLI needs timestamp-named files and tracks what it
has applied, and Supabase exposes the `public` schema to browsers through the
Data API roles `anon`/`authenticated`. Those roles do not exist on plain
PostgreSQL, so the hardening below cannot live in the canonical tree.

Rules:

- Each file contains the same schema statements as its canonical pair, plus
  Supabase-only hardening: `ALTER TABLE … ENABLE ROW LEVEL SECURITY` and
  `REVOKE ALL … FROM PUBLIC` / `FROM anon, authenticated` for every table.
  All access goes through the Next.js server, never directly from browsers.
- Keep files idempotent (`IF NOT EXISTS`) so projects where SQL was pasted by
  hand (e.g. `docs/forum-replies-migration.sql`) still push cleanly.
- New files need a timestamp later than the last one applied remotely.
- `tests/persistence/migrations.test.mjs` checks the pairing and the shared
  schema. The pairing table is in `services/persistence/migrations/README.md`.

The Supabase CLI skips this README with a "Skipping migration" notice.
