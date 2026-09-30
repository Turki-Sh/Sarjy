"use client";

// Everyone in the Majlis, seated around the finjan in their own profile picture and seat color
// (Turki, Day 3). Whoever has the mic moves in beside the cup, larger, ringed in their color that
// pulses while they talk, with their name over them; while Sarjy answers them the ring holds
// still. People who aren't connected fade.

import type { CSSProperties } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Member } from "@/shared/room";
import styles from "./Majlis.module.css";
import { seatStyle } from "./seat";
import { seatAngle } from "./seating";

type Props = {
  lang: Lang;
  members: Member[];
  online: string[];
  me: string;
  /** Who holds the mic: talking now. */
  floor: string | null;
  /** Whose turn Sarjy is on: they asked, it answers. */
  asker: string | null;
  /** Whose own recorded words are playing here now: they are talking, to this screen. */
  voicing: string | null;
};

export function MajlisSeats({ lang, members, online, me, floor, asker, voicing }: Props) {
  const s = t(lang).majlis;
  const rtl = lang === "ar";
  const talking = voicing ?? floor;
  const active = talking ?? asker;
  const nameOf = (m: Member) => (m.id === me ? s.you : (m.name ?? s.guest(m.seat)));

  return (
    <ul className={styles.seats} aria-label={s.people}>
      {members.map((m, i) => {
        const here = m.id === me || online.includes(m.id);
        const mode = m.id === talking ? "talking" : m.id === active ? "asked" : undefined;
        const label = mode === "talking" ? s.holding(nameOf(m)) : nameOf(m);
        return (
          <li
            key={m.id}
            className={styles.seat}
            style={
              { ...seatStyle(m.seat), "--a": `${seatAngle(i, members.length, rtl)}deg` } as CSSProperties
            }
            data-active={mode}
            data-away={here ? undefined : true}
            title={label}
          >
            <span className={styles.face}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a small fixed-size picture */}
              <img src={m.avatar} alt="" width={40} height={40} />
            </span>
            {mode && (
              <span className={styles.nameTag} aria-hidden="true">
                {nameOf(m)}
              </span>
            )}
            <span className="sr-only">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
