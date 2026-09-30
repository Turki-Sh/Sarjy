import { describe, expect, it } from "vitest";
import {
  bondOf,
  BOND_LEVELS,
  expressionOf,
  isBondEvent,
  isRafeeq,
  PERSONALITIES,
  RAFEEQS,
} from "@/shared/rafeeq";

describe("the bond with a Rafeeq", () => {
  it("starts at level 1 and climbs through five levels", () => {
    expect(bondOf(0)).toEqual({ level: 1, progress: 0, next: 15 });
    expect(bondOf(14).level).toBe(1);
    expect(bondOf(15)).toEqual({ level: 2, progress: 0, next: 45 });
    expect(bondOf(30).progress).toBeCloseTo(0.5);
    expect(bondOf(BOND_LEVELS[4])).toEqual({ level: 5, progress: 1, next: null });
    expect(bondOf(10_000).level).toBe(5);
  });

  it("knows its companions and what grows the bond", () => {
    expect(isRafeeq("scout")).toBe(true);
    expect(isRafeeq("orb")).toBe(false);
    expect(isBondEvent("pet")).toBe(true);
    expect(isBondEvent("toString")).toBe(false);
  });
});

describe("each Rafeeq's personality", () => {
  it("gives every companion its own temper, and none the same whole self", () => {
    const selves = RAFEEQS.map((id) => JSON.stringify(PERSONALITIES[id]));
    expect(new Set(selves).size).toBe(RAFEEQS.length);
    expect(new Set(RAFEEQS.map((id) => PERSONALITIES[id].temper)).size).toBe(RAFEEQS.length);
    // And none smiles like another.
    expect(new Set(RAFEEQS.map((id) => PERSONALITIES[id].smile)).size).toBe(RAFEEQS.length);
    for (const id of RAFEEQS) {
      const p = PERSONALITIES[id];
      expect(p.energy).toBeGreaterThanOrEqual(0.5);
      expect(p.energy).toBeLessThanOrEqual(1.5);
      expect(p.fidgets.length).toBeGreaterThan(0);
      expect(p.fidgetEvery[0]).toBeLessThan(p.fidgetEvery[1]);
    }
  });

  it("makes its own face when your pointer rests on it", () => {
    // Fennec is wary at first, then annoyed if you stay.
    expect(expressionOf("fennec", "none", "near", true)).toBe("wary");
    expect(expressionOf("fennec", "none", "long", true)).toBe("annoyed");
    expect(expressionOf("keeper", "none", "near", true)).toBe("shy");
    expect(expressionOf("dune", "none", "long", true)).toBe("smug");
    expect(expressionOf("breeze", "none", "near", true)).toBe("giggle");
    // Not while it is busy with a turn.
    expect(expressionOf("fennec", "none", "long", false)).toBeNull();
  });

  it("takes petting and failure in its own way, and rests with its own face", () => {
    expect(expressionOf("fennec", "grumble", null, true)).toBe("annoyed");
    expect(expressionOf("lantern", "droop", null, true)).toBe("worried");
    expect(expressionOf("rider", "droop", null, true)).toBe("determined");
    expect(expressionOf("dune", "droop", null, true)).toBe("annoyed");
    expect(expressionOf("keeper", "none", null, true)).toBe("content");
    expect(expressionOf("rider", "none", null, true)).toBeNull();
    // A moment's mood wins over its face at rest.
    expect(expressionOf("keeper", "petted", "near", true)).toBeNull();
  });
});
