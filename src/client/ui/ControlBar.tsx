// The glass control bar under the text box (visual identity, section 9).
// The orb itself is the mic (Turki's direction, Day 2), so the bar only holds what a turn needs:
// End, while there is something to end, and voice settings once they exist (M5).
// With nothing to show, the bar is not drawn at all.

import { Icon } from "./Icon";
import styles from "./ControlBar.module.css";

/** How the mic looks, now drawn on the orb: ready, live, or dashed when there is no mic access. */
export type MicLook = "ready" | "live" | "blocked";

type Props = {
  labels: { end: string; settings: string };
  /** Present while Sarjy is listening, thinking or speaking. */
  onEnd?: () => void;
  onSettings?: () => void;
};

export function ControlBar({ labels, onEnd, onSettings }: Props) {
  if (!onEnd && !onSettings) return null;
  return (
    <div className={`${styles.bar} glass ${styles.appear}`}>
      {onEnd && (
        <button type="button" className={styles.ctl} aria-label={labels.end} onClick={onEnd}>
          <Icon name="x" />
        </button>
      )}
      {onSettings && (
        <button type="button" className={styles.ctl} aria-label={labels.settings} onClick={onSettings}>
          <Icon name="sliders" />
        </button>
      )}
    </div>
  );
}
