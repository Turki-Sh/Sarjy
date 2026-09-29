"use client";

// Drives the orb once per animation frame: the wave's shape, the light's strength, size and turn.
// Ported from the reference build in docs/brand/sarjy-visual-identity-v3.html (the `frame` function).
//
// It writes straight to the DOM (CSS variables and the path's `d`), never to React state,
// so sixty updates a second cost no re-renders.

import { useEffect, useRef, type RefObject } from "react";
import type { VoiceState } from "@/shared/states";
import { REST, easeToward, isAtRest, wavePath, type WaveShape } from "@/shared/wave";

/** Loudness from 0 to 1, or null when there is no live audio (then the motion is synthetic). */
export type LevelSource = () => number | null;

type Refs = {
  root: RefObject<HTMLElement | null>;
  moving: RefObject<SVGPathElement | null>;
  trace: RefObject<SVGPathElement | null>;
  waveBox: RefObject<HTMLElement | null>;
};

type Frame = { target: WaveShape; glow: number; lvl: number; rot: number; ease: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** What the orb should look like `e` seconds into a state. Pure, so it is easy to reason about. */
export function frameFor(state: VoiceState, e: number, input: number | null, output: number | null): Frame {
  const idle: Frame = { target: REST, glow: 0, lvl: 1, rot: (e * 10) % 360, ease: 0.14 };

  switch (state) {
    case "listening": {
      // Height follows the mic level, 0.5 to 1.1 of rest. Without a mic, the reference's synthetic rhythm.
      const n =
        input !== null
          ? 0.5 + 0.6 * clamp01(input)
          : 0.5 + 0.3 * Math.abs(Math.sin(e * 5.3)) + 0.3 * Math.abs(Math.sin(e * 8.7 + 1));
      const a2 =
        input !== null
          ? 0.5 + 0.55 * clamp01(input * (0.85 + 0.15 * Math.sin(e * 6.1)))
          : 0.5 + 0.55 * Math.abs(Math.sin(e * 6.1 + 0.6));
      return {
        target: { a1: n, a2, s: 1 },
        glow: 0.35 + (n - 0.5) * 0.75,
        lvl: 0.9 + (n - 0.5) * 0.35,
        rot: (e * 15) % 360,
        ease: 0.14,
      };
    }
    case "thinking":
      return { target: { a1: 0.35, a2: 0.35, s: 0.6 }, glow: 0.22, lvl: 1, rot: (e * 10) % 360, ease: 0.14 };
    case "tool":
      return { target: { a1: 0.25, a2: 0.25, s: 0.4 }, glow: 0.16, lvl: 1, rot: (e * 10) % 360, ease: 0.14 };
    case "speaking": {
      // Height follows Sarjy's audio; the two peaks move independently so it never looks like a meter.
      const level = output !== null ? clamp01(output) : 0.6 + 0.4 * Math.abs(Math.sin(e * 3.1));
      return {
        target: {
          a1: 0.55 + 0.55 * level + 0.12 * Math.sin(e * 9.4),
          a2: 0.6 + 0.5 * level + 0.12 * Math.sin(e * 7.1 + 1.3),
          s: 1 + 0.9 * Math.sin(e * 4.6) * level,
        },
        glow: 0.8,
        lvl: 0.96 + 0.07 * level,
        rot: (e * 40) % 360,
        ease: 0.14,
      };
    }
    case "saving":
      // The wave returns to rest over about 480 ms.
      return { ...idle, ease: 0.06 };
    case "idle":
      return idle;
  }
}

export function useOrbMotion(
  refs: Refs,
  state: VoiceState,
  levels: { input: LevelSource; output: LevelSource },
) {
  const stateRef = useRef(state);
  const startRef = useRef(0);
  const levelsRef = useRef(levels);

  // The frame loop reads these through refs, so a new state or level source never restarts the loop.
  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  useEffect(() => {
    stateRef.current = state;
    startRef.current = performance.now();
  }, [state]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let shape: WaveShape = { ...REST };
    let raf = 0;

    const tick = (now: number) => {
      const root = refs.root.current;
      const moving = refs.moving.current;
      const trace = refs.trace.current;
      const box = refs.waveBox.current;
      if (root && moving && trace && box) {
        const current = stateRef.current;
        const e = (now - startRef.current) / 1000;

        if (reduce.matches) {
          // Reduced motion: the wave and the light stay still. Only the mic, chip and captions change.
          shape = { ...REST };
          const live = current === "listening" || current === "speaking";
          root.style.setProperty("--glow", live ? "0.5" : "0");
          root.style.setProperty("--lvl", "1");
        } else {
          const f = frameFor(current, e, levelsRef.current.input(), levelsRef.current.output());
          shape = easeToward(shape, f.target, f.ease);
          root.style.setProperty("--glow", f.glow.toFixed(3));
          root.style.setProperty("--lvl", f.lvl.toFixed(3));
          root.style.setProperty("--rot", `${f.rot.toFixed(1)}deg`);
          if (current === "thinking") {
            // A Dusk segment travels the line, 1.2 s per loop.
            trace.setAttribute("stroke-dashoffset", String(100 - ((e / 1.2) % 1) * 114));
          }
        }

        const d = wavePath(shape);
        moving.setAttribute("d", d);
        trace.setAttribute("d", d);
        // At rest the orb crossfades back to the master symbol, which the single line can't match exactly.
        const rest = (current === "idle" || current === "saving") && isAtRest(shape);
        box.dataset.rest = String(rest);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [refs.root, refs.moving, refs.trace, refs.waveBox]);
}
