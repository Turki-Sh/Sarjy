import "server-only";

// A Majlis in the database (architecture, section 13): open one, let people in, say who is there,
// end it. The conversation belongs to the host; every member may read it.

import { randomInt } from "node:crypto";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { avatarFor, avatarUrl } from "@/shared/avatars";
import { hash } from "@/shared/og";
import { CODE_ALPHABET, SEATS, type Member } from "@/shared/room";
import type { Db } from "../db/client";
import { conversations, roomMembers, rooms, users, type RoomRow } from "../db/schema";

/** Five characters from 31: about 28 million codes, and every room page is noindex. */
function newCode(): string {
  return Array.from({ length: 5 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

/** Opens a Majlis in a new conversation (never an existing chat: guests would read it), host in seat 0. */
export async function createRoom(db: Db, hostId: string): Promise<RoomRow> {
  const [conversation] = await db.insert(conversations).values({ userId: hostId, title: "" }).returning();
  for (let attempt = 0; ; attempt++) {
    try {
      const [room] = await db
        .insert(rooms)
        .values({ code: newCode(), hostId, conversationId: conversation!.id })
        .returning();
      await db.insert(roomMembers).values({ roomId: room!.id, userId: hostId, seat: 0 });
      return room!;
    } catch (error) {
      if (attempt >= 4) throw error; // a taken code, five times running: something else is wrong
    }
  }
}

export async function findRoom(db: Db, code: string): Promise<RoomRow | null> {
  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  return room ?? null;
}

/** Where a member's own uploaded picture is served, to the room only; the version changes with it. */
export const memberPictureUrl = (code: string, userId: string, image: string) =>
  `/api/rooms/${code}/people/${userId}/picture?v=${hash(image).toString(36)}`;

/** Everyone who has joined, in seat order, with the names and pictures they go by. */
export async function listMembers(db: Db, room: RoomRow): Promise<Member[]> {
  const rows = await db
    .select({
      id: roomMembers.userId,
      seat: roomMembers.seat,
      name: users.name,
      avatar: users.avatar,
      image: users.avatarImage,
    })
    .from(roomMembers)
    .innerJoin(users, eq(users.id, roomMembers.userId))
    .where(eq(roomMembers.roomId, room.id))
    .orderBy(asc(roomMembers.seat));
  return rows.map((r) => {
    const choice = avatarFor(r.id, r.avatar, r.image);
    return {
      id: r.id,
      name: r.name,
      seat: r.seat,
      host: r.id === room.hostId,
      // An upload is a data URL of up to 80 KB: too big to send to everyone in every room event.
      avatar: choice === "upload" ? memberPictureUrl(room.code, r.id, r.image!) : avatarUrl(choice),
    };
  });
}

export async function isMember(db: Db, roomId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ seat: roomMembers.seat })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1);
  return !!row;
}

export type JoinResult = "joined" | "member" | "full" | "ended";

/**
 * Lets someone in: the lowest free seat is theirs. Two people at the door at once may reach for
 * the same seat; the unique index turns one away, and they try the next.
 */
export async function joinRoom(db: Db, room: RoomRow, userId: string): Promise<JoinResult> {
  if (await isMember(db, room.id, userId)) return "member";
  if (room.endedAt) return "ended";
  for (let attempt = 0; attempt < SEATS; attempt++) {
    const taken = new Set(
      (
        await db.select({ seat: roomMembers.seat }).from(roomMembers).where(eq(roomMembers.roomId, room.id))
      ).map((r) => r.seat),
    );
    const seat = Array.from({ length: SEATS }, (_, i) => i).find((i) => !taken.has(i));
    if (seat === undefined) return "full";
    const inserted = await db
      .insert(roomMembers)
      .values({ roomId: room.id, userId, seat })
      .onConflictDoNothing()
      .returning({ seat: roomMembers.seat });
    if (inserted.length) return "joined";
    if (await isMember(db, room.id, userId)) return "member"; // the same person, in two tabs
  }
  return "full";
}

/** Ends a Majlis. Only its host can; the floor is let go with it. */
export async function endRoom(db: Db, room: RoomRow, userId: string): Promise<boolean> {
  if (room.hostId !== userId) return false;
  const rows = await db
    .update(rooms)
    .set({ endedAt: new Date(), floorId: null, floorExpiresAt: null })
    .where(and(eq(rooms.id, room.id), isNull(rooms.endedAt)))
    .returning({ id: rooms.id });
  return rows.length > 0;
}

/** Majlis chats this user joined as a guest (their own rooms are already their own chats). */
export async function guestConversationIds(db: Db, userId: string): Promise<string[]> {
  const rows = await db
    .select({ conversationId: rooms.conversationId, hostId: rooms.hostId })
    .from(roomMembers)
    .innerJoin(rooms, eq(rooms.id, roomMembers.roomId))
    .where(eq(roomMembers.userId, userId));
  return rows.filter((r) => r.hostId !== userId).map((r) => r.conversationId);
}

/** The Majlis a conversation belongs to, by conversation id (for labeling chats in Recent). */
export async function roomsOf(db: Db, conversationIds: string[]): Promise<Map<string, RoomRow>> {
  if (!conversationIds.length) return new Map();
  const rows = await db.select().from(rooms).where(inArray(rooms.conversationId, conversationIds));
  return new Map(rows.map((r) => [r.conversationId, r]));
}

/** Whether this user joined the Majlis that holds this conversation. */
export async function isRoomReader(db: Db, userId: string, conversationId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: rooms.id })
    .from(rooms)
    .innerJoin(roomMembers, eq(roomMembers.roomId, rooms.id))
    .where(and(eq(rooms.conversationId, conversationId), eq(roomMembers.userId, userId)))
    .limit(1);
  return !!row;
}
