// The Majlis on the server (architecture, section 13): seats, the floor, private memory, what the
// room hears, and who may read what.

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getConversation, getPicture, listConversations } from "@/server/chat/repo";
import { createTestDb, type Db } from "@/server/db/client";
import { messages, pictures, users } from "@/server/db/schema";
import { getProviders } from "@/server/providers";
import { listenLocal, localRealtime } from "@/server/realtime/local";
import { spokenName } from "@/server/rooms/access";
import { claimFloor, floorHolder, releaseFloor } from "@/server/rooms/floor";
import { getMedia } from "@/server/rooms/media";
import { roomOutlet } from "@/server/rooms/outlet";
import { createRoom, endRoom, findRoom, joinRoom, listMembers } from "@/server/rooms/rooms";
import { resolveUser } from "@/server/session";
import { runTurn } from "@/server/turn/pipeline";
import type { RoomRow } from "@/server/db/schema";
import { TurnEvent } from "@/shared/protocol";
import { RoomEvent, SEATS } from "@/shared/room";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

async function person(name: string | null) {
  const { user } = await resolveUser(db, undefined);
  await db.update(users).set({ name, onboardingStep: "done" }).where(eq(users.id, user.id));
  return user.id;
}

/** One typed turn said in the room; returns the speaker's own events and what the room heard. */
async function say(room: RoomRow, userId: string, text: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const heard: RoomEvent[] = [];
  const stop = listenLocal(room.code, "listener", (e) => heard.push(RoomEvent.parse(e)));
  const outlet = roomOutlet({ db, realtime: localRealtime, room, speakerId: userId });
  const own: TurnEvent[] = [];
  const members = await listMembers(db, room);
  await runTurn(
    {
      user: user!,
      audio: null,
      text,
      conversationId: null,
      uiLang: "en",
      timeZone: "Asia/Riyadh",
      room: {
        conversationId: room.conversationId,
        people: members.map((m) => ({ id: m.id, name: spokenName(m), host: m.host })),
      },
    },
    { db, providers: getProviders() },
    (e) => {
      own.push(TurnEvent.parse(e));
      outlet.send(e);
    },
  );
  await outlet.flushed();
  stop();
  const turns = heard.flatMap((e) => (e.type === "turn" ? [e] : []));
  const done = own.find((e) => e.type === "done");
  return { own, turns, said: done?.type === "done" ? done.text : "" };
}

describe("a Majlis", () => {
  it("seats people in order, up to eight, and turns the ninth away", async () => {
    const host = await person("Turki");
    const room = await createRoom(db, host);
    for (let i = 1; i < SEATS; i++) expect(await joinRoom(db, room, await person(`P${i}`))).toBe("joined");
    expect(await joinRoom(db, room, await person("Late"))).toBe("full");
    expect(await joinRoom(db, room, host)).toBe("member");
    const seats = (await listMembers(db, room)).map((m) => m.seat);
    expect(seats).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("gives the floor to one person at a time, and frees it", async () => {
    const host = await person("Turki");
    const sara = await person("Sara");
    const room = await createRoom(db, host);
    await joinRoom(db, room, sara);
    expect(await claimFloor(db, room.id, sara)).toBe(true);
    expect(await claimFloor(db, room.id, host)).toBe(false);
    expect(await claimFloor(db, room.id, sara)).toBe(true); // renewing your own claim
    expect(floorHolder((await findRoom(db, room.code))!)).toBe(sara);
    expect(await releaseFloor(db, room.id, host)).toBe(false); // not yours to let go
    expect(await releaseFloor(db, room.id, sara)).toBe(true);
    expect(await claimFloor(db, room.id, host)).toBe(true);
  });

  it("ends only by its host, and refuses newcomers and the floor afterwards", async () => {
    const host = await person("Turki");
    const sara = await person("Sara");
    const room = await createRoom(db, host);
    await joinRoom(db, room, sara);
    expect(await endRoom(db, room, sara)).toBe(false);
    expect(await endRoom(db, room, host)).toBe(true);
    const ended = (await findRoom(db, room.code))!;
    expect(await joinRoom(db, ended, await person("Late"))).toBe("ended");
    expect(await claimFloor(db, room.id, sara)).toBe(false);
  });

  it("keeps each person's memory their own (AT-60)", async () => {
    const host = await person("Turki");
    const sara = await person("Sara");
    const room = await createRoom(db, host);
    await joinRoom(db, room, sara);

    const told = await say(room, host, "My favorite color is green.");
    // The saved fact is Turki's: his screen gets the card, the room never sees it.
    expect(told.own.some((e) => e.type === "memory_saved")).toBe(true);
    expect(told.turns.some((t) => t.event.type === "memory_saved")).toBe(false);

    const asked = await say(room, sara, "What's my favorite color?");
    expect(asked.said).toMatch(/don't have/i);
    expect(asked.said).not.toMatch(/green/i);
  });

  it("sends the room every turn event in order, with who spoke and audio by URL", async () => {
    const host = await person("Turki");
    const room = await createRoom(db, host);
    const { own, turns } = await say(room, host, "Hello");
    expect(turns.every((t) => t.speaker === host)).toBe(true);
    expect(turns.map((t) => t.event.type)).toEqual(own.map((e) => e.type));
    const segment = turns.find((t) => t.event.type === "segment")!.event;
    expect(segment.type === "segment" && segment.audio).toBeNull();
    const url = segment.type === "segment" ? segment.url! : "";
    const id = url.split("/").at(-1)!;
    expect(url).toBe(`/api/rooms/${room.code}/media/${id}`);
    expect((await getMedia(db, room.id, id))?.mediaType).toBe("audio/wav");
  });

  it("saves each turn with its speaker in the host's chat, which every member can read", async () => {
    const host = await person("Turki");
    const sara = await person("Sara");
    const stranger = await person("Nope");
    const room = await createRoom(db, host);
    await joinRoom(db, room, sara);
    await say(room, sara, "Hello from Sara");

    const chat = await getConversation(db, sara, room.conversationId);
    expect(chat?.title).toBe("Hello from Sara");
    expect(chat?.messages[0]).toMatchObject({ role: "user", speakerId: sara });
    expect(await getConversation(db, stranger, room.conversationId)).toBeNull();

    // In Recent: the host's own, and the guest's as a Majlis they joined.
    const [guestView] = await listConversations(db, sara);
    expect(guestView).toMatchObject({ id: room.conversationId, majlis: { code: room.code, mine: false } });
    const [hostView] = await listConversations(db, host);
    expect(hostView?.majlis?.mine).toBe(true);
    expect(await listConversations(db, stranger)).toEqual([]);

    // A picture in the room's chat: members may see it, nobody else.
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, room.conversationId));
    const [picture] = await db
      .insert(pictures)
      .values({ messageId: message!.id, mediaType: "image/jpeg", bytes: Buffer.from([1, 2, 3]) })
      .returning();
    expect(await getPicture(db, sara, picture!.id)).not.toBeNull();
    expect(await getPicture(db, stranger, picture!.id)).toBeNull();
  });

  it("tells the model who is in the room and who is speaking", async () => {
    const host = await person("Turki");
    const guest = await person(null);
    const room = await createRoom(db, host);
    await joinRoom(db, room, guest);
    const members = await listMembers(db, room);
    expect(members.map(spokenName)).toEqual(["Turki", "Guest 2"]);
  });

  it("gives the room the speaker's own recording with their words", async () => {
    const host = await person("Turki");
    const room = await createRoom(db, host);
    const heard: RoomEvent[] = [];
    const stop = listenLocal(room.code, "listener", (e) => heard.push(e));
    const outlet = roomOutlet({
      db,
      realtime: localRealtime,
      room,
      speakerId: host,
      voiceUrl: Promise.resolve(`/api/rooms/${room.code}/media/clip`),
    });
    outlet.send({ type: "transcript", text: "Hello", lang: "en", ms: 300 });
    outlet.send({ type: "memory_saved", memory: {} as never });
    await outlet.flushed();
    stop();
    const turns = heard.flatMap((e) => (e.type === "turn" ? [e.event] : []));
    expect(turns).toEqual([
      { type: "transcript", text: "Hello", lang: "en", ms: 300, voice: `/api/rooms/${room.code}/media/clip` },
    ]);
  });
});
