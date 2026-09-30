// GET: the picture someone in your Majlis uploaded for themselves, so it shows in their seat.
// Only for people in that same Majlis; anyone else reads as not found. The address carries a
// version (?v=), so the browser may keep it.

import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/server/db/schema";
import { currentUser, json } from "@/server/http";
import { memberRoom } from "@/server/rooms/access";
import { isMember } from "@/server/rooms/rooms";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string; id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { code, id } = await params;
  if (!z.uuid().safeParse(id).success) return json({ error: "not_found" }, 404);
  const { db, user } = await currentUser();
  const room = await memberRoom(db, code, user.id);
  if (!room || !(await isMember(db, room.id, id))) return json({ error: "not_found" }, 404);
  const [person] = await db
    .select({ avatar: users.avatar, image: users.avatarImage })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const match =
    person?.avatar === "upload" ? person.image?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) : null;
  if (!match) return json({ error: "not_found" }, 404);
  return new Response(new Uint8Array(Buffer.from(match[2]!, "base64")), {
    headers: {
      "Content-Type": match[1]!,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
