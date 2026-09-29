// Settings, Appearance: System, Light or Dark, each shown as a tiny picture of the voice screen
// drawn in that scheme (the .scheme-light and .scheme-dark token classes), not a sun and a moon.

import { t, type Lang } from "@/shared/i18n";
import type { ThemeChoice } from "@/shared/preferences";
import styles from "./Settings.module.css";

type Props = { lang: Lang; choice: ThemeChoice; onChoice: (choice: ThemeChoice) => void };

/** A miniature voice screen: sidebar lines, the orb, the text box. */
function Mini({ scheme }: { scheme: "light" | "dark" }) {
  return (
    <span className={`${styles.mini} scheme-${scheme}`} aria-hidden="true">
      <span className={styles.miniSide}>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.miniMain}>
        <span className={styles.miniOrb} />
        <span className={styles.miniBox} />
      </span>
    </span>
  );
}

export function Appearance({ lang, choice, onChoice }: Props) {
  const s = t(lang).settings;
  const options: { id: ThemeChoice; label: string }[] = [
    { id: "system", label: s.system },
    { id: "light", label: s.light },
    { id: "dark", label: s.dark },
  ];
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <span className={styles.label} id="settings-mode">
          {s.mode}
        </span>
        <div className={styles.modes} role="radiogroup" aria-labelledby="settings-mode">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={o.id === choice}
              className={styles.mode}
              onClick={() => onChoice(o.id)}
            >
              {o.id === "system" ? (
                // Half light, half dark: "whichever your device uses".
                <span className={styles.split}>
                  <Mini scheme="light" />
                  <Mini scheme="dark" />
                </span>
              ) : (
                <Mini scheme={o.id} />
              )}
              <span className={styles.modeLabel}>{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
