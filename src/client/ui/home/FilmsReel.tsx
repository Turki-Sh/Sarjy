"use client";

// The films (Turki, Day 5: "Films by Sarjy", animated like the rest, with its own play): a night
// screening in the dunes. The screen plays the newest films' stills in turn, each coming on with a
// projector's flicker, its title and a bar running to the next; one of the audience cheers each new
// one. They are there to be played with, the cinema way: tap one and popcorn arcs from the box into
// its mouth; tap Drifter, asleep through all of it, and it wakes with a start, insists it was
// watching, and nods off again; rest on the screen and the ones awake lean in. Beside it, the newest
// films (three at most, and a way to all of them past that). It only runs while you can see it.

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

/** In a row on the sand before the screen; the middle two a little nearer. The last one sleeps. */
const SEATS: { id: RafeeqId; x: number; y: number; size: number; facing: 1 | -1 }[] = [
  { id: "rider", x: 19, y: 90, size: 15, facing: 1 },
  { id: "keeper", x: 40, y: 93, size: 16.5, facing: 1 },
  { id: "fennec", x: 61, y: 93, size: 16.5, facing: -1 },
  { id: "drifter", x: 81, y: 90, size: 15, facing: -1 },
];
const SLEEPER = 3;
/** The popcorn box, on the sand between the middle two. */
const BOX = { x: 50.5, y: 92 };
/** The section shows this many of the newest films; the films page has the rest. */
const SHOWN = 3;
const REEL_MS = 5200;
const KERNEL_MS = 820;

type Kernel = { id: number; seat: number; spread: number; delay: number };

export function FilmsReel({ lang }: { lang: Lang }) {
  const s = HOME[lang].films;
  const f = FILM[lang];
  const films = FILMS.slice(0, SHOWN);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage);

  const [turn, setTurn] = useState(0);
  useEffect(() => {
    if (!inView || films.length < 2) return;
    const t = window.setInterval(() => setTurn((n) => n + 1), REEL_MS);
    return () => window.clearInterval(t);
  }, [inView, films.length]);
  const showing = turn % films.length;
  // Each new film delights a different one of the three who are awake.
  const cheering = turn % SLEEPER;

  // Leaning in while you rest on the screen.
  const [leaning, setLeaning] = useState(false);

  // Popcorn: kernels in flight, and who is enjoying theirs.
  const [kernels, setKernels] = useState<Kernel[]>([]);
  const [munching, setMunching] = useState<number | null>(null);
  const nextKernel = useRef(0);
  const munchTimer = useRef(0);
  const toss = (seat: number) => {
    const batch = [0, 1, 2].map((k) => ({
      id: nextKernel.current++,
      seat,
      spread: (k - 1) * 1.4,
      delay: k * 90,
    }));
    setKernels((all) => [...all, ...batch]);
    window.setTimeout(
      () => setKernels((all) => all.filter((x) => !batch.includes(x))),
      KERNEL_MS + 200 + batch.length * 90,
    );
    window.clearTimeout(munchTimer.current);
    munchTimer.current = window.setTimeout(() => {
      setMunching(seat);
      munchTimer.current = window.setTimeout(() => setMunching(null), 1400);
    }, KERNEL_MS);
  };

  // Drifter, woken for a moment.
  const [stirred, setStirred] = useState(0);
  const stirTimer = useRef(0);
  const stir = () => {
    setStirred((n) => n + 1);
    window.clearTimeout(stirTimer.current);
    stirTimer.current = window.setTimeout(() => setStirred(0), 2800);
  };
  useEffect(
    () => () => {
      window.clearTimeout(munchTimer.current);
      window.clearTimeout(stirTimer.current);
    },
    [],
  );

  const moodOf = (i: number): Mood | null => {
    if (i === SLEEPER) return stirred ? "waking" : "sleepy";
    if (munching === i) return "petted";
    return i === cheering && turn > 0 ? "happy" : null;
  };
  const sleeper = SEATS[SLEEPER]!;

  return (
    <section id="films" className={`${home.section} ${styles.films}`} aria-labelledby="films-title">
      <div className={styles.words}>
        <p className={home.kicker}>{s.kicker}</p>
        <h2 id="films-title" className={home.h2}>
          {s.title}
        </h2>
        <p className={home.lede}>{s.lede}</p>
        <ul className={styles.list}>
          {films.map((film, i) => {
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
          {FILMS.length > SHOWN ? s.all(FILMS.length) : s.cta}
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
          style={{ backgroundImage: `url(${pickVersion(films[showing]!, lang).poster})` }}
        />
        <span className={styles.poles} />
        <Link
          href={filmHref(films[showing]!)}
          className={styles.screen}
          tabIndex={-1}
          onPointerEnter={() => setLeaning(true)}
          onPointerLeave={() => setLeaning(false)}
        >
          {films.map((film, i) => (
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
          {turn > 0 && <span key={`flicker-${turn}`} className={styles.flicker} />}
          <span key={turn} className={styles.caption}>
            <span className={styles.captionNow}>{s.now}</span>
            {films[showing]!.title[lang]}
          </span>
          <span className={styles.bigPlay}>
            <Icon name="play" />
          </span>
          {inView && films.length > 1 && (
            <span
              key={`bar-${turn}`}
              className={styles.progress}
              style={{ "--ms": `${REEL_MS}ms` } as CSSProperties}
            />
          )}
        </Link>

        {SEATS.map((seat, i) => (
          <div
            key={seat.id}
            style={{ "--seat": `var(--seat-${i + 2})` } as CSSProperties}
            onClick={() => (i === SLEEPER ? stir() : toss(i))}
          >
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
              act={moodOf(i)}
              state={leaning && i !== SLEEPER ? "listening" : "idle"}
              z={3}
            />
          </div>
        ))}

        <svg
          className={styles.popcorn}
          style={{ "--x": `${BOX.x}%`, "--y": `${BOX.y}%` } as CSSProperties}
          viewBox="0 0 58 74"
        >
          <g className={styles.puffs}>
            <circle cx="12" cy="20" r="9" />
            <circle cx="26" cy="13" r="10" />
            <circle cx="41" cy="18" r="9" />
            <circle cx="20" cy="24" r="8" />
            <circle cx="35" cy="25" r="8" />
          </g>
          <path className={styles.box} d="M5 28 h48 l-6 44 h-36 Z" />
          <path className={styles.stripes} d="M15 28 l3 44 M29 28 v44 M43 28 l-3 44" />
        </svg>

        {kernels.map((k) => {
          const seat = SEATS[k.seat]!;
          // From the top of the box to the mouth, in the stage's width units (it is 1.22 wide).
          const dx = seat.x - BOX.x + k.spread;
          const dy = (seat.y - seat.size * 1.22 * 0.42 - (BOX.y - 6)) / 1.22;
          return (
            <span
              key={k.id}
              className={styles.kernel}
              style={
                {
                  "--x": `${BOX.x}%`,
                  "--y": `${BOX.y - 6}%`,
                  "--dx": `${dx}cqw`,
                  "--dy": `${dy}cqw`,
                  "--ms": `${KERNEL_MS}ms`,
                  "--delay": `${k.delay}ms`,
                } as CSSProperties
              }
            >
              <span />
            </span>
          );
        })}

        {stirred > 0 && (
          <p
            key={stirred}
            className={styles.line}
            style={
              { "--x": `${sleeper.x}%`, "--y": `${sleeper.y - sleeper.size * 1.22 - 2}%` } as CSSProperties
            }
          >
            {s.awake}
          </p>
        )}
      </div>
    </section>
  );
}
