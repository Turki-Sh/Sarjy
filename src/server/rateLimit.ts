import "server-only";

// Fixed-window rate limits stored in Postgres, so they hold across serverless instances.
// Limits protect the provider quota on a public URL (architecture, section 19).

import { sql } from "drizzle-orm";
import type { Db } from "./db/client";

export const LIMITS = {
  userPerMinute: 10,
  userPerDay: 200,
  ipPerDay: 400,
} as const;

/** Counts one hit against `key` in a window of `seconds`. Returns the count after this hit. */
export async function hit(db: Db, key: string, seconds: number): Promise<number> {
  const result = await db.execute<{ count: number }>(sql`
    insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${seconds}) then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${seconds}) then now() else rate_limits.window_start end
    returning count
  `);
  const rows = (Array.isArray(result) ? result : (result as { rows: { count: number }[] }).rows) as {
    count: number;
  }[];
  return Number(rows[0]?.count ?? 1);
}

/** True when this turn is allowed. */
export async function allowTurn(db: Db, userId: string, ipHash: string): Promise<boolean> {
  const [minute, day, ip] = await Promise.all([
    hit(db, `user:${userId}:minute`, 60),
    hit(db, `user:${userId}:day`, 86_400),
    hit(db, `ip:${ipHash}:day`, 86_400),
  ]);
  return minute <= LIMITS.userPerMinute && day <= LIMITS.userPerDay && ip <= LIMITS.ipPerDay;
}
