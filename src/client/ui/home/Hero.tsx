"use client";

// The home page's first screen (Turki, Day 4: the Rafeeqs are part of the picture, not a card in
// a showcase). The headline is the brand's tagline, and the companions live in it: yours (or
// Rider) stands on the headline beside "rider.", Fennec peeks over the first line (and ducks if
// you stare), Breeze drifts past, and the rest walk the dunes along the bottom. Hover "Talk to
// Sarjy" and they all lean in to listen. It greets you by the time of day, and by name if Sarjy
// knows it.

import Link from "next/link";
import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { HOME, type PartOfDay } from "@/shared/home-copy";
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

const partOf = (hour: number): PartOfDay =>
  hour >= 5 && hour < 12
    ? "morning"
    : hour < 17 && hour >= 12
      ? "afternoon"
      : hour < 23 && hour >= 17
        ? "evening"
        : "night";

/** The hour doesn't need watching while you read. */
const noChange = () => () => {};

type Props = { lang: Lang; visitor: Visitor | null; cast: HomeCast };

export function Hero({ lang, visitor, cast }: Props) {
  const s = HOME[lang].hero;
  const names = t(lang).rafeeq.names;
  const root = useRef<HTMLElement>(null);
  const uid = `hero${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  usePointerParallax(root);

  // The greeting needs your clock, so the server leaves it out and the browser fills it in.
  const part = useSyncExternalStore(
    noChange,
    () => partOf(new Date().getHours()),
    () => null,
  );

  // Everyone leans in to listen while you're about to talk.
  const [leaning, setLeaning] = useState(false);
  const state = leaning ? "listening" : "idle";
  const lean = { onPointerEnter: () => setLeaning(true), onPointerLeave: () => setLeaning(false) };
  const focus = { onFocus: () => setLeaning(true), onBlur: () => setLeaning(false) };

  const yours = visitor?.rafeeq === cast.perch;
  return (
    <section
      id="hero"
      ref={root}
      className={`${scene.scene} ${styles.hero}`}
      data-time="theme"
      aria-labelledby="hero-title"
    >
      {/* Low over the dunes, on the side away from the words (it doesn't mirror; the words do). */}
      <Sky arc={lang === "ar" ? 0.08 : 0.92} stars={60} seed={11} className={styles.sky} />
      <div className={styles.content}>
        <p className={styles.hello} data-shown={part ? "" : undefined}>
          <span className={styles.live} aria-hidden="true" />
          {part ? s.hello(part, visitor?.name ?? null) : " "}
        </p>
        {/* The heading, plainly, for screen readers and search; the picture of it, with the */}
        {/* companions living in the words, for the eye. */}
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
            <em className={styles.em}>{s.titleB}</em>
            <span className={styles.perch} aria-hidden="true">
              <Rafeeq id={cast.perch} state={state} level={yours ? visitor!.level : 4} />
              {yours && (
                <span className={styles.yours}>
                  {names[cast.perch]} · {t(lang).rafeeq.short(visitor!.level)}
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
        <p className={styles.note}>{s.note}</p>
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
