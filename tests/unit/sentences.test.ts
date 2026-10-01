import { describe, expect, it } from "vitest";
import {
  isNearRepeat,
  isSelfTalk,
  SpeechChunker,
  splitSentences,
  tidy,
  unglue,
  withoutNearRepeats,
} from "@/server/turn/sentences";

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
  it("drops markdown the model slipped in, keeping the words (Turki's review, Day 2)", () => {
    expect(tidy("Try *Horizon Forbidden West* or **DOOM Eternal**.")).toBe(
      "Try Horizon Forbidden West or DOOM Eternal.",
    );
    expect(tidy("جرب *Valorant* و *Among Us*.")).toBe("جرب Valorant و Among Us.");
    expect(tidy("- Kabsa is great.")).toBe("Kabsa is great.");
    expect(tidy("See [the forecast](https://example.com) and `code`.")).toBe("See the forecast and code.");
    expect(tidy("It's _really_ hot.")).toBe("It's really hot.");
    expect(tidy("قهوة بدون سكر، ذوق أصيل. 👍")).toBe("قهوة بدون سكر، ذوق أصيل.");
    // Words with underscores and ordinary numbers are left alone.
    expect(tidy("Your favorite_color key is set. It's 41.5 today.")).toBe(
      "Your favorite_color key is set. It's 41.5 today.",
    );
  });

  it("fixes the slips a model makes when speaking", () => {
    const dash = String.fromCharCode(0x2014);
    expect(tidy(`All set, Turki${dash}what's next?`)).toBe("All set, Turki, what's next?");
    expect(tidy("Kabsa. You told me on today.")).toBe("Kabsa. You told me today.");
    expect(tidy("Green. You told me on Sunday.")).toBe("Green. You told me on Sunday.");
  });
});

describe("self-talk", () => {
  it("drops a model's leaked planning, keeps the answer (seen live, Day 2)", () => {
    const leaked =
      "Clear skies, high of 39, low of 29 in Dammam. Got it. We need to respond? Actually answer already given. Probably just end. Got it.";
    expect(tidy(leaked)).toBe("Clear skies, high of 39, low of 29 in Dammam. Got it.");
  });

  it("recognises planning, not ordinary answers", () => {
    for (const s of [
      "We need to respond?",
      "The user asks about weather.",
      "Let me check the tool.",
      "No need to reply.",
    ]) {
      expect(isSelfTalk(s)).toBe(true);
    }
    for (const s of [
      "Got it.",
      "Actually, it's 39 tomorrow.",
      "I need an umbrella? Not tomorrow.",
      "Saved. Your city is Dammam.",
    ]) {
      expect(isSelfTalk(s)).toBe(false);
    }
  });
});

describe("English filler in an Arabic answer (seen live, Day 5)", () => {
  it("drops filler sentences from an Arabic reply", () => {
    expect(tidy("تركي؟ حلو الاسم. Okay? Ready. Anything else? Okay.", "ar")).toBe("تركي؟ حلو الاسم.");
  });

  it("keeps English that means something, and leaves English replies alone", () => {
    expect(tidy("جرب Elden Ring. Valorant.", "ar")).toBe("جرب Elden Ring. Valorant.");
    expect(tidy("Sure. It's 41 tomorrow.", "en")).toBe("Sure. It's 41 tomorrow.");
  });
});

describe("a sentence said twice in other words (seen live, Day 5)", () => {
  it("is said once", () => {
    expect(
      withoutNearRepeats(
        "Partly cloudy, high of 40, low of 28, and 0 chance of rain in Riybah today. Partly cloudy, high of 40, low of 28, and zero chance of rain in Riyadh today.",
      ),
    ).toBe("Partly cloudy, high of 40, low of 28, and 0 chance of rain in Riybah today.");
  });

  it("keeps sentences that only look alike", () => {
    const two = "High of 40 in Riyadh today. High of 43 in Jeddah tomorrow.";
    expect(withoutNearRepeats(two)).toBe(two);
    expect(withoutNearRepeats("Got it. Got it, Turki.")).toBe("Got it. Got it, Turki.");
  });

  it("drops what was already voiced in an earlier piece", () => {
    expect(
      isNearRepeat("Clear skies and a high of 41 in Riyadh.", ["Clear skies, and a high of 41 in Riyadh."]),
    ).toBe(true);
  });
});
