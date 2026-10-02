"use client";

// An easter egg on the film pages: type "popcorn" (or "فشار") anywhere and it rains popcorn, on
// Keeper. Nothing on the page takes typing, so listening to keys here gets in no one's way.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FILM } from "@/shared/film-copy";
import type { Lang } from "@/shared/i18n";
import styles from "./Film.module.css";

const WORDS = ["popcorn", "فشار"];
const KERNELS = 36;
const RAIN_MS = 3200;

export function PopcornRain({ lang }: { lang: Lang }) {
  const [burst, setBurst] = useState(0);
  const typed = useRef("");
  const timer = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
      typed.current = (typed.current + e.key.toLowerCase()).slice(-12);
      if (!WORDS.some((w) => typed.current.endsWith(w))) return;
      typed.current = "";
      setBurst((n) => n + 1);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setBurst(0), RAIN_MS + 600);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer.current);
    };
  }, []);

  if (!burst) return null;
  return (
    <div key={burst} className={styles.rain} aria-live="polite">
      {Array.from({ length: KERNELS }, (_, i) => (
        // A fixed scatter: across the page, each at its own pace and spin.
        <span
          key={i}
          className={styles.drop}
          style={
            {
              "--x": `${(i * 37) % 100}%`,
              "--delay": `${(i * 83) % 1400}ms`,
              "--fall": `${1600 + ((i * 131) % 1200)}ms`,
              "--spin": `${((i % 2) * 2 - 1) * (180 + ((i * 47) % 360))}deg`,
              "--size": `${14 + ((i * 7) % 12)}px`,
            } as CSSProperties
          }
        />
      ))}
      <p className={styles.toast}>{FILM[lang].popcorn}</p>
    </div>
  );
}
