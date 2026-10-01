import { describe, expect, it } from "vitest";
import { castHome } from "@/client/ui/home/cast";
import { stage, BEATS } from "@/client/ui/lost/staging";
import { castScene, VIGNETTES } from "@/client/ui/lost/vignettes";
import { HOME } from "@/shared/home-copy";
import { LOST } from "@/shared/lost-copy";
import { PERSONALITIES, RAFEEQS } from "@/shared/rafeeq";
import { seeded, shuffled } from "@/shared/random";

// The home page and the 404 (Turki, Day 4): who plays what, and the words, in both languages.

describe("the seeded random behind the scenes", () => {
  it("draws the same numbers from the same seed, so the server and browser agree", () => {
    const a = seeded(42);
    const b = seeded(42);
    const draws = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(draws);
    expect(draws.every((n) => n >= 0 && n < 1)).toBe(true);
    expect(seeded(43)()).not.toBe(draws[0]);
  });

  it("shuffles without losing or repeating anyone", () => {
    const out = shuffled(RAFEEQS, seeded(7));
    expect([...out].sort()).toEqual([...RAFEEQS].sort());
  });
});

describe("the 404's lost Rafeeqs", () => {
  it("draws a scene and a cast from a seed, the same every time", () => {
    expect(castScene(1234)).toEqual(castScene(1234));
    const kinds = new Set(Array.from({ length: 60 }, (_, i) => castScene(i).kind));
    expect(kinds).toEqual(new Set(VIGNETTES));
  });

  it("never shows the scene you just saw when you ask for directions", () => {
    for (let i = 0; i < 40; i++) {
      const before = castScene(i);
      expect(castScene(i + 1000, before.kind).kind).not.toBe(before.kind);
    }
  });

  it("casts by personality: the sleepiest dozes, nobody plays two parts", () => {
    for (let i = 0; i < 40; i++) {
      const v = castScene(i);
      const ids = Object.values(v.cast);
      expect(new Set(ids).size).toBe(ids.length);
      const sleeper = PERSONALITIES[v.cast.sleeper!];
      for (const id of ids) expect(PERSONALITIES[id].sleepMs).toBeGreaterThanOrEqual(sleeper.sleepMs);
    }
  });

  it("stages every scene with everyone on the stage, and the squabble in three beats", () => {
    for (let i = 0; i < 40; i++) {
      const v = castScene(i);
      for (const beat of BEATS) {
        const s = stage(v, beat.name);
        expect(s.actors.length).toBe(Object.keys(v.cast).length);
        for (const a of s.actors) {
          expect(a.x).toBeGreaterThanOrEqual(0);
          expect(a.x).toBeLessThanOrEqual(100);
        }
      }
    }
    const squabble = castScene(
      Array.from({ length: 99 }, (_, i) => i).find((i) => castScene(i).kind === "squabble")!,
    );
    expect(stage(squabble, "fight").cloud).toBeDefined();
    expect(stage(squabble, "sulk").map?.torn).toBe(true);
    expect(stage(squabble, "makeUp").cloud).toBeUndefined();
  });
});

describe("the home page's cast", () => {
  it("puts your own Rafeeq on the headline, and everyone else somewhere", () => {
    for (const yours of [null, ...RAFEEQS]) {
      const cast = castHome(yours);
      expect(cast.perch).toBe(yours ?? "rider");
      const all = [cast.perch, cast.peek, cast.float, ...cast.caravan];
      expect(new Set(all).size).toBe(RAFEEQS.length);
    }
  });
});

describe("the pages' words", () => {
  const texts = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : typeof value === "function"
        ? [String((value as (...a: unknown[]) => unknown)("x", "Turki"))]
        : value && typeof value === "object"
          ? Object.values(value).flatMap(texts)
          : [];

  it("says the same things in English and Arabic", () => {
    expect(HOME.ar.day.stops.map((s) => s.at)).toEqual(HOME.en.day.stops.map((s) => s.at));
    expect(HOME.ar.reins.items.length).toBe(HOME.en.reins.items.length);
    expect(HOME.ar.majlis.chatter.map((c) => c.seat)).toEqual(HOME.en.majlis.chatter.map((c) => c.seat));
    for (const id of RAFEEQS) expect(LOST.ar.lines[id].length).toBe(LOST.en.lines[id].length);
  });

  it("says hello with the page's light, several ways, by name when it knows it", () => {
    for (const lang of ["en", "ar"] as const) {
      for (const theme of ["light", "dark"] as const) {
        const lines = HOME[lang].hero.hello[theme];
        expect(lines.length).toBeGreaterThanOrEqual(4);
        for (const line of lines) {
          expect(line("Turki")).toContain("Turki");
          expect(line(null)).not.toContain("null");
        }
      }
    }
    expect(HOME.ar.hero.hello.dark[0]!("تركي")).toBe("سهران يا تركي؟");
    expect(HOME.en.hero.hello.dark[0]!(null)).toBe("Up late?");
  });

  it("never uses an em dash", () => {
    const all = [...texts(HOME), ...texts(LOST)];
    expect(all.length).toBeGreaterThan(100);
    // Built from its code, so the character itself never appears in the repository either.
    const emDash = String.fromCharCode(0x2014);
    for (const text of all) expect(text).not.toContain(emDash);
  });
});
