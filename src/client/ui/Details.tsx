"use client";

// How an answer was made: a small waterfall of where the time went (heard you, first word, first
// sound, tools, done), the model, tokens, and what it cost. Opened from the ⓘ on Sarjy's latest
// answer. The numbers are the server's own measurements, sent with the turn's `done` event.

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Timings } from "@/shared/protocol";
import styles from "./Details.module.css";

const ms = (n: number, lang: Lang) =>
  `${(n / 1000).toLocaleString(lang === "ar" ? "ar-SA" : "en", { maximumFractionDigits: 2 })} s`;
const usd = (n: number) => `$${n < 0.01 ? n.toFixed(4) : n.toFixed(3)}`;

export function Details({ lang, timings }: { lang: Lang; timings: Timings }) {
  const s = t(lang).details;
  const total = Math.max(1, timings.totalMs);
  const rows: { label: string; at?: number }[] = [
    { label: s.heard, at: timings.sttMs },
    { label: s.firstWord, at: timings.firstTokenMs },
    { label: s.firstSound, at: timings.firstAudioMs },
    { label: s.done, at: timings.totalMs },
  ];
  return (
    <section className={`${styles.details} glass text`} aria-label={s.title}>
      <h4 className={styles.title}>{s.title}</h4>
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
