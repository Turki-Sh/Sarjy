import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/server/db/client";
import { listMemories } from "@/server/memory/repo";
import { getProviders } from "@/server/providers";
import { resolveUser } from "@/server/session";
import { runTurn } from "@/server/turn/pipeline";
import { TurnEvent } from "@/shared/protocol";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

/** Runs one typed turn for a user and returns every event, validated against the protocol. */
async function turn(userId: string, text: string, conversationId: string | null = null) {
  const { users } = await import("@/server/db/schema");
  const { eq } = await import("drizzle-orm");
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const events: TurnEvent[] = [];
  await runTurn(
    { user: user!, audio: null, text, conversationId, uiLang: "en", timeZone: "Asia/Riyadh" },
    { db, providers: getProviders() },
    (e) => events.push(TurnEvent.parse(e)),
  );
  const done = events.find((e) => e.type === "done");
  return { events, done, said: done && done.type === "done" ? done.text : "" };
}

async function newUser(onboarded = true) {
  const { user } = await resolveUser(db, undefined);
  if (onboarded) {
    const { users } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ onboardingStep: "done" }).where(eq(users.id, user.id));
  }
  return user.id;
}

describe("a turn", () => {
  it("streams events in order: transcript, segments, done", async () => {
    const id = await newUser();
    const { events } = await turn(id, "Hello");
    const types = events.map((e) => e.type);
    expect(types[0]).toBe("transcript");
    expect(types.at(-1)).toBe("done");
    expect(types).toContain("segment");
    const seg = events.find((e) => e.type === "segment");
    expect(seg?.type === "segment" && seg.audio).toBeTruthy();
  });

  it("saves a fact, confirms it out loud, and recalls it in a later session (AT-10, AT-11, AT-17)", async () => {
    const id = await newUser();
    const save = await turn(id, "My favorite color is green.");
    const saved = save.events.find((e) => e.type === "memory_saved");
    expect(saved).toBeDefined();
    expect(save.said).toBe("Saved. Your favorite color is green.");

    // A new conversation (a later session) still knows.
    const recall = await turn(id, "What's my favorite color?");
    expect(recall.said).toBe("Green. You told me today.");
  });

  it("asks instead of guessing (AT-16)", async () => {
    const id = await newUser();
    const { said } = await turn(id, "What's my favorite food?");
    expect(said).toBe("I don't have that saved yet. What is it?");
  });

  it("forgets on request and confirms (AT-13)", async () => {
    const id = await newUser();
    await turn(id, "I live in Riyadh.");
    const { events, said } = await turn(id, "Forget my home city.");
    expect(events.some((e) => e.type === "memory_forgotten")).toBe(true);
    expect(said).toBe("Forgotten. I no longer know your home city.");
    expect(await listMemories(db, id)).toHaveLength(0);
  });

  it("refuses to store a password (AT-18)", async () => {
    const id = await newUser();
    const { events, said } = await turn(id, "My password is hunter2.");
    expect(events.some((e) => e.type === "memory_saved")).toBe(false);
    expect(said).toContain("don't keep passwords");
    expect(await listMemories(db, id)).toHaveLength(0);
  });

  it("answers the weather from the tool, with a timed chip (AT-30, AT-31)", async () => {
    const id = await newUser();
    const { events, said } = await turn(id, "What's the weather in Riyadh tomorrow?");
    const start = events.find((e) => e.type === "tool_start");
    const end = events.find((e) => e.type === "tool_end");
    expect(start?.type === "tool_start" && start.label).toBe('weather.forecast("Riyadh", "tomorrow")');
    expect(end?.type === "tool_end" && end.ok).toBe(true);
    expect(said).toBe("Clear skies and a high of 41 tomorrow in Riyadh.");
    // Every number spoken came from the tool.
    for (const n of said.match(/\d+/g) ?? []) expect(["41"]).toContain(n);
  });

  it("uses the remembered home city when none is said (AT-32)", async () => {
    const id = await newUser();
    await turn(id, "I live in Jeddah.");
    const { said } = await turn(id, "How's the weather tomorrow?");
    expect(said).toContain("Jeddah");
  });

  it("asks which city when it has none (AT-33)", async () => {
    const id = await newUser();
    const { said } = await turn(id, "What's the weather tomorrow?");
    expect(said).toBe("Which city should I check?");
  });

  it("owns a weather failure plainly, with no numbers (AT-34)", async () => {
    const id = await newUser();
    const { said, events } = await turn(id, "What's the weather in Failtown?");
    expect(said).toBe("I couldn't reach the weather service. Want me to try again?");
    expect(said).not.toMatch(/\d/);
    const end = events.find((e) => e.type === "tool_end");
    expect(end?.type === "tool_end" && end.ok).toBe(false);
  });

  it("answers Arabic in Arabic (AT-47)", async () => {
    const id = await newUser();
    const { said, events } = await turn(id, "كيف الجو في جدة بكرة؟");
    const t = events.find((e) => e.type === "transcript");
    expect(t?.type === "transcript" && t.lang).toBe("ar");
    expect(said).toContain("جدة");
    expect(said).toMatch(/[٠-٩]/);
  });

  it("walks onboarding and only advances when the memory is saved (AT-20, AT-22)", async () => {
    const id = await newUser(false);
    const hello = await turn(id, "Hello");
    expect(hello.said).toContain("What should I call you?");
    const named = await turn(id, "Turki");
    expect(named.said).toBe("Saved. Your name is Turki.");
    const { users } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    expect(user!.onboardingStep).toBe("home_city");
    expect(user!.name).toBe("Turki");
  });
});
