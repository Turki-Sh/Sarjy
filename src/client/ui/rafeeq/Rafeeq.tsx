"use client";

// Rafeeq, the companion (Turki, Day 3): when you pick one in Settings it takes the orb's place in
// your own chats, and is the mic the same way (tap it to talk). It follows every state the orb
// does, and it has a life of its own:
//   - it breathes, blinks, and looks at your pointer, or down at the text box while you type
//   - it leans in and pulses with your voice while listening; its mouth moves with Sarjy's voice
//   - it thinks (dots over its head), works a tool, beams on a save, droops when a tool fails
//   - stroke it and it's happy (from bond level 3 it purrs, blushes and shows hearts)
//   - leave it be and it falls asleep, and wakes with a start when you come back
//   - it greets you when you arrive (level 2), does its own trick now and then (level 4), and
//     wears a gold star (level 5)
// The moods live here; the poses live in Rafeeq.module.css, keyed on data-state and data-mood.

import { useEffect, useId, useRef, useState } from "react";
import type { RafeeqId } from "@/shared/rafeeq";
import { UNLOCKS } from "@/shared/rafeeq";
import type { VoiceState } from "@/shared/states";
import type { LevelSource } from "../../voice/useOrbMotion";
import { Character } from "./characters";
import styles from "./Rafeeq.module.css";
import { useRafeeqMotion } from "./useRafeeqMotion";

type Mood = "none" | "sleepy" | "waking" | "happy" | "petted" | "droop" | "greet" | "trick" | "celebrate";

/** Something that just happened that it reacts to. `at` makes each one new. */
export type RafeeqCue = { kind: "saved" | "failed" | "levelup"; at: number };

const none: LevelSource = () => null;
/** How long with nothing happening before it dozes off. */
const SLEEP_MS = 45_000;
/** Where sparkles burst around it, on a save. */
const SPARKLES: [number, number][] = [
  [44, 70],
  [158, 76],
  [36, 128],
  [168, 132],
  [100, 36],
];
/** How much stroking (in pixels, within a second) counts as petting. */
const PET_PX = 260;

type Props = {
  id: RafeeqId;
  state: VoiceState;
  inputLevel?: LevelSource;
  outputLevel?: LevelSource;
  /** Bond level, 1 to 5. */
  level: number;
  cue?: RafeeqCue | null;
  /** It was petted (a stroke across it). */
  onPet?: () => void;
  /** A small, calm preview (Settings): no greeting, no sleep, no tricks, no pointer. */
  preview?: boolean;
};

export function Rafeeq({
  id,
  state,
  inputLevel = none,
  outputLevel = none,
  level,
  cue,
  onPet,
  preview = false,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const uid = `rq${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [mood, setMood] = useState<Mood>("none");
  const moodRef = useRef<Mood>("none");
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);
  const moodTimer = useRef(0);
  /** A mood for a moment, then back to itself (unless something else took over). */
  const flash = (next: Mood, ms: number) => {
    window.clearTimeout(moodTimer.current);
    setMood(next);
    moodTimer.current = window.setTimeout(() => setMood("none"), ms);
  };
  const flashRef = useRef(flash);
  useEffect(() => {
    flashRef.current = flash;
  });

  useRafeeqMotion(root, state, { input: inputLevel, output: outputLevel }, preview);

  // Hello, when you arrive (from bond level 2).
  useEffect(() => {
    if (preview || level < UNLOCKS.greet) return;
    const t = window.setTimeout(() => flashRef.current("greet", 1700), 500);
    return () => window.clearTimeout(t);
    // Only on arrival, not whenever the level changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  // Reacting to what just happened.
  useEffect(() => {
    if (!cue) return;
    const [next, ms] =
      cue.kind === "saved"
        ? (["happy", 1600] as const)
        : cue.kind === "failed"
          ? (["droop", 2200] as const)
          : (["celebrate", 2800] as const);
    flashRef.current(next, ms);
  }, [cue]);

  // Dozing off when nothing happens, and waking with a start. Any state but rest keeps it awake.
  const lastActive = useRef(0);
  useEffect(() => {
    lastActive.current = performance.now();
    if (state !== "idle" && moodRef.current === "sleepy") setMood("none");
  }, [state]);
  useEffect(() => {
    if (preview) return;
    lastActive.current = performance.now();
    const wake = () => {
      lastActive.current = performance.now();
      if (moodRef.current === "sleepy") flashRef.current("waking", 900);
    };
    const check = window.setInterval(() => {
      if (moodRef.current === "none" && performance.now() - lastActive.current > SLEEP_MS) setMood("sleepy");
    }, 3000);
    window.addEventListener("pointermove", wake, { passive: true });
    window.addEventListener("keydown", wake);
    return () => {
      window.clearInterval(check);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [preview]);

  // Its own trick, now and then while it waits (from bond level 4).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    if (preview || level < UNLOCKS.trick) return;
    let t = 0;
    const next = () => {
      t = window.setTimeout(
        () => {
          if (stateRef.current === "idle" && moodRef.current === "none") flashRef.current("trick", 2200);
          next();
        },
        18_000 + Math.random() * 14_000,
      );
    };
    next();
    return () => window.clearTimeout(t);
  }, [preview, level]);

  // Petting: a stroke back and forth across it.
  const stroke = useRef({ px: 0, since: 0, x: 0, y: 0, lastPet: -Infinity });
  const onPointerMove = (e: React.PointerEvent) => {
    if (preview) return;
    const s = stroke.current;
    const now = performance.now();
    if (now - s.since > 1000) ((s.px = 0), (s.since = now));
    if (s.x || s.y) s.px += Math.abs(e.clientX - s.x) + Math.abs(e.clientY - s.y);
    s.x = e.clientX;
    s.y = e.clientY;
    if (s.px > PET_PX && now - s.lastPet > 2500 && stateRef.current === "idle") {
      s.lastPet = now;
      s.px = 0;
      flash("petted", 1800);
      onPet?.();
    }
  };
  const onPointerLeave = () => {
    stroke.current.x = 0;
    stroke.current.y = 0;
  };

  return (
    <div
      ref={root}
      className={styles.wrap}
      data-rafeeq={id}
      data-state={state}
      data-mood={mood}
      data-purr={level >= UNLOCKS.purr || undefined}
      data-star={level >= UNLOCKS.star || undefined}
      data-preview={preview || undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-hidden="true"
    >
      <div className={styles.aura} />
      <svg className={styles.svg} viewBox="0 0 200 200">
        <ellipse className={styles.shadow} cx="100" cy="189" rx="50" ry="6" />
        <g className={styles.float}>
          <Character id={id} uid={uid} />
        </g>
        <g className={styles.thought}>
          <circle cx="84" cy="40" r="5" />
          <circle cx="100" cy="34" r="6" />
          <circle cx="116" cy="40" r="5" />
        </g>
        <g className={styles.zzz}>
          <text x="140" y="70">
            z
          </text>
          <text x="152" y="54">
            z
          </text>
          <text x="166" y="36">
            Z
          </text>
        </g>
        <g className={styles.hearts}>
          <path d="M60 60 c-4 -6 -12 -2 -8 5 l8 8 l8 -8 c4 -7 -4 -11 -8 -5 Z" />
          <path d="M140 52 c-3 -5 -10 -2 -7 4 l7 7 l7 -7 c3 -6 -4 -9 -7 -4 Z" />
          <path d="M100 30 c-3 -5 -9 -2 -6 4 l6 6 l6 -6 c3 -6 -3 -9 -6 -4 Z" />
        </g>
        <g className={styles.sparkles}>
          {SPARKLES.map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y - 7} l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z`} />
          ))}
        </g>
        <path className={styles.badge} d="M14 176 l4 -9 l4 9 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 Z" />
      </svg>
    </div>
  );
}
