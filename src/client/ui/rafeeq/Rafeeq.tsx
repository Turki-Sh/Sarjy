"use client";

// Rafeeq, the companion (Turki, Day 3): when you pick one in Settings it takes the orb's place in
// your own chats, and is the mic the same way (tap it to talk). It follows every state the orb
// does, and it has a life, and a personality, of its own (shared/rafeeq.ts, PERSONALITIES):
//   - it breathes, blinks, and looks at your pointer, or down at the text box while you type
//   - it leans in while listening; its mouth moves with Sarjy's voice; it thinks and searches
//   - rest your pointer on it and it answers in character: Rider stands to attention, Keeper goes
//     shy and looks away, Scout leans in, Drifter doesn't care, Dune puffs up, Lantern glows,
//     Fennec gets annoyed, Breeze dodges and giggles
//   - stroke it and it reacts in character too: melts, giggles, keeps its composure, or grumbles
//     (twice, then gives in with a smirk); a failed tool worries one and fires up another
//   - every happy moment gets its own smile (art/shared.ts, smileOf)
//   - between turns it fidgets in its own way, at its own pace, and dozes off on its own schedule
//   - it greets you when you arrive (level 2), does its own trick (level 4), wears a star (level 5)
// The moods and personality live here; the looks live in Rafeeq.module.css, keyed on data-*.

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  expressionOf,
  PERSONALITIES,
  UNLOCKS,
  type Fidget,
  type Hover,
  type Mood,
  type RafeeqId,
} from "@/shared/rafeeq";
import type { VoiceState } from "@/shared/states";
import type { LevelSource } from "../../voice/useOrbMotion";
import { ART } from "./art";
import styles from "./Rafeeq.module.css";
import { useRafeeqMotion } from "./useRafeeqMotion";

/** Something that just happened that it reacts to. `at` makes each one new. */
export type RafeeqCue = { kind: "saved" | "failed" | "levelup"; at: number };

const none: LevelSource = () => null;
/** How much stroking (in pixels, within a second) counts as petting. */
const PET_PX = 260;
/** Your pointer resting on it: a moment, then a while. */
const NEAR_MS = 250;
const LONG_MS = 2200;
/** A grumbler keeps count of strokes this close together, and gives in on the third. */
const GIVE_IN_MS = 10_000;
const GIVE_IN_AFTER = 3;
/** How long a grumble lasts: long enough to be felt. */
const GRUMBLE_MS = 4200;
/** Where sparkles burst around it, on a save. */
const SPARKLES: [number, number][] = [
  [44, 70],
  [158, 76],
  [36, 128],
  [168, 132],
  [100, 36],
];

type Props = {
  id: RafeeqId;
  state: VoiceState;
  inputLevel?: LevelSource;
  outputLevel?: LevelSource;
  /** Bond level with this companion, 1 to 5. */
  level: number;
  cue?: RafeeqCue | null;
  /** It was petted (a stroke across it). */
  onPet?: () => void;
  /** A small, calm preview (Settings): no greeting, no sleep, no fidgets, no pointer. */
  preview?: boolean;
  /**
   * A scene directing it (the home page, the 404): the mood it plays, over its own. It still
   * breathes, blinks, watches you and answers your pointer in character between acts.
   */
  act?: Mood | null;
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
  act = null,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const uid = `rq${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const self = PERSONALITIES[id];
  const selfRef = useRef(self);
  const stateRef = useRef(state);
  const [mood, setMood] = useState<Mood>("none");
  const moodRef = useRef<Mood>("none");
  useEffect(() => {
    moodRef.current = mood;
    stateRef.current = state;
    selfRef.current = self;
  });
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

  useRafeeqMotion(root, state, { input: inputLevel, output: outputLevel }, self, preview);

  // Hello, when you arrive (from bond level 2), in its own way.
  useEffect(() => {
    if (preview || level < UNLOCKS.greet) return;
    // A little after you arrive, and not all at once when there are several of them.
    const t = window.setTimeout(() => flashRef.current("greet", 1700), 500 + Math.random() * 900);
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

  // Dozing off when nothing happens (each on its own schedule), and waking with a start.
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
      const idleFor = performance.now() - lastActive.current;
      if (moodRef.current === "none" && idleFor > selfRef.current.sleepMs) setMood("sleepy");
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

  // Fidgeting while it waits: its own habits, at its own pace.
  const [fidget, setFidget] = useState<Fidget | null>(null);
  useEffect(() => {
    if (preview) return;
    let t = 0;
    const next = () => {
      const [lo, hi] = selfRef.current.fidgetEvery;
      t = window.setTimeout(
        () => {
          if (stateRef.current === "idle" && moodRef.current === "none") {
            const habits = selfRef.current.fidgets;
            setFidget(habits[Math.floor(Math.random() * habits.length)]!);
            window.setTimeout(() => setFidget(null), 1400);
          }
          next();
        },
        (lo + Math.random() * (hi - lo)) * 1000,
      );
    };
    next();
    return () => window.clearTimeout(t);
  }, [preview]);

  // Your pointer resting on it (a mouse or pen; a finger taps, it doesn't hover).
  const [hover, setHover] = useState<Hover>(null);
  const hoverTimers = useRef<number[]>([]);
  const onPointerEnter = (e: React.PointerEvent) => {
    if (preview || e.pointerType === "touch") return;
    hoverTimers.current.forEach(window.clearTimeout);
    hoverTimers.current = [
      window.setTimeout(() => setHover("near"), NEAR_MS),
      window.setTimeout(() => setHover("long"), LONG_MS),
    ];
  };
  const onPointerLeave = () => {
    hoverTimers.current.forEach(window.clearTimeout);
    // A companion you annoyed doesn't forgive you the moment you leave: a parting huff.
    if (self.temper === "annoyed" && hover === "long" && stateRef.current === "idle") {
      flash("grumble", 2600);
    }
    setHover(null);
    stroke.current.x = 0;
    stroke.current.y = 0;
  };
  useEffect(() => () => hoverTimers.current.forEach(window.clearTimeout), []);

  // Petting: a stroke back and forth across it. A grumbler grumbles, then gives in if you persist.
  const stroke = useRef({ px: 0, since: 0, x: 0, y: 0, lastPet: -Infinity, grumbles: 0 });
  const onPointerMove = (e: React.PointerEvent) => {
    if (preview) return;
    const s = stroke.current;
    const now = performance.now();
    if (now - s.since > 1000) ((s.px = 0), (s.since = now));
    if (s.x || s.y) s.px += Math.abs(e.clientX - s.x) + Math.abs(e.clientY - s.y);
    s.x = e.clientX;
    s.y = e.clientY;
    if (s.px > PET_PX && now - s.lastPet > 2500 && stateRef.current === "idle") {
      if (now - s.lastPet > GIVE_IN_MS) s.grumbles = 0;
      s.lastPet = now;
      s.px = 0;
      if (self.pet === "grumbles" && ++s.grumbles < GIVE_IN_AFTER) flash("grumble", GRUMBLE_MS);
      else ((s.grumbles = 0), flash("petted", 2200));
      onPet?.();
    }
  };

  const idle = state === "idle";
  const shown = act ?? mood;
  return (
    <div
      ref={root}
      className={styles.wrap}
      data-rafeeq={id}
      data-state={state}
      data-mood={shown}
      data-fidget={shown === "none" && idle && !hover ? (fidget ?? undefined) : undefined}
      data-hover={shown === "none" && idle ? (hover ?? undefined) : undefined}
      data-expr={expressionOf(id, shown, hover, idle) ?? undefined}
      data-temper={self.temper}
      data-pet={self.pet}
      data-fail={self.fail}
      data-purr={level >= UNLOCKS.purr || undefined}
      data-star={level >= UNLOCKS.star || undefined}
      data-preview={preview || undefined}
      style={{ "--energy": self.energy } as CSSProperties}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-hidden="true"
    >
      <div className={styles.aura} />
      <svg className={styles.svg} viewBox="0 0 200 200">
        {/* The art is fixed markup from art/ (no user content), shared with the art lab. */}
        <g className={styles.float} dangerouslySetInnerHTML={{ __html: ART[id](uid) }} />
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
        <g className={styles.huff}>
          <path d="M150 64 l10 -6 M154 74 l12 -2 M150 84 l10 4" />
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
