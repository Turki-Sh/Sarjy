"use client";

// How an answer was made: a small waterfall of where the time went (heard you, first word, first
// sound, tools, done), the model, tokens, and what it cost. Opened from the ⓘ on Sarjy's latest
// answer. The numbers are the server's own measurements, sent with the turn's `done` event.
// It closes like any popover: its X, Escape, a tap anywhere else, or the next turn.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Timings } from "@/shared/protocol";
import { Icon } from "./Icon";
import styles from "./Details.module.css";

const ms = (n: number, lang: Lang) =>
  `${(n / 1000).toLocaleString(lang === "ar" ? "ar-SA" : "en", { maximumFractionDigits: 2 })} s`;
const usd = (n: number) => `$${n < 0.01 ? n.toFixed(4) : n.toFixed(3)}`;

/** The space between the card and the ⓘ, and the least space left at the window's edge. */
const GAP = 10;

type Props = {
  lang: Lang;
  timings: Timings;
  onClose: () => void;
  /** The ⓘ that opened it: a tap on it toggles, so it doesn't count as "outside". */
  opener: React.RefObject<HTMLElement | null>;
};

export function Details({ lang, timings, onClose, opener }: Props) {
  const s = t(lang).details;
  const card = useRef<HTMLElement>(null);
  // Anchored to the ⓘ: just above it, or below when there is no room above. It used to sit at a
  // fixed spot over the answer, covering the ⓘ that would close it.
  const [top, setTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const anchor = opener.current?.getBoundingClientRect();
      const height = card.current?.offsetHeight ?? 0;
      if (!anchor) return;
      const above = anchor.top - GAP - height;
      setTop(above >= GAP ? above : Math.min(anchor.bottom + GAP, window.innerHeight - height - GAP));
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [opener]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!card.current?.contains(target) && !opener.current?.contains(target)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [onClose, opener]);
  const total = Math.max(1, timings.totalMs);
  const rows: { label: string; at?: number }[] = [
    { label: s.heard, at: timings.sttMs },
    { label: s.firstWord, at: timings.firstTokenMs },
    { label: s.firstSound, at: timings.firstAudioMs },
    { label: s.done, at: timings.totalMs },
  ];
  return (
    <section
      ref={card}
      className={`${styles.details} glass`}
      aria-label={s.title}
      style={top === null ? { visibility: "hidden" } : { insetBlockStart: top }}
    >
      <header className={styles.head}>
        <h4 className={styles.title}>{s.title}</h4>
        <button type="button" className={styles.close} aria-label={s.close} title={s.close} onClick={onClose}>
          <Icon name="x" />
        </button>
      </header>
      <ol className={styles.waterfall}>
        {rows
          .filter((r) => r.at !== undefined)
          .map((r) => (
            <li key={r.label}>
              <span className={styles.label}>{r.label}</span>
              <span className={styles.track}>
                <span className={styles.bar} style={{ inlineSize: `${(r.at! / total) * 100}%` }} />
              </span>
              <span className={styles.value}>{ms(r.at!, lang)}</span>
            </li>
          ))}
      </ol>
      <dl className={styles.facts}>
        {timings.toolMs !== undefined && (
          <>
            <dt>{s.tools}</dt>
            <dd>{ms(timings.toolMs, lang)}</dd>
          </>
        )}
        {timings.model && (
          <>
            <dt>{s.model}</dt>
            <dd>{timings.model}</dd>
          </>
        )}
        {timings.inputTokens !== undefined && (
          <>
            <dt>{s.tokens}</dt>
            <dd>
              {timings.inputTokens.toLocaleString()}, {timings.outputTokens?.toLocaleString()}
            </dd>
          </>
        )}
        {timings.costUsd !== undefined && (
          <>
            <dt>{s.cost}</dt>
            <dd>
              {usd(timings.costUsd)}{" "}
              <span className={styles.aside}>
                ({usd(timings.costUsd * 1000)} {s.perThousand})
              </span>
            </dd>
          </>
        )}
      </dl>
    </section>
  );
}
