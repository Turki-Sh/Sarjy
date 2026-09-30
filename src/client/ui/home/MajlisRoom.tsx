"use client";

// The Majlis, as a picture of one: friends (Rafeeqs, here) sitting around a Sadu rug at night, each
// in their seat color, with Sarjy as the finjan in the middle, the same finjan a real Majlis shows
// (Orb.tsx). The talk goes round the seats; Sarjy stays quiet until someone asks it, listens, then
// answers the room.

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import type { RafeeqId } from "@/shared/rafeeq";
import { TALK } from "@/shared/site";
import { Orb } from "../Orb";
import { Actor } from "../scene/Actor";
import { Dunes } from "../scene/Dunes";
import { useInView } from "../scene/hooks";
import { Sky } from "../scene/Sky";
import scene from "../scene/Scene.module.css";
import home from "./Home.module.css";
import styles from "./MajlisRoom.module.css";

/** Around the rug: the back row a little smaller, the front row closer. */
const SEATS: { id: RafeeqId; x: number; y: number; size: number; facing: 1 | -1 }[] = [
  { id: "dune", x: 20, y: 74, size: 17, facing: 1 },
  { id: "rider", x: 35, y: 50, size: 14, facing: 1 },
  { id: "fennec", x: 65, y: 50, size: 14, facing: -1 },
  { id: "keeper", x: 80, y: 74, size: 17, facing: -1 },
];
const LINE_MS = 2900;

export function MajlisRoom({ lang }: { lang: Lang }) {
  const s = HOME[lang].majlis;
  const room = useRef<HTMLDivElement>(null);
  const inView = useInView(room);
  const [turn, setTurn] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = window.setInterval(() => setTurn((n) => n + 1), LINE_MS);
    return () => window.clearInterval(t);
  }, [inView]);

  const line = s.chatter[turn % s.chatter.length]!;
  const next = s.chatter[(turn + 1) % s.chatter.length]!;
  const sarjySpeaks = line.seat === -1;
  // Asked by name: it listens for the rest of the question.
  const orbState = sarjySpeaks ? "speaking" : next.seat === -1 ? "listening" : "idle";

  return (
    <section id="majlis" className={`${home.section} ${styles.majlis}`} aria-labelledby="majlis-title">
      <div className={styles.words}>
        <p className={home.kicker}>{s.kicker}</p>
        <h2 id="majlis-title" className={home.h2}>
          {s.title}
        </h2>
        <p className={home.lede}>{s.lede}</p>
        <ul className={styles.points}>
          {s.points.map((p, i) => (
            <li key={p} style={{ "--seat": `var(--seat-${i + 1})` } as CSSProperties}>
              {p}
            </li>
          ))}
        </ul>
        <Link href={TALK} className={styles.cta}>
          {s.cta}
        </Link>
      </div>

      <div ref={room} className={`${scene.scene} ${styles.room}`} data-time="night" aria-hidden="true">
        <Sky stars={50} seed={21} bodies={false} shooting={false} />
        <Dunes shape="deep" uid="majlis-room" />
        <span className={styles.rug} />
        <div className={styles.finjan} data-speaking={sarjySpeaks || undefined}>
          <Orb state={orbState} majlis />
        </div>
        {SEATS.map((seat, i) => {
          const speaking = line.seat === i;
          return (
            <div key={seat.id} style={{ "--seat": `var(--seat-${i + 1})` } as CSSProperties}>
              <span
                className={styles.cushion}
                data-on={speaking || undefined}
                style={{ "--x": `${seat.x}%`, "--y": `${seat.y}%`, "--size": seat.size } as CSSProperties}
              />
              <Actor
                id={seat.id}
                x={seat.x}
                y={seat.y}
                size={seat.size}
                facing={seat.facing}
                state={speaking ? "speaking" : sarjySpeaks ? "listening" : "idle"}
                z={seat.y > 60 ? 3 : 1}
              />
            </div>
          );
        })}
        <p
          key={turn}
          className={styles.bubble}
          data-sarjy={sarjySpeaks || undefined}
          style={
            (sarjySpeaks
              ? { "--x": "50%", "--y": "34%", "--seat": "var(--memory)" }
              : {
                  "--x": `${SEATS[line.seat]!.x}%`,
                  "--y": `${SEATS[line.seat]!.y - SEATS[line.seat]!.size * 0.9}%`,
                  "--seat": `var(--seat-${line.seat + 1})`,
                }) as CSSProperties
          }
        >
          {sarjySpeaks && <span className={styles.bubbleWho}>{s.sarjy}</span>}
          {line.text}
        </p>
      </div>
    </section>
  );
}
