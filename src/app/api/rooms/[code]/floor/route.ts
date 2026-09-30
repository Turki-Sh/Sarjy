// POST: take the mic (the floor) before you start talking. 409 with who has it when someone else does.
// DELETE: let it go, when you stop without saying anything. A turn lets it go by itself at the end.

import { currentUser, json } from "@/server/http";
import { getRealtime } from "@/server/realtime";
import { memberRoom } from "@/server/rooms/access";
import { claimFloor, floorHolder, releaseFloor } from "@/server/rooms/floor";
import { findRoom } from "@/server/rooms/rooms";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

const announce = (code: string, holder: string | null) =>
  getRealtime()
    .publish(code, { type: "floor", holder })
    .catch((error) => console.error("room publish failed", error));

export async function POST(_request: Request, { params }: Params) {
  const { db, user } = await currentUser();
  const room = await memberRoom(db, (await params).code, user.id);
  if (!room) return json({ error: "not_found" }, 404);
  if (room.endedAt) return json({ error: "ended" }, 409);
  if (!(await claimFloor(db, room.id, user.id))) {
    const now = await findRoom(db, room.code);
    return json({ error: "busy", holder: now ? floorHolder(now) : null }, 409);
  }
  await announce(room.code, user.id);
  return json({ holder: user.id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { db, user } = await currentUser();
  const room = await memberRoom(db, (await params).code, user.id);
  if (!room) return json({ error: "not_found" }, 404);
  if (await releaseFloor(db, room.id, user.id)) await announce(room.code, null);
  return json({ holder: null });
}
