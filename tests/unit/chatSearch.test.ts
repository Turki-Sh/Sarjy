import { describe, expect, it } from "vitest";
import { periodOf, searchWords } from "@/server/chat/search";

describe("searching past chats", () => {
  it("looks for the words that matter, in either language", () => {
    expect(searchWords("What was that game we talked about?")).toEqual(["game"]);
    expect(searchWords("Elden Ring, the game!")).toEqual(["elden", "ring", "game"]);
    // The Arabic "ال" comes off, so "القهوة" also finds "قهوة".
    expect(searchWords("وش قلت لي عن القهوة")).toEqual(["قهوة"]);
  });

  it("turns 'yesterday' and 'last week' into the right hours where the user is (Riyadh, UTC+3)", () => {
    // Wednesday 30 September 2026, 10:00 in Riyadh.
    const now = new Date("2026-09-30T07:00:00Z");
    const zone = "Asia/Riyadh";
    expect(periodOf("today", now, zone)).toEqual({ from: new Date("2026-09-29T21:00:00Z") });
    expect(periodOf("yesterday", now, zone)).toEqual({
      from: new Date("2026-09-28T21:00:00Z"),
      to: new Date("2026-09-29T21:00:00Z"),
    });
    // The week starts on Sunday 27 September.
    expect(periodOf("this_week", now, zone)).toEqual({ from: new Date("2026-09-26T21:00:00Z") });
    expect(periodOf("last_week", now, zone)).toEqual({
      from: new Date("2026-09-19T21:00:00Z"),
      to: new Date("2026-09-26T21:00:00Z"),
    });
    expect(periodOf("this_month", now, zone)).toEqual({ from: new Date("2026-08-31T21:00:00Z") });
    expect(periodOf("any", now, zone)).toEqual({});
  });
});
