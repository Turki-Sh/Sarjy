"use client";

// Your bond with your Rafeeq, at the top of the screen: its name, the level you've reached, and a
// bar to the next. When the bond grows, "+2" floats up from it; on a new level it glows. Tapping it
// opens Settings, Rafeeq, where the levels and what they unlock are listed.

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { bondOf, type RafeeqId } from "@/shared/rafeeq";
import { Icon } from "../Icon";
import styles from "./BondPill.module.css";

type Props = {
  lang: Lang;
  id: RafeeqId;
  bond: number;
  /** The last time the bond grew, and by how much (each one floats up once). */
  gain: { n: number; at: number } | null;
  /** True for a moment after a new level. */
  leveledUp: boolean;
  onOpen: () => void;
};

export function BondPill({ lang, id, bond, gain, leveledUp, onOpen }: Props) {
  const s = t(lang).rafeeq;
  const { level, progress } = bondOf(bond);
  return (
    <button
      type="button"
      className={`${styles.pill} glass text`}
      data-up={leveledUp || undefined}
      onClick={onOpen}
      aria-label={`${s.open}: ${s.names[id]}, ${s.levels[level - 1]}`}
    >
      <Icon name="rafeeq" className={styles.icon} />
      <span className={styles.name}>{s.names[id]}</span>
      <span className={styles.level}>{s.levels[level - 1]}</span>
      <span className={styles.bar} aria-hidden="true">
        <i style={{ width: `${progress * 100}%` }} />
      </span>
      {gain && (
        <span key={gain.at} className={styles.gain} aria-hidden="true">
          +{gain.n}
        </span>
      )}
    </button>
  );
}
