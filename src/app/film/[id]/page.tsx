// /film/<id>: one film, with the others listed under it. The newest lives at /film, so its own
// address sends you there (once a newer one comes, its address becomes its page).

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Film } from "@/client/ui/film/Film";
import { readPreferences } from "@/server/preferences";
import { DAYLIGHT_SCRIPT } from "@/shared/daylight";
import { FEATURED, filmById, pickVersion } from "@/shared/films";
import { filmMetadata } from "../film-metadata";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const film = filmById((await params).id);
  if (!film) return {};
  const { lang } = await readPreferences();
  const version = pickVersion(film, lang, (await searchParams).v);
  return filmMetadata(film, version, lang, `/film/${film.id}`);
}

export default async function FilmByIdPage({ params, searchParams }: Props) {
  const film = filmById((await params).id);
  if (!film) notFound();
  const { v } = await searchParams;
  if (film.id === FEATURED.id) redirect(v ? `/film?v=${encodeURIComponent(v)}` : "/film");
  const { lang } = await readPreferences();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DAYLIGHT_SCRIPT }} />
      <Film lang={lang} film={film} version={pickVersion(film, lang, v).lang} />
    </>
  );
}
