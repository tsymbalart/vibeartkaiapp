import path from "path";
import { fileURLToPath } from "url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

/**
 * Apply any pending Drizzle migrations on server startup. Safe to call
 * multiple times — drizzle keeps track of applied migrations in its own
 * `__drizzle_migrations` table and skips anything already in place.
 *
 * Resolution:
 * - In dev / test we import this module directly and resolve the
 *   migrations folder relative to `lib/db/migrations`.
 * - In prod the api-server bundles this module via esbuild and we
 *   still resolve against the filesystem path, which is fine as long
 *   as the migrations folder is copied next to the built artifact.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../migrations",
  );
  await migrate(db, { migrationsFolder });
}
