import "server-only";

// Sends one person's turn to everyone else in the Majlis (architecture, section 13). The speaker's
// own screen reads the turn's stream as always; each event also goes to the room, in order,
// wrapped with who is speaking. Three changes on the way:
//   - memory events stay private: a saved fact is the speaker's, and its card is only theirs
//   - audio becomes a URL (kept in room_media), since realtime messages are small
//   - the transcript carries the picture's URL, once the picture has passed the guard
// Publishing never holds up or breaks the speaker's own turn.

import type { TurnEvent } from "@/shared/protocol";
import type { Db } from "../db/client";
import type { Realtime } from "../realtime";
import { keepMedia, mediaUrl } from "./media";

export type RoomOutlet = {
  send: (event: TurnEvent) => void;
  /** Resolves once everything sent so far has been published (or failed to). */
  flushed: () => Promise<void>;
};

/** Events only the speaker's own screen gets. */
const PRIVATE = new Set<TurnEvent["type"]>(["memory_saved", "memory_forgotten"]);
/** Errors that are about the speaker alone: the room saw nothing of that turn. */
const PRIVATE_ERRORS = new Set(["not_understood", "floor_busy", "picture_refused", "rate_limited"]);

export function roomOutlet(input: {
  db: Db;
  realtime: Realtime;
  room: { id: string; code: string };
  speakerId: string;
  /** Where the room fetches the picture sent with this turn, if there is one. */
  pictureUrl?: string | null;
}): RoomOutlet {
  const { db, realtime, room, speakerId } = input;
  let chain = Promise.resolve();

  const prepare = async (event: TurnEvent): Promise<TurnEvent> => {
    if (event.type === "segment" && event.audio) {
      const id = await keepMedia(db, room.id, Buffer.from(event.audio, "base64"), "audio/wav");
      return { ...event, audio: null, url: mediaUrl(room.code, id) };
    }
    if (event.type === "transcript" && input.pictureUrl) return { ...event, image: input.pictureUrl };
    return event;
  };

  return {
    send(event) {
      if (PRIVATE.has(event.type)) return;
      if (event.type === "error" && PRIVATE_ERRORS.has(event.code)) return;
      chain = chain
        .then(async () =>
          realtime.publish(room.code, { type: "turn", speaker: speakerId, event: await prepare(event) }),
        )
        .catch((error) => console.error("room publish failed", error));
    },
    flushed: () => chain,
  };
}
