// The films (Day 5): every film the site shows, newest first. /film plays the first one and lists
// the rest under it; each has its own page at /film/<id>. Adding a film is a new entry here and its
// file in public/video/ (H.264 and AAC, with the index at the front so it starts before it has all
// arrived); the pages, the list, the sitemap and the link previews follow.

import type { Lang } from "./i18n";

export type FilmEntry = {
  /** Its address: /film/<id>. Lowercase words and hyphens, never changed once shared. */
  id: string;
  /** The file, under public/. */
  src: string;
  /** The language spoken in it. */
  spoken: Lang;
  seconds: number;
  width: number;
  height: number;
  title: Record<Lang, string>;
  body: Record<Lang, string>;
  /** A still to show before it plays, under public/. Without one, the film card is used. */
  poster?: string;
};

export const FILMS: FilmEntry[] = [
  {
    id: "sarjy-in-a-minute",
    src: "/video/sarjy-in-a-minute-ar.mp4",
    spoken: "ar",
    seconds: 68,
    width: 3840,
    height: 2160,
    title: { en: "Sarjy, in a minute.", ar: "سرجي في دقيقة." },
    body: { en: "A short film about Sarjy, in Arabic.", ar: "فيلم قصير عن سرجي." },
  },
];

/** The film /film opens on: the newest. */
export const FEATURED = FILMS[0]!;

export const filmById = (id: string): FilmEntry | undefined => FILMS.find((f) => f.id === id);

/** The other films, for the list under the one playing. */
export const othersThan = (id: string): FilmEntry[] => FILMS.filter((f) => f.id !== id);

/** How long it runs, the way a player shows it: 1:08. */
export const runningTime = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
