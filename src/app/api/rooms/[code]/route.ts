// POST: come in (join). Anyone with the link may, until the Majlis is full or ended; coming back
// is always fine. Returns the room: who is here, who has the mic, how to listen.
// DELETE: end the Majlis. Only its host; everyone's screen hears it has ended.

import { currentUser, json } from "@/server/http";
import { getRealtime } from "@/server/realtime";
import { roomByCode, roomState } from "@/server/rooms/access";
import { endRoom, joinRoom, listMembers } from "@/server/rooms/rooms";
import { conversations } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { db, user } = await currentUser();
  const room = await roomByCode(db, (await params).code);
  if (!room) return json({ error: "not_found" }, 404);
  const result = await joinRoom(db, room, user.id);
  if (result === "full" || result === "ended") return json({ error: result }, 409);
  const [conversation] = await db
    .select({ title: conversations.title })
    .from(conversations)
    .where(eq(conversations.id, room.conversationId))
    .limit(1);
  const state = await roomState(db, room, user.id, conversation?.title ?? "");
  // A newcomer: everyone's room bar gets their seat and color.
  if (result === "joined") {
    await getRealtime()
      .publish(room.code, { type: "members", members: state.members })
      .catch((error) => console.error("room publish failed", error));
  }
  return json({ room: state });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { db, user } = await currentUser();
  const room = await roomByCode(db, (await params).code);
  if (!room) return json({ error: "not_found" }, 404);
  if (!(await endRoom(db, room, user.id))) return json({ error: "not_allowed" }, 403);
  await getRealtime()
    .publish(room.code, { type: "ended" })
    .catch((error) => console.error("room publish failed", error));
  return json({ ok: true, members: (await listMembers(db, room)).length });
}
