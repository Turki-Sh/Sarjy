import { describe, expect, it } from "vitest";
import { REST, easeToward, isAtRest, wavePath } from "@/shared/wave";

describe("wavePath", () => {
  it("matches the brand's master centerline at rest", () => {
    expect(wavePath(REST)).toBe(
      "M24 107 C36 107 40 41.00 57 41.00 C72 41.00 82 114.00 112 114.00 C142 114.00 150 29.00 168 29.00 C186 29.00 186 107 200 107",
    );
  });

  it("flattens toward the rest line as the ends lower", () => {
    const flat = wavePath({ a1: 0, a2: 0, s: 0 });
    expect(flat).toContain("57 107.00");
    expect(flat).toContain("168 107.00");
  });
});

describe("easeToward", () => {
  it("moves a fraction of the way to the target", () => {
    const next = easeToward({ a1: 0, a2: 0, s: 0 }, REST, 0.14);
    expect(next.a1).toBeCloseTo(0.14);
    expect(next.s).toBeCloseTo(0.14);
  });

  it("reaches rest after enough frames", () => {
    let shape = { a1: 0.25, a2: 0.25, s: 0.4 };
    for (let i = 0; i < 60; i++) shape = easeToward(shape, REST, 0.14);
    expect(isAtRest(shape)).toBe(true);
  });
});
