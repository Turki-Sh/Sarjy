"use client";

// Sarjy's reply appearing as it is said: a few letters at a time, after a short pause (the tool
// runs first). Everything at once with reduced motion.

import { useEffect, useState } from "react";

export function useTyped(text: string, run: boolean, delay = 700, perChar = 22): string {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    let tick = 0;
    const start = window.setTimeout(
      () => {
        tick = window.setInterval(() => {
          i = reduce ? text.length : i + 1;
          setShown(i);
          if (i >= text.length) window.clearInterval(tick);
        }, perChar);
      },
      reduce ? 0 : delay,
    );
    return () => {
      window.clearTimeout(start);
      window.clearInterval(tick);
      setShown(0);
    };
  }, [text, run, delay, perChar]);
  return text.slice(0, shown);
}
