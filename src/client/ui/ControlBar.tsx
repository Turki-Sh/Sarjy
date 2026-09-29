// The glass control bar: end, mic, voice settings (visual identity, section 9).
// The mic has three looks: glass when ready, green when live, dashed when there is no mic access.
// End only appears when there is something to end; settings only once there are settings (M5).

import { Icon } from "./Icon";
import styles from "./ControlBar.module.css";

export type MicLook = "ready" | "live" | "blocked";

type Props = {
  mic: MicLook;
  labels: { talk: string; stop: string; end: string; settings: string };
  onMic: () => void;
  /** Present while Sarjy is listening, thinking or speaking. */
  onEnd?: () => void;
  onSettings?: () => void;
};

export function ControlBar({ mic, labels, onMic, onEnd, onSettings }: Props) {
  return (
    <div className={`${styles.bar} glass`}>
      {onEnd && (
        <button
          type="button"
          className={`${styles.ctl} ${styles.appear}`}
          aria-label={labels.end}
          onClick={onEnd}
        >
          <Icon name="x" />
        </button>
      )}
      <button
        type="button"
        className={`${styles.ctl} ${styles.mic}`}
        data-look={mic}
        aria-label={mic === "live" ? labels.stop : labels.talk}
        aria-pressed={mic === "live"}
        onClick={onMic}
      >
        <Icon name="mic" />
      </button>
      {onSettings && (
        <button type="button" className={styles.ctl} aria-label={labels.settings} onClick={onSettings}>
          <Icon name="sliders" />
        </button>
      )}
    </div>
  );
}
