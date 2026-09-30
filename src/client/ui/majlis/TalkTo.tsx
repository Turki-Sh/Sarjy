"use client";

// Who your next turn is for in a Majlis (Turki, Day 3): everyone, or Sarjy. People talk to each
// other by default and Sarjy joins only when asked, which also keeps the cost down. Starting with
// "Sarjy" asks it whatever this says.

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { Icon } from "../Icon";
import styles from "./Majlis.module.css";

export type TalkTarget = "room" | "sarjy";

export function TalkTo({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: TalkTarget;
  onChange: (to: TalkTarget) => void;
}) {
  const s = t(lang).majlis;
  const option = (to: TalkTarget, label: string, icon: "users" | "finjan") => (
    <button
      type="button"
      role="radio"
      aria-checked={value === to}
      className={styles.target}
      onClick={() => onChange(to)}
    >
      <Icon name={icon} />
      {label}
    </button>
  );
  return (
    <div className={`${styles.talkTo} glass text`} role="radiogroup" aria-label={s.talkTo}>
      {option("room", s.everyone, "users")}
      {option("sarjy", s.sarjy, "finjan")}
    </div>
  );
}
