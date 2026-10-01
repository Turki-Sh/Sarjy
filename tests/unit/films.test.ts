import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FEATURED, FILMS, filmById, othersThan, runningTime } from "@/shared/films";

describe("the films", () => {
  it("every film's file (and poster, when it has one) is there", () => {
    for (const f of FILMS) {
      expect(existsSync(`public${f.src}`), f.src).toBe(true);
      if (f.poster) expect(existsSync(`public${f.poster}`), f.poster).toBe(true);
    }
  });

  it("every film plays on iPhones and iPads: H.264 at level 4.1 or lower, its index at the front", () => {
    for (const f of FILMS) {
      const bytes = readFileSync(`public${f.src}`);
      // The decoder setup (avcC) holds the profile and the level; Safari refuses levels above 5.2.
      const avcC = bytes.indexOf("avcC");
      expect(avcC, `${f.src}: not H.264`).toBeGreaterThan(0);
      expect(bytes[avcC + 7], `${f.src}: H.264 level x10`).toBeLessThanOrEqual(41);
      // The index (moov) before the picture (mdat), so it starts playing before it has all arrived.
      expect(bytes.indexOf("moov"), f.src).toBeLessThan(bytes.indexOf("mdat"));
    }
  });

  it("ids are unique and fit in an address", () => {
    const ids = FILMS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("every film has words in both languages", () => {
    for (const f of FILMS)
      for (const lang of ["en", "ar"] as const) expect(f.title[lang] && f.body[lang]).toBeTruthy();
  });

  it("/film opens on the newest, and lists the rest", () => {
    expect(FEATURED).toBe(FILMS[0]);
    expect(filmById(FEATURED.id)).toBe(FEATURED);
    expect(filmById("not-a-film")).toBeUndefined();
    expect(othersThan(FEATURED.id)).toHaveLength(FILMS.length - 1);
  });

  it("says how long a film runs the way a player does", () => {
    expect(runningTime(68)).toBe("1:08");
    expect(runningTime(5)).toBe("0:05");
    expect(runningTime(600)).toBe("10:00");
  });
});
