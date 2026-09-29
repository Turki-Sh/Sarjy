import { describe, expect, it } from "vitest";
import { dayPart, hijriDate, safeTimeZone } from "@/shared/hijri";

describe("hijri", () => {
  // 29 Sep 2026, 07:00 in Riyadh (04:00 UTC).
  const morning = new Date("2026-09-29T04:00:00Z");

  it("formats the Umm al-Qura date in both languages", () => {
    expect(hijriDate(morning, "en")).toMatch(/1448/);
    expect(hijriDate(morning, "ar")).toMatch(/١٤٤٨|1448/);
  });

  it("knows the time of day where the user is", () => {
    expect(dayPart(morning, "Asia/Riyadh")).toBe("morning");
    expect(dayPart(new Date("2026-09-29T16:00:00Z"), "Asia/Riyadh")).toBe("evening");
  });

  it("falls back to Riyadh for a bad time zone", () => {
    expect(safeTimeZone("Not/AZone")).toBe("Asia/Riyadh");
    expect(safeTimeZone("Europe/London")).toBe("Europe/London");
  });
});
