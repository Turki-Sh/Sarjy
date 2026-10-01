import { describe, expect, it } from "vitest";
import { spokenLang, sttPrompt } from "@/server/providers/groq";

describe("the language you spoke", () => {
  it("follows the transcript's letters over Whisper's label (English with a Saudi accent)", () => {
    expect(spokenLang("I'm fine, thank you. Can you tell me about yourself?", "arabic", "ar")).toBe("en");
    expect(spokenLang("وش الجو بكرة؟", "english", "en")).toBe("ar");
  });

  it("goes by the majority when both scripts appear", () => {
    expect(spokenLang("Remember that I live in الرياض please", "english", "en")).toBe("en");
    expect(spokenLang("اسمي Turki وأسكن في جدة", "arabic", "en")).toBe("ar");
  });

  it("uses the label, then the interface language, when the text says nothing", () => {
    expect(spokenLang("123", "arabic", "en")).toBe("ar");
    expect(spokenLang("", undefined, "ar")).toBe("ar");
  });
});

describe("the listener's prompt (Day 5)", () => {
  it("adds what this turn is about after the sample, and keeps it short", () => {
    expect(sttPrompt()).toMatch(/^Sarjy, سرجي\./);
    expect(sttPrompt("تركي. الرياض. وش اسمك؟")).toMatch(/وش اسمك؟$/);
    expect(sttPrompt("a ".repeat(500)).length).toBeLessThan(400);
  });
});
