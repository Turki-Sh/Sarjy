"use client";

// The door of a Majlis: who opened it and who is inside, then one tap to come in. The tap is also
// what lets this browser play sound. Someone with no name yet is asked for one first, so the room
// knows who is talking (they may leave it empty and be a numbered guest). A Majlis that is full,
// ended or missing says so, with a way back.

import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { RoomPhase } from "../../room/useRoom";
import { Icon } from "../Icon";
import styles from "./Majlis.module.css";

type Props = {
  lang: Lang;
  phase: RoomPhase;
  hostName: string | null;
  /** How many have come in so far (known before joining, from the page). */
  people: number;
  /** Whether to ask for a name: you have none yet. */
  askName: boolean;
  onJoin: (name: string) => void;
};

export function MajlisDoor({ lang, phase, hostName, people, askName, onJoin }: Props) {
  const s = t(lang).majlis;
  const [name, setName] = useState("");
  const closed = phase === "full" || phase === "ended" || phase === "missing";

  return (
    <div className={`${styles.door} glass text`} role="dialog" aria-label={s.name(hostName)}>
      <Icon name="finjan" className={styles.doorMark} />
      <h1 className={styles.doorTitle}>{phase === "missing" ? s.missing : s.name(hostName)}</h1>
      {closed ? (
        <>
          {phase !== "missing" && <p className={styles.doorHint}>{phase === "full" ? s.full : s.ended}</p>}
          <Link href="/" className={styles.join}>
            {s.back}
          </Link>
        </>
      ) : (
        <form
          className={styles.doorForm}
          onSubmit={(e) => {
            e.preventDefault();
            onJoin(name);
          }}
        >
          {people > 0 && <p className={styles.doorCount}>{s.here(people)}</p>}
          <p className={styles.doorHint}>{s.joinHint}</p>
          {askName && (
            <label className={styles.nameField}>
              <span>{s.askName}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={s.namePlaceholder}
                maxLength={40}
                autoComplete="given-name"
                autoFocus
              />
            </label>
          )}
          <button type="submit" className={styles.join} disabled={phase === "joining"}>
            {s.join}
          </button>
        </form>
      )}
    </div>
  );
}
