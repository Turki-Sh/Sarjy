// GET: one of your past chats, with its messages, when you open it from Recent.
// Only ever the caller's own chats; anyone else's reads as not found.

import { z } from "zod";
import { getConversation } from "@/server/chat/repo";
import { currentUser, json } from "@/server/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return json({ error: "not_found" }, 404);
  const { db, user } = await currentUser();
  const chat = await getConversation(db, user.id, id.data);
  return chat ? json({ chat }) : json({ error: "not_found" }, 404);
}
