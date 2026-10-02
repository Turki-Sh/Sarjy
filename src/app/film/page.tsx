// /film: the newest film (Day 5), hosted with the app so the link is one place, with the others
// listed under it. ?v= picks a version (/film?v=en); without it, the one in your language.

import type { Metadata } from "next";
import { Film } from "@/client/ui/film/Film";
import { readPreferences } from "@/server/preferences";
import { DAYLIGHT_SCRIPT } from "@/shared/daylight";
import { FEATURED, pickVersion } from "@/shared/films";
import { filmMetadata } from "./film-metadata";

type Props = { searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { lang } = await readPreferences();
  const version = pickVersion(FEATURED, lang, (await searchParams).v);
  return filmMetadata(FEATURED, version, lang, "/film");
}

export default async function FilmPage({ searchParams }: Props) {
  const { lang } = await readPreferences();
  const version = pickVersion(FEATURED, lang, (await searchParams).v);
  return (
    <>
      {/* Day or night by your clock (or your recent choice), set before the page paints. */}
      <script dangerouslySetInnerHTML={{ __html: DAYLIGHT_SCRIPT }} />
      <Film lang={lang} film={FEATURED} version={version.lang} />
    </>
  );
}
