import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CARDS, pickCard, type CardKind } from "@/shared/og";

const KINDS: CardKind[] = [
  "home",
  "weather",
  "weather_tomorrow",
  "recall",
  "saved",
  "chat",
  "image",
  "majlis",
  "talk",
  "film",
  "lost",
  "handbook",
];

describe("link preview cards", () => {
  it("every card file exists", () => {
    for (const c of CARDS) expect(existsSync(`public/og/${c.file}`), c.file).toBe(true);
  });

  it("every kind of link has a card in both languages", () => {
    for (const kind of KINDS) {
      for (const lang of ["en", "ar"] as const) expect(pickCard(kind, lang, "x").file).toBeTruthy();
    }
  });

  it("the same link always gets the same card", () => {
    expect(pickCard("recall", "en", "K7Q2M").file).toBe(pickCard("recall", "en", "K7Q2M").file);
  });

  it("different links get different cards when there is a choice", () => {
    const files = new Set(Array.from({ length: 40 }, (_, i) => pickCard("chat", "en", `link-${i}`).file));
    expect(files.size).toBeGreaterThan(1);
  });

  it("matches the card to the link", () => {
    expect(pickCard("weather_tomorrow", "en", "a").file).toBe("tomorrow-at-a-glance.png");
    expect(pickCard("handbook", "en", "a").file).toBe("notes-from-building.png");
    expect(pickCard("majlis", "ar", "a").file).toBe("majlis-hayyak.png");
    expect(pickCard("majlis", "en", "a").file).toBe("majlis-pull-up-a-cushion.png");
    expect(pickCard("home", "en", "a").file).toBe("home-shaped-to-its-rider.png");
    expect(pickCard("home", "ar", "a").file).toBe("home-ala-maqas-farisah.png");
    expect(pickCard("talk", "en", "a").file).toBe("talk-tell-it-once.png");
    expect(pickCard("talk", "ar", "a").file).toBe("talk-qulha-marra.png");
    expect(pickCard("film", "en", "a").file).toBe("film-now-showing.png");
    expect(pickCard("film", "ar", "a").file).toBe("film-yiradh-alhin.png");
    expect(pickCard("lost", "en", "a").file).toBe("lost-not-a-real-page.png");
    expect(pickCard("lost", "ar", "a").file).toBe("lost-mo-mawjouda.png");
    expect(pickCard("image", "en", "a").file).toBe("little-things-big-picture.png");
    expect(["cassette-sunday.png", "record-sunday.png", "thought-and-reply.png"]).toContain(
      pickCard("recall", "en", "z").file,
    );
  });

  it("prefers Arabic cards for Arabic links", () => {
    expect(pickCard("saved", "ar", "q").lang).toBe("ar");
  });
});
