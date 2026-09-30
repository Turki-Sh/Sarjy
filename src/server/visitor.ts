import "server-only";

// Who is looking at the home page, if we know them: their name, their Rafeeq and its bond level,
// so the page can greet them and put their own companion up front (Turki, Day 4: "live, and
// personal"). Read only: a first visit gets nothing and creates nobody; that happens when they
// start talking.

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { bondOf, isRafeeq } from "@/shared/rafeeq";
import type { Visitor } from "@/shared/visitor";
import { getDb } from "./db/client";
import { users } from "./db/schema";
import { bondsOf } from "./rafeeq/bond";
import { SESSION_COOKIE, verifyCookie } from "./session";

export async function readVisitor(): Promise<Visitor | null> {
  const id = verifyCookie((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  try {
    const db = await getDb();
    const [user] = await db
      .select({ name: users.name, rafeeq: users.rafeeq })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) return null;
    const rafeeq = isRafeeq(user.rafeeq) ? user.rafeeq : null;
    const level = rafeeq ? bondOf((await bondsOf(db, id))[rafeeq] ?? 0).level : 1;
    return { name: user.name?.trim() || null, rafeeq, level };
  } catch {
    // The home page never fails for want of a greeting.
    return null;
  }
}
