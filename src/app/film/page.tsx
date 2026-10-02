// /film: the films, opening on the newest. It has its own link card (the films as a whole); each
// film has its own page, link and card at /film/<id>. Once it has loaded, the address bar shows
// the newest film's own link, so what you copy from it is that film's. ?v= picks a version.

import type { Metadata } from "next";
import { Film } from "@/client/ui/film/Film";
import { readPreferences } from "@/server/preferences";
import { DAYLIGHT_SCRIPT } from "@/shared/daylight";
import { FILM } from "@/shared/film-copy";
import { FEATURED, pickVersion } from "@/shared/films";
import { cardImage, pickCard } from "@/shared/og";
import { SITE_NAME } from "@/shared/site";

type Props = { searchParams: Promise<{ v?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await readPreferences();
  const { title, body: description } = FILM[lang].index;
  const card = cardImage(pickCard("film", lang, "/film"));
  return {
    title,
    description,
    alternates: { canonical: "/film" },
    openGraph: { type: "website", siteName: SITE_NAME, title, description, url: "/film", images: [card] },
    twitter: { card: "summary_large_image", title, description, images: [card] },
  };
}

export default async function FilmPage({ searchParams }: Props) {
  const { lang } = await readPreferences();
  const version = pickVersion(FEATURED, lang, (await searchParams).v);
  return (
    <>
      {/* Day or night by your clock (or your recent choice), set before the page paints. */}
      <script dangerouslySetInnerHTML={{ __html: DAYLIGHT_SCRIPT }} />
      <Film lang={lang} film={FEATURED} version={version.lang} landing />
    </>
  );
}
