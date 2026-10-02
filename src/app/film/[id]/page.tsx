// /film/<id>: one film, with the others on a shelf under it. Its address is its link for good,
// whether it is the newest or not (/film sends you to the newest's). ?v= picks a version.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Film } from "@/client/ui/film/Film";
import { readPreferences } from "@/server/preferences";
import { DAYLIGHT_SCRIPT } from "@/shared/daylight";
import { filmById, filmHref, pickVersion } from "@/shared/films";
import { filmMetadata } from "../film-metadata";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const film = filmById((await params).id);
  if (!film) return {};
  const { lang } = await readPreferences();
  const version = pickVersion(film, lang, (await searchParams).v);
  return filmMetadata(film, version, lang, filmHref(film));
}

export default async function FilmByIdPage({ params, searchParams }: Props) {
  const film = filmById((await params).id);
  if (!film) notFound();
  const { lang } = await readPreferences();
  const { v } = await searchParams;
  return (
    <>
      {/* Day or night by your clock (or your recent choice), set before the page paints. */}
      <script dangerouslySetInnerHTML={{ __html: DAYLIGHT_SCRIPT }} />
      <Film lang={lang} film={film} version={pickVersion(film, lang, v).lang} />
    </>
  );
}
