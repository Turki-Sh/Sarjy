import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FEATURED, FILMS, filmById, filmHref, othersThan, pickVersion, runningTime } from "@/shared/films";
import { cardByFile } from "@/shared/og";

const versions = FILMS.flatMap((f) => f.versions);

describe("the films", () => {
  it("every version's file and poster, and every film's cards, are there", () => {
    for (const v of versions) {
      expect(existsSync(`public${v.src}`), v.src).toBe(true);
      expect(existsSync(`public${v.poster}`), v.poster).toBe(true);
    }
    for (const f of FILMS) {
      for (const lang of ["en", "ar"] as const) {
        expect(existsSync(`public/og/${f.card[lang]}`), f.card[lang]).toBe(true);
        expect(cardByFile(f.card[lang])?.lang, `${f.card[lang]} is in the card catalog`).toBe(lang);
      }
    }
  });

  it("every film has its own cards, not another film's", () => {
    const files = FILMS.flatMap((f) => [f.card.en, f.card.ar]);
    expect(new Set(files).size).toBe(files.length);
  });

  it("every film plays on iPhones and iPads: H.264 at level 4.1 or lower, its index at the front", () => {
    for (const v of versions) {
      const bytes = readFileSync(`public${v.src}`);
      // The decoder setup (avcC) holds the profile and the level; Safari refuses levels above 5.2.
      const avcC = bytes.indexOf("avcC");
      expect(avcC, `${v.src}: not H.264`).toBeGreaterThan(0);
      expect(bytes[avcC + 7], `${v.src}: H.264 level x10`).toBeLessThanOrEqual(41);
      // The index (moov) before the picture (mdat), so it starts playing before it has all arrived.
      expect(bytes.indexOf("moov"), v.src).toBeLessThan(bytes.indexOf("mdat"));
    }
  });

  it("ids are unique and fit in an address; a film's versions are one per language", () => {
    const ids = FILMS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const f of FILMS) {
      expect(f.versions.length).toBeGreaterThan(0);
      expect(new Set(f.versions.map((v) => v.lang)).size).toBe(f.versions.length);
    }
  });

  it("every film has words in both languages", () => {
    for (const f of FILMS)
      for (const lang of ["en", "ar"] as const) expect(f.title[lang] && f.body[lang]).toBeTruthy();
  });

  it("/film opens on the newest, lists the rest, and gives the others their own address", () => {
    expect(FEATURED).toBe(FILMS[0]);
    expect(filmById(FEATURED.id)).toBe(FEATURED);
    expect(filmById("not-a-film")).toBeUndefined();
    expect(othersThan(FEATURED.id)).toHaveLength(FILMS.length - 1);
    expect(filmHref(FEATURED)).toBe("/film");
    for (const f of othersThan(FEATURED.id)) expect(filmHref(f)).toBe(`/film/${f.id}`);
  });

  it("opens on the version asked for, else the one in your language, else the first", () => {
    const both = filmById("sarjy-in-a-minute")!;
    expect(pickVersion(both, "ar").lang).toBe("ar");
    expect(pickVersion(both, "en").lang).toBe("en");
    expect(pickVersion(both, "en", "ar").lang).toBe("ar");
    expect(pickVersion(both, "ar", "fr").lang).toBe("ar");
    const one = filmById("end-of-winter")!;
    expect(pickVersion(one, "en").lang).toBe(one.versions[0]!.lang);
  });

  it("says how long a film runs the way a player does", () => {
    expect(runningTime(68)).toBe("1:08");
    expect(runningTime(5)).toBe("0:05");
    expect(runningTime(600)).toBe("10:00");
  });
});
