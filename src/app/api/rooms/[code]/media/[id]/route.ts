// GET: one piece of a Majlis's media (a sentence of Sarjy's voice, or a shared picture), for the
// people in it. Kept for an hour; it never changes, so the browser may keep it privately.

import { z } from "zod";
import { currentUser, json } from "@/server/http";
import { memberRoom } from "@/server/rooms/access";
import { getMedia } from "@/server/rooms/media";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string; id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { code, id } = await params;
  if (!z.uuid().safeParse(id).success) return json({ error: "not_found" }, 404);
  const { db, user } = await currentUser();
  const room = await memberRoom(db, code, user.id);
  const media = room ? await getMedia(db, room.id, id) : null;
  if (!media) return json({ error: "not_found" }, 404);
  return new Response(new Uint8Array(media.bytes), {
    headers: {
      "Content-Type": media.mediaType,
      "Cache-Control": "private, max-age=3600, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
