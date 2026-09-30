// The sky over a scene: its colors by the time of day (the scene's data-time, see
// Scene.module.css), stars that come out at dusk and twinkle at night, the sun or the moon
// along an arc, and now and then a shooting star. Stars are placed by a seeded random, so the
// server and the browser draw the same sky.

import type { CSSProperties } from "react";
import { seeded } from "@/shared/random";
import styles from "./Scene.module.css";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

type Props = {
  /** Where the sun (or moon) is along its arc: 0 rising on the left, 1 setting on the right. */
  arc?: number;
  stars?: number;
  seed?: number;
  /** A shooting star every so often (at night). */
  shooting?: boolean;
  /** The sun and moon (a scene can place its own). */
  bodies?: boolean;
  className?: string;
};

export function Sky({ arc = 0.5, stars = 70, seed = 7, shooting = true, bodies = true, className }: Props) {
  const rand = seeded(seed);
  const field = Array.from({ length: stars }, () => ({
    x: rand() * 160,
    y: rand() * 62,
    r: 0.6 + rand() * 1.3,
    delay: rand() * 5,
    twinkle: rand() < 0.45,
  }));
  // The arc: low at both ends, high in the middle.
  const place = {
    "--arc-x": `${8 + arc * 84}%`,
    "--arc-y": `${78 - Math.sin(arc * Math.PI) * 58}%`,
  } as CSSProperties;
  return (
    <div className={`${styles.sky}${className ? ` ${className}` : ""}`} aria-hidden="true">
      <svg className={styles.stars} viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">
        {field.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.16}
            className={s.twinkle ? styles.twinkle : undefined}
            style={{ animationDelay: `${s.delay}s` }}
          />
        ))}
      </svg>
      {shooting && <span className={styles.shooting} />}
      {bodies && (
        <div className={styles.orbit} style={place}>
          <span className={styles.sun} />
          <span className={styles.moon} />
        </div>
      )}
    </div>
  );
}
