// Day and night on the home page and the 404 (Turki, Day 5): they follow the clock where you are
// (day from 6 in the morning to 6 in the evening), and your own choice of light or dark wins for
// a while: until the light next changes, then they go back to the clock.
//
// `sceneLight` is written to stand alone (no imports, nothing from outside), because the same
// function also runs as a tiny script before the page paints, so there is no flash of the wrong
// light (see pre-paint scripts in app/page.tsx and app/not-found.tsx).

import { COOKIE } from "./preferences";

export type Light = "light" | "dark";

/**
 * The light for these pages now. `choice` and `chosenAt` are your last choice of light or dark and
 * when you made it; anything else ("system", nothing) means no choice.
 */
export function sceneLight(choice: string | null, chosenAt: number, now: Date): Light {
  const DAWN = 6;
  const DUSK = 18;
  const isDay = (t: Date) => t.getHours() >= DAWN && t.getHours() < DUSK;
  /** The next time the light changes after `t`: 6 in the morning or 6 in the evening. */
  const nextTurn = (t: Date) => {
    const n = new Date(t.getTime());
    n.setMinutes(0, 0, 0);
    const h = t.getHours();
    if (h < DAWN) n.setHours(DAWN);
    else if (h < DUSK) n.setHours(DUSK);
    else {
      n.setDate(n.getDate() + 1);
      n.setHours(DAWN);
    }
    return n;
  };
  const chose = (choice === "light" || choice === "dark") && chosenAt > 0;
  if (chose && now.getTime() < nextTurn(new Date(chosenAt)).getTime()) return choice as Light;
  return isDay(now) ? "light" : "dark";
}

/** When the light next changes after `now`, so a page left open can turn with it. */
export function nextTurnAfter(now: Date): Date {
  const n = new Date(now.getTime());
  n.setMinutes(0, 0, 0);
  const h = now.getHours();
  if (h < 6) n.setHours(6);
  else if (h < 18) n.setHours(18);
  else {
    n.setDate(n.getDate() + 1);
    n.setHours(6);
  }
  return n;
}

/**
 * The script that runs before these pages paint: it reads the two cookies and the clock, and sets
 * <html data-theme> (the server can't know your clock). Built from `sceneLight` itself.
 */
export const DAYLIGHT_SCRIPT = `(function(){var c=function(n){var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):null};var f=${sceneLight.toString()};document.documentElement.dataset.theme=f(c(${JSON.stringify(COOKIE.theme)}),Number(c(${JSON.stringify(COOKIE.themeAt)}))||0,new Date())})()`;
