"use client";

// Settings, Rafeeq: pick a companion, or none (the orb, the default). Each choice is a live, calm
// preview of the companion itself. Below, your bond: its level, how far to the next, and what each
// level unlocks, so there is something to look forward to.

import { t, type Lang } from "@/shared/i18n";
import { bondOf, RAFEEQS, UNLOCKS, type RafeeqId } from "@/shared/rafeeq";
import { Orb } from "../Orb";
import { Rafeeq } from "../rafeeq/Rafeeq";
import styles from "./Settings.module.css";

type Props = {
  lang: Lang;
  choice: RafeeqId | null;
  /** Bond points (shared/rafeeq.ts, bondOf). */
  bond: number;
  onChoice: (choice: RafeeqId | null) => void;
};

export function RafeeqPicker({ lang, choice, bond, onChoice }: Props) {
  const s = t(lang).rafeeq;
  const { level, progress, next } = bondOf(bond);
  const options: (RafeeqId | null)[] = [null, ...RAFEEQS];
  return (
    <>
      <p className={styles.intro}>{s.intro}</p>
      <div className={styles.rafeeqs} role="radiogroup" aria-label={t(lang).settings.rafeeq}>
        {options.map((id) => (
          <button
            key={id ?? "none"}
            type="button"
            role="radio"
            aria-checked={choice === id}
            className={styles.rafeeqChoice}
            onClick={() => onChoice(id)}
          >
            <span className={styles.rafeeqPreview} aria-hidden="true">
              {id ? <Rafeeq id={id} state="idle" level={level} preview /> : <Orb state="idle" />}
            </span>
            <span className={styles.label}>{id ? s.names[id] : s.none}</span>
            <span className={styles.hint}>{id ? s.lines[id] : s.noneLine}</span>
          </button>
        ))}
      </div>

      {choice && (
        <div className={styles.card}>
          <div className={`${styles.row} ${styles.stack}`}>
            <div>
              <span className={styles.label}>
                {s.names[choice]} · {s.levels[level - 1]}
              </span>
              <p className={styles.hint}>
                {s.level(level)}. {next === null ? s.maxed : s.toNext(next - bond)}
              </p>
            </div>
            <div
              className={styles.bondBar}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-label={s.levels[level - 1]}
            >
              <i style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <div className={`${styles.row} ${styles.stack}`}>
            <ul className={styles.unlocks}>
              {(Object.keys(UNLOCKS) as (keyof typeof UNLOCKS)[]).map((key) => (
                <li key={key} data-open={level >= UNLOCKS[key] || undefined}>
                  <span>{s.level(UNLOCKS[key])}</span>
                  {s.unlocks[key]}
                </li>
              ))}
            </ul>
            <p className={styles.hint}>{s.how}</p>
          </div>
        </div>
      )}
    </>
  );
}
