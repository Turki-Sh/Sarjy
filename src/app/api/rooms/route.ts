// POST: open a Majlis. It starts in a new conversation, you in the first seat. Returns its code;
// the invite link is /majlis/{code}.

import { currentUser, json } from "@/server/http";
import { hit } from "@/server/rateLimit";
import { createRoom } from "@/server/rooms/rooms";

export const dynamic = "force-dynamic";

/** Opening rooms is cheap, but not free: a few an hour is plenty for anyone. */
const ROOMS_PER_HOUR = 12;

export async function POST() {
  const { db, user } = await currentUser();
  if ((await hit(db, `rooms:${user.id}:hour`, 3600)) > ROOMS_PER_HOUR)
    return json({ error: "rate_limited" }, 429);
  const room = await createRoom(db, user.id);
  return json({ code: room.code, path: `/majlis/${room.code}` });
}
