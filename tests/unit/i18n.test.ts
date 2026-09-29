import { describe, expect, it } from "vitest";
import { STRINGS, dir, isLang } from "@/shared/i18n";
import { VOICE_STATES } from "@/shared/states";

describe("i18n", () => {
  it("has every string in both languages", () => {
    const keys = (o: object) => Object.keys(o).sort();
    expect(keys(STRINGS.ar)).toEqual(keys(STRINGS.en));
    for (const state of VOICE_STATES) {
      expect(STRINGS.en.status[state]).toBeTruthy();
      expect(STRINGS.ar.status[state]).toBeTruthy();
    }
  });

  it("mirrors Arabic", () => {
    expect(dir("ar")).toBe("rtl");
    expect(dir("en")).toBe("ltr");
  });

  it("recognises only supported languages", () => {
    expect(isLang("ar")).toBe(true);
    expect(isLang("fr")).toBe(false);
  });

  it("never uses an em dash in interface copy", () => {
    expect(JSON.stringify(STRINGS)).not.toContain("—");
  });
});
