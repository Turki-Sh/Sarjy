// The voice screen. The server passes the saved theme and language so the client starts in sync.

import { VoiceScreen } from "@/client/ui/VoiceScreen";
import { readPreferences } from "@/server/preferences";

export default async function Home() {
  const { lang, langChoice, themeChoice, sidebarOpen, glass } = await readPreferences();
  return (
    <VoiceScreen
      initialLang={lang}
      initialLangChoice={langChoice}
      initialThemeChoice={themeChoice}
      initialSidebarOpen={sidebarOpen}
      initialGlass={glass}
    />
  );
}
