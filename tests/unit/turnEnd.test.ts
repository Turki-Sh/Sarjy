import { describe, expect, it } from "vitest";
import { answerFinished, type TurnProgress } from "@/client/voice/turnEnd";

const base: TurnProgress = {
  streamDone: true,
  received: 2,
  scheduled: 2,
  lastEndAt: 5,
  now: 6,
  playerBusy: false,
};

describe("when an answer is finished", () => {
  it("is finished once every piece has been scheduled and played", () => {
    expect(answerFinished(base)).toBe(true);
  });

  it("is NOT finished while the rest of the answer is still decoding (the Day 2 bug)", () => {
    // "Sure thing." has played; the rest arrived with `done` and is decoding: silence, but not the end.
    expect(answerFinished({ ...base, scheduled: 1, lastEndAt: 1.2, now: 3 })).toBe(false);
  });

  it("is not finished while the player is busy, or before the last sound ends", () => {
    expect(answerFinished({ ...base, playerBusy: true })).toBe(false);
    expect(answerFinished({ ...base, now: 5.01 })).toBe(false);
  });

  it("is not finished before the stream ends, or with nothing received", () => {
    expect(answerFinished({ ...base, streamDone: false })).toBe(false);
    expect(answerFinished({ ...base, received: 0, scheduled: 0 })).toBe(false);
  });
});
