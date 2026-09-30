"use client";

// The orb: a liquid glass sphere holding the logo wave. It is the product's status light.
// Layers, back to front: the light (a blurred conic sweep), the glass sphere, the wave.
// In a Majlis the wave gives way to a finjan (Turki, Day 3), whose steam rises with the voice;
// the light still carries every state.
// Motion comes from useOrbMotion; this component is only structure.

import { useRef } from "react";
import { SYMBOL_PATH } from "@/shared/brand/marks";
import type { VoiceState } from "@/shared/states";
import { REST, wavePath } from "@/shared/wave";
import { useOrbMotion, type LevelSource } from "../voice/useOrbMotion";
import styles from "./Orb.module.css";

const REST_PATH = wavePath(REST);

/** The finjan, drawn like the symbol (round caps, heavy stroke) in the same 224 x 152 box. */
const FINJAN_CUP = "M60 58 C66 96 78 124 92 140 H132 C146 124 158 96 164 58 Z";
const FINJAN_STEAM = ["M98 36 C88 26 108 16 98 2", "M126 36 C116 26 136 16 126 2"];
const none: LevelSource = () => null;

export function Orb({
  state,
  inputLevel = none,
  outputLevel = none,
  majlis = false,
}: {
  state: VoiceState;
  /** In a Majlis: the finjan instead of the wave. */
  majlis?: boolean;
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
      <div ref={waveBox} className={styles.wave} data-rest="true" data-majlis={majlis || undefined}>
        <svg viewBox="0 0 224 152">
          {majlis && (
            <g className={styles.finjan}>
              <path
                d={FINJAN_CUP}
                fill="none"
                stroke="currentColor"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {FINJAN_STEAM.map((d, i) => (
                <path
                  key={d}
                  className={styles.steam}
                  style={{ animationDelay: `${i * -1.1}s` }}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              ))}
            </g>
          )}
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
