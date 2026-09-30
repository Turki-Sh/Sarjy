// The conversation under the orb, one bubble per message (like x.ai's voice mode): your words on
// one side, Sarjy's on the other in the voice face. The earlier lines are small and fade with age;
// the line being said now is the largest, and Sarjy's words come into focus as they are spoken.

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  // The card belongs to one answer: it is open for those timings, so the next turn closes it.
  const [openFor, setOpenFor] = useState<Timings | null>(null);
  const open = !!timings && openFor === timings;
  const [whole, setWhole] = useState(false);
  const info = useRef<HTMLButtonElement>(null);
  // The whole chat opens at its newest line, where you were; older lines are a scroll up.
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (whole && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [whole]);
  // On a short window the box can't hold every recent bubble. One that would be cut by the box's
  // top is hidden whole instead (the newest stay anchored at the bottom, so nothing moves).
  useLayoutEffect(() => {
    const box = list.current;
    if (!box) return;
    if (whole) {
      // The whole chat scrolls, so every bubble shows.
      box.querySelectorAll("li[data-cut]").forEach((bubble) => bubble.removeAttribute("data-cut"));
      return;
    }
    const fit = () => {
      const edge = box.getBoundingClientRect().top + parseFloat(getComputedStyle(box).paddingTop);
      for (const bubble of box.querySelectorAll("li")) {
        bubble.toggleAttribute("data-cut", bubble.getBoundingClientRect().top < edge - 1);
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  });
  const close = useCallback(() => setOpenFor(null), []);
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
      <div ref={list} className={styles.transcript} data-whole={whole || undefined}>
        {earlier.length > 0 && (
          <ol className={styles.earlier} aria-hidden="true" data-whole={whole || undefined}>
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
                <span className={styles.words}>{line.text}</span>
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
                ref={info}
                type="button"
                className={styles.info}
                aria-label={s.details.open}
                title={s.details.open}
                aria-expanded={open}
                onClick={() => setOpenFor(open ? null : timings)}
              >
                <Icon name="info" />
              </button>
            )}
          </div>
        )}
      </div>
      {canExplain && open && <Details lang={lang} timings={timings!} onClose={close} opener={info} />}
    </>
  );
}
