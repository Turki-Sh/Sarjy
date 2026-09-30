// Growing the bond with a Rafeeq: each moment adds a little, never past its daily cap.

import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/server/db/client";
import { growBond } from "@/server/rafeeq/bond";
import { resolveUser } from "@/server/session";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

describe("the bond", () => {
  it("grows with each moment, up to each one's daily cap", async () => {
    const { user } = await resolveUser(db, undefined);
    expect(await growBond(db, user.id, "visit")).toEqual({ points: 5, gained: 5 });
    // Coming back again the same day adds nothing more.
    expect(await growBond(db, user.id, "visit")).toEqual({ points: 5, gained: 0 });
    let last = { points: 0, gained: 0 };
    for (let i = 0; i < 12; i++) last = await growBond(db, user.id, "pet");
    // Petting: 1 each, 10 a day at most.
    expect(last).toEqual({ points: 15, gained: 0 });
    expect(await growBond(db, user.id, "save")).toEqual({ points: 18, gained: 3 });
  });
});
