// What a film page tells link previews: the film's own title and words, its own card in the
// page's language, and the video itself (the version being shown), so apps that can play it in
// place do.

import type { Metadata } from "next";
import type { FilmEntry, FilmVersion } from "@/shared/films";
import type { Lang } from "@/shared/i18n";
import { cardByFile, cardImage, pickCard } from "@/shared/og";
import { SITE_NAME } from "@/shared/site";

export function filmMetadata(film: FilmEntry, version: FilmVersion, lang: Lang, path: string): Metadata {
  const title = film.title[lang];
  const description = film.body[lang];
  const image = cardImage(cardByFile(film.card[lang]) ?? pickCard("film", lang, film.id));
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "video.other",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [image],
      videos: [{ url: version.src, type: "video/mp4", width: film.width, height: film.height }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
