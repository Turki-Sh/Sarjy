"use client";

// The page's light or dark, as the home page reads and changes it: the same cookie and <html>
// attributes the voice screen uses, so a switch here holds there too. The hero's greeting follows
// it, and the sun (or moon) over the dunes switches it when you click it.

import { useSyncExternalStore } from "react";
import { COOKIE } from "@/shared/preferences";

export type Theme = "light" | "dark";
const YEAR = 60 * 60 * 24 * 365;

const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

function subscribe(onChange: () => void) {
  const watch = new MutationObserver(onChange);
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => watch.disconnect();
}

/** The theme on screen now, or null while the server renders (it can't know "follow my device"). */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** Light to dark, or back, remembered for next time. */
export function toggleTheme() {
  const html = document.documentElement;
  const next: Theme = read() === "dark" ? "light" : "dark";
  document.cookie = `${COOKIE.theme}=${next}; path=/; max-age=${YEAR}; samesite=lax`;
  html.dataset.themeChoice = next;
  html.dataset.theme = next;
}
