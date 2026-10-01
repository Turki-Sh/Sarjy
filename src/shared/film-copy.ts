// The film page's words (Day 5: Turki's short film about Sarjy, in Arabic, shown on the site).

import type { Lang } from "./i18n";

export const FILM: Record<Lang, { title: string; body: string; talk: string; home: string; label: string }> =
  {
    en: {
      title: "Sarjy, in a minute.",
      body: "A short film about Sarjy, in Arabic.",
      talk: "Talk to Sarjy",
      home: "Home",
      label: "The Sarjy film",
    },
    ar: {
      title: "سرجي في دقيقة.",
      body: "فيلم قصير عن سرجي.",
      talk: "كلّم سرجي",
      home: "الرئيسية",
      label: "فيلم سرجي",
    },
  };

/** The film itself: H.264 and AAC, set up to start playing before it has all arrived. */
export const FILM_SRC = "/film/sarjy-film-ar.mp4";
