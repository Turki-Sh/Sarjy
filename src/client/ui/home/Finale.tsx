"use client";

// The last word: "Who rides with you?", and all eight peeking up from the bottom of the page,
// shoulder to shoulder. Rest your pointer on one and it rises to meet you (in its own temper),
// with its name; pick it and you go straight to talk, with it. Or just the orb (no companion).

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { RAFEEQS } from "@/shared/rafeeq";
import { Rafeeq } from "../rafeeq/Rafeeq";
import styles from "./Finale.module.css";
import home from "./Home.module.css";
import { pickRafeeq } from "./pick";

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
        <button type="button" className={styles.orb} onClick={() => void pickRafeeq(null, router.push)}>
          {s.orb}
        </button>
      </div>
      <ul className={styles.lineup}>
        {RAFEEQS.map((id, i) => (
          <li key={id} style={{ "--i": i } as CSSProperties}>
            <button type="button" className={styles.pick} onClick={() => void pickRafeeq(id, router.push)}>
              <span className={styles.name}>{names[id]}</span>
              <span className={styles.visuallyHidden}>{s.pick(names[id])}</span>
              <span className={styles.figure} aria-hidden="true">
                <Rafeeq id={id} state="idle" level={4} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
