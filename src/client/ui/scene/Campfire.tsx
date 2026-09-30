// A campfire for the lost Rafeeqs (the 404): a ring of stones, crossed logs, three layers of
// flame that flicker out of step, a glow that breathes on the sand around it, embers drifting up
// and a thread of smoke. Stoked (a tap), it flares up and throws a burst of sparks.

import type { CSSProperties } from "react";
import styles from "./Scene.module.css";

/** A flame, as a teardrop standing on (50, 100) in a 100 x 100 box. */
const FLAME = "M50 100 C22 96 18 70 32 50 C40 38 44 24 50 4 C58 24 70 36 76 54 C84 76 76 96 50 100 Z";
const TONGUE = "M50 100 C38 96 36 82 42 70 C46 62 48 54 50 44 C54 56 60 64 62 74 C64 88 60 98 50 100 Z";
/** Embers: where each rises from, how far it drifts, how long it takes, when it starts. */
const EMBERS: [number, number, number, number][] = [
  [44, -18, 2.6, 0],
  [52, 12, 3.1, 0.7],
  [48, -8, 2.2, 1.3],
  [56, 22, 3.4, 0.4],
  [40, -26, 2.9, 1.9],
  [50, 6, 2.4, 2.4],
  [46, 16, 3.6, 1.1],
  [54, -14, 2.8, 2.9],
];

export function Campfire({ stoked = false, onStoke }: { stoked?: boolean; onStoke?: () => void }) {
  return (
    <div className={styles.campfire} data-stoked={stoked || undefined} onClick={onStoke} aria-hidden="true">
      <span className={styles.fireGlow} />
      <svg className={styles.fireSvg} viewBox="0 0 100 100">
        <g className={styles.smoke}>
          <path d="M50 30 C44 20 56 12 50 2" />
          <path d="M52 34 C60 24 46 14 54 4" />
        </g>
        <g className={styles.flames}>
          <path d={FLAME} className={styles.flameEdge} />
          <g transform="translate(-13 3) rotate(-12 50 100)">
            <path d={TONGUE} className={`${styles.flameEdge} ${styles.tongue}`} />
          </g>
          <g transform="translate(13 3) rotate(12 50 100)">
            <path d={TONGUE} className={`${styles.flameEdge} ${styles.tongue} ${styles.tongueR}`} />
          </g>
          {/* Smaller flames inside the big one, scaled from its foot. */}
          <g transform="translate(50 100) scale(0.74) translate(-50 -100)">
            <path d={FLAME} className={styles.flameMid} />
          </g>
          <g transform="translate(50 100) scale(0.44 0.52) translate(-50 -100)">
            <path d={FLAME} className={styles.flameCore} />
          </g>
        </g>
        <g className={styles.logs}>
          <rect x="18" y="86" width="64" height="9" rx="4.5" transform="rotate(-14 50 90)" />
          <rect x="18" y="86" width="64" height="9" rx="4.5" transform="rotate(14 50 90)" />
          <circle cx="21" cy="96" r="3" className={styles.logEnd} />
          <circle cx="79" cy="96" r="3" className={styles.logEnd} />
        </g>
        <g className={styles.stones}>
          <ellipse cx="14" cy="98" rx="8" ry="5" />
          <ellipse cx="30" cy="100" rx="9" ry="5" />
          <ellipse cx="50" cy="101" rx="9" ry="5" />
          <ellipse cx="70" cy="100" rx="9" ry="5" />
          <ellipse cx="86" cy="98" rx="8" ry="5" />
        </g>
      </svg>
      {EMBERS.map(([x, dx, dur, delay], i) => (
        <span
          key={i}
          className={styles.ember}
          style={
            {
              "--ex": `${x}%`,
              "--dx": `${dx}px`,
              "--dur": `${dur}s`,
              "--delay": `${delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
