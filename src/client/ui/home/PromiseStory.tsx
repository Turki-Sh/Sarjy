"use client";

// "Tell it once." (the brand's promise, section 2), told as you scroll: on Sunday you say it,
// Sarjy saves it out loud, and Keeper, who carries other people's little things, tucks it into
// its satchel; on Wednesday you ask, and Keeper brings it back out. The section is tall and its
// picture stays put while you scroll through it.

import { useRef } from "react";
import type { Lang } from "@/shared/i18n";
import { HOME } from "@/shared/home-copy";
import { Icon } from "../Icon";
import { Rafeeq } from "../rafeeq/Rafeeq";
import { useScrollProgress } from "../scene/hooks";
import home from "./Home.module.css";
import styles from "./Promise.module.css";

/** Where each beat starts, as a share of the scroll through the section. */
const BEATS = [0.1, 0.28, 0.48, 0.66] as const;

export function PromiseStory({ lang }: { lang: Lang }) {
  const s = HOME[lang].promise;
  const root = useRef<HTMLElement>(null);
  const progress = useScrollProgress(root);
  const step = BEATS.filter((b) => progress >= b).length;

  // Keeper listens to you, beams at the save, thinks when you ask, and answers.
  const state = step === 1 ? "listening" : step === 3 ? "thinking" : step >= 4 ? "speaking" : "idle";
  const act = step === 2 ? "happy" : null;
  const card = step >= 4 ? "out" : step >= 2 ? "packed" : "hidden";

  return (
    <section
      id="promise"
      ref={root}
      className={styles.promise}
      data-step={step}
      aria-labelledby="promise-title"
    >
      <div className={styles.sticky}>
        <div className={styles.inner}>
          <div className={styles.words}>
            <p className={home.kicker}>{s.kicker}</p>
            <h2 id="promise-title" className={`${home.h2} ${styles.title}`}>
              <span className={home.voice}>{s.title}</span>
            </h2>
            <ol className={styles.chat}>
              <li className={styles.day} data-on={step >= 1 || undefined}>
                {s.sunday}
              </li>
              <li className={styles.you} data-on={step >= 1 || undefined}>
                <span className={styles.who}>{s.you}</span>
                {s.tellIt}
              </li>
              <li className={styles.sarjy} data-on={step >= 2 || undefined}>
                <Icon name="check" className={styles.stitch} />
                {s.saved}
              </li>
              <li className={styles.day} data-on={step >= 3 || undefined}>
                {s.wednesday}
              </li>
              <li className={styles.you} data-on={step >= 3 || undefined}>
                <span className={styles.who}>{s.you}</span>
                {s.ask}
              </li>
              <li className={styles.sarjy} data-on={step >= 4 || undefined}>
                {s.recall}
              </li>
            </ol>
            <p className={styles.caption}>{s.caption}</p>
          </div>

          <div className={styles.figure} aria-hidden="true">
            <span className={styles.glow} />
            <span className={styles.mound} />
            <div className={styles.keeper}>
              <Rafeeq id="keeper" state={state} act={act} level={4} />
            </div>
            <div className={styles.card} data-where={card}>
              <span className={styles.dot} />
              <span className={styles.topic}>{s.card.topic}</span>
              <span className={styles.swatch} />
              <span className={styles.value}>{s.card.value}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
