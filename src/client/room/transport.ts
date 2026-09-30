"use client";

// How this browser hears a Majlis. Two transports, one shape:
//   ably   production: Ably's realtime client, with a token from /api/realtime/token that may
//          listen and show presence on this one room, never publish
//   local  tests, offline, no Ably key: the app's own event stream, /api/rooms/[code]/events
// Either way the page gets room events, who is connected, and whether the line is up.

import { RoomEvent, channelName, type RoomState } from "@/shared/room";

export type LinkStatus = "live" | "reconnecting";

export type RoomHandlers = {
  onEvent: (event: RoomEvent) => void;
  /** Who is connected right now, by user id. */
  onOnline: (ids: string[]) => void;
  onStatus: (status: LinkStatus) => void;
};

export type RoomLink = { close: () => void };

export async function connectRoom(room: RoomState, handlers: RoomHandlers): Promise<RoomLink> {
  return room.transport === "ably" ? connectAbly(room, handlers) : connectLocal(room, handlers);
}

function connectLocal(room: RoomState, { onEvent, onOnline, onStatus }: RoomHandlers): RoomLink {
  const source = new EventSource(`/api/rooms/${room.code}/events`);
  source.onopen = () => onStatus("live");
  // The browser reconnects by itself; until then, the room bar says so.
  source.onerror = () => onStatus("reconnecting");
  source.onmessage = (message) => {
    const parsed = RoomEvent.safeParse(JSON.parse(message.data as string));
    if (!parsed.success) return;
    if (parsed.data.type === "presence") onOnline(parsed.data.online);
    else onEvent(parsed.data);
  };
  return { close: () => source.close() };
}

async function connectAbly(
  room: RoomState,
  { onEvent, onOnline, onStatus }: RoomHandlers,
): Promise<RoomLink> {
  // Loaded only in a Majlis, and only when Ably carries it: most visits never download it.
  const Ably = await import("ably");
  const client = new Ably.Realtime({
    clientId: room.me,
    authCallback: (_params, callback) => {
      fetch(`/api/realtime/token?code=${room.code}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`token ${res.status}`);
          callback(null, await res.json());
        })
        .catch((error: Error) => callback(error.message, null));
    },
  });
  client.connection.on((change) => {
    if (change.current === "connected") onStatus("live");
    else if (change.current === "disconnected" || change.current === "suspended") onStatus("reconnecting");
  });
  const channel = client.channels.get(channelName(room.code));
  await channel.subscribe((message) => {
    const parsed = RoomEvent.safeParse(message.data);
    if (parsed.success) onEvent(parsed.data);
  });
  const refresh = () =>
    void channel.presence
      .get()
      .then((present) => onOnline([...new Set(present.map((p) => p.clientId))]))
      .catch(() => {});
  await channel.presence.subscribe(refresh);
  await channel.presence.enter();
  refresh();
  return { close: () => client.close() };
}
