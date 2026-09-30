// GET ?code=K7Q2M: a short-lived Ably token request for one Majlis, allowed to listen and to show
// you are there, never to publish (only the server publishes). Members only; ended rooms get none.

import { currentUser, json } from "@/server/http";
import { getRealtime } from "@/server/realtime";
import { memberRoom } from "@/server/rooms/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const { db, user } = await currentUser();
  const room = await memberRoom(db, code, user.id);
  if (!room || room.endedAt) return json({ error: "not_found" }, 404);
  const token = await getRealtime().token(room.code, user.id);
  return token ? json(token) : json({ error: "not_found" }, 404);
}
