// Growing the bond with a Rafeeq: each companion's own, each moment within its daily cap.

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { bondsOf, growBond } from "@/server/rafeeq/bond";
import { resolveUser } from "@/server/session";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

const pick = (id: string, rafeeq: string | null) => db.update(users).set({ rafeeq }).where(eq(users.id, id));

describe("the bond", () => {
  it("grows with each moment, up to each one's daily cap", async () => {
    const { user } = await resolveUser(db, undefined);
    await pick(user.id, "scout");
    expect(await growBond(db, user.id, "visit")).toEqual({ rafeeq: "scout", points: 5, gained: 5 });
    // Coming back again the same day adds nothing more, and says it's today's cap (so the screen
    // can say so, rather than the bond seeming stuck).
    expect(await growBond(db, user.id, "visit")).toEqual({
      rafeeq: "scout",
      points: 5,
      gained: 0,
      capped: true,
    });
    let last: Awaited<ReturnType<typeof growBond>> = { rafeeq: null, points: 0, gained: 0 };
    for (let i = 0; i < 12; i++) last = await growBond(db, user.id, "pet");
    // Petting: 1 each, 10 a day at most.
    expect(last).toEqual({ rafeeq: "scout", points: 15, gained: 0, capped: true });
    expect(await growBond(db, user.id, "save")).toEqual({ rafeeq: "scout", points: 18, gained: 3 });
  });

  it("keeps a separate bond with each companion, and grows none without one", async () => {
    const { user } = await resolveUser(db, undefined);
    expect(await growBond(db, user.id, "turn")).toEqual({ rafeeq: null, points: 0, gained: 0 });
    await pick(user.id, "keeper");
    await growBond(db, user.id, "turn");
    await pick(user.id, "breeze");
    await growBond(db, user.id, "turn");
    await growBond(db, user.id, "turn");
    expect(await bondsOf(db, user.id)).toEqual({ keeper: 2, breeze: 4 });
  });
});
