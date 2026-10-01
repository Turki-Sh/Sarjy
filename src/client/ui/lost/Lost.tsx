"use client";

// The 404 (Turki, Day 4): night in the dunes, the moon for the zero, and a few Rafeeqs lost around
// a campfire. Every visit draws a different scene and cast (vignettes.ts): a story by the fire, a
// squabble over the map in a cloud of dust, one walking in circles, a map held upside down. They
// talk, each in its own voice. Two small secrets: tap the fire and it flares up and they cheer;
// tap the moon and another scene plays. The way home is always right there.

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { dir } from "@/shared/i18n";
import { LOST } from "@/shared/lost-copy";
import { freshSeed } from "@/shared/random";
import { TALK } from "@/shared/site";
import { Logo } from "../brand/Logo";
import { Actor } from "../scene/Actor";
import { Campfire } from "../scene/Campfire";
import { Dunes } from "../scene/Dunes";
import { usePointerParallax } from "../scene/hooks";
import { Sky } from "../scene/Sky";
import scene from "../scene/Scene.module.css";
import styles from "./Lost.module.css";
import { DustCloud, MapProp, Bubble } from "./props";
import { BEATS, stage, type Placed } from "./staging";
import { castScene } from "./vignettes";

/** How long each line stays up. */
const LINE_MS = 3400;
/** How long a stoked fire keeps them cheering. */
const CHEER_MS = 1800;

export function Lost({ lang, seed }: { lang: Lang; seed: number }) {
  const s = LOST[lang];
  const root = useRef<HTMLElement>(null);
  const uid = `lost${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  usePointerParallax(root);

  const [v, setV] = useState(() => castScene(seed));
  const [beat, setBeat] = useState(0);
  const [turn, setTurn] = useState(0);
  const [cheer, setCheer] = useState(false);

  // The squabble plays its beats in a loop: brawl, sulk, make up.
  useEffect(() => {
    if (v.kind !== "squabble") return;
    const t = window.setTimeout(() => setBeat((b) => (b + 1) % BEATS.length), BEATS[beat]!.ms);
    return () => window.clearTimeout(t);
  }, [v, beat]);
  // Someone says something every few seconds.
  useEffect(() => {
    const t = window.setInterval(() => setTurn((n) => n + 1), LINE_MS);
    return () => window.clearInterval(t);
  }, [v]);

  const beatName = BEATS[beat]!.name;
  const staged = stage(v, beatName);
  const speakerRole = staged.speakers[turn % staged.speakers.length]!;
  const speaker = staged.actors.find((a) => a.role === speakerRole);
  const round = Math.floor(turn / staged.speakers.length);
  const line = speaker
    ? v.kind === "squabble"
      ? s.squabble[beatName][turn % s.squabble[beatName].length]!
      : s.lines[speaker.id][round % s.lines[speaker.id].length]!
    : null;

  const stoke = () => {
    setCheer(true);
    window.setTimeout(() => setCheer(false), CHEER_MS);
  };
  const reshuffle = () => {
    setV((old) => castScene(freshSeed(), old.kind));
    setBeat(0);
    setTurn(0);
  };

  const direct = (a: Placed) => {
    if (cheer && !a.brawl) return a.act === "sleepy" ? "waking" : "happy";
    return a.act ?? null;
  };

  return (
    <main
      ref={root}
      className={`${scene.scene} ${styles.lost}`}
      data-time="night"
      lang={lang}
      dir={dir(lang)}
    >
      <Sky seed={seed % 997} stars={120} bodies={false} />

      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="Sarjy">
          <Logo lang={lang} className={styles.logo} />
        </Link>
      </header>

      <div className={styles.sky}>
        <p className={styles.digits} dir="ltr">
          <span aria-hidden="true">4</span>
          {/* A small secret: the moon changes the scene. */}
          <button type="button" className={styles.moon} onClick={reshuffle} aria-label={s.shuffle} />
          <span aria-hidden="true">4</span>
        </p>
        <section className={styles.copy}>
          <h1 className={styles.title}>{s.title}</h1>
          <p className={styles.body}>{s.body}</p>
          <div className={styles.actions}>
            <Link href="/" className={styles.primary}>
              {s.home}
            </Link>
            <Link href={TALK} className={styles.secondary}>
              {s.talk}
            </Link>
          </div>
        </section>
      </div>

      <div className={styles.stage} role="img" aria-label={s.scene} data-vignette={v.kind} key={v.seed}>
        <Dunes shape="deep" uid={uid} />
        {staged.loop !== undefined && (
          <span className={styles.footprints} style={{ "--lx": `${staged.loop}%` } as CSSProperties} />
        )}
        <div className={styles.fire} style={{ "--fx": `${staged.fire}%` } as CSSProperties}>
          <Campfire stoked={cheer} onStoke={stoke} />
        </div>
        {staged.actors.map((a) => (
          <Actor
            key={`${a.role}-${a.id}`}
            id={a.id}
            x={a.x}
            y={a.y}
            size={a.size}
            facing={a.facing}
            z={a.z ?? 2}
            act={direct(a)}
            state={a === speaker && a.act !== "sleepy" ? "speaking" : (a.state ?? "idle")}
            className={`${a.brawl ? styles.brawl : ""} ${a.circling ? styles.circling : ""}`}
          />
        ))}
        {staged.cloud !== undefined && <DustCloud x={staged.cloud} />}
        {staged.map && <MapProp {...staged.map} />}
        {speaker && line && <Bubble key={turn} x={speaker.x} y={speaker.y} size={speaker.size} text={line} />}
      </div>
    </main>
  );
}
