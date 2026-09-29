import "server-only";

// Reads the visitor's theme and interface language for the first render (cookies, then Accept-Language).

import { cookies, headers } from "next/headers";
import { COOKIE, readLang, readTheme } from "@/shared/preferences";

export async function readPreferences() {
  const jar = await cookies();
  const lang = readLang(jar.get(COOKIE.lang)?.value, (await headers()).get("accept-language"));
  const theme = readTheme(jar.get(COOKIE.theme)?.value);
  return { lang, theme };
}
