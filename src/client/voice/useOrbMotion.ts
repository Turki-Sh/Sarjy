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

/**
 * One frame's targets. The light (glow, lvl) and the spin are eased in the loop below, never set
 * raw: Turki asked for a smoother, calmer light (Day 2), and raw per-frame loudness looked jittery.
 */
type Frame = { target: WaveShape; glow: number; lvl: number; spin: number; ease: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * What the orb should look like `e` seconds into a state. Pure, so it is easy to reason about.
 * `input` and `output` are already smoothed loudness levels (see `follow`), 0 to 1, or null.
 * `spin` is degrees per second; the loop turns it into an angle that carries across states.
 */
export function frameFor(state: VoiceState, e: number, input: number | null, output: number | null): Frame {
  const idle: Frame = { target: REST, glow: 0, lvl: 1, spin: 6, ease: 0.12 };

  switch (state) {
    case "listening": {
      // Height follows your voice, 0.5 to 1.1 of rest. Without a mic, a slow synthetic breath.
      const n = input !== null ? 0.5 + 0.6 * clamp01(input) : 0.62 + 0.18 * Math.sin(e * 2.2);
      const a2 =
        input !== null
          ? 0.5 + 0.55 * clamp01(input * (0.9 + 0.1 * Math.sin(e * 2.4)))
          : 0.62 + 0.18 * Math.sin(e * 2.2 + 0.9);
      return {
        target: { a1: n, a2, s: 1 },
        glow: 0.35 + (n - 0.5) * 0.6,
        lvl: 0.94 + (n - 0.5) * 0.2,
        spin: 9,
        ease: 0.1,
      };
    }
    case "thinking":
      return { target: { a1: 0.35, a2: 0.35, s: 0.6 }, glow: 0.22, lvl: 1, spin: 8, ease: 0.1 };
    case "tool":
      return { target: { a1: 0.25, a2: 0.25, s: 0.4 }, glow: 0.16, lvl: 1, spin: 8, ease: 0.1 };
    case "speaking": {
      // Height follows Sarjy's voice; the two peaks drift independently and slowly, so it never
      // looks like a meter.
      const level = output !== null ? clamp01(output) : 0.6 + 0.2 * Math.sin(e * 2.1);
      return {
        target: {
          a1: 0.55 + 0.5 * level + 0.06 * Math.sin(e * 3.7),
          a2: 0.6 + 0.45 * level + 0.06 * Math.sin(e * 3.1 + 1.3),
          s: 1 + 0.5 * Math.sin(e * 1.9) * level,
        },
        glow: 0.72 + 0.1 * level,
        lvl: 0.97 + 0.05 * level,
        spin: 14,
        ease: 0.1,
      };
    }
    case "saving":
      // The wave returns to rest over about 480 ms.
      return { ...idle, ease: 0.06 };
    case "idle":
      return idle;
  }
}

/**
 * A loudness follower: rises quickly (so a word is felt), falls slowly (so the light breathes
 * instead of flickering between syllables).
 */
export function follow(previous: number, next: number): number {
  const rate = next > previous ? 0.22 : 0.06;
  return previous + (next - previous) * rate;
}

/** How fast the light's brightness and size catch up with their targets, per frame. */
const LIGHT_EASE = 0.07;

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
    // The light's state, eased every frame: smoothed levels, glow, size, and an angle that keeps
    // turning across states (it used to restart at 0 on every change, which read as a jump).
    let input = 0;
    let output = 0;
    let glow = 0;
    let lvl = 1;
    let angle = 0;
    let last = 0;

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
          const rawIn = levelsRef.current.input();
          const rawOut = levelsRef.current.output();
          input = follow(input, rawIn ?? 0);
          output = follow(output, rawOut ?? 0);
          const f = frameFor(current, e, rawIn === null ? null : input, rawOut === null ? null : output);
          shape = easeToward(shape, f.target, f.ease);
          glow += (f.glow - glow) * LIGHT_EASE;
          lvl += (f.lvl - lvl) * LIGHT_EASE;
          const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
          angle = (angle + f.spin * dt) % 360;
          root.style.setProperty("--glow", glow.toFixed(3));
          root.style.setProperty("--lvl", lvl.toFixed(3));
          root.style.setProperty("--rot", `${angle.toFixed(2)}deg`);
          if (current === "thinking") {
            // A Dusk segment travels the line, 1.2 s per loop.
            trace.setAttribute("stroke-dashoffset", String(100 - ((e / 1.2) % 1) * 114));
          }
        }

        last = now;
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
