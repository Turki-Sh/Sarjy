"use client";

// The home page's first screen (Turki, Day 4: the Rafeeqs are part of the picture, not a card in
// a showcase). The headline is the brand's tagline, and the companions live in it: yours (or
// Rider) stands on the headline beside "rider.", Fennec peeks over the first line (and ducks if
// you stare), Breeze drifts past, and the rest walk the dunes along the bottom. Hover "Talk to
// Sarjy" and they all lean in to listen. Your Rafeeq says hello (by name, if Sarjy knows it), in
// words that suit the page's light: day ones in the light theme, night ones in the dark. Click the
// sun, or the moon, and the day turns (a small secret).

import Link from "next/link";
import { useId, useRef, useState, type CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { freshSeed } from "@/shared/random";
import { TALK } from "@/shared/site";
import type { Visitor } from "@/shared/visitor";
import { Rafeeq } from "../rafeeq/Rafeeq";
import { Actor } from "../scene/Actor";
import { Dunes } from "../scene/Dunes";
import { usePointerParallax } from "../scene/hooks";
import { Sky } from "../scene/Sky";
import scene from "../scene/Scene.module.css";
import type { HomeCast } from "./cast";
import styles from "./Hero.module.css";
import { toggleTheme, useTheme } from "./theme";

type Props = { lang: Lang; visitor: Visitor | null; cast: HomeCast };

export function Hero({ lang, visitor, cast }: Props) {
  const s = HOME[lang].hero;
  const nav = HOME[lang].nav;
  const root = useRef<HTMLElement>(null);
  const uid = `hero${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  usePointerParallax(root);

  // The hello follows the light, so the server leaves it out and the browser says it; which of
  // the lines is picked at random, once per visit.
  const theme = useTheme();
  const [pick] = useState(freshSeed);
  const lines = theme ? s.hello[theme] : null;
  const hello = lines ? lines[pick % lines.length]!(visitor?.name ?? null) : null;

  // Everyone leans in to listen while you're about to talk.
  const [leaning, setLeaning] = useState(false);
  const state = leaning ? "listening" : "idle";
  const lean = { onPointerEnter: () => setLeaning(true), onPointerLeave: () => setLeaning(false) };
  const focus = { onFocus: () => setLeaning(true), onBlur: () => setLeaning(false) };

  const yours = visitor?.rafeeq === cast.perch;
  // The sun (or moon) sits low over the dunes, on the side away from the words (a picture doesn't
  // mirror; the words do).
  const arc = lang === "ar" ? 0.08 : 0.92;
  return (
    <section
      id="hero"
      ref={root}
      className={`${scene.scene} ${styles.hero}`}
      data-time="theme"
      aria-labelledby="hero-title"
    >
      <Sky arc={arc} stars={60} seed={11} className={styles.sky} />
      <button
        type="button"
        className={styles.daylight}
        style={{ left: `${8 + arc * 84}%`, top: `${78 - Math.sin(arc * Math.PI) * 58}%` }}
        onClick={toggleTheme}
        aria-label={theme === "dark" ? nav.light : nav.dark}
      />
      <div className={styles.content}>
        {/* The heading, plainly, for screen readers and search; the picture of it, with the */}
        {/* companions living in the words, for the eye. */}
        {hello && <p className={styles.visuallyHidden}>{hello}</p>}
        <h1 id="hero-title" className={styles.visuallyHidden}>
          {s.titleA} {s.titleB}
        </h1>
        <div className={styles.title} aria-hidden="true">
          <span className={styles.lineA}>
            <span className={styles.peek} aria-hidden="true">
              <span className={styles.peeker}>
                <Rafeeq id={cast.peek} state={state} level={4} />
              </span>
            </span>
            {s.titleA}
            <span className={styles.float} aria-hidden="true">
              <Rafeeq id={cast.float} state={state} level={4} />
            </span>
          </span>{" "}
          <span className={styles.lineB}>
            <span className={styles.em}>{s.titleB}</span>
            <span className={styles.perch} aria-hidden="true">
              <Rafeeq id={cast.perch} state={state} level={yours ? visitor!.level : 4} />
              {hello && (
                <span key={hello} className={styles.hello} data-hello="">
                  {hello}
                </span>
              )}
            </span>
          </span>
        </div>
        <p className={styles.lede}>{s.lede}</p>
        <div className={styles.actions}>
          <Link href={TALK} className={styles.talk} {...lean} {...focus}>
            <span className={styles.mic} aria-hidden="true" />
            {s.talk}
          </Link>
          <a href="#rafeeqs" className={styles.meet}>
            {s.meet}
          </a>
        </div>
      </div>

      <div className={styles.horizon} role="img" aria-label={s.scene}>
        <Dunes uid={uid} />
        {cast.caravan.map((id, i) => (
          <Actor
            key={id}
            id={id}
            x={-10}
            y={86}
            size={5.4}
            walk
            state={state}
            className={styles.walker}
            style={{ "--i": i, "--n": cast.caravan.length } as CSSProperties}
          />
        ))}
      </div>
    </section>
  );
}
