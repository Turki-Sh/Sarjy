// POST /api/shares { messageId }: share one of Sarjy's answers (with its question) as a link.

import { z } from "zod";
import { currentUser, json } from "@/server/http";
import { createShare } from "@/server/share/repo";

export const dynamic = "force-dynamic";

const Body = z.object({ messageId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { db, user } = await currentUser();
  const share = await createShare(db, user.id, parsed.data.messageId);
  if (!share) return json({ error: "not_found" }, 404);
  return json({ code: share.code, path: `/s/${share.code}` });
}
