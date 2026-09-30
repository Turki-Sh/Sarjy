import { describe, expect, it } from "vitest";
import { DEFAULT_GLASS, readGlass, readLang, readTheme, refractScale } from "@/shared/preferences";

describe("preferences", () => {
  it("defaults to light", () => {
    expect(readTheme(undefined)).toBe("light");
    expect(readTheme("nonsense")).toBe("light");
    expect(readTheme("dark")).toBe("dark");
  });

  it("prefers the saved language, then the browser's", () => {
    expect(readLang("en", "ar-SA,ar;q=0.9")).toBe("en");
    expect(readLang(undefined, "ar-SA,ar;q=0.9")).toBe("ar");
    expect(readLang(undefined, "en-US")).toBe("en");
    expect(readLang(undefined, null)).toBe("en");
  });

  it("keeps the glass level between Solid (0) and Pure (150), every old value unchanged", () => {
    expect(readGlass(undefined)).toBe(DEFAULT_GLASS);
    expect(readGlass("100")).toBe(100);
    expect(readGlass("150")).toBe(150);
    expect(readGlass("400")).toBe(150);
    expect(readGlass("-3")).toBe(0);
    expect(readGlass("nope")).toBe(DEFAULT_GLASS);
    // The bend keeps growing past Clear.
    expect(refractScale(150)).toBeGreaterThan(refractScale(100));
  });
});
