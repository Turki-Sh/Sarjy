import { defineConfig } from "drizzle-kit";

// Generates SQL migrations from src/server/db/schema.ts: pnpm db:generate
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
});
