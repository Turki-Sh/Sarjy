import { describe, expect, it } from "vitest";
import { readWallpaper, wallpaperUrl } from "@/shared/wallpapers";

describe("wallpapers", () => {
  it("reads the saved choice, and anything unknown is the light field", () => {
    expect(readWallpaper(undefined)).toBe("none");
    expect(readWallpaper("crimson")).toBe("crimson");
    expect(readWallpaper("own-1727700000000")).toBe("own-1727700000000");
    expect(readWallpaper("own-abc")).toBe("none");
    expect(readWallpaper("../../etc/passwd")).toBe("none");
  });

  it("points a rug at its file and your own picture at its versioned address", () => {
    expect(wallpaperUrl("none")).toBeNull();
    expect(wallpaperUrl("midnight")).toBe("/wallpapers/midnight.jpg");
    expect(wallpaperUrl("own-42")).toBe("/api/wallpaper?v=42");
  });
});
