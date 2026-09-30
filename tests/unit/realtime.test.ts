// The Majlis transport: token requests Ably will accept, and the local bus's presence.

import * as Ably from "ably";
import { describe, expect, it } from "vitest";
import { ablyRealtime } from "@/server/realtime/ably";
import { listenLocal, localRealtime } from "@/server/realtime/local";
import type { RoomEvent } from "@/shared/room";

describe("Ably token requests", () => {
  it("are signed exactly as Ably's own SDK signs them, for one room, listen and presence only", async () => {
    const key = "appId.keyId:c2VjcmV0LXNlY3JldA";
    const mine = (await ablyRealtime(key).token("K7Q2M", "user-1")) as Record<string, string | number>;
    expect(mine.capability).toBe('{"room:K7Q2M":["presence","subscribe"]}');
    const sdk = await new Ably.Rest({
      key,
      autoConnect: false,
    } as Ably.ClientOptions).auth.createTokenRequest(
      {
        clientId: "user-1",
        ttl: mine.ttl as number,
        capability: { "room:K7Q2M": ["presence", "subscribe"] },
        timestamp: mine.timestamp as number,
        nonce: mine.nonce as string,
      },
      { key, queryTime: false },
    );
    expect(mine.mac).toBe(sdk.mac);
    expect(mine.keyName).toBe("appId.keyId");
  });
});

describe("the local bus", () => {
  it("delivers a room's events to that room only, and says who is connected", async () => {
    const heard: RoomEvent[] = [];
    const elsewhere: RoomEvent[] = [];
    const leaveA = listenLocal("AAAAA", "sara", (e) => heard.push(e));
    const leaveB = listenLocal("BBBBB", "noura", (e) => elsewhere.push(e));
    const leaveTurki = listenLocal("AAAAA", "turki", () => {});
    await localRealtime.publish("AAAAA", { type: "floor", holder: "sara" });
    leaveTurki();
    expect(heard).toEqual([
      { type: "presence", online: ["sara"] },
      { type: "presence", online: ["sara", "turki"] },
      { type: "floor", holder: "sara" },
      { type: "presence", online: ["sara"] },
    ]);
    expect(elsewhere).toEqual([{ type: "presence", online: ["noura"] }]);
    leaveA();
    leaveB();
  });

  it("counts two tabs of one person as one presence, until both close", () => {
    const seen: RoomEvent[] = [];
    const watch = listenLocal("CCCCC", "watcher", (e) => seen.push(e));
    const tab1 = listenLocal("CCCCC", "sara", () => {});
    const tab2 = listenLocal("CCCCC", "sara", () => {});
    tab1();
    expect(seen.at(-1)).toEqual({ type: "presence", online: ["watcher", "sara"] });
    tab2();
    expect(seen.at(-1)).toEqual({ type: "presence", online: ["watcher"] });
    watch();
  });
});
