// PATCH: change something about you that is not a memory. For now, your profile picture.

import { eq } from "drizzle-orm";
import { z } from "zod";
import { AVATARS } from "@/shared/avatars";
import { users } from "@/server/db/schema";
import { currentUser, json } from "@/server/http";

export const dynamic = "force-dynamic";

const Patch = z.object({ avatar: z.enum(AVATARS.map((a) => a.id)) });

export async function PATCH(request: Request) {
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { db, user } = await currentUser();
  await db.update(users).set({ avatar: parsed.data.avatar }).where(eq(users.id, user.id));
  return json({ avatar: parsed.data.avatar });
}
