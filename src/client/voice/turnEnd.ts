// When is Sarjy done speaking? A pure rule, so the race that once cut an answer short
// ("Sure thing." then silence) is pinned down by tests instead of by luck.
//
// The answer arrives in pieces: the first sentence, then the rest. The rest can arrive after the
// first sentence has finished playing, and then takes a moment to decode. During that moment the
// speakers are silent and the stream has ended, yet the answer is not over.

export type TurnProgress = {
  /** The server said `done` (or `error`): no more pieces will come. */
  streamDone: boolean;
  /** Pieces received from the server. */
  received: number;
  /** Pieces decoded and scheduled on the player. */
  scheduled: number;
  /** When the last scheduled piece ends, on the player's clock (seconds). */
  lastEndAt: number;
  now: number;
  /** Anything decoding, queued or playing. */
  playerBusy: boolean;
};

/** A small grace after the last sound, so the final word is never clipped. */
const TAIL = 0.05;

export function answerFinished(p: TurnProgress): boolean {
  return (
    p.streamDone &&
    p.received > 0 &&
    p.scheduled === p.received && // every piece is on the player, none still decoding
    !p.playerBusy &&
    p.now >= p.lastEndAt + TAIL
  );
}
