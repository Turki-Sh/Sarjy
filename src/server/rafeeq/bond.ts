import "server-only";

// Growing the bond with your Rafeeq (shared/rafeeq.ts). Each kind of moment adds a little, up to a
// daily cap, so the bond grows with use rather than with clicking.

import { eq, sql } from "drizzle-orm";
import { GAINS, type BondEvent } from "@/shared/rafeeq";
import type { Db } from "../db/client";
import { users } from "../db/schema";
import { hit } from "../rateLimit";

/** Adds this moment to the bond if today's cap allows. Returns the bond after it, and what it added. */
export async function growBond(
  db: Db,
  userId: string,
  event: BondEvent,
): Promise<{ points: number; gained: number }> {
  const { points, perDay } = GAINS[event];
  const count = await hit(db, `bond:${userId}:${event}`, 86_400);
  const gained = count * points <= perDay ? points : 0;
  const [row] = gained
    ? await db
        .update(users)
        .set({ rafeeqBond: sql`${users.rafeeqBond} + ${gained}` })
        .where(eq(users.id, userId))
        .returning({ points: users.rafeeqBond })
    : await db.select({ points: users.rafeeqBond }).from(users).where(eq(users.id, userId));
  return { points: row?.points ?? 0, gained };
}
