// The Majlis contract (architecture, section 13): what the server publishes to a room's channel,
// and what everyone's browser renders. A turn event is the same event the speaker's own stream
// carries (protocol.ts), wrapped with who is speaking; audio travels as a URL.

import { z } from "zod";
import { TurnEvent } from "./protocol";

/** The most people in one Majlis: one seat, and one color, each. */
export const SEATS = 8;

/** Invite codes: five characters from an alphabet with no look-alikes (no 0/O, 1/I/L). */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const isRoomCode = (code: string) => /^[2-9A-HJKMNP-Z]{5}$/.test(code);

/** The realtime channel a room's events travel on. */
export const channelName = (code: string) => `room:${code}`;

export const Member = z.object({
  id: z.string(),
  name: z.string().nullable(),
  /** 0 to 7: the order they came in, and the color their turns wear (--seat-1 to --seat-8). */
  seat: z
    .number()
    .int()
    .min(0)
    .max(SEATS - 1),
  host: z.boolean(),
});
export type Member = z.infer<typeof Member>;

export const RoomEvent = z.discriminatedUnion("type", [
  /** One event of someone's turn, as their own screen saw it. */
  z.object({ type: z.literal("turn"), speaker: z.string(), event: TurnEvent }),
  /** Who holds the mic now (null: nobody, anyone may talk). */
  z.object({ type: z.literal("floor"), holder: z.string().nullable() }),
  /** Everyone who has joined, whenever someone new comes in. */
  z.object({ type: z.literal("members"), members: z.array(Member) }),
  /** Who is connected right now (the local transport; Ably has its own presence). */
  z.object({ type: z.literal("presence"), online: z.array(z.string()) }),
  /** The host ended the Majlis. */
  z.object({ type: z.literal("ended") }),
]);
export type RoomEvent = z.infer<typeof RoomEvent>;

/** How the browser reaches the room: Ably in production, the app's own event stream elsewhere. */
export type Transport = "ably" | "local";

/** What joining returns: enough to draw the room and catch up on what was said. */
export type RoomState = {
  code: string;
  conversationId: string;
  title: string;
  hostName: string | null;
  members: Member[];
  floor: string | null;
  ended: boolean;
  transport: Transport;
  me: string;
};
