// The moment something is remembered: a small stitched glass card under the orb, "Noted · Your
// sister Noura is getting married in December 2026." Memories are written just after Sarjy replies
// (save, then show), so this card is how you see it happen. It fades after a few seconds; tapping
// it opens Settings, Memory.

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { noteOf } from "@/shared/memory";
import type { Memory } from "@/shared/protocol";
import styles from "./SavedCard.module.css";

export function SavedCard({
  lang,
  memory,
  onOpen,
}: {
  lang: Lang;
  memory: Memory | null;
  onOpen: () => void;
}) {
  if (!memory) return null;
  const s = t(lang);
  return (
    <button
      // A new save replays the card.
      key={memory.id + memory.updatedAt}
      type="button"
      className={`${styles.card} glass text`}
      onClick={onOpen}
      aria-label={`${s.savedCard}: ${noteOf(memory)}`}
    >
      <span className={styles.tag}>{s.savedCard}</span>
      <span lang={memory.lang} dir={memory.lang === "ar" ? "rtl" : "ltr"}>
        {noteOf(memory)}
      </span>
    </button>
  );
}
