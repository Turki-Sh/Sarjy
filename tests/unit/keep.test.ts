import { describe, expect, it } from "vitest";
import { findKeep } from "@/client/voice/keep";

describe("findKeep (the stitch, AT-44)", () => {
  it("underlines from the label to the value, as in the brand book", () => {
    const words = "Saved. Your favorite color is green.".split(" ");
    expect(findKeep(words, { label: "Favorite color", value: "Green" })).toEqual({ start: 2, end: 6 });
  });

  it("underlines just the value when the label isn't said", () => {
    const words = "Got it, Riyadh it is.".split(" ");
    expect(findKeep(words, { label: "Home city", value: "Riyadh" })).toEqual({ start: 2, end: 3 });
  });

  it("works in Arabic", () => {
    const words = "حفظت. الأكلة المفضلة: كبسة.".split(" ");
    expect(findKeep(words, { label: "الأكلة المفضلة", value: "كبسة" })).toEqual({ start: 1, end: 4 });
  });

  it("returns nothing when the fact isn't in the sentence", () => {
    expect(findKeep(["Done."], { label: "Units", value: "Celsius" })).toBeUndefined();
  });
});
