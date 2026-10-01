// The voice screen, at /talk (the home page at / introduces Sarjy and leads here). The server
// passes the saved theme and language so the client starts in sync.

import type { Metadata } from "next";
import { VoiceScreen } from "@/client/ui/VoiceScreen";
import { readPreferences } from "@/server/preferences";
import { HOME } from "@/shared/home-copy";
import { t } from "@/shared/i18n";
import { cardImage, pickCard } from "@/shared/og";
import { freshSeed } from "@/shared/random";
import { SITE_NAME, TALK } from "@/shared/site";

// Its own link preview: the orb with Rider, "Tell it once." (Day 5).
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await readPreferences();
  const title = HOME[lang].finale.orb;
  const description = t(lang).description;
  const card = cardImage(pickCard("talk", lang, TALK));
  return {
    title,
    alternates: { canonical: TALK },
    openGraph: { type: "website", siteName: SITE_NAME, title, description, url: TALK, images: [card] },
    twitter: { card: "summary_large_image", title, description, images: [card] },
  };
}

export default async function Talk() {
  const { lang, langChoice, themeChoice, sidebarOpen, glass, wallpaper, rafeeq } = await readPreferences();
  return (
    <VoiceScreen
      initialLang={lang}
      initialLangChoice={langChoice}
      initialThemeChoice={themeChoice}
      initialSidebarOpen={sidebarOpen}
      initialGlass={glass}
      initialWallpaper={wallpaper}
      initialRafeeq={rafeeq}
      initialFreshLine={freshSeed()}
    />
  );
}
