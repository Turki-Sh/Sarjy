// The films (Day 5): every film the site shows, newest first. Each has its own page at /film/<id>,
// its link for good (Turki: "each one should have a unique link"); /film opens on the newest. A film can come in more than one version
// (the same cut in English and in Arabic, say): the page offers them as a choice, not as two films.
// Adding a film is a new entry here, its files in public/video/ and its cards in scripts/og/; the
// pages, the lists (here and on the home page), the sitemap and the link previews follow.
//
// The files: H.264 High at level 4.1 or lower (1080p), AAC, with the index at the front so it starts
// before it has all arrived. iPhones and iPads refuse H.264 above level 5.2 outright (the first cut
// was 4K at level 6.0 and showed only a crossed-out play button there), and tests/unit/films.test.ts
// checks every file. With ffmpeg: -vf scale=1920:1080 -c:v libx264 -crf 18 -profile:v high
// -level:v 4.1 -c:a aac -movflags +faststart. A new cut gets a new file name, so no one is left
// with the old one in their cache. The poster is a still from the film, 1280 by 720.

import type { Lang } from "./i18n";

export type FilmVersion = {
  /** The language it is in (spoken, and on screen). It is also the version's key: ?v=en. */
  lang: Lang;
  /** Subtitles burned into the picture, if any. */
  subtitles?: Lang;
  /** The file, under public/. */
  src: string;
  /** A still to show before it plays, under public/. */
  poster: string;
};

export type FilmEntry = {
  /** Its address: /film/<id>. Lowercase words and hyphens, never changed once shared. */
  id: string;
  /** One or more versions of the same cut, the same length, so switching keeps your place. */
  versions: FilmVersion[];
  seconds: number;
  width: number;
  height: number;
  title: Record<Lang, string>;
  body: Record<Lang, string>;
  /** Its own link-preview card in each language (public/og/, drawn by scripts/og/cards-entry.ts). */
  card: Record<Lang, string>;
};

export const FILMS: FilmEntry[] = [
  {
    id: "the-star-in-the-well",
    versions: [
      {
        lang: "ar",
        src: "/video/the-star-in-the-well-ar-1080.mp4",
        poster: "/video/the-star-in-the-well-ar.jpg",
      },
      {
        lang: "en",
        src: "/video/the-star-in-the-well-en-1080.mp4",
        poster: "/video/the-star-in-the-well-en.jpg",
      },
    ],
    seconds: 106,
    width: 1920,
    height: 1080,
    title: { en: "The Star in the Well", ar: "سهيل في البير" },
    body: {
      en: "Summer is ending, and Suhail hasn't risen with his rain. The eight Rafeeqs follow a glow across the dunes to an old well, and find out why.",
      ar: "الصيف خلص، وسهيل ما طلع بمطره. الرفقاء الثمانية يلحقون نور بين الطعوس لين بير قديم، ويعرفون ليش.",
    },
    card: { en: "film-the-star-in-the-well.png", ar: "film-suhail-fi-albeer.png" },
  },
  {
    id: "end-of-winter",
    versions: [
      {
        lang: "ar",
        subtitles: "en",
        src: "/video/end-of-winter-1080.mp4",
        poster: "/video/end-of-winter.jpg",
      },
    ],
    seconds: 91,
    width: 1920,
    height: 1080,
    title: { en: "End of Winter", ar: "آخر الشتاء" },
    body: {
      en: "A winter night in the desert. Abu Saad asks Sarjy to keep the one thing he can't lose: how Umm Saad, God rest her, made her coffee.",
      ar: "ليلة شتا في البر. أبو سعد يوصّي سرجي على الشي الوحيد اللي ما يبي ينساه: قهوة أم سعد، الله يرحمها، وش كانت تحط فيها.",
    },
    card: { en: "film-end-of-winter.png", ar: "film-akhir-alshita.png" },
  },
  {
    id: "sarjy-in-a-minute",
    versions: [
      {
        lang: "en",
        src: "/video/sarjy-in-a-minute-en-1080.mp4",
        poster: "/video/sarjy-in-a-minute-en.jpg",
      },
      {
        lang: "ar",
        src: "/video/sarjy-in-a-minute-ar-1080.mp4",
        poster: "/video/sarjy-in-a-minute-ar.jpg",
      },
    ],
    seconds: 68,
    width: 1920,
    height: 1080,
    title: { en: "Sarjy, in a minute", ar: "سرجي في دقيقة" },
    body: {
      en: "Tell it once, and it remembers. How Sarjy works, from the first word to the Majlis.",
      ar: "قلها مرة وحدة ويتذكرها. كيف يشتغل سرجي، من أول كلمة لين المجلس.",
    },
    card: { en: "film-sarjy-in-a-minute.png", ar: "film-sarjy-fi-daqiqa.png" },
  },
];

/** The film /film opens on (it sends you to its page): the newest. */
export const FEATURED = FILMS[0]!;

export const filmById = (id: string): FilmEntry | undefined => FILMS.find((f) => f.id === id);

/** The other films, for the list under the one playing. */
export const othersThan = (id: string): FilmEntry[] => FILMS.filter((f) => f.id !== id);

/** A film's own address, the one to share: it never changes, however many films come after it. */
export const filmHref = (film: FilmEntry): string => `/film/${film.id}`;

/**
 * The version to start on: the one asked for (?v=), else the one in the page's language, else the
 * first.
 */
export function pickVersion(film: FilmEntry, lang: Lang, asked?: string | null): FilmVersion {
  return (
    film.versions.find((v) => v.lang === asked) ??
    film.versions.find((v) => v.lang === lang) ??
    film.versions[0]!
  );
}

/** How long it runs, the way a player shows it: 1:08. */
export const runningTime = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
