import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/server/db/client";
import { listMemories } from "@/server/memory/repo";
import { parsePlan } from "@/server/memory/writer";
import { getProviders } from "@/server/providers";
import type { Providers } from "@/server/providers/types";
import { resolveUser } from "@/server/session";
import { runTurn } from "@/server/turn/pipeline";
import { TurnEvent } from "@/shared/protocol";

// Memory as sentences, written after the reply (Day 2): what is kept, how it is kept tidy, what is
// never kept, and searching past chats.

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

async function newUser() {
  const { user } = await resolveUser(db, undefined);
  const { users } = await import("@/server/db/schema");
  const { eq } = await import("drizzle-orm");
  await db.update(users).set({ onboardingStep: "done" }).where(eq(users.id, user.id));
  return user.id;
}

async function turn(
  userId: string,
  text: string,
  opts: { conversationId?: string | null; providers?: Providers; audio?: boolean } = {},
) {
  const { users } = await import("@/server/db/schema");
  const { eq } = await import("drizzle-orm");
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const events: TurnEvent[] = [];
  await runTurn(
    {
      user: user!,
      audio: opts.audio ? new Blob([new Uint8Array(64)], { type: "audio/wav" }) : null,
      text: opts.audio ? null : text,
      conversationId: opts.conversationId ?? null,
      uiLang: "en",
      timeZone: "Asia/Riyadh",
    },
    { db, providers: opts.providers ?? getProviders() },
    (e) => events.push(TurnEvent.parse(e)),
  );
  const done = events.find((e) => e.type === "done");
  return {
    events,
    said: done && done.type === "done" ? done.text : "",
    saved: events.flatMap((e) => (e.type === "memory_saved" ? [e.memory] : [])),
    conversationId: done && done.type === "done" ? done.conversationId : null,
  };
}

describe("remembering", () => {
  it("keeps the details as a sentence, under a topic", async () => {
    const id = await newUser();
    const { saved } = await turn(id, "My sister Noura is getting married in December.");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      key: "sister_noura",
      topic: "people",
      note: "Your sister Noura is getting married in December 2026.",
    });
  });

  it("updates what changed instead of adding a second memory, and dates it from the change", async () => {
    const id = await newUser();
    await turn(id, "I live in Dammam.");
    const moved = await turn(id, "I just moved to Jeddah.");
    expect(moved.saved.map((m) => [m.key, m.value])).toEqual([["home_city", "Jeddah"]]);
    const all = await listMemories(db, id);
    expect(all.filter((m) => m.key === "home_city")).toHaveLength(1);
    const city = all.find((m) => m.key === "home_city")!;
    expect(Date.parse(city.updatedAt)).toBeGreaterThan(Date.parse(city.createdAt));
  });

  it("keeps nothing from small talk, and never a secret", async () => {
    const id = await newUser();
    expect((await turn(id, "It's on.")).saved).toHaveLength(0);
    const secret = await turn(id, "My password is hunter2.");
    expect(secret.saved).toHaveLength(0);
    expect(secret.said).toMatch(/don't keep passwords/);
    expect(await listMemories(db, id)).toHaveLength(0);
  });

  it("keeps nothing from words Whisper doubted (the 'It's on' case)", async () => {
    const id = await newUser();
    const base = getProviders();
    const doubtful: Providers = {
      ...base,
      stt: { transcribe: async () => ({ text: "My favorite color is red.", lang: "en", unsure: true }) },
    };
    const heard = await turn(id, "", { audio: true, providers: doubtful });
    expect(heard.said).toBe("Got it.");
    expect(heard.saved).toHaveLength(0);
  });

  it("never writes back what was just forgotten", async () => {
    const id = await newUser();
    await turn(id, "My favorite color is green.");
    const forget = await turn(id, "Forget my favorite color.");
    expect(forget.events.some((e) => e.type === "memory_forgotten")).toBe(true);
    expect(forget.saved).toHaveLength(0);
    expect(await listMemories(db, id)).toHaveLength(0);
  });

  it("reads the writer's answer strictly: anything malformed changes nothing", () => {
    expect(parsePlan('{"ops":[]}')).toEqual([]);
    expect(parsePlan("Sure! Here you go: nothing.")).toEqual([]);
    expect(parsePlan('{"ops":[{"op":"add","key":"x"}]}')).toEqual([]);
    expect(parsePlan('```json\n{"ops":[{"op":"delete","key":"home_city"}]}\n```')).toEqual([
      { op: "delete", key: "home_city" },
    ]);
  });
});

describe("searching past chats", () => {
  it("finds what was said in another chat, and says when", async () => {
    const id = await newUser();
    await turn(id, "I've been playing Elden Ring all week.");
    // A new chat asks about it.
    const found = await turn(id, "What was that game we talked about?");
    expect(found.events.some((e) => e.type === "tool_start" && e.label.startsWith("chats.search"))).toBe(
      true,
    );
    expect(found.said).toMatch(/^We talked about it today: I've been playing Elden Ring all week\./);
  });

  it("says so when nothing matches, instead of making something up", async () => {
    const id = await newUser();
    const none = await turn(id, "What was that recipe we talked about?");
    expect(none.said).toBe("I couldn't find that in our chats.");
  });
});
