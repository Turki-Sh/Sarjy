"use client";

// The home page (Turki, Day 4): it introduces Sarjy and leads into the voice screen at /talk, with
// the Rafeeqs living in every section rather than sitting in a showcase. Top to bottom: the hero,
// the promise told as a story, a day with Sarjy, the eight companions, the Majlis, the reins, the
// films, and a last chance to pick who rides with you. A little companion rides along the page
// with you.

import type { Lang } from "@/shared/i18n";
import { dir } from "@/shared/i18n";
import type { Visitor } from "@/shared/visitor";
import { castHome } from "./cast";
import { Companion } from "./Companion";
import { DayOnTheRoad } from "./DayOnTheRoad";
import { Finale } from "./Finale";
import { FilmsReel } from "./FilmsReel";
import { Footer } from "./Footer";
import { Gallery } from "./Gallery";
import { Hero } from "./Hero";
import styles from "./Home.module.css";
import { MajlisRoom } from "./MajlisRoom";
import { Nav } from "./Nav";
import { PromiseStory } from "./PromiseStory";
import { Reins } from "./Reins";
import { useDaylight } from "./theme";

export function Home({ lang, visitor }: { lang: Lang; visitor: Visitor | null }) {
  const cast = castHome(visitor?.rafeeq ?? null);
  useDaylight();
  return (
    <div className={styles.home} lang={lang} dir={dir(lang)}>
      <Nav lang={lang} />
      <main>
        <Hero lang={lang} visitor={visitor} cast={cast} />
        <PromiseStory lang={lang} />
        <DayOnTheRoad lang={lang} />
        <Gallery lang={lang} visitor={visitor} />
        <MajlisRoom lang={lang} />
        <Reins lang={lang} />
        <FilmsReel lang={lang} />
        <Finale lang={lang} />
      </main>
      <Footer lang={lang} />
      <Companion lang={lang} id={cast.perch} level={visitor?.rafeeq ? visitor.level : 4} />
    </div>
  );
}
