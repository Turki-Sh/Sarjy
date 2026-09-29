import "server-only";

// The only place secrets are read. Everything is validated once, so a missing key fails loudly
// on deploy instead of quietly at the first request. `server-only` makes the build fail if any
// browser code imports this file.

import { z } from "zod";

const schema = z.object({
  /** fake: deterministic stand-ins (tests, offline work). live: real providers. */
  SARJY_PROVIDERS: z.enum(["fake", "live"]).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  ABLY_API_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
});

const parsed = schema.parse(process.env);

/** Live in production unless told otherwise; fake everywhere else unless told otherwise. */
const providers = parsed.SARJY_PROVIDERS ?? (process.env.NODE_ENV === "production" ? "live" : "fake");

export const env = { ...parsed, providers } as const;

/** What is configured, as booleans only. Safe to show anyone. */
export function configured() {
  return {
    providers,
    groq: Boolean(env.GROQ_API_KEY),
    ably: Boolean(env.ABLY_API_KEY),
    database: Boolean(env.DATABASE_URL),
    session: Boolean(env.SESSION_SECRET),
  };
}
