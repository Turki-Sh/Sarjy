// Your Rafeeq (shared/rafeeq.ts).
// PATCH { rafeeq: "scout" | null }: pick one, or go back to the orb. Also remembered in a cookie,
//   so the first paint of the page already shows it.
// POST { event: "visit" | "turn" | "save" | "pet" }: a moment that grows your bond with the Rafeeq
//   you have now, within a daily cap. Returns which one, and its bond after it.

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { users } from "@/server/db/schema";
import { currentUser, json } from "@/server/http";
import { growBond } from "@/server/rafeeq/bond";
import { COOKIE } from "@/shared/preferences";
import { isBondEvent, RAFEEQS } from "@/shared/rafeeq";

export const dynamic = "force-dynamic";

const YEAR = 60 * 60 * 24 * 365;

const Choice = z.object({ rafeeq: z.enum(RAFEEQS).nullable() });

export async function PATCH(request: Request) {
  const body = Choice.safeParse(await request.json().catch(() => null));
  if (!body.success) return json({ error: "bad_request" }, 400);
  const { db, user } = await currentUser();
  await db.update(users).set({ rafeeq: body.data.rafeeq }).where(eq(users.id, user.id));
  (await cookies()).set({
    name: COOKIE.rafeeq,
    value: body.data.rafeeq ?? "none",
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });
  return json({ rafeeq: body.data.rafeeq });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { event?: unknown } | null;
  if (!isBondEvent(body?.event)) return json({ error: "bad_request" }, 400);
  const { db, user } = await currentUser();
  return json(await growBond(db, user.id, body.event));
}
