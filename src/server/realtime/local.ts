import "server-only";

// The local transport: an in-process bus, for tests, offline work, and running without an Ably
// key. Browsers read it through /api/rooms/[code]/events (a server-sent event stream), and a room's
// presence is simply who has that stream open. It only reaches browsers served by this one server
// process, which is why production uses Ably.

import type { RoomEvent } from "@/shared/room";
import type { Realtime } from "./types";

type Listener = (event: RoomEvent) => void;
type Bus = {
  listeners: Map<string, Set<Listener>>;
  /** Per room: user id to how many of their tabs are connected. */
  online: Map<string, Map<string, number>>;
};

// On globalThis, so every route (bundled separately) shares one bus.
const holder = globalThis as unknown as { __sarjyBus?: Bus };
const bus = (holder.__sarjyBus ??= { listeners: new Map(), online: new Map() });

function send(code: string, event: RoomEvent) {
  for (const listener of bus.listeners.get(code) ?? []) {
    try {
      listener(event);
    } catch {
      // one broken listener never stops the others
    }
  }
}

function announcePresence(code: string) {
  send(code, { type: "presence", online: [...(bus.online.get(code)?.keys() ?? [])] });
}

export const localRealtime: Realtime = {
  transport: "local",
  async publish(code, event) {
    send(code, event);
  },
  async token() {
    return null;
  },
  async present(code) {
    return [...(bus.online.get(code)?.keys() ?? [])];
  },
};

/**
 * Listens to a room as one user: they count as present until the returned function is called.
 * Everyone (the newcomer included) hears the new presence list.
 */
export function listenLocal(code: string, userId: string, listener: Listener): () => void {
  const listeners = bus.listeners.get(code) ?? new Set();
  bus.listeners.set(code, listeners);
  listeners.add(listener);
  const online = bus.online.get(code) ?? new Map<string, number>();
  bus.online.set(code, online);
  online.set(userId, (online.get(userId) ?? 0) + 1);
  announcePresence(code);

  let open = true;
  return () => {
    if (!open) return;
    open = false;
    listeners.delete(listener);
    const count = (online.get(userId) ?? 1) - 1;
    if (count > 0) online.set(userId, count);
    else online.delete(userId);
    announcePresence(code);
  };
}
