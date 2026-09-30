// POST /api/shares: share one of Sarjy's answers (with its question) as a link.
//   { messageId }        that answer
//   { conversationId }   the latest answer in that chat (the chat menu's Share)

import { z } from "zod";
import { currentUser, json } from "@/server/http";
import { lastAnswerId } from "@/server/chat/repo";
import { createShare } from "@/server/share/repo";

export const dynamic = "force-dynamic";

const Body = z.union([z.object({ messageId: z.uuid() }), z.object({ conversationId: z.uuid() })]);

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { db, user } = await currentUser();
  const messageId =
    "messageId" in parsed.data
      ? parsed.data.messageId
      : await lastAnswerId(db, user.id, parsed.data.conversationId);
  const share = messageId ? await createShare(db, user.id, messageId) : null;
  if (!share) return json({ error: "not_found" }, 404);
  return json({ code: share.code, path: `/s/${share.code}` });
}
