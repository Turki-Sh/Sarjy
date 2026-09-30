import { describe, expect, it } from "vitest";
import { seatAngle } from "@/client/ui/majlis/seating";
import { REST, surfacePath, wavePath } from "@/shared/wave";

describe("seats around the finjan", () => {
  it("puts one person straight above, and spreads everyone evenly over the top", () => {
    expect(seatAngle(0, 1, false)).toBe(-90);
    expect([0, 1].map((i) => seatAngle(i, 2, false))).toEqual([-109, -71]);
  });

  it("never goes past about 220 degrees, leaving the bottom open for the conversation", () => {
    const eight = Array.from({ length: 8 }, (_, i) => seatAngle(i, 8, false));
    expect(eight[0]).toBeCloseTo(-200);
    expect(eight[7]).toBeCloseTo(20);
  });

  it("starts from the reading start, so Arabic mirrors", () => {
    expect(seatAngle(0, 3, true)).toBe(-seatAngle(0, 3, false) - 180);
  });
});

describe("the coffee's surface", () => {
  it("is the brand wave, squeezed into the cup's mouth below the rim", () => {
    const d = surfacePath(REST);
    expect(d.split(" ").length).toBe(wavePath(REST).split(" ").length);
    const ys = [...d.matchAll(/[\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    // The rim's inner edge is at 67: the surface stays at or under it.
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(67);
  });
});
