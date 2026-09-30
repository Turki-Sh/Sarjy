import { describe, expect, it } from "vitest";
import { bondOf, BOND_LEVELS, isBondEvent, isRafeeq } from "@/shared/rafeeq";

describe("the bond with a Rafeeq", () => {
  it("starts at level 1 and climbs through five levels", () => {
    expect(bondOf(0)).toEqual({ level: 1, progress: 0, next: 15 });
    expect(bondOf(14).level).toBe(1);
    expect(bondOf(15)).toEqual({ level: 2, progress: 0, next: 45 });
    expect(bondOf(30).progress).toBeCloseTo(0.5);
    expect(bondOf(BOND_LEVELS[4])).toEqual({ level: 5, progress: 1, next: null });
    expect(bondOf(10_000).level).toBe(5);
  });

  it("knows its four companions and what grows the bond", () => {
    expect(isRafeeq("scout")).toBe(true);
    expect(isRafeeq("orb")).toBe(false);
    expect(isBondEvent("pet")).toBe(true);
    expect(isBondEvent("toString")).toBe(false);
  });
});
