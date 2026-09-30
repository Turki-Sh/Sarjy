// The 404's props: the dust cloud two Rafeeqs squabble in (with stars popping out of it), the map
// they fight over (held upside down, or torn in two), and a speech bubble. Placed like actors, in
// percent of the stage, sized in percent of its width.

import type { CSSProperties, ReactNode } from "react";
import styles from "./Lost.module.css";

const at = (x: number, y: number, size: number) =>
  ({ "--x": `${x}%`, "--y": `${y}%`, "--size": size }) as CSSProperties;

/** A cartoon brawl: puffs of dust tumbling over each other, and little stars flying out. */
export function DustCloud({ x }: { x: number }) {
  const puffs = [0, 1, 2, 3, 4, 5, 6].map((i) => (
    <span key={i} className={styles.puff} style={{ "--i": i } as CSSProperties} />
  ));
  return (
    <>
      <div className={`${styles.cloud} ${styles.cloudFront}`} style={at(x, 100, 22)} aria-hidden="true">
        {puffs}
      </div>
      <Cloud x={x}>{puffs}</Cloud>
    </>
  );
}

function Cloud({ x, children }: { x: number; children: ReactNode }) {
  return (
    <div className={styles.cloud} style={at(x, 84, 22)} aria-hidden="true">
      {children}
      <svg className={styles.pow} viewBox="0 0 100 60">
        <path d="M18 14 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" />
        <path d="M80 8 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 l4 -1.6 Z" />
        <path d="M60 2 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 Z" />
      </svg>
    </div>
  );
}

/** The map: parchment, a dotted route and an X. Upside down, or torn in two. */
export function MapProp({
  x,
  y,
  torn = false,
  upsideDown = false,
}: {
  x: number;
  y: number;
  torn?: boolean;
  upsideDown?: boolean;
}) {
  const sheet = (clip: string) => (
    <svg viewBox="0 0 100 70" className={styles.mapSheet}>
      <g clipPath={clip}>
        <path d="M4 6 L34 2 L66 8 L96 3 L96 64 L66 68 L34 62 L4 67 Z" className={styles.paper} />
        <path d="M34 2 L34 62 M66 8 L66 68" className={styles.fold} />
        <path d="M14 52 C26 40 34 50 46 36 C56 26 66 34 78 20" className={styles.route} />
        <path d="M74 16 l8 8 M82 16 l-8 8" className={styles.x} />
        <path d="M16 12 l4 10 l4 -10 M20 22 v-12" className={styles.compass} />
      </g>
    </svg>
  );
  if (torn) {
    return (
      <>
        <div className={`${styles.map} ${styles.half}`} style={at(x - 8, y, 6)} aria-hidden="true">
          {sheet("url(#lost-left)")}
        </div>
        <div
          className={`${styles.map} ${styles.half} ${styles.halfR}`}
          style={at(x + 8, y, 6)}
          aria-hidden="true"
        >
          {sheet("url(#lost-right)")}
        </div>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <clipPath id="lost-left">
            <path d="M0 0 H52 L46 18 L54 34 L46 50 L52 70 H0 Z" />
          </clipPath>
          <clipPath id="lost-right">
            <path d="M52 0 H100 V70 H52 L46 50 L54 34 L46 18 Z" />
          </clipPath>
        </svg>
      </>
    );
  }
  return (
    <div
      className={`${styles.map}${upsideDown ? ` ${styles.upsideDown}` : ""}`}
      style={at(x, y, 9)}
      aria-hidden="true"
    >
      {sheet("none")}
    </div>
  );
}

/** What someone says, over their head. */
export function Bubble({ x, y, size, text }: { x: number; y: number; size: number; text: string }) {
  return (
    <p className={styles.bubble} style={at(x, y, size)} aria-live="polite">
      {text}
    </p>
  );
}
