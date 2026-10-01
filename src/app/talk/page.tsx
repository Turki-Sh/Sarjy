// The voice screen, at /talk (the home page at / introduces Sarjy and leads here). The server
// passes the saved theme and language so the client starts in sync.

import type { Metadata } from "next";
import { VoiceScreen } from "@/client/ui/VoiceScreen";
import { readPreferences } from "@/server/preferences";
import { freshSeed } from "@/shared/random";
import { TALK } from "@/shared/site";

export const metadata: Metadata = { alternates: { canonical: TALK } };

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
