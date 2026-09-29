// PATCH: Edit on a memory card. DELETE: Forget on a memory card.
// Both only ever touch the caller's own memories. Your name is also kept on your profile,
// so editing or forgetting the `name` memory updates the profile too.

import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/server/db/schema";
import { currentUser, json } from "@/server/http";
import { deleteMemory, listMemories, updateMemory } from "@/server/memory/repo";

export const dynamic = "force-dynamic";

const Patch = z.object({ label: z.string().max(200).optional(), value: z.string().max(500).optional() });

type Params = { params: Promise<{ id: string }> };

const memoryId = async (params: Params["params"]) => z.uuid().safeParse((await params).id);

export async function PATCH(request: Request, { params }: Params) {
  const id = await memoryId(params);
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!id.success || !parsed.success) return json({ error: "bad_request" }, 400);
  const { db, user } = await currentUser();
  const memory = await updateMemory(db, user.id, id.data, parsed.data);
  if (!memory) return json({ error: "not_found" }, 404);
  if (memory.key === "name") await db.update(users).set({ name: memory.value }).where(eq(users.id, user.id));
  return json({ memory });
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = await memoryId(params);
  if (!id.success) return json({ error: "not_found" }, 404);
  const { db, user } = await currentUser();
  const forgotten = (await listMemories(db, user.id)).find((m) => m.id === id.data);
  const ok = await deleteMemory(db, user.id, id.data);
  if (ok && forgotten?.key === "name")
    await db.update(users).set({ name: null }).where(eq(users.id, user.id));
  return ok ? json({ ok }) : json({ error: "not_found" }, 404);
}
