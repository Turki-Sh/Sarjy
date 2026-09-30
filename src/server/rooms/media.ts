import "server-only";

// Room media: Sarjy's voice and shared pictures, kept for an hour so everyone else in the Majlis
// can fetch them by URL (a realtime message is capped at 64 KB).

import { and, eq, lt } from "drizzle-orm";
import type { Db } from "../db/client";
import { roomMedia } from "../db/schema";

const KEEP_MS = 60 * 60 * 1000;

/** Keeps one piece of media; returns its id. Anything older than an hour goes on the way in. */
export async function keepMedia(
  db: Db,
  roomId: string,
  bytes: Uint8Array,
  mediaType: string,
): Promise<string> {
  const [row] = await db
    .insert(roomMedia)
    .values({ roomId, mediaType, bytes: Buffer.from(bytes) })
    .returning({ id: roomMedia.id });
  // Tidying never holds up the turn: it runs behind, and a failure only means it runs next time.
  void db
    .delete(roomMedia)
    .where(lt(roomMedia.createdAt, new Date(Date.now() - KEEP_MS)))
    .catch(() => {});
  return row!.id;
}

/** One piece of a room's media, or null (another room's, or gone after the hour). */
export async function getMedia(
  db: Db,
  roomId: string,
  id: string,
): Promise<{ bytes: Buffer; mediaType: string } | null> {
  const [row] = await db
    .select({ bytes: roomMedia.bytes, mediaType: roomMedia.mediaType })
    .from(roomMedia)
    .where(and(eq(roomMedia.id, id), eq(roomMedia.roomId, roomId)))
    .limit(1);
  return row ?? null;
}

export const mediaUrl = (code: string, id: string) => `/api/rooms/${code}/media/${id}`;
