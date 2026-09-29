// Settings, Appearance: System, Light or Dark, each shown as a tiny picture of the voice screen
// drawn in that scheme (the .scheme-light and .scheme-dark token classes), not a sun and a moon.

import { t, type Lang } from "@/shared/i18n";
import type { ThemeChoice } from "@/shared/preferences";
import styles from "./Settings.module.css";

type Props = {
  lang: Lang;
  choice: ThemeChoice;
  onChoice: (choice: ThemeChoice) => void;
  /** Liquid glass, 0 (solid) to 100 (clear). */
  glass: number;
  onGlass: (glass: number) => void;
};

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

export function Appearance({ lang, choice, onChoice, glass, onGlass }: Props) {
  const s = t(lang).settings;
  // The device asks for less transparency and you haven't chosen yet: say why Sarjy looks solid.
  const deviceAsksSolid =
    typeof window !== "undefined" &&
    document.documentElement.dataset.glass !== "set" &&
    matchMedia("(prefers-reduced-transparency: reduce), (prefers-contrast: more)").matches;
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
      <div className={`${styles.row} ${styles.stack}`}>
        <div>
          <label htmlFor="settings-glass" className={styles.label}>
            {s.glass}
          </label>
          <p className={styles.hint}>{s.glassHint}</p>
          {deviceAsksSolid && <p className={`${styles.hint} ${styles.note}`}>{s.glassSystem}</p>}
        </div>
        {/* Changes the page live as you drag: what you see is the setting. */}
        <div className={styles.slider}>
          <input
            id="settings-glass"
            type="range"
            min={0}
            max={100}
            step={1}
            value={glass}
            aria-valuetext={`${glass}%, ${s.glassStops[Math.min(3, Math.floor(glass / 25))]}`}
            onChange={(e) => onGlass(Number(e.target.value))}
            style={{ ["--fill" as string]: `${glass}%` }}
          />
          <div className={styles.stops} aria-hidden="true">
            {s.glassStops.map((stop, i) => (
              <button
                key={stop}
                type="button"
                tabIndex={-1}
                onClick={() => onGlass(Math.round((i / 3) * 100))}
              >
                {stop}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
