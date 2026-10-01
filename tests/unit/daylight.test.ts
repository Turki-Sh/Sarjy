import { describe, expect, it } from "vitest";
import { DAYLIGHT_SCRIPT, nextTurnAfter, sceneLight } from "@/shared/daylight";

// The home page and the 404 follow the clock, and your choice wins until the light next changes.
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute);

describe("day and night on the home page and the 404", () => {
  it("follows the clock when you haven't chosen", () => {
    expect(sceneLight(null, 0, at(1, 10))).toBe("light");
    expect(sceneLight(null, 0, at(1, 5, 59))).toBe("dark");
    expect(sceneLight(null, 0, at(1, 6))).toBe("light");
    expect(sceneLight(null, 0, at(1, 18))).toBe("dark");
    // "Follow my device" is not a choice of light or dark.
    expect(sceneLight("system", at(1, 10).getTime(), at(1, 10, 5))).toBe("light");
  });

  it("keeps your choice until the light next changes, then follows the clock again", () => {
    const chose = at(1, 10).getTime();
    expect(sceneLight("dark", chose, at(1, 17, 59))).toBe("dark");
    expect(sceneLight("dark", chose, at(1, 18, 1))).toBe("dark"); // night anyway
    expect(sceneLight("dark", chose, at(2, 7))).toBe("light"); // the next morning, the clock again
    // Light chosen at night holds until dawn.
    const late = at(1, 23).getTime();
    expect(sceneLight("light", late, at(2, 3))).toBe("light");
    expect(sceneLight("light", late, at(2, 19))).toBe("dark");
  });

  it("knows when the light next changes", () => {
    expect(nextTurnAfter(at(1, 10))).toEqual(at(1, 18));
    expect(nextTurnAfter(at(1, 20))).toEqual(at(2, 6));
    expect(nextTurnAfter(at(1, 3))).toEqual(at(1, 6));
  });

  it("runs the same rule as a script before the page paints", () => {
    expect(DAYLIGHT_SCRIPT).toContain("sarjy_theme_at");
    // It is valid JavaScript on its own.
    expect(() => new Function(DAYLIGHT_SCRIPT)).not.toThrow();
  });
});
