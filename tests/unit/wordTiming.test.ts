import { describe, expect, it } from "vitest";
import { toneSpeech } from "@/server/providers/fake/tones";
import { estimateWordTimings, evenly, wordsSpoken } from "@/shared/wordTiming";

const SENTENCES = [
  "Clear skies and a high of 41 tomorrow.",
  "Saved. Your favorite food is kabsa.",
  "I kept it in Celsius, like you asked.",
  "صحو، والعظمى ٤١ درجة بكرة في الرياض.",
];

describe("estimateWordTimings (AT-43)", () => {
  it.each(SENTENCES)("finds each word within 150 ms: %s", (text) => {
    const { samples, rate, starts } = toneSpeech(text);
    const words = text.split(" ");
    const timings = estimateWordTimings(words, samples, rate);
    expect(timings).toHaveLength(words.length);
    timings.forEach((t, i) => expect(Math.abs(t.start - starts[i]!)).toBeLessThan(0.15));
  });

  it("keeps words in order with no overlaps", () => {
    const { samples, rate } = toneSpeech(SENTENCES[2]!);
    const timings = estimateWordTimings(SENTENCES[2]!.split(" "), samples, rate);
    for (let i = 1; i < timings.length; i++)
      expect(timings[i]!.start).toBeGreaterThanOrEqual(timings[i - 1]!.end - 1e-9);
  });

  it("spreads words evenly when there is no audio", () => {
    const t = evenly(["one", "two"], 0, 1);
    expect(t[0]!.start).toBe(0);
    expect(t[1]!.end).toBeCloseTo(1);
  });

  it("counts the words spoken so far", () => {
    const t = evenly(["a", "b", "c"], 0, 3);
    expect(wordsSpoken(t, 0)).toBe(1);
    expect(wordsSpoken(t, 2.5)).toBe(3);
  });
});
