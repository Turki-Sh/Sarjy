"use client";

// The one who rides along the page with you (Turki, Day 4: "the user shouldn't feel alone"): once
// you scroll past the first screen, your Rafeeq (or Rider) comes up in the corner and stays with
// you. It takes an interest in each section (it listens to the promise, thinks through the day,
// is delighted to see its friends), says a word the first time you reach each one, and bows out
// at the end, where all eight are waiting. Tap it to talk.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import type { Mood, RafeeqId } from "@/shared/rafeeq";
import type { VoiceState } from "@/shared/states";
import { TALK } from "@/shared/site";
import { Rafeeq } from "../rafeeq/Rafeeq";
import styles from "./Home.module.css";

type Section = keyof (typeof HOME)["en"]["companion"]["lines"];
const SECTIONS: Section[] = ["promise", "day", "rafeeqs", "majlis", "reins", "films"];
const MOOD: Record<Section, { state: VoiceState; act: Mood | null }> = {
  promise: { state: "listening", act: null },
  day: { state: "thinking", act: null },
  rafeeqs: { state: "idle", act: "greet" },
  majlis: { state: "listening", act: null },
  reins: { state: "idle", act: null },
  films: { state: "idle", act: "happy" },
};

export function Companion({ lang, id, level }: { lang: Lang; id: RafeeqId; level: number }) {
  const s = HOME[lang].companion;
  const [past, setPast] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [current, setCurrent] = useState<Section | null>(null);
  const [line, setLine] = useState<{ section: Section; text: string } | null>(null);
  const seen = useRef(new Set<Section>());

  useEffect(() => {
    const hero = document.getElementById("hero");
    const finale = document.getElementById("finale");
    const edges = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setPast(!e.isIntersecting);
        if (e.target === finale) setAtEnd(e.isIntersecting);
      }
    });
    if (hero) edges.observe(hero);
    if (finale) edges.observe(finale);

    const middle = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const section = e.target.id as Section;
          setCurrent(section);
          if (!seen.current.has(section)) {
            seen.current.add(section);
            setLine({ section, text: s.lines[section] });
          }
        }
      },
      // A section counts once it crosses the middle of the window.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const section of SECTIONS) {
      const el = document.getElementById(section);
      if (el) middle.observe(el);
    }
    return () => {
      edges.disconnect();
      middle.disconnect();
    };
  }, [s]);

  const shown = past && !atEnd;
  const mood = current ? MOOD[current] : { state: "idle" as const, act: null };
  return (
    <Link
      href={TALK}
      className={styles.companion}
      data-shown={shown || undefined}
      aria-label={s.label}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown || undefined}
    >
      {shown && line && (
        <span key={line.section} className={styles.companionLine}>
          {line.text}
        </span>
      )}
      <span>
        <Rafeeq id={id} state={mood.state} act={mood.act} level={level} />
      </span>
    </Link>
  );
}
