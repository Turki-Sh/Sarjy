// The conversation under the orb, one bubble per message (like x.ai's voice mode): your words on
// one side, Sarjy's on the other in the voice face. The earlier lines are small and fade with age;
// the line being said now is the largest, and Sarjy's words come into focus as they are spoken.

"use client";

import { useState } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Timings } from "@/shared/protocol";
import type { ChatLine } from "../voice/useSarjy";
import { Caption, type CaptionModel } from "./Caption";
import { Details } from "./Details";
import { Icon } from "./Icon";
import styles from "./Transcript.module.css";

type Props = {
  lang: Lang;
  /** Every line of the chat, for "Show the whole chat". */
  all: ChatLine[];
  earlier: ChatLine[];
  caption: CaptionModel | null;
  /** The finished answer's measurements; when present, its bubble offers the details card. */
  timings: Timings | null;
  /** First visit, nothing said yet: a quiet welcome from Sarjy, with a way to skip the intro. */
  welcome: { line: string; skip: string; onSkip: () => void } | null;
};

export function Transcript({ lang, all, earlier: recent, caption, timings, welcome }: Props) {
  const [open, setOpen] = useState(false);
  const [whole, setWhole] = useState(false);
  const s = t(lang);
  if (!recent.length && !caption) {
    if (!welcome) return null;
    return (
      <div className={styles.transcript}>
        <div className={`${styles.bubble} ${styles.sarjy} ${styles.now} ${styles.welcome} glass text`}>
          {welcome.line}
        </div>
        <button type="button" className={styles.more} onClick={welcome.onSkip}>
          {welcome.skip}
        </button>
      </div>
    );
  }
  const canExplain = !!timings && caption?.speaker === "sarjy";
  // The whole chat: every line except the one the caption is showing now (the newest line, when
  // the short list above stops before it).
  const captionIsLast = all.length > 0 && recent.at(-1) !== all.at(-1);
  const before = captionIsLast ? all.slice(0, -1) : all;
  const hidden = before.length - recent.length;
  const earlier = whole ? before : recent;

  return (
    <>
      {/* Outside the bubbles' box, which is height-capped and clips from the top. */}
      {(hidden > 0 || whole) && (
        <button type="button" className={styles.more} onClick={() => setWhole((w) => !w)}>
          {whole ? s.lessChat : s.wholeChat(all.length)}
        </button>
      )}
      <div className={styles.transcript} data-whole={whole || undefined}>
        {earlier.length > 0 && (
          <ol className={styles.earlier} aria-hidden="true">
            {earlier.map((line, i) => (
              <li
                key={`${earlier.length - i}:${line.text.slice(0, 24)}`}
                className={`${styles.bubble} ${line.role === "assistant" ? `${styles.sarjy} glass text` : styles.user}`}
                lang={line.lang}
                dir={line.lang === "ar" ? "rtl" : "ltr"}
                // The newest earlier line is the clearest; older ones fade.
                data-age={whole ? undefined : earlier.length - 1 - i}
              >
                {line.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- a local object URL
                  <img className={styles.picture} src={line.image} alt="" />
                )}
                {line.text}
              </li>
            ))}
          </ol>
        )}
        {caption && (
          <div
            className={`${styles.bubble} ${styles.now} ${caption.speaker === "sarjy" ? `${styles.sarjy} glass text` : styles.user}`}
          >
            <Caption caption={caption} />
            {canExplain && (
              <button
                type="button"
                className={styles.info}
                aria-label={s.details.open}
                title={s.details.open}
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
              >
                <Icon name="info" />
              </button>
            )}
          </div>
        )}
      </div>
      {canExplain && open && <Details lang={lang} timings={timings!} />}
    </>
  );
}
