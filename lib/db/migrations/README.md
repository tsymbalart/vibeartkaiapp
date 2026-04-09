# Migrations

Drizzle SQL migrations live here. One file per change, timestamped by
`drizzle-kit generate`.

## Workflow

1. Edit a schema file under `lib/db/src/schema/`.
2. Run `pnpm --filter @workspace/db run generate` — this inspects the
   current DB + the TS schema and writes a new SQL migration into this
   folder alongside a snapshot JSON.
3. Review the generated SQL, commit it.
4. Apply locally with `pnpm --filter @workspace/db run migrate`.
5. On deploy, the api-server calls `runMigrations()` from
   `@workspace/db/migrator` during boot so the production DB picks up
   everything automatically.

## Not using `push` anymore?

`drizzle-kit push` is still wired in `package.json` for throwaway local
work, but **prefer `generate` + `migrate`** for anything that ends up
in main so the migration history is auditable.
