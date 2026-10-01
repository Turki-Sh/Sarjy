"use client";

// The last word: "Who rides with you?", with all eight scattered around it (Turki, Day 4, after
// chatgpt.com/features/dots): tilted, drifting on their own beats, some half off the edge of the
// page. Rest your pointer on one and it comes forward (in its own temper) with its name; pick it
// and you go straight to talk, with it. Or just talk.

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import type { RafeeqId } from "@/shared/rafeeq";
import { TALK } from "@/shared/site";
import { Rafeeq } from "../rafeeq/Rafeeq";
import styles from "./Finale.module.css";
import home from "./Home.module.css";
import { pickRafeeq } from "./pick";

/**
 * Where each one sits, in percent of the section, its size and its tilt; then again for a phone,
 * where they keep to the top and bottom and leave the words the middle.
 */
const SCATTER: { id: RafeeqId; x: number; y: number; s: number; r: number; mx: number; my: number }[] = [
  { id: "rider", x: 9, y: 16, s: 12, r: -8, mx: 18, my: 9 },
  { id: "breeze", x: 50, y: 4, s: 8, r: 4, mx: 50, my: 6 },
  { id: "keeper", x: 88, y: 14, s: 13, r: 7, mx: 82, my: 10 },
  { id: "scout", x: 5, y: 56, s: 10, r: 6, mx: 11, my: 80 },
  { id: "lantern", x: 94, y: 52, s: 10, r: -6, mx: 89, my: 79 },
  { id: "dune", x: 24, y: 94, s: 14, r: 5, mx: 28, my: 96 },
  { id: "fennec", x: 76, y: 95, s: 13, r: -5, mx: 72, my: 96 },
  { id: "drifter", x: 50, y: 99, s: 12, r: 2, mx: 50, my: 88 },
];

export function Finale({ lang }: { lang: Lang }) {
  const s = HOME[lang].finale;
  const names = t(lang).rafeeq.names;
  const router = useRouter();
  return (
    <section id="finale" className={styles.finale} aria-labelledby="finale-title">
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
              } as CSSProperties
            }
          >
            <button type="button" className={styles.pick} onClick={() => void pickRafeeq(p.id, router.push)}>
              <span className={styles.name}>{names[p.id]}</span>
              <span className={styles.visuallyHidden}>{s.pick(names[p.id])}</span>
              <span className={styles.figure} aria-hidden="true">
                <Rafeeq id={p.id} state="idle" level={4} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
