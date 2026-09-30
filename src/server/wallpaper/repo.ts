import "server-only";

// Your own wallpaper: saved, read back, and the version the browser's address carries.

import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { wallpapers } from "../db/schema";

/** Saves (or replaces) your wallpaper. Returns its version: when it was saved, in ms. */
export async function saveWallpaper(db: Db, userId: string, bytes: Uint8Array, mediaType: string) {
  const updatedAt = new Date();
  await db
    .insert(wallpapers)
    .values({ userId, mediaType, bytes: Buffer.from(bytes), updatedAt })
    .onConflictDoUpdate({
      target: wallpapers.userId,
      set: { mediaType, bytes: Buffer.from(bytes), updatedAt },
    });
  return updatedAt.getTime();
}

export async function getWallpaper(db: Db, userId: string) {
  const [found] = await db
    .select({ bytes: wallpapers.bytes, mediaType: wallpapers.mediaType })
    .from(wallpapers)
    .where(eq(wallpapers.userId, userId))
    .limit(1);
  return found ?? null;
}

/** The version of your wallpaper, or null if you have none (no bytes loaded). */
export async function wallpaperVersion(db: Db, userId: string): Promise<number | null> {
  const [found] = await db
    .select({ updatedAt: wallpapers.updatedAt })
    .from(wallpapers)
    .where(eq(wallpapers.userId, userId))
    .limit(1);
  return found ? found.updatedAt.getTime() : null;
}
