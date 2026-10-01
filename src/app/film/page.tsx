// /film: the newest film (Day 5), hosted with the app so the link is one place, and the others
// listed under it once there are more.

import type { Metadata } from "next";
import { Film } from "@/client/ui/film/Film";
import { readPreferences } from "@/server/preferences";
import { FEATURED, othersThan } from "@/shared/films";
import { filmMetadata, posterFor } from "./film-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await readPreferences();
  return filmMetadata(FEATURED, lang, "/film");
}

export default async function FilmPage() {
  const { lang } = await readPreferences();
  const others = othersThan(FEATURED.id).map((film) => ({ film, poster: posterFor(film, lang) }));
  return <Film lang={lang} film={FEATURED} poster={posterFor(FEATURED, lang)} others={others} />;
}
