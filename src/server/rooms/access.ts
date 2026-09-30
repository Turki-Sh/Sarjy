import "server-only";

// Who may do what in a Majlis. Every room route starts here: a real code, a real room, and the
// caller (known from their signed cookie, never from anything the browser says) in it.

import { isRoomCode, type Member, type RoomState } from "@/shared/room";
import type { Db } from "../db/client";
import type { RoomRow } from "../db/schema";
import { getRealtime } from "../realtime";
import { floorHolder } from "./floor";
import { and, eq, isNull } from "drizzle-orm";
import { roomMembers, rooms } from "../db/schema";
import { findRoom, isMember, listMembers } from "./rooms";

/** The room behind a code, if the code is well formed and the room exists. */
export async function roomByCode(db: Db, code: string): Promise<RoomRow | null> {
  return isRoomCode(code) ? findRoom(db, code) : null;
}

/** The room, only if the caller has joined it. */
export async function memberRoom(db: Db, code: string, userId: string): Promise<RoomRow | null> {
  const room = await roomByCode(db, code);
  return room && (await isMember(db, room.id, userId)) ? room : null;
}

/** How a person is named to the model: their name, or their seat. */
export const spokenName = (m: Member) => m.name ?? `Guest ${m.seat + 1}`;

/**
 * Someone changed their name or picture: every open Majlis they are in redraws their seat.
 * Best effort; a missed update only waits for the next person to come in.
 */
export async function announceMembers(db: Db, userId: string): Promise<void> {
  const open = await db
    .select({ room: rooms })
    .from(roomMembers)
    .innerJoin(rooms, eq(rooms.id, roomMembers.roomId))
    .where(and(eq(roomMembers.userId, userId), isNull(rooms.endedAt)));
  const realtime = getRealtime();
  await Promise.all(
    open.map(async ({ room }) =>
      realtime.publish(room.code, { type: "members", members: await listMembers(db, room) }).catch(() => {}),
    ),
  );
}

/** Everything a member's screen needs to draw the room. */
export async function roomState(db: Db, room: RoomRow, userId: string, title: string): Promise<RoomState> {
  const members = await listMembers(db, room);
  return {
    code: room.code,
    conversationId: room.conversationId,
    title,
    hostName: members.find((m) => m.host)?.name ?? null,
    members,
    floor: floorHolder(room),
    ended: !!room.endedAt,
    transport: getRealtime().transport,
    me: userId,
  };
}
