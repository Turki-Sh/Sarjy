// The 404 (Turki, Day 4): lost in the dunes with the Rafeeqs. The server picks the scene's seed,
// so the page it sends and the page the browser brings to life are the same scene; every visit
// draws a new one.

import { DAYLIGHT_SCRIPT } from "@/shared/daylight";
import type { Metadata } from "next";
import { Lost } from "@/client/ui/lost/Lost";
import { readPreferences } from "@/server/preferences";
import { LOST } from "@/shared/lost-copy";
import { freshSeed } from "@/shared/random";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await readPreferences();
  return { title: LOST[lang].title, robots: { index: false } };
}

export default async function NotFound() {
  const { lang } = await readPreferences();
  // A fresh scene per visit. (Not for anything secret: it only picks who is lost tonight.)
  return (
    <>
      {/* Day or night by your clock (or your recent choice), set before the page paints. */}
      <script dangerouslySetInnerHTML={{ __html: DAYLIGHT_SCRIPT }} />
      <Lost lang={lang} seed={freshSeed()} />
    </>
  );
}
