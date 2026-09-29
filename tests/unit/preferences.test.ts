import { describe, expect, it } from "vitest";
import { readLang, readTheme } from "@/shared/preferences";

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
});
