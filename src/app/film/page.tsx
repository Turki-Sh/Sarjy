// /film: Turki's short film about Sarjy (Day 5), hosted with the app so the link is one place.

import type { Metadata } from "next";
import { Film } from "@/client/ui/film/Film";
import { readPreferences } from "@/server/preferences";
import { FILM, FILM_SRC } from "@/shared/film-copy";
import { cardImage, pickCard } from "@/shared/og";
import { SITE_NAME } from "@/shared/site";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await readPreferences();
  const { title, body: description } = FILM[lang];
  const card = cardImage(pickCard("home", lang, "/film"));
  return {
    title,
    description,
    alternates: { canonical: "/film" },
    openGraph: {
      type: "video.other",
      siteName: SITE_NAME,
      title,
      description,
      url: "/film",
      images: [card],
      videos: [{ url: FILM_SRC, type: "video/mp4", width: 3840, height: 2160 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [card] },
  };
}

export default async function FilmPage() {
  const { lang } = await readPreferences();
  return <Film lang={lang} poster={cardImage(pickCard("home", lang, "/film")).url} />;
}
