// The films (Day 5): every film the site shows, newest first. /film plays the first one and lists
// the rest under it; each has its own page at /film/<id>. Adding a film is a new entry here and its
// file in public/video/; the pages, the list, the sitemap and the link previews follow.
//
// The file: H.264 High at level 4.1 or lower (1080p), AAC, with the index at the front so it starts
// before it has all arrived. iPhones and iPads refuse H.264 above level 5.2 outright (the first cut
// was 4K at level 6.0 and showed only a crossed-out play button there), and tests/unit/films.test.ts
// checks every file. With ffmpeg: -vf scale=1920:1080 -c:v libx264 -crf 18 -profile:v high
// -level:v 4.1 -c:a aac -movflags +faststart. A new cut gets a new file name, so no one is left
// with the old one in their cache.

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
    src: "/video/sarjy-in-a-minute-ar-1080.mp4",
    spoken: "ar",
    seconds: 68,
    width: 1920,
    height: 1080,
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
