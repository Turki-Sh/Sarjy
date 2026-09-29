import { describe, expect, it } from "vitest";
import { follow, frameFor } from "@/client/voice/useOrbMotion";

describe("the orb's light stays calm (Turki's review, Day 2)", () => {
  it("follows loudness quickly up and slowly down, so it breathes instead of flickering", () => {
    const up = follow(0, 1);
    const down = 1 - follow(1, 0);
    expect(up).toBeGreaterThan(down * 3);
    // Ten frames of a sudden silence still leave a soft glow, not a snap to dark.
    let level = 1;
    for (let i = 0; i < 10; i++) level = follow(level, 0);
    expect(level).toBeGreaterThan(0.5);
  });

  it("turns slowly in every state", () => {
    for (const state of ["idle", "listening", "thinking", "tool", "speaking", "saving"] as const) {
      expect(frameFor(state, 1, 0.5, 0.5).spin).toBeLessThanOrEqual(15);
    }
  });

  it("keeps the speaking light steady: loud and quiet differ only a little", () => {
    const loud = frameFor("speaking", 1, null, 1);
    const quiet = frameFor("speaking", 1, null, 0);
    expect(loud.glow - quiet.glow).toBeLessThanOrEqual(0.1 + 1e-9);
    expect(loud.lvl - quiet.lvl).toBeLessThanOrEqual(0.05 + 1e-9);
  });
});
