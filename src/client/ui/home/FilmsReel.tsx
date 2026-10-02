"use client";

// The films (Turki, Day 5: "Films by Sarjy", animated like the rest): a night screening in the
// dunes. The screen plays the films' stills in turn, each with its title, a bar running along the
// bottom until the next; the Rafeeqs watch from their cushions in their seat colors, one of them
// delighted each time a new one comes on (Drifter sleeps through all of it). Beside it, the films
// themselves, each a way into its page. Like the Majlis, it only runs while you can see it.

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FILMS, filmHref, pickVersion, runningTime } from "@/shared/films";
import { FILM } from "@/shared/film-copy";
import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import type { Mood, RafeeqId } from "@/shared/rafeeq";
import { Icon } from "../Icon";
import { Actor } from "../scene/Actor";
import { Dunes } from "../scene/Dunes";
import { useInView } from "../scene/hooks";
import { Sky } from "../scene/Sky";
import scene from "../scene/Scene.module.css";
import home from "./Home.module.css";
import styles from "./FilmsReel.module.css";

/** In a row on the sand before the screen; the middle two a little nearer. */
const SEATS: { id: RafeeqId; x: number; y: number; size: number; facing: 1 | -1; act?: Mood }[] = [
  { id: "rider", x: 19, y: 90, size: 15, facing: 1 },
  { id: "keeper", x: 40, y: 93, size: 16.5, facing: 1 },
  { id: "fennec", x: 61, y: 93, size: 16.5, facing: -1 },
  { id: "drifter", x: 81, y: 90, size: 15, facing: -1, act: "sleepy" },
];
const REEL_MS = 5200;

export function FilmsReel({ lang }: { lang: Lang }) {
  const s = HOME[lang].films;
  const f = FILM[lang];
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage);
  const [turn, setTurn] = useState(0);
  useEffect(() => {
    if (!inView || FILMS.length < 2) return;
    const t = window.setInterval(() => setTurn((n) => n + 1), REEL_MS);
    return () => window.clearInterval(t);
  }, [inView]);

  const showing = turn % FILMS.length;
  // Each new film delights a different one of the three who are awake.
  const cheering = turn % 3;

  return (
    <section id="films" className={`${home.section} ${styles.films}`} aria-labelledby="films-title">
      <div className={styles.words}>
        <p className={home.kicker}>{s.kicker}</p>
        <h2 id="films-title" className={home.h2}>
          {s.title}
        </h2>
        <p className={home.lede}>{s.lede}</p>
        <ul className={styles.list}>
          {FILMS.map((film, i) => {
            const v = pickVersion(film, lang);
            return (
              <li key={film.id}>
                <Link href={filmHref(film)} className={styles.film} data-on={i === showing || undefined}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a fixed still from public/ */}
                  <img
                    className={styles.thumb}
                    src={v.poster}
                    alt=""
                    width={1280}
                    height={720}
                    loading="lazy"
                  />
                  <span className={styles.filmText}>
                    <span className={styles.filmTitle}>{film.title[lang]}</span>
                    <span className={styles.filmMeta}>
                      <span dir="ltr">{runningTime(film.seconds)}</span> ·{" "}
                      {film.versions.map((x) => f.spoken(x.lang, x.subtitles)).join(" · ")}
                    </span>
                  </span>
                  <Icon name="play" className={styles.filmPlay} />
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href="/film" className={styles.cta}>
          <Icon name="film" />
          {s.cta}
        </Link>
      </div>

      <div
        ref={stage}
        className={`${scene.scene} ${styles.stage}`}
        data-time="night"
        data-running={inView || undefined}
        aria-hidden="true"
      >
        <Sky stars={60} seed={33} bodies={false} shooting={inView} />
        <Dunes shape="deep" uid="films-reel" />
        {/* The screen's light on the sand, in the colors of what is on it. */}
        <span
          className={styles.spill}
          style={{ backgroundImage: `url(${pickVersion(FILMS[showing]!, lang).poster})` }}
        />
        <span className={styles.poles} />
        <Link href={filmHref(FILMS[showing]!)} className={styles.screen} tabIndex={-1}>
          {FILMS.map((film, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- fixed stills from public/
            <img
              key={film.id}
              className={styles.frame}
              data-on={i === showing || undefined}
              src={pickVersion(film, lang).poster}
              alt=""
              width={1280}
              height={720}
            />
          ))}
          <span key={turn} className={styles.caption}>
            <span className={styles.captionNow}>{s.now}</span>
            {FILMS[showing]!.title[lang]}
          </span>
          {inView && FILMS.length > 1 && (
            <span
              key={`bar-${turn}`}
              className={styles.progress}
              style={{ "--ms": `${REEL_MS}ms` } as CSSProperties}
            />
          )}
        </Link>
        {SEATS.map((seat, i) => (
          <div key={seat.id} style={{ "--seat": `var(--seat-${i + 2})` } as CSSProperties}>
            <span
              className={styles.cushion}
              style={{ "--x": `${seat.x}%`, "--y": `${seat.y}%`, "--size": seat.size } as CSSProperties}
            />
            <Actor
              id={seat.id}
              x={seat.x}
              y={seat.y}
              size={seat.size}
              facing={seat.facing}
              act={seat.act ?? (i === cheering && turn > 0 ? "happy" : null)}
              z={3}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
