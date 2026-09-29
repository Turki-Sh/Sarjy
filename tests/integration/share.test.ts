import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { getProviders } from "@/server/providers";
import { resolveUser } from "@/server/session";
import { classifyMoment, createShare, getShare, listShares } from "@/server/share/repo";
import { runTurn } from "@/server/turn/pipeline";
import type { TurnEvent } from "@/shared/protocol";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

async function turn(userId: string, text: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  let messageId = "";
  await runTurn(
    { user: user!, audio: null, text, conversationId: null, uiLang: "en", timeZone: "Asia/Riyadh" },
    { db, providers: getProviders() },
    (e: TurnEvent) => {
      if (e.type === "done") messageId = e.messageId;
    },
  );
  return messageId;
}

async function newUser() {
  const { user } = await resolveUser(db, undefined);
  await db.update(users).set({ onboardingStep: "done" }).where(eq(users.id, user.id));
  return user.id;
}

describe("classifyMoment", () => {
  it("names the moment by what happened in it", () => {
    expect(
      classifyMoment({
        tools: [{ name: "weather.forecast", label: 'weather.forecast("Riyadh", "tomorrow")' }],
        answer: "",
      }),
    ).toBe("weather_tomorrow");
    expect(
      classifyMoment({
        tools: [{ name: "weather.forecast", label: 'weather.forecast("Riyadh", "today")' }],
        answer: "",
      }),
    ).toBe("weather");
    expect(classifyMoment({ tools: [{ name: "memory.write", label: "" }], answer: "Saved." })).toBe("saved");
    expect(classifyMoment({ tools: [], answer: "Green. You told me on Sunday." })).toBe("recall");
    expect(classifyMoment({ tools: [], answer: "Hello." })).toBe("chat");
  });
});

describe("shared moments", () => {
  it("shares an answer with its question, as a weather moment", async () => {
    const id = await newUser();
    const messageId = await turn(id, "What's the weather in Riyadh tomorrow?");
    const share = await createShare(db, id, messageId);
    expect(share).toMatchObject({
      kind: "weather_tomorrow",
      question: "What's the weather in Riyadh tomorrow?",
    });
    expect(share!.answer).toContain("41");
    expect((await getShare(db, share!.code))?.answer).toBe(share!.answer);
  });

  it("lets only the owner share their own answers", async () => {
    const owner = await newUser();
    const stranger = await newUser();
    const messageId = await turn(owner, "Hello");
    expect(await createShare(db, stranger, messageId)).toBeNull();
  });

  it("forgets shares when the user forgets everything", async () => {
    const id = await newUser();
    await createShare(db, id, await turn(id, "Hello"));
    expect(await listShares(db, id)).toHaveLength(1);
    await db.delete(users).where(eq(users.id, id));
    expect(await listShares(db, id)).toHaveLength(0);
  });

  it("rejects malformed codes without querying", async () => {
    expect(await getShare(db, "../etc")).toBeNull();
  });
});
