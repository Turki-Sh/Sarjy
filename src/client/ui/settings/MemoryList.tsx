"use client";

// Settings, Memory: everything Sarjy keeps, grouped by topic like Claude's memory list (Day 2).
// Each memory is a sentence, with the words it came from under it, and Edit and Forget. The few the
// app reads bare (name, home city, units) edit their value; the rest edit their sentence.
// Forget everything deletes the user and all they own, after one clear confirmation.

import { useState } from "react";
import { t, type Lang } from "@/shared/i18n";
import { isSlot, noteOf, TOPIC_NAMES, TOPICS } from "@/shared/memory";
import type { Memory } from "@/shared/protocol";
import styles from "./Settings.module.css";

type Props = {
  lang: Lang;
  memories: Memory[];
  onEdit: (id: string, change: { note?: string; value?: string }) => void;
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
        {TOPICS.map((topic) => {
          const group = memories.filter((m) => m.topic === topic);
          if (!group.length) return null;
          return (
            <section key={topic} className={styles.topic} aria-label={TOPIC_NAMES[topic][lang]}>
              <h4 className={styles.topicName}>{TOPIC_NAMES[topic][lang]}</h4>
              {group.map((m) => {
                const bare = isSlot(m.key);
                return (
                  <div key={m.id} className={`${styles.row} ${styles.fact}`} lang={m.lang}>
                    {editing === m.id ? (
                      <form
                        className={styles.inline}
                        onSubmit={(e) => {
                          e.preventDefault();
                          const text = new FormData(e.currentTarget).get("text");
                          if (typeof text === "string" && text.trim())
                            onEdit(m.id, bare ? { value: text.trim() } : { note: text.trim() });
                          setEditing(null);
                        }}
                      >
                        <input
                          name="text"
                          className={styles.input}
                          defaultValue={bare ? m.value : noteOf(m)}
                          aria-label={m.label}
                          maxLength={bare ? 120 : 220}
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
                          <span className={styles.note}>{noteOf(m)}</span>
                          {m.source && (
                            <span className={styles.hint}>
                              {s.settings.memoryFrom}: “{m.source}”
                            </span>
                          )}
                        </div>
                        <span className={styles.inline}>
                          {/* Named with the memory ("Forget Favorite color"), so a screen reader knows which one. */}
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
                );
              })}
            </section>
          );
        })}
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
