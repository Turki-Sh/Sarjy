// The glass control bar: end, mic, voice settings (visual identity, section 9).
// The mic has three looks: glass when ready, green when live, dashed when there is no mic access.

import { Icon } from "./Icon";
import styles from "./ControlBar.module.css";

export type MicLook = "ready" | "live" | "blocked";

type Props = {
  mic: MicLook;
  labels: { talk: string; stop: string; end: string; settings: string };
  onMic: () => void;
  onEnd: () => void;
  onSettings: () => void;
};

export function ControlBar({ mic, labels, onMic, onEnd, onSettings }: Props) {
  return (
    <div className={`${styles.bar} glass`}>
      <button type="button" className={styles.ctl} aria-label={labels.end} onClick={onEnd}>
        <Icon name="x" />
      </button>
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
      <button type="button" className={styles.ctl} aria-label={labels.settings} onClick={onSettings}>
        <Icon name="sliders" />
      </button>
    </div>
  );
}
