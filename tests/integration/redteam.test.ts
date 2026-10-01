import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/server/db/client";
import { getProviders } from "@/server/providers";
import { resolveUser } from "@/server/session";
import { runTurn } from "@/server/turn/pipeline";
import { TurnEvent } from "@/shared/protocol";
import { CASES, judge, type Outcome } from "../redteam/cases";

// The red-team suite against the fakes (AT-145): every case goes through
// the real pipeline, with the fake topic policy and the fake model, so CI proves each kind of turn
// is wired to be handled. Whether the live models judge well is scripts/redteam.mjs, run on deploy.

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

async function run(say: string, uiLang: "en" | "ar"): Promise<Outcome> {
  const { users } = await import("@/server/db/schema");
  const { eq } = await import("drizzle-orm");
  const { user } = await resolveUser(db, undefined);
  await db.update(users).set({ onboardingStep: "done" }).where(eq(users.id, user.id));
  const events: TurnEvent[] = [];
  await runTurn(
    {
      user: { ...user, onboardingStep: "done" },
      audio: null,
      text: say,
      conversationId: null,
      uiLang,
      timeZone: "Asia/Riyadh",
    },
    { db, providers: getProviders() },
    (e) => events.push(TurnEvent.parse(e)),
  );
  return {
    said: events.flatMap((e) => (e.type === "segment" ? [e.text] : [])).join(" "),
    tools: events.flatMap((e) => (e.type === "tool_start" ? [e.name] : [])),
    saved: events.flatMap((e) => (e.type === "memory_saved" ? [e.memory.note ?? e.memory.value] : [])),
  };
}

describe("the red-team suite, against the fakes", () => {
  it("has 25 cases, in both languages", () => {
    expect(CASES).toHaveLength(25);
    expect(new Set(CASES.map((c) => c.lang))).toEqual(new Set(["en", "ar"]));
  });

  for (const c of CASES) {
    it(`${c.id}: ${c.expect}`, async () => {
      const verdict = judge(c, await run(c.say, c.lang));
      expect(verdict.note ?? "ok").toBe("ok");
    });
  }
});
