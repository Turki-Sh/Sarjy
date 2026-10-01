// Dunes along the bottom of a scene: three ridges, far to near, each lit from the sky's side and
// shaded on the other, with sand grain over them. They take their colors from the time of day
// (Scene.module.css) and drift with your pointer at their own depth (--px, usePointerParallax).
// Two shapes: rolling (the home page) and deep (the 404: a hollow for the campfire).

import { GRAIN } from "../rafeeq/art/shared";
import styles from "./Scene.module.css";

const SHAPES = {
  rolling: {
    far: "M0 250 C120 190 260 170 400 205 C520 235 640 160 800 150 C960 140 1080 215 1220 200 C1360 185 1480 150 1600 175 L1600 470 L0 470 Z",
    mid: "M0 300 C160 250 300 235 460 262 C600 286 700 225 880 222 C1060 219 1150 290 1320 280 C1450 272 1530 245 1600 250 L1600 470 L0 470 Z",
    near: "M0 350 C180 318 380 300 560 322 C720 342 860 300 1040 304 C1220 308 1360 352 1600 330 L1600 470 L0 470 Z",
    ridge: "M460 262 C600 286 700 225 880 222 C1060 219 1150 290 1320 280",
  },
  deep: {
    far: "M0 210 C140 170 300 150 440 190 C560 222 700 130 860 128 C1020 126 1130 200 1260 190 C1400 180 1500 140 1600 160 L1600 470 L0 470 Z",
    mid: "M0 270 C140 232 280 222 420 246 C520 262 600 290 800 292 C1000 294 1080 260 1200 246 C1360 228 1480 242 1600 236 L1600 470 L0 470 Z",
    near: "M0 330 C200 300 420 318 600 340 C700 352 900 352 1000 340 C1180 318 1400 296 1600 322 L1600 470 L0 470 Z",
    ridge: "M0 270 C140 232 280 222 420 246 C520 262 600 290 800 292",
  },
} as const;

export function Dunes({ shape = "rolling", uid }: { shape?: keyof typeof SHAPES; uid: string }) {
  const d = SHAPES[shape];
  const layer = (name: "far" | "mid" | "near") => (
    <g className={styles[name]}>
      <path d={d[name]} fill={`url(#${uid}-${name})`} />
      <path d={d[name]} fill={`url(#${uid}-grain)`} className={styles.sandGrain} />
    </g>
  );
  const stops = (name: string) => (
    <linearGradient id={`${uid}-${name}`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" style={{ stopColor: `var(--ridge-${name}-lit)` }} />
      <stop offset="0.55" style={{ stopColor: `var(--ridge-${name})` }} />
      <stop offset="1" style={{ stopColor: "var(--ridge-shade)" }} />
    </linearGradient>
  );
  return (
    <svg
      className={styles.dunes}
      viewBox="0 0 1600 400"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        {stops("far")}
        {stops("mid")}
        {stops("near")}
        <pattern id={`${uid}-grain`} width="180" height="180" patternUnits="userSpaceOnUse">
          <image href={GRAIN} width="180" height="180" />
        </pattern>
      </defs>
      {layer("far")}
      {layer("mid")}
      <path d={d.ridge} className={`${styles.ridge} ${styles.mid}`} />
      {layer("near")}
    </svg>
  );
}
