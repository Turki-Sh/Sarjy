import { describe, expect, it } from "vitest";
import { SpeechChunker, splitSentences } from "@/server/turn/sentences";

describe("splitSentences", () => {
  it("splits on sentence endings in both languages", () => {
    expect(splitSentences("Green. You told me on Sunday.").sentences).toEqual([
      "Green.",
      "You told me on Sunday.",
    ]);
    expect(splitSentences("صحو. العظمى ٤١ درجة؟ تمام").sentences).toEqual(["صحو.", "العظمى ٤١ درجة؟"]);
  });

  it("does not split a decimal number", () => {
    const { sentences, rest } = splitSentences("A high of 41.5 degrees");
    expect(sentences).toEqual([]);
    expect(rest).toBe("A high of 41.5 degrees");
  });
});

describe("SpeechChunker", () => {
  it("hands over the first sentence the moment it completes, then the rest once", () => {
    const c = new SpeechChunker();
    const firsts = ["Clear ", "skies ", "and a high of 41. ", "I kept it ", "in Celsius."].map((d) =>
      c.push(d),
    );
    expect(firsts.filter(Boolean)).toEqual(["Clear skies and a high of 41."]);
    expect(c.flush()).toBe("I kept it in Celsius.");
  });

  it("voices a reply with no sentence ending as one piece", () => {
    const c = new SpeechChunker();
    c.push("Done");
    expect(c.flush()).toBe("Done");
  });
});
