// The caption: the words of the message being said now, inside its bubble (Transcript.tsx).
// Your words are in the interface face, Sarjy's in the voice face (Newsreader or Noto Naskh italic).
//
// How words appear depends on `style`:
//   stream  your words, appearing one by one as you say them
//   dim     your words, faded while Sarjy thinks
//   speak   Sarjy's words, blurred until each one is spoken, then in focus
// A saved fact carries the Dusk stitch underline (`keep`).

import type { Lang } from "@/shared/i18n";
import type { Speaker } from "../voice/useSarjy";
import styles from "./Caption.module.css";

export type CaptionModel = {
  speaker: "user" | "sarjy";
  lang: Lang;
  words: string[];
  /** How many words are fully visible (the rest are hidden or blurred). */
  shown: number;
  style: "stream" | "dim" | "speak";
  /** Word indexes (inclusive start, exclusive end) of a fact that was just saved. */
  keep?: { start: number; end: number };
  /** In a Majlis: who is saying it (their bubble wears their color). */
  who?: Speaker;
};

export function Caption({ caption }: { caption: CaptionModel | null }) {
  // (Who is speaking decides the bubble around it: Transcript.tsx.)
  if (!caption) return null;

  const { lang, words, shown, style, keep } = caption;
  const className = styles.caption;

  const word = (w: string, i: number) => {
    const state = i < shown ? "on" : style === "speak" ? "up" : style === "stream" ? "hidden" : "on";
    return (
      <span key={i} className={styles.word} data-word={style === "dim" ? "dim" : state}>
        {w}
      </span>
    );
  };

  // A run of words joined by real spaces, so copying, search and screen readers get a normal sentence.
  const run = (from: number, to: number) =>
    words.slice(from, to).flatMap((w, j) => (j === 0 ? [word(w, from + j)] : [" ", word(w, from + j)]));

  // Split around the saved fact, if there is one: before, the stitched fact, after.
  const parts: React.ReactNode[] = keep
    ? [
        ...run(0, keep.start),
        keep.start > 0 ? " " : null,
        <span key="keep" className={styles.keep}>
          {run(keep.start, keep.end)}
        </span>,
        keep.end < words.length ? " " : null,
        ...run(keep.end, words.length),
      ]
    : run(0, words.length);

  return (
    <p className={className} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      {parts}
    </p>
  );
}
