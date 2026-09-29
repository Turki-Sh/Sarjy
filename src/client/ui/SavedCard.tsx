// The moment something is remembered: a small stitched glass card under the orb, "Saved · Favorite
// color: Green". Memory lives in Settings now, so this is where you see it happen. It fades after a
// few seconds; tapping it opens Settings, Memory. Forgetting shows the same card, crossed out.

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
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
      aria-label={`${s.savedCard}: ${memory.label}, ${memory.value}`}
    >
      <span className={styles.tag}>{s.savedCard}</span>
      <span lang={memory.lang} dir={memory.lang === "ar" ? "rtl" : "ltr"}>
        {memory.label}: <b>{memory.value}</b>
      </span>
    </button>
  );
}
