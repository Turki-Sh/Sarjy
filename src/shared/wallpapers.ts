// The background behind everything (Settings, Appearance; Turki's direction, Day 2): the light
// field Sarjy has always had, one of three rugs Turki chose, or your own picture. The rugs live in
// public/wallpapers (1500 px), with 240 x 160 thumbnails for the picker.

import type { Lang } from "./i18n";

export const WALLPAPERS = [
  { id: "crimson", name: { en: "Crimson", ar: "قرمزي" } },
  { id: "midnight", name: { en: "Midnight", ar: "كحلي" } },
  { id: "sunlit", name: { en: "Sunlit", ar: "شمس العصر" } },
] as const satisfies readonly { id: string; name: Record<Lang, string> }[];

export type WallpaperId = (typeof WALLPAPERS)[number]["id"];

/**
 * What the cookie holds: "none" (the light field), a rug, or "own-<version>" for your own picture.
 * The version is when you uploaded it, so a new upload gets a new address and the browser never
 * shows the old one from its cache.
 */
export type WallpaperChoice = "none" | WallpaperId | `own-${number}`;

/** The most your own picture may weigh once shrunk in the browser (it is about 300 to 600 KB). */
export const OWN_WALLPAPER_MAX_BYTES = 2_500_000;

const isRug = (value: string): value is WallpaperId => WALLPAPERS.some((w) => w.id === value);

export function readWallpaper(value: string | undefined): WallpaperChoice {
  if (!value) return "none";
  if (isRug(value)) return value;
  const own = /^own-(\d{1,15})$/.exec(value);
  return own ? `own-${Number(own[1])}` : "none";
}

/** Where to load the background from; null for the light field. */
export function wallpaperUrl(choice: WallpaperChoice): string | null {
  if (choice === "none") return null;
  if (choice.startsWith("own-")) return `/api/wallpaper?v=${choice.slice(4)}`;
  return `/wallpapers/${choice}.jpg`;
}

export const wallpaperThumb = (id: WallpaperId) => `/wallpapers/thumbs/${id}.jpg`;
