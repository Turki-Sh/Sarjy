// Theme and interface language are stored in cookies, so the server can render the right ones
// on the first paint (no flash of the wrong theme or direction).

import { isLang, type Lang } from "./i18n";

export const THEMES = ["light", "dark"] as const;
/** The theme actually drawn. */
export type Theme = (typeof THEMES)[number];
/** What you chose in settings: a theme, or "system" to follow the device. */
export type ThemeChoice = Theme | "system";
/** What you chose for the interface language: one, or "auto" to follow the browser. */
export type LangChoice = Lang | "auto";

export const COOKIE = { theme: "sarjy_theme", lang: "sarjy_lang", sidebar: "sarjy_sidebar" } as const;

export const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

/** Light is the default (brand rule); dark and "follow the device" are options. */
export const readThemeChoice = (value: string | undefined): ThemeChoice =>
  isTheme(value) || value === "system" ? value : "light";

/** The theme the server draws first. "system" starts light; a tiny script in <head> corrects it before paint. */
export const readTheme = (value: string | undefined): Theme => (isTheme(value) ? value : "light");

export const readLangChoice = (value: string | undefined): LangChoice => (isLang(value) ? value : "auto");

/** The saved language, else the browser's preferred language, else English. */
export function readLang(saved: string | undefined, acceptLanguage: string | null): Lang {
  if (isLang(saved)) return saved;
  const first = acceptLanguage?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return first === "ar" ? "ar" : "en";
}

/** The sidebar is open unless you closed it. */
export const readSidebarOpen = (value: string | undefined): boolean => value !== "closed";
