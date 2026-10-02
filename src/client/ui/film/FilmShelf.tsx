"use client";

// The other films, on a shelf under the one playing: each its poster (in your language's version),
// its title, how long it runs and what it is in. They come in one after another as the shelf
// scrolls into view, like the home page's sections.

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import type { FilmEntry } from "@/shared/films";
import { filmHref, pickVersion, runningTime } from "@/shared/films";
import { FILM } from "@/shared/film-copy";
import type { Lang } from "@/shared/i18n";
import { Icon } from "../Icon";
import home from "../home/Home.module.css";
import { useInView } from "../scene/hooks";
import styles from "./Film.module.css";

export function FilmShelf({ lang, films }: { lang: Lang; films: FilmEntry[] }) {
  const s = FILM[lang];
  const shelf = useRef<HTMLElement>(null);
  const inView = useInView(shelf, "0px 0px -15% 0px");
  // Once in, they stay in: scrolling back up doesn't hide them again.
  const [seen, setSeen] = useState(false);
  if (inView && !seen) setSeen(true);
  return (
    <section
      ref={shelf}
      id="more"
      className={`${home.section} ${styles.shelf}`}
      data-in={seen || undefined}
      aria-labelledby="more-films"
    >
      <h2 id="more-films" className={styles.shelfTitle}>
        {s.more}
      </h2>
      <ul className={styles.list}>
        {films.map((film, i) => {
          const v = pickVersion(film, lang);
          return (
            <li key={film.id} style={{ "--i": i } as CSSProperties}>
              <Link href={filmHref(film)} className={styles.item} aria-label={s.play(film.title[lang])}>
                <span className={styles.still}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a fixed still from public/ */}
                  <img src={v.poster} alt="" width={1280} height={720} loading="lazy" />
                  <span className={styles.playBadge}>
                    <Icon name="play" />
                  </span>
                  <span className={styles.runtime} dir="ltr">
                    {runningTime(film.seconds)}
                  </span>
                </span>
                <span className={styles.itemTitle}>{film.title[lang]}</span>
                <span className={styles.itemBody}>{film.body[lang]}</span>
                <span className={styles.itemMeta}>
                  {film.versions.map((x) => s.spoken(x.lang, x.subtitles)).join(" · ")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
