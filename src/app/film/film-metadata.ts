// What a film page tells link previews: the film's own title and words, its card (or poster), and
// the video itself, so apps that can play it in place do.

import type { Metadata } from "next";
import type { FilmEntry } from "@/shared/films";
import type { Lang } from "@/shared/i18n";
import { cardImage, pickCard } from "@/shared/og";
import { SITE_NAME } from "@/shared/site";

/** The still shown before a film plays: its own, or the film card in the page's language. */
export const posterFor = (film: FilmEntry, lang: Lang): string =>
  film.poster ?? cardImage(pickCard("film", lang, film.id)).url;

export function filmMetadata(film: FilmEntry, lang: Lang, path: string): Metadata {
  const title = film.title[lang];
  const description = film.body[lang];
  const card = cardImage(pickCard("film", lang, film.id));
  const image = film.poster ? { ...card, url: film.poster } : card;
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
      videos: [{ url: film.src, type: "video/mp4", width: film.width, height: film.height }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
