import { describe, expect, it } from "vitest";
import { fakeFetch } from "@/server/providers/fake/fetch";
import { looksSecret } from "@/server/tools/memory";
import { forecast, weatherLabel } from "@/server/tools/weather";
import { toldWhen } from "@/server/turn/prompt";

describe("weather", () => {
  it("returns rounded numbers only (AT-31)", async () => {
    const r = await forecast(fakeFetch, { location: "Riyadh", dayOffset: 1, units: "celsius", lang: "en" });
    expect(r).toMatchObject({
      place: "Riyadh",
      day: "tomorrow",
      condition: "clear skies",
      high: 41,
      units: "celsius",
    });
    if ("high" in r) expect(Number.isInteger(r.high) && Number.isInteger(r.low)).toBe(true);
  });

  it("answers in Arabic for an Arabic place name", async () => {
    const r = await forecast(fakeFetch, { location: "جدة", dayOffset: 0, units: "celsius", lang: "ar" });
    expect(r).toMatchObject({ place: "جدة", day: "اليوم", condition: "صحو" });
  });

  it("reports an unknown place and a failed service as errors, never numbers (AT-34, AT-35)", async () => {
    expect(
      await forecast(fakeFetch, { location: "Atlantis", dayOffset: 0, units: "celsius", lang: "en" }),
    ).toEqual({
      error: "place_not_found",
      query: "Atlantis",
    });
    expect(
      await forecast(fakeFetch, { location: "Failtown", dayOffset: 0, units: "celsius", lang: "en" }),
    ).toEqual({
      error: "service_unavailable",
    });
  });

  it("labels the chip like the brand's example", () => {
    expect(weatherLabel("Riyadh", 1)).toBe('weather.forecast("Riyadh", "tomorrow")');
  });
});

describe("secrets", () => {
  it("refuses passwords and long numbers in either language (AT-18)", () => {
    expect(looksSecret(["password", "Password", "hunter2"])).toBe(true);
    expect(looksSecret(["card", "Card", "4111 1111 1111 1111"])).toBe(true);
    expect(looksSecret(["id", "ID", "1098765432"])).toBe(true);
    expect(looksSecret(["كلمة السر", "كلمة السر", "abc"])).toBe(true);
    expect(looksSecret(["favorite_color", "Favorite color", "Green"])).toBe(false);
  });

  it("keeps a birthday written as a date (Day 5: it was refused as a long number)", () => {
    expect(looksSecret(["birthday", "Birthday", "2002-06-03", "Your birthday is 2002-06-03."])).toBe(false);
    expect(looksSecret(["birthday", "يوم ميلادك", "3/6/2002", "يوم ميلادك 3/6/2002."])).toBe(false);
    // A date doesn't hide a real number next to it.
    expect(looksSecret(["note", "Note", "2002-06-03", "card 4111 1111 1111 1111"])).toBe(true);
  });
});

describe("toldWhen", () => {
  const now = new Date("2026-09-30T09:00:00Z"); // Wednesday in Riyadh
  it("says when a memory was told the way a person would", () => {
    expect(toldWhen(new Date("2026-09-30T06:00:00Z"), now, "Asia/Riyadh")).toBe("today");
    expect(toldWhen(new Date("2026-09-29T06:00:00Z"), now, "Asia/Riyadh")).toBe("yesterday");
    expect(toldWhen(new Date("2026-09-27T06:00:00Z"), now, "Asia/Riyadh")).toBe("on Sunday");
    expect(toldWhen(new Date("2026-09-12T06:00:00Z"), now, "Asia/Riyadh")).toBe("on 12 September");
  });
});
