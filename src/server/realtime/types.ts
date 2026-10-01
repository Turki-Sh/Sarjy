import type { RoomEvent, Transport } from "@/shared/room";

/** Sends a room's events to everyone in it. Only the server publishes; browsers only listen. */
export type Realtime = {
  transport: Transport;
  publish(code: string, event: RoomEvent): Promise<void>;
  /**
   * What the browser trades for a connection to one room, allowed to listen and to say it is
   * there, never to publish. Null when the transport needs none (the local stream checks the cookie).
   */
  token(code: string, userId: string): Promise<unknown>;
  /** Who has the room open right now (user ids), or null when it can't be told. */
  present(code: string): Promise<string[] | null>;
};
