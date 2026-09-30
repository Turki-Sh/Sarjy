"use client";

// Keeps a Rafeeq alive, once per animation frame, straight on the DOM (no re-renders), like the
// orb's motion (useOrbMotion.ts):
//   --breath   a slow in and out, always
//   --lvl      your voice while it listens, Sarjy's while it speaks, smoothed
//   --mouth    how open its mouth is: Sarjy's voice, while it speaks
//   --look-x/y where its eyes point: your pointer, the text box while you type, a glance now and then
// and it blinks, at a random moment every few seconds (data-blink).

import { useEffect, useRef, type RefObject } from "react";
import type { VoiceState } from "@/shared/states";
import { follow, type LevelSource } from "../../voice/useOrbMotion";

const clamp = (n: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, n));

export function useRafeeqMotion(
  root: RefObject<HTMLElement | null>,
  state: VoiceState,
  levels: { input: LevelSource; output: LevelSource },
  still: boolean,
) {
  const stateRef = useRef(state);
  const levelsRef = useRef(levels);
  useEffect(() => {
    stateRef.current = state;
    levelsRef.current = levels;
  });

  useEffect(() => {
    const el = root.current;
    if (!el || still) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let level = 0;
    let mouth = 0;
    const look = { x: 0, y: 0 };
    const aim = { x: 0, y: 0 };
    let pointerAt = 0;
    let typingUntil = 0;
    let glanceUntil = 0;
    let nextGlance = performance.now() + 3000;

    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      aim.x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 1.2));
      aim.y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 1.2));
      pointerAt = performance.now();
    };
    // Typing: it reads along, eyes down toward the text box.
    const onKey = () => (typingUntil = performance.now() + 1400);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("keydown", onKey);

    // Blinking: every 2.5 to 6 seconds, sometimes twice.
    let blinkTimer = 0;
    const blink = () => {
      el.dataset.blink = "true";
      window.setTimeout(() => delete el.dataset.blink, 140);
      if (Math.random() < 0.2) {
        window.setTimeout(() => {
          el.dataset.blink = "true";
          window.setTimeout(() => delete el.dataset.blink, 120);
        }, 260);
      }
      blinkTimer = window.setTimeout(blink, 2500 + Math.random() * 3500);
    };
    blinkTimer = window.setTimeout(blink, 1800);

    const tick = (now: number) => {
      if (!reduce.matches) {
        const s = stateRef.current;
        const input = levelsRef.current.input();
        const output = levelsRef.current.output();
        const raw =
          s === "listening"
            ? (input ?? 0)
            : s === "speaking"
              ? (output ?? 0.4 + 0.3 * Math.sin(now / 90))
              : 0;
        level = follow(level, clamp(raw, 0, 1));
        // The mouth follows the voice quickly, so words look spoken.
        const target = s === "speaking" ? clamp((output ?? 0.5 + 0.5 * Math.sin(now / 70)) * 1.6, 0, 1) : 0;
        mouth += (target - mouth) * (target > mouth ? 0.5 : 0.25);

        // Where to look: typing wins, then your pointer (for 4 s after it moved), then a glance.
        let tx = 0;
        let ty = 0;
        if (now < typingUntil) ty = 1;
        else if (now - pointerAt < 4000) ((tx = aim.x), (ty = aim.y));
        else if (s === "idle") {
          if (now > nextGlance) {
            aim.x = Math.random() * 1.6 - 0.8;
            aim.y = Math.random() * 0.8 - 0.4;
            glanceUntil = now + 900;
            nextGlance = now + 3000 + Math.random() * 4000;
          }
          if (now < glanceUntil) ((tx = aim.x), (ty = aim.y));
        }
        look.x += (tx - look.x) * 0.12;
        look.y += (ty - look.y) * 0.12;

        el.style.setProperty("--breath", Math.sin(now / 900).toFixed(3));
        el.style.setProperty("--lvl", level.toFixed(3));
        el.style.setProperty("--mouth", mouth.toFixed(3));
        el.style.setProperty("--look-x", look.x.toFixed(3));
        el.style.setProperty("--look-y", look.y.toFixed(3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(blinkTimer);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [root, still]);
}
