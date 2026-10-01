"use client";

// The last word: "Who rides with you?", with all eight scattered around it (Turki, Day 4, after
// chatgpt.com/features/dots): tilted, drifting on their own beats, some half off the edge of the
// page. As you scroll down they gather (Turki, Day 5): each leaves its spot and they line up side
// by side along the bottom, peeking up over the edge, like the dots at the end of that page.
// Rest your pointer on one and it comes forward (in its own temper) with its name; pick it and
// you go straight to talk, with it. Or just talk.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import type { RafeeqId } from "@/shared/rafeeq";
import { TALK } from "@/shared/site";
import { Rafeeq } from "../rafeeq/Rafeeq";
import { usePinnedProgress } from "../scene/hooks";
import styles from "./Finale.module.css";
import home from "./Home.module.css";
import { pickRafeeq } from "./pick";

/**
 * Where each one starts, in percent of the section, its size and its tilt; then again for a
 * phone, where they keep to the top and bottom and leave the words the middle. `seat` is its
 * place in the line they gather into, left to right, colors alternating.
 */
const SCATTER: {
  id: RafeeqId;
  x: number;
  y: number;
  s: number;
  r: number;
  mx: number;
  my: number;
  seat: number;
}[] = [
  { id: "rider", x: 9, y: 22, s: 12, r: -8, mx: 18, my: 9, seat: 3 },
  { id: "breeze", x: 50, y: 18, s: 8, r: 4, mx: 50, my: 8, seat: 6 },
  { id: "keeper", x: 88, y: 21, s: 13, r: 7, mx: 82, my: 10, seat: 1 },
  { id: "scout", x: 5, y: 56, s: 10, r: 6, mx: 11, my: 80, seat: 5 },
  { id: "lantern", x: 94, y: 52, s: 10, r: -6, mx: 89, my: 79, seat: 4 },
  { id: "dune", x: 24, y: 94, s: 14, r: 5, mx: 28, my: 96, seat: 0 },
  { id: "fennec", x: 76, y: 95, s: 13, r: -5, mx: 72, my: 96, seat: 2 },
  { id: "drifter", x: 50, y: 99, s: 12, r: 2, mx: 50, my: 88, seat: 7 },
];

export function Finale({ lang }: { lang: Lang }) {
  const s = HOME[lang].finale;
  const names = t(lang).rafeeq.names;
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  usePinnedProgress(root, "--gather");
  return (
    <section ref={root} id="finale" className={styles.finale} aria-labelledby="finale-title">
      <div className={styles.stage}>
        <div className={styles.words}>
          <h2 id="finale-title" className={`${home.h2} ${styles.title}`}>
            <span className={home.voice}>{s.title}</span>
          </h2>
          <p className={home.lede}>{s.lede}</p>
          <Link href={TALK} className={styles.talk}>
            {s.orb}
          </Link>
        </div>
        <ul className={styles.scatter}>
          {SCATTER.map((p, i) => (
            <li
              key={p.id}
              style={
                {
                  "--x": `${p.x}%`,
                  "--y": `${p.y}%`,
                  "--s": p.s,
                  "--r": `${p.r}deg`,
                  "--mx": `${p.mx}%`,
                  "--my": `${p.my}%`,
                  "--i": i,
                  "--seat": p.seat,
                } as CSSProperties
              }
            >
              <button
                type="button"
                className={styles.pick}
                onClick={() => void pickRafeeq(p.id, router.push)}
              >
                <span className={styles.name}>{names[p.id]}</span>
                <span className={styles.visuallyHidden}>{s.pick(names[p.id])}</span>
                <span className={styles.figure} aria-hidden="true">
                  <Rafeeq id={p.id} state="idle" level={4} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
