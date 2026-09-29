"use client";

// Settings, Memory: every fact Sarjy keeps, stitched like the sidebar cards, each with Edit and
// Forget. Forget everything deletes the user and all they own, after one clear confirmation.

import { useState } from "react";
import { t, type Lang } from "@/shared/i18n";
import type { Memory } from "@/shared/protocol";
import styles from "./Settings.module.css";

type Props = {
  lang: Lang;
  memories: Memory[];
  onEdit: (id: string, value: string) => void;
  onForget: (id: string) => void;
  onForgetAll: () => void;
};

export function MemoryList({ lang, memories, onEdit, onForget, onForgetAll }: Props) {
  const s = t(lang);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <p className={styles.intro}>{s.settings.memoryHint}</p>
      <div className={styles.card}>
        {memories.length === 0 && <p className={`${styles.hint} ${styles.row}`}>{s.emptyMemory}</p>}
        {memories.map((m) => (
          <div key={m.id} className={`${styles.row} ${styles.fact}`} lang={m.lang}>
            {editing === m.id ? (
              <form
                className={styles.inline}
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = new FormData(e.currentTarget).get("value");
                  if (typeof value === "string" && value.trim()) onEdit(m.id, value.trim());
                  setEditing(null);
                }}
              >
                <input
                  name="value"
                  className={styles.input}
                  defaultValue={m.value}
                  aria-label={m.label}
                  maxLength={120}
                  autoFocus
                  onKeyDown={(e) => e.key === "Escape" && (e.preventDefault(), setEditing(null))}
                />
                <button type="submit" className={styles.button}>
                  {s.settings.save}
                </button>
              </form>
            ) : (
              <>
                <div className={styles.stitched}>
                  <span className={styles.hint}>{m.label}</span>
                  <b>{m.value}</b>
                </div>
                <span className={styles.inline}>
                  {/* Named with the fact ("Forget Favorite color"), so a screen reader knows which one. */}
                  <button
                    type="button"
                    className={styles.quiet}
                    aria-label={`${s.settings.edit} ${m.label}`}
                    onClick={() => setEditing(m.id)}
                  >
                    {s.settings.edit}
                  </button>
                  <button
                    type="button"
                    className={styles.quiet}
                    aria-label={`${s.settings.forget} ${m.label}`}
                    onClick={() => onForget(m.id)}
                  >
                    {s.settings.forget}
                  </button>
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <div>
            <span className={styles.label}>{s.settings.forgetAll}</span>
            <p className={styles.hint}>{s.settings.forgetAllHint}</p>
          </div>
          {confirming ? (
            <span className={styles.inline}>
              <button type="button" className={styles.quiet} onClick={() => setConfirming(false)}>
                {s.settings.cancel}
              </button>
              <button type="button" className={`${styles.button} ${styles.danger}`} onClick={onForgetAll}>
                {s.settings.forgetAllConfirm}
              </button>
            </span>
          ) : (
            <button
              type="button"
              className={`${styles.button} ${styles.danger}`}
              onClick={() => setConfirming(true)}
            >
              {s.settings.forgetAll}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
