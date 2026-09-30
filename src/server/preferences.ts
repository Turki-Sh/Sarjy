import "server-only";

// Reads the visitor's theme, interface language, glass and background for the first render
// (cookies, then Accept-Language).

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
import { readWallpaper } from "@/shared/wallpapers";

export async function readPreferences() {
  const jar = await cookies();
  const lang = readLang(jar.get(COOKIE.lang)?.value, (await headers()).get("accept-language"));
  const theme = readTheme(jar.get(COOKIE.theme)?.value);
  const themeChoice = readThemeChoice(jar.get(COOKIE.theme)?.value);
  const langChoice = readLangChoice(jar.get(COOKIE.lang)?.value);
  const sidebarOpen = readSidebarOpen(jar.get(COOKIE.sidebar)?.value);
  const glass = readGlass(jar.get(COOKIE.glass)?.value);
  /** You chose a glass level yourself: it wins over the device's "reduce transparency". */
  const glassSet = jar.has(COOKIE.glass);
  const wallpaper = readWallpaper(jar.get(COOKIE.wallpaper)?.value);
  return { lang, theme, themeChoice, langChoice, sidebarOpen, glass, glassSet, wallpaper };
}
