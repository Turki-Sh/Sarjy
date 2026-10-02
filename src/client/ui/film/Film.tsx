// A film page (Day 5, redesigned the same day: Turki, "match the rest of the site"): the home
// page's bar and foot, light or dark, English or Arabic, with the film in the middle. The words
// come first (what it is, how long, in what language), then the screen with its glow, the choice
// of version when there is more than one, and the other films on a shelf below.

import Link from "next/link";
import type { FilmEntry } from "@/shared/films";
import { othersThan } from "@/shared/films";
import { FILM } from "@/shared/film-copy";
import type { Lang } from "@/shared/i18n";
import { dir } from "@/shared/i18n";
import { TALK } from "@/shared/site";
import { Footer } from "../home/Footer";
import home from "../home/Home.module.css";
import { Nav } from "../home/Nav";
import styles from "./Film.module.css";
import { FilmPlayer } from "./FilmPlayer";
import { FilmShelf } from "./FilmShelf";
import { PopcornRain } from "./PopcornRain";

/** `landing`: shown at /film, which then puts the film's own link in the address bar. */
export function Film({
  lang,
  film,
  version,
  landing = false,
}: {
  lang: Lang;
  film: FilmEntry;
  version: Lang;
  landing?: boolean;
}) {
  const s = FILM[lang];
  const others = othersThan(film.id);
  return (
    <div className={home.home} lang={lang} dir={dir(lang)}>
      <Nav lang={lang} at="films" />
      <main>
        <section className={styles.hero} aria-labelledby="film-title">
          <div className={styles.intro}>
            <div>
              <p className={home.kicker}>{s.kicker}</p>
              <h1 id="film-title" className={styles.title}>
                {film.title[lang]}
              </h1>
            </div>
            <div className={styles.aside}>
              <p className={home.lede}>{film.body[lang]}</p>
              <Link href={TALK} className={styles.talk}>
                {s.talk}
              </Link>
            </div>
          </div>
          <FilmPlayer lang={lang} film={film} initial={version} landing={landing} />
        </section>
        {others.length > 0 && <FilmShelf lang={lang} films={others} />}
      </main>
      <Footer lang={lang} />
      <PopcornRain lang={lang} />
    </div>
  );
}
