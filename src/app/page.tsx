// The voice screen. The server passes the saved theme and language so the client starts in sync.

import { VoiceScreen } from "@/client/ui/VoiceScreen";
import { readPreferences } from "@/server/preferences";

export default async function Home() {
  const { lang, theme, sidebarOpen } = await readPreferences();
  return <VoiceScreen initialLang={lang} initialTheme={theme} initialSidebarOpen={sidebarOpen} />;
}
