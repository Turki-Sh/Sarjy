"use client";

// The page's light or dark, as the home page and the 404 read and change it: the same cookie and
// <html> attributes the voice screen uses, so a switch here holds there too. By default these pages
// follow the clock (useDaylight); the hero's greeting follows whatever is on screen, and the sun
// (or moon) over the dunes switches it when you click it.

import { useEffect, useSyncExternalStore } from "react";
import { nextTurnAfter, sceneLight } from "@/shared/daylight";
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

/**
 * Light to dark, or back. Remembered, with when: these pages keep your choice until the light next
 * changes, then follow the clock again (useDaylight).
 */
export function toggleTheme() {
  const html = document.documentElement;
  const next: Theme = read() === "dark" ? "light" : "dark";
  document.cookie = `${COOKIE.theme}=${next}; path=/; max-age=${YEAR}; samesite=lax`;
  document.cookie = `${COOKIE.themeAt}=${Date.now()}; path=/; max-age=${YEAR}; samesite=lax`;
  html.dataset.themeChoice = next;
  html.dataset.theme = next;
}

const cookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? null;

/** The theme you chose in Settings, as the voice screen draws it. */
function savedTheme(): Theme {
  const choice = cookie(COOKIE.theme);
  if (choice === "dark" || choice === "light") return choice;
  if (choice === "system") return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return "light";
}

/**
 * Day and night by the clock, for the home page and the 404 (Turki, Day 5), with your recent
 * choice winning until the light next changes (shared/daylight.ts). A script set it before the
 * first paint; this keeps it right while the page stays open, and hands the voice screen back
 * your own theme when you leave.
 */
export function useDaylight() {
  useEffect(() => {
    const html = document.documentElement;
    let timer = 0;
    const apply = () => {
      html.dataset.theme = sceneLight(cookie(COOKIE.theme), Number(cookie(COOKIE.themeAt)) || 0, new Date());
      timer = window.setTimeout(apply, nextTurnAfter(new Date()).getTime() - Date.now() + 1000);
    };
    apply();
    return () => {
      window.clearTimeout(timer);
      html.dataset.theme = savedTheme();
    };
  }, []);
}
