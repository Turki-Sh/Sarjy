import "server-only";

// Growing the bond with your Rafeeq (shared/rafeeq.ts). Each companion has its own bond (Turki,
// Day 3), and the moment goes to the one you have now. Each kind of moment adds a little, up to a
// daily cap for you (not per companion, so switching around doesn't farm it).

import { and, eq, sql } from "drizzle-orm";
import { GAINS, isRafeeq, type BondEvent, type RafeeqId } from "@/shared/rafeeq";
import type { Db } from "../db/client";
import { rafeeqBonds, users } from "../db/schema";
import { hit } from "../rateLimit";

/** Every companion's bond for this user, by id (those never grown are absent: 0). */
export async function bondsOf(db: Db, userId: string): Promise<Partial<Record<RafeeqId, number>>> {
  const rows = await db.select().from(rafeeqBonds).where(eq(rafeeqBonds.userId, userId));
  return Object.fromEntries(rows.filter((r) => isRafeeq(r.rafeeq)).map((r) => [r.rafeeq, r.points]));
}

/**
 * Adds this moment to the bond with your current Rafeeq, if today's cap allows. Returns which
 * companion, its bond after, and what it added. With no Rafeeq picked, nothing grows.
 */
export async function growBond(
  db: Db,
  userId: string,
  event: BondEvent,
): Promise<{ rafeeq: RafeeqId | null; points: number; gained: number }> {
  const [user] = await db.select({ rafeeq: users.rafeeq }).from(users).where(eq(users.id, userId));
  const rafeeq = isRafeeq(user?.rafeeq) ? user.rafeeq : null;
  if (!rafeeq) return { rafeeq: null, points: 0, gained: 0 };
  const { points, perDay } = GAINS[event];
  const count = await hit(db, `bond:${userId}:${event}`, 86_400);
  const gained = count * points <= perDay ? points : 0;
  if (gained) {
    const [row] = await db
      .insert(rafeeqBonds)
      .values({ userId, rafeeq, points: gained })
      .onConflictDoUpdate({
        target: [rafeeqBonds.userId, rafeeqBonds.rafeeq],
        set: { points: sql`${rafeeqBonds.points} + ${gained}`, updatedAt: new Date() },
      })
      .returning({ points: rafeeqBonds.points });
    return { rafeeq, points: row!.points, gained };
  }
  const [row] = await db
    .select({ points: rafeeqBonds.points })
    .from(rafeeqBonds)
    .where(and(eq(rafeeqBonds.userId, userId), eq(rafeeqBonds.rafeeq, rafeeq)));
  return { rafeeq, points: row?.points ?? 0, gained: 0 };
}
