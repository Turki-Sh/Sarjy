// GET: a picture sent in one of your chats, so it shows again when you reopen the chat.
// Only ever the caller's own; anyone else's reads as not found. A picture never changes once
// sent, so the browser may keep it (privately) for as long as it likes.

import { z } from "zod";
import { getPicture } from "@/server/chat/repo";
import { currentUser, json } from "@/server/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return json({ error: "not_found" }, 404);
  const { db, user } = await currentUser();
  const picture = await getPicture(db, user.id, id.data);
  if (!picture) return json({ error: "not_found" }, 404);
  return new Response(new Uint8Array(picture.bytes), {
    headers: {
      "Content-Type": picture.mediaType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
