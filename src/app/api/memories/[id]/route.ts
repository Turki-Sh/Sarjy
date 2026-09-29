// PATCH: Edit on a memory card. DELETE: Forget on a memory card.
// Both only ever touch the caller's own memories.

import { z } from "zod";
import { currentUser, json } from "@/server/http";
import { deleteMemory, updateMemory } from "@/server/memory/repo";

export const dynamic = "force-dynamic";

const Patch = z.object({ label: z.string().max(200).optional(), value: z.string().max(500).optional() });

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { db, user } = await currentUser();
  const memory = await updateMemory(db, user.id, (await params).id, parsed.data);
  return memory ? json({ memory }) : json({ error: "not_found" }, 404);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { db, user } = await currentUser();
  const ok = await deleteMemory(db, user.id, (await params).id);
  return ok ? json({ ok }) : json({ error: "not_found" }, 404);
}
