"use client";

// Settings, Rafeeq: pick a companion, or none (the orb, the default). Two families: the plush
// Rafeeqs, and the first four. Each card is a live, calm preview of the companion itself, with
// your level with that one (each has its own bond, raised on its own). Below, the one you have
// now: its level, how far to the next, and what each level unlocks.

import { t, type Lang } from "@/shared/i18n";
import { bondOf, RAFEEQS, UNLOCKS, type RafeeqId } from "@/shared/rafeeq";
import { Orb } from "../Orb";
import { Rafeeq } from "../rafeeq/Rafeeq";
import styles from "./Settings.module.css";

type Props = {
  lang: Lang;
  choice: RafeeqId | null;
  /** Bond points with each companion (shared/rafeeq.ts, bondOf). */
  bonds: Partial<Record<RafeeqId, number>>;
  onChoice: (choice: RafeeqId | null) => void;
};

const PLUSH = RAFEEQS.slice(0, 4);
const CLASSIC = RAFEEQS.slice(4);

export function RafeeqPicker({ lang, choice, bonds, onChoice }: Props) {
  const s = t(lang).rafeeq;
  const levelOf = (id: RafeeqId) => bondOf(bonds[id] ?? 0).level;
  const card = (id: RafeeqId | null) => (
    <button
      key={id ?? "none"}
      type="button"
      role="radio"
      aria-checked={choice === id}
      className={styles.rafeeqChoice}
      onClick={() => onChoice(id)}
    >
      <span className={styles.rafeeqPreview} aria-hidden="true">
        {id ? <Rafeeq id={id} state="idle" level={levelOf(id)} preview /> : <Orb state="idle" />}
      </span>
      <span className={styles.label}>{id ? s.names[id] : s.none}</span>
      {id && <span className={styles.rafeeqLevel}>{s.short(levelOf(id))}</span>}
      <span className={styles.hint}>{id ? s.traits[id] : s.noneLine}</span>
    </button>
  );
  const bond = choice ? (bonds[choice] ?? 0) : 0;
  const { level, progress, next } = bondOf(bond);
  return (
    <>
      <p className={styles.intro}>{s.intro}</p>
      <div className={styles.rafeeqs} role="radiogroup" aria-label={t(lang).settings.rafeeq}>
        {card(null)}
        <h4 className={styles.rafeeqGroup}>{s.groups.plush}</h4>
        {PLUSH.map(card)}
        <h4 className={styles.rafeeqGroup}>{s.groups.classic}</h4>
        {CLASSIC.map(card)}
      </div>

      {choice && (
        <div className={styles.card}>
          <div className={`${styles.row} ${styles.stack}`}>
            <div>
              <span className={styles.label}>
                {s.names[choice]} · {s.levels[level - 1]}
              </span>
              <p className={styles.hint}>{s.lines[choice]}</p>
              <p className={`${styles.hint} ${styles.story}`}>{s.stories[choice]}</p>
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
