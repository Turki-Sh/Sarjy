import "server-only";

// The floor: who holds the mic in a Majlis. One statement claims it, so two people tapping at the
// same moment can't both win. A claim lasts 45 seconds (a turn is at most 30 s of speech plus the
// answer), so a dropped phone can't hold the room hostage; the turn lets it go at the end.

import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { rooms, type RoomRow } from "../db/schema";

export const FLOOR_MS = 45_000;

/** Takes the floor if it is free, expired, or already yours (renewing it). True when you hold it. */
export async function claimFloor(db: Db, roomId: string, userId: string): Promise<boolean> {
  const rows = await db
    .update(rooms)
    .set({ floorId: userId, floorExpiresAt: sql`now() + interval '45 seconds'` })
    .where(
      and(
        eq(rooms.id, roomId),
        isNull(rooms.endedAt),
        or(isNull(rooms.floorId), eq(rooms.floorId, userId), lt(rooms.floorExpiresAt, sql`now()`)),
      ),
    )
    .returning({ id: rooms.id });
  return rows.length > 0;
}

/** Lets the floor go, only if it is yours. True when it was. */
export async function releaseFloor(db: Db, roomId: string, userId: string): Promise<boolean> {
  const rows = await db
    .update(rooms)
    .set({ floorId: null, floorExpiresAt: null })
    .where(and(eq(rooms.id, roomId), eq(rooms.floorId, userId)))
    .returning({ id: rooms.id });
  return rows.length > 0;
}

/** Who holds the floor now; an expired claim counts as nobody. */
export function floorHolder(room: RoomRow, now = new Date()): string | null {
  if (!room.floorId || !room.floorExpiresAt || room.floorExpiresAt < now) return null;
  return room.floorId;
}
