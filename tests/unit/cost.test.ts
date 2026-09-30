import { describe, expect, it } from "vitest";
import { turnCost, wavSeconds } from "@/server/turn/cost";

describe("cost per turn", () => {
  it("adds the model, the ears and the voice", () => {
    const usd = turnCost({
      model: "openai/gpt-oss-120b",
      inputTokens: 2000,
      outputTokens: 60,
      audioSeconds: 3,
      voiced: { en: 80, ar: 0 },
    });
    // 2000 x 0.15/M + 60 x 0.60/M = 0.000336; 3 s of Whisper = 0.0000333; 80 chars x 22/M = 0.00176
    expect(usd).toBeCloseTo(0.000336 + 0.0000333 + 0.00176, 7);
  });

  it("prices the Saudi voice at its own rate", () => {
    const en = turnCost({
      model: "x",
      inputTokens: 0,
      outputTokens: 0,
      audioSeconds: 0,
      voiced: { en: 100, ar: 0 },
    });
    const ar = turnCost({
      model: "x",
      inputTokens: 0,
      outputTokens: 0,
      audioSeconds: 0,
      voiced: { en: 0, ar: 100 },
    });
    expect(ar / en).toBeCloseTo(40 / 22, 5);
  });

  it("reads seconds from a 16 kHz WAV", () => {
    expect(wavSeconds(44 + 32_000 * 2)).toBe(2);
  });
});
