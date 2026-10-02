"use client";

// The other films, on a shelf under the one playing: each its poster (in your language's version),
// its title, how long it runs and what it is in. They come in one after another as the shelf
// scrolls into view, like the home page's sections. A few sit in a grid; past ROW_AFTER they make
// one row you swipe (or step through with the arrows), newest first, so ten films don't make the
// page ten screens long.

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

/** More than this many, and the grid becomes a row. */
const ROW_AFTER = 3;

export function FilmShelf({ lang, films }: { lang: Lang; films: FilmEntry[] }) {
  const s = FILM[lang];
  const shelf = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const row = films.length > ROW_AFTER;
  // A step is most of a screen's width of cards; in Arabic the row runs the other way.
  const step = (by: 1 | -1) => {
    const el = list.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: by * (rtl ? -1 : 1) * el.clientWidth * 0.85, behavior: "smooth" });
  };
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
      <div className={styles.shelfHead}>
        <h2 id="more-films" className={styles.shelfTitle}>
          {s.more}
        </h2>
        {row && (
          <div className={styles.arrows}>
            <button type="button" className={styles.arrow} onClick={() => step(-1)} aria-label={s.previous}>
              <Icon name="chev" />
            </button>
            <button type="button" className={styles.arrow} onClick={() => step(1)} aria-label={s.next}>
              <Icon name="chev" />
            </button>
          </div>
        )}
      </div>
      <ul ref={list} className={styles.list} data-row={row || undefined}>
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
