// A film page (Day 5): one film, played by the browser itself, with the way into the app under it,
// and the other films listed below once there are more than one. Nothing here needs JavaScript:
// the video element brings its own controls.

import Link from "next/link";
import type { FilmEntry } from "@/shared/films";
import { FEATURED, runningTime } from "@/shared/films";
import { FILM } from "@/shared/film-copy";
import type { Lang } from "@/shared/i18n";
import { dir } from "@/shared/i18n";
import { TALK } from "@/shared/site";
import { Logo } from "../brand/Logo";
import styles from "./Film.module.css";

type Props = {
  lang: Lang;
  film: FilmEntry;
  poster: string;
  /** The other films, each with the still to show for it. Empty while there is only one. */
  others: { film: FilmEntry; poster: string }[];
};

/** A film's own address: the newest is /film itself. */
const hrefOf = (film: FilmEntry) => (film.id === FEATURED.id ? "/film" : `/film/${film.id}`);

export function Film({ lang, film, poster, others }: Props) {
  const s = FILM[lang];
  return (
    <main className={styles.film} lang={lang} dir={dir(lang)}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label={s.home}>
          <Logo lang={lang} className={styles.logo} />
        </Link>
      </header>
      <div className={styles.screen}>
        <video
          className={styles.video}
          src={film.src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          aria-label={film.title[lang]}
        />
      </div>
      <section className={styles.words}>
        <h1 className={styles.title}>{film.title[lang]}</h1>
        <p className={styles.body}>{film.body[lang]}</p>
        <div className={styles.actions}>
          <Link href={TALK} className={styles.primary}>
            {s.talk}
          </Link>
          <Link href="/" className={styles.secondary}>
            {s.home}
          </Link>
        </div>
      </section>
      {others.length > 0 && (
        <section className={styles.more} aria-labelledby="more-films">
          <h2 id="more-films" className={styles.moreTitle}>
            {s.more}
          </h2>
          <ul className={styles.list}>
            {others.map(({ film: other, poster: still }) => (
              <li key={other.id}>
                <Link href={hrefOf(other)} className={styles.item}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a fixed card from public/ */}
                  <img className={styles.still} src={still} alt="" width={1200} height={630} loading="lazy" />
                  <span className={styles.itemTitle}>{other.title[lang]}</span>
                  <span className={styles.itemMeta}>
                    {runningTime(other.seconds)} · {s.spoken[other.spoken]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
