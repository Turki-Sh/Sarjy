"use client";

// A day with Sarjy: one scene through five moments, from dawn to lights out. The sky and the sand
// change with the hour, the sun (then the moon) crosses, and different Rafeeqs play each moment:
// Scout on a dune at first light, Fennec with its ears up for a search, Keeper beaming at a save,
// friends in a Majlis at dusk, Lantern keeping watch while the others sleep. Each moment shows
// the exchange, the tool Sarjy used, and its reply as it is said. It plays by itself while you
// watch; drag the timeline (or use the arrows) to go through the day yourself.

import { useEffect, useId, useRef, useState } from "react";
import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import type { Mood, RafeeqId } from "@/shared/rafeeq";
import type { VoiceState } from "@/shared/states";
import { Actor } from "../scene/Actor";
import { Dunes } from "../scene/Dunes";
import { useInView, usePointerParallax } from "../scene/hooks";
import { Sky } from "../scene/Sky";
import scene from "../scene/Scene.module.css";
import styles from "./Day.module.css";
import home from "./Home.module.css";
import { Timeline } from "./Timeline";
import { useTyped } from "./useTyped";

type Part = {
  id: RafeeqId;
  x: number;
  y: number;
  size: number;
  facing?: 1 | -1;
  act?: Mood;
  state?: VoiceState;
};

/** Who plays each moment, and where. The first is the one who "answers" (it speaks the reply). */
const CAST: Part[][] = [
  [
    { id: "scout", x: 30, y: 90, size: 13, state: "tool" },
    { id: "rider", x: 15, y: 91, size: 11 },
  ],
  [
    { id: "fennec", x: 28, y: 90, size: 13, state: "tool" },
    { id: "breeze", x: 12, y: 60, size: 7 },
  ],
  [
    { id: "keeper", x: 26, y: 91, size: 14, act: "happy" },
    { id: "drifter", x: 10, y: 90, size: 10 },
  ],
  [
    { id: "dune", x: 32, y: 91, size: 11, facing: -1 },
    { id: "rider", x: 18, y: 91, size: 11 },
    { id: "lantern", x: 7, y: 90, size: 9 },
  ],
  [
    { id: "lantern", x: 28, y: 91, size: 12 },
    { id: "drifter", x: 13, y: 91, size: 10, act: "sleepy" },
    { id: "keeper", x: 42, y: 91, size: 9, act: "sleepy", facing: -1 },
  ],
];
/** How long each moment plays on its own. */
const MOMENT_MS = 7000;

export function DayOnTheRoad({ lang }: { lang: Lang }) {
  const s = HOME[lang].day;
  const root = useRef<HTMLDivElement>(null);
  const uid = `day${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  usePointerParallax(root);
  const inView = useInView(root, "-20% 0px");

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing || !inView) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % s.stops.length), MOMENT_MS);
    return () => window.clearTimeout(t);
  }, [playing, inView, index, s.stops.length]);

  const stop = s.stops[index]!;
  const reply = useTyped(stop.sarjy, inView);
  const talking = inView && reply.length > 0 && reply.length < stop.sarjy.length;
  const go = (i: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(s.stops.length - 1, i)));
  };

  return (
    <section id="day" className={styles.day} aria-labelledby="day-title">
      <div className={home.section}>
        <p className={home.kicker}>{s.kicker}</p>
        <h2 id="day-title" className={home.h2}>
          {s.title}
        </h2>
        <p className={home.lede}>{s.lede}</p>
      </div>

      <div ref={root} className={`${scene.scene} ${styles.stage}`} data-time={stop.sky}>
        <Sky arc={stop.arc} stars={80} seed={5} />
        <Dunes uid={uid} />
        {CAST[index]!.map((p, i) => (
          <Actor
            key={`${index}-${p.id}`}
            id={p.id}
            x={p.x}
            y={p.y}
            size={p.size}
            facing={p.facing ?? 1}
            act={p.act ?? null}
            state={i === 0 && talking ? "speaking" : (p.state ?? "idle")}
            className={styles.enter}
          />
        ))}

        <div className={styles.chat} key={index} aria-live="polite">
          <p className={styles.moment}>
            <span className={styles.time}>{stop.time}</span> {stop.label}
          </p>
          <p className={styles.you}>
            <span className={styles.who}>{stop.who ?? s.you}</span>
            {stop.user}
          </p>
          <p className={styles.tool} dir="ltr">
            {stop.tool}
          </p>
          <p className={styles.sarjy} aria-label={stop.sarjy}>
            {reply}
            <span className={styles.caret} aria-hidden="true" />
          </p>
        </div>
      </div>

      <div className={home.section} data-tight="">
        <Timeline
          stops={s.stops}
          index={index}
          onChange={go}
          playing={playing}
          onToggle={() => setPlaying((p) => !p)}
          labels={s}
        />
        <p className={styles.sample}>{s.sample}</p>
      </div>
    </section>
  );
}
