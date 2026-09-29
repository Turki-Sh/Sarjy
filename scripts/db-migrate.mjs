// Applies SQL migrations to the Neon database. Runs in the Vercel build before `next build`,
// so a failed migration fails the deploy instead of leaving production half-migrated.
// Without DATABASE_URL (local builds, CI) it does nothing: PGlite migrates itself on start.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

if (!process.env.DATABASE_URL) {
  console.log("db:migrate: no DATABASE_URL, skipping (PGlite migrates itself).");
  process.exit(0);
}

await migrate(drizzle(neon(process.env.DATABASE_URL)), { migrationsFolder: "src/server/db/migrations" });
console.log("db:migrate: done.");
