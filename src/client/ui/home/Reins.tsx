"use client";

// "You hold the reins" (brand book, section 3): a small copy of the Memory panel you can try.
// Each sentence Sarjy keeps is there with its topic; Forget unpicks it like a stitch and Sarjy
// says so out loud, the way it confirms every forget. Keeper, at the panel's side, takes it
// the way Keeper takes things: a little worried, then fine.

import { useState } from "react";
import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { Icon } from "../Icon";
import { Rafeeq } from "../rafeeq/Rafeeq";
import home from "./Home.module.css";
import styles from "./Reins.module.css";

export function Reins({ lang }: { lang: Lang }) {
  const s = HOME[lang].reins;
  const [gone, setGone] = useState<number[]>([]);
  const [said, setSaid] = useState<string | null>(null);
  const [worried, setWorried] = useState(0);

  const forget = (i: number) => {
    setGone((g) => [...g, i]);
    setSaid(s.items[i]!.forgot);
    setWorried((n) => n + 1);
  };

  return (
    <section id="reins" className={`${home.section} ${styles.reins}`} aria-labelledby="reins-title">
      <div>
        <p className={home.kicker}>{s.kicker}</p>
        <h2 id="reins-title" className={home.h2}>
          {s.title}
        </h2>
        <p className={home.lede}>{s.lede}</p>
      </div>

      <div className={styles.side}>
        <div className={styles.panel}>
          <p className={styles.head}>
            <span className={styles.dot} />
            {s.panel}
          </p>
          <ul className={styles.list}>
            {s.items.map((item, i) => {
              const off = gone.includes(i);
              return (
                <li key={item.topic} className={styles.item} data-gone={off || undefined}>
                  <span className={styles.topic}>{item.topic}</span>
                  <span className={styles.text}>{item.text}</span>
                  <button
                    type="button"
                    className={styles.forget}
                    onClick={() => forget(i)}
                    disabled={off}
                    aria-label={`${s.forget}: ${item.text}`}
                  >
                    {s.forget}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className={styles.said} aria-live="polite">
            {said && (
              <>
                <Icon name="check" className={styles.stitch} />
                <span key={said}>{said}</span>
              </>
            )}
          </p>
          {gone.length > 0 && (
            <button
              type="button"
              className={styles.reset}
              onClick={() => {
                setGone([]);
                setSaid(null);
              }}
            >
              {s.reset}
            </button>
          )}
        </div>
        <div className={styles.keeper} aria-hidden="true">
          <Rafeeq id="keeper" state="idle" level={4} cue={worried ? { kind: "failed", at: worried } : null} />
        </div>
      </div>
    </section>
  );
}
