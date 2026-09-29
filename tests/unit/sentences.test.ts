import { describe, expect, it } from "vitest";
import { SpeechChunker, splitSentences, tidy, unglue } from "@/server/turn/sentences";

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

describe("unglue", () => {
  it("puts back the space a model left out between sentences", () => {
    expect(unglue("Your favorite food is kabsa.Got it.")).toBe("Your favorite food is kabsa. Got it.");
    expect(unglue("حفظتها.لونك أخضر")).toBe("حفظتها. لونك أخضر");
  });

  it("leaves decimals, and a sentence already spaced, alone", () => {
    expect(unglue("A high of 4.5 today. Nice.")).toBe("A high of 4.5 today. Nice.");
  });

  it("works across streamed pieces", () => {
    const c = new SpeechChunker();
    expect(c.push("Saved. Your food is kabsa")).toBe("Saved.");
    c.push(".");
    c.push("Got");
    c.push(" it.");
    expect(c.flush()).toBe("Your food is kabsa. Got it.");
  });
});

describe("tidy", () => {
  it("fixes the slips a model makes when speaking", () => {
    const dash = String.fromCharCode(0x2014);
    expect(tidy(`All set, Turki${dash}what's next?`)).toBe("All set, Turki, what's next?");
    expect(tidy("Kabsa. You told me on today.")).toBe("Kabsa. You told me today.");
    expect(tidy("Green. You told me on Sunday.")).toBe("Green. You told me on Sunday.");
  });
});
