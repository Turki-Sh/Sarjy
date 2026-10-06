// Link previews (Open Graph cards). Every link picks a card by what it is about and the language
// it is in: Turki's illustrated cards (public/og/), so a shared weather answer looks like weather
// and a saved fact like a keepsake, and the cards drawn with the Rafeeqs in them (Day 5, by
// scripts/og/) for the home page, a Majlis invite, the voice screen, the films and the 404.
//
// The choice is deterministic: the same link always gets the same card (crawlers cache previews,
// and a card should not change under someone's message), but different links get different cards.

export type CardKind =
  | "home" // the home page, and any page with no card of its own
  | "weather" // a shared weather answer
  | "weather_tomorrow" // a shared answer about tomorrow
  | "recall" // Sarjy answering from memory ("You told me on Sunday")
  | "saved" // Sarjy keeping a new fact
  | "chat" // any other shared moment
  | "image" // a moment with a picture in it
  | "majlis" // an invite to a Majlis (multiplayer room)
  | "talk" // the voice screen, /talk
  | "film" // the films as a whole, /film (each film has its own, by file, in shared/films.ts)
  | "lost" // the 404: a page that isn't there
  | "handbook"; // the Sarjy Handbook (the build notes)

export type Card = {
  file: string;
  alt: string;
  kinds: CardKind[];
  /** The language written on the card, or "any" when it reads in both. */
  lang: "en" | "ar" | "any";
};

export const CARDS: Card[] = [
  {
    file: "little-more-you.png",
    alt: "A little more you. A voice assistant that remembers.",
    kinds: ["saved", "chat"],
    lang: "en",
  },
  {
    file: "cassette-sunday.png",
    alt: "Some things stay with you. A cassette labelled: You told me on Sunday.",
    kinds: ["recall"],
    lang: "en",
  },
  {
    file: "hafazt-kalamak.png",
    alt: "حفظت كلامك: I kept your words. From a shared conversation.",
    kinds: ["saved", "recall"],
    lang: "ar",
  },
  {
    file: "one-small-thing.png",
    alt: "شيء صغير يخصك: one small thing, yours.",
    kinds: ["saved", "chat"],
    lang: "ar",
  },
  {
    file: "notes-from-building.png",
    alt: "Small things, made to matter. Notes from building Sarjy.",
    kinds: ["handbook"],
    lang: "en",
  },
  {
    file: "little-things-big-picture.png",
    alt: "Little things, big picture. Remember this.",
    kinds: ["image", "chat"],
    lang: "en",
  },
  {
    file: "thought-and-reply.png",
    alt: "A thought, a reply. What did I tell you? You prefer Celsius.",
    kinds: ["recall", "chat"],
    lang: "en",
  },
  {
    file: "little-more-personal.png",
    alt: "A little more personal. A voice assistant that remembers.",
    kinds: ["chat"],
    lang: "en",
  },
  {
    file: "room-for-little-things.png",
    alt: "Room for the little things. Keep something good.",
    kinds: ["saved", "chat"],
    lang: "en",
  },
  {
    file: "useful-unexpected.png",
    alt: "Useful, and a little unexpected. An example weather result.",
    kinds: ["weather"],
    lang: "any",
  },
  {
    file: "record-sunday.png",
    alt: "You told me on Sunday. Selected words from Sarjy.",
    kinds: ["recall"],
    lang: "en",
  },
  {
    file: "tomorrow-at-a-glance.png",
    alt: "Tomorrow, at a glance. A shared weather snapshot.",
    kinds: ["weather_tomorrow", "weather"],
    lang: "any",
  },
  // Drawn from the app's own pieces (scripts/og/cards-entry.ts).
  {
    file: "home-shaped-to-its-rider.png",
    alt: "Shaped to its rider. All eight Rafeeqs crossing the dunes under a big sun, Rider leading.",
    kinds: ["home"],
    lang: "en",
  },
  {
    file: "home-ala-maqas-farisah.png",
    alt: "على مقاس فارسه: all eight Rafeeqs crossing the dunes under a big sun, Rider leading.",
    kinds: ["home"],
    lang: "ar",
  },
  {
    file: "majlis-pull-up-a-cushion.png",
    alt: "Pull up a cushion. Eight Rafeeqs on eight cushions around a finjan: an invite to a Majlis.",
    kinds: ["majlis"],
    lang: "en",
  },
  {
    file: "majlis-hayyak.png",
    alt: "حيّاك، المجلس عامر: eight Rafeeqs around a finjan, an invite to a Majlis.",
    kinds: ["majlis"],
    lang: "ar",
  },
  {
    file: "talk-tell-it-once.png",
    alt: "Tell it once. The orb, and Rider saying Noted.",
    kinds: ["talk"],
    lang: "en",
  },
  {
    file: "talk-qulha-marra.png",
    alt: "قلها مرة وحدة: the orb, and Rider saying it kept it.",
    kinds: ["talk"],
    lang: "ar",
  },
  // The films: /film's own pair, for the films as a whole...
  {
    file: "films-sarjy-films.png",
    alt: "Sarjy films. An open-air screen in the dunes at night, the orb on it, five Rafeeqs on cushions watching.",
    kinds: ["film"],
    lang: "en",
  },
  {
    file: "films-aflam-sarjy.png",
    alt: "أفلام سرجي: an open-air screen in the dunes at night, the orb on it, five Rafeeqs on cushions watching.",
    kinds: ["film"],
    lang: "ar",
  },
  // ...and each film's own, at its own link (shared/films.ts names them; no kind picks them).
  {
    file: "film-the-star-in-the-well.png",
    alt: "The Star in the Well. An old stone well in the dunes at night, light pouring out of it and a little star peeking over the rim, Fennec and Keeper beside it.",
    kinds: [],
    lang: "en",
  },
  {
    file: "film-suhail-fi-albeer.png",
    alt: "سهيل في البير: an old stone well in the dunes at night, light pouring out of it and a little star peeking over the rim, Fennec and Keeper beside it.",
    kinds: [],
    lang: "ar",
  },
  {
    file: "film-end-of-winter.png",
    alt: "End of Winter. A winter night in the desert: Lantern by the fire, the dallah on the coals, Keeper on a Sadu cushion with a finjan.",
    kinds: [],
    lang: "en",
  },
  {
    file: "film-akhir-alshita.png",
    alt: "آخر الشتاء: a winter night in the desert, Lantern by the fire, the dallah on the coals, Keeper on a Sadu cushion with a finjan.",
    kinds: [],
    lang: "ar",
  },
  {
    file: "film-sarjy-in-a-minute.png",
    alt: "Sarjy, in a minute. A bright day on the dunes: the orb, a brass hourglass running beside it, Rider watching the sand.",
    kinds: [],
    lang: "en",
  },
  {
    file: "film-sarjy-fi-daqiqa.png",
    alt: "سرجي في دقيقة: a bright day on the dunes, the orb, a brass hourglass running beside it, Rider watching the sand.",
    kinds: [],
    lang: "ar",
  },
  {
    file: "lost-not-a-real-page.png",
    alt: "This page isn't real. 404 with the moon for the zero, and Fennec holding the map upside down.",
    kinds: ["lost"],
    lang: "en",
  },
  {
    file: "lost-mo-mawjouda.png",
    alt: "هالصفحة مو موجودة أصلًا: 404 with the moon for the zero, and Fennec holding the map upside down.",
    kinds: ["lost"],
    lang: "ar",
  },
];

/** A small, stable hash (FNV-1a), so a seed always maps to the same card. */
export function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The card for a link. Prefers cards written in the link's language, then cards that read in
 * both, then any card of the right kind; falls back to a general "chat" card.
 */
export function pickCard(kind: CardKind, lang: "en" | "ar", seed: string): Card {
  const ofKind = (k: CardKind) => CARDS.filter((c) => c.kinds.includes(k));
  let pool = ofKind(kind);
  if (kind === "weather_tomorrow" && !pool.length) pool = ofKind("weather");
  if (!pool.length) pool = ofKind("chat");

  const sameLang = pool.filter((c) => c.lang === lang);
  const either = pool.filter((c) => c.lang === "any");
  const choices = sameLang.length ? sameLang : either.length ? either : pool;
  return choices[hash(`${kind}:${seed}`) % choices.length]!;
}

/** A card by its file name (a film names its own). */
export function cardByFile(file: string): Card | undefined {
  return CARDS.find((c) => c.file === file);
}

/** Open Graph image metadata for a card. */
export function cardImage(card: Card) {
  return { url: `/og/${card.file}`, width: 1200, height: 630, alt: card.alt, type: "image/png" };
}
