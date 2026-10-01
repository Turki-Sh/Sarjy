// /film/<id>: one film, with the others listed under it. The newest lives at /film, so its own
// address sends you there (once a newer one comes, its address becomes its page).

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Film } from "@/client/ui/film/Film";
import { readPreferences } from "@/server/preferences";
import { FEATURED, filmById, othersThan } from "@/shared/films";
import { filmMetadata, posterFor } from "../film-metadata";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const film = filmById((await params).id);
  if (!film) return {};
  const { lang } = await readPreferences();
  return filmMetadata(film, lang, `/film/${film.id}`);
}

export default async function FilmByIdPage({ params }: Props) {
  const film = filmById((await params).id);
  if (!film) notFound();
  if (film.id === FEATURED.id) redirect("/film");
  const { lang } = await readPreferences();
  const others = othersThan(film.id).map((f) => ({ film: f, poster: posterFor(f, lang) }));
  return <Film lang={lang} film={film} poster={posterFor(film, lang)} others={others} />;
}
