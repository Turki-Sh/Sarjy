import "server-only";

// One database interface, two engines:
//   production: Neon Postgres over HTTP (DATABASE_URL is set by the Vercel integration)
//   development and tests: PGlite, real Postgres compiled to WebAssembly, running in-process
// The same SQL migrations run on both, so what is tested is what ships.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { env } from "../env";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = join(process.cwd(), "src/server/db/migrations");

/** A fresh in-memory database with every migration applied. Each test gets its own. */
export async function createTestDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}

async function connect(): Promise<Db> {
  if (env.DATABASE_URL) {
    // Migrations run at build time on Vercel (scripts/db-migrate.mjs), not per request.
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle(neon(env.DATABASE_URL), { schema }) as unknown as Db;
  }
  // Local development: a PGlite database kept on disk in .data/ (git-ignored), migrated on start.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  const db = drizzle(new PGlite(join(process.cwd(), ".data/pglite")), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}

// Kept on globalThis so hot reloads in development reuse one connection.
const holder = globalThis as unknown as { __sarjyDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  holder.__sarjyDb ??= connect();
  return holder.__sarjyDb;
}

/** Lets tests swap in their own database. */
export function setDbForTests(db: Db) {
  holder.__sarjyDb = Promise.resolve(db);
}
