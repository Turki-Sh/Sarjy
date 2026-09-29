import "server-only";

// Reads the visitor's theme and interface language for the first render (cookies, then Accept-Language).

import { cookies, headers } from "next/headers";
import {
  COOKIE,
  readGlass,
  readLang,
  readLangChoice,
  readSidebarOpen,
  readTheme,
  readThemeChoice,
} from "@/shared/preferences";

export async function readPreferences() {
  const jar = await cookies();
  const lang = readLang(jar.get(COOKIE.lang)?.value, (await headers()).get("accept-language"));
  const theme = readTheme(jar.get(COOKIE.theme)?.value);
  const themeChoice = readThemeChoice(jar.get(COOKIE.theme)?.value);
  const langChoice = readLangChoice(jar.get(COOKIE.lang)?.value);
  const sidebarOpen = readSidebarOpen(jar.get(COOKIE.sidebar)?.value);
  const glass = readGlass(jar.get(COOKIE.glass)?.value);
  return { lang, theme, themeChoice, langChoice, sidebarOpen, glass };
}
