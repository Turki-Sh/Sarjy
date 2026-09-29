"use client";

// The orb: a liquid glass sphere holding the logo wave. It is the product's status light.
// Layers, back to front: the light (a blurred conic sweep), the glass sphere, the wave.
// Motion comes from useOrbMotion; this component is only structure.

import { useRef } from "react";
import { SYMBOL_PATH } from "@/shared/brand/marks";
import type { VoiceState } from "@/shared/states";
import { REST, wavePath } from "@/shared/wave";
import { useOrbMotion, type LevelSource } from "../voice/useOrbMotion";
import styles from "./Orb.module.css";

const REST_PATH = wavePath(REST);
const none: LevelSource = () => null;

export function Orb({
  state,
  inputLevel = none,
  outputLevel = none,
}: {
  state: VoiceState;
  inputLevel?: LevelSource;
  outputLevel?: LevelSource;
}) {
  const root = useRef<HTMLDivElement>(null);
  const moving = useRef<SVGPathElement>(null);
  const trace = useRef<SVGPathElement>(null);
  const waveBox = useRef<HTMLDivElement>(null);

  useOrbMotion({ root, moving, trace, waveBox }, state, { input: inputLevel, output: outputLevel });

  return (
    <div ref={root} className={styles.wrap} data-state={state} aria-hidden="true">
      <div className={styles.light} />
      <div className={styles.orb} />
      <div ref={waveBox} className={styles.wave} data-rest="true">
        <svg viewBox="0 0 224 152">
          <path className={styles.master} fill="currentColor" d={SYMBOL_PATH} />
          <path
            ref={moving}
            className={styles.moving}
            fill="none"
            stroke="currentColor"
            strokeWidth="22"
            strokeLinecap="round"
            d={REST_PATH}
          />
          <path
            ref={trace}
            className={styles.trace}
            fill="none"
            strokeWidth="22"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="14 86"
            d={REST_PATH}
          />
        </svg>
      </div>
    </div>
  );
}
