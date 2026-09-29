// GET: one of your past chats, with its messages, when you open it from Recent.
// PATCH: rename it. Only ever the caller's own chats; anyone else's reads as not found.

import { z } from "zod";
import { getConversation, renameConversation } from "@/server/chat/repo";
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

/** A title is one line, 1 to 60 characters, trimmed. */
const Rename = z.object({ title: z.string().trim().min(1).max(60) });

export async function PATCH(request: Request, { params }: Params) {
  const id = z.uuid().safeParse((await params).id);
  const body = Rename.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) return json({ error: "bad_request" }, 400);
  const title = body.data.title.replace(/\s+/g, " ");
  const { db, user } = await currentUser();
  const ok = await renameConversation(db, user.id, id.data, title);
  return ok ? json({ title }) : json({ error: "not_found" }, 404);
}
