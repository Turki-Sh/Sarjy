// A glass chip that says which tool answered and how long it took (visual identity, section 9).
// Machine output, so it is set in the mono face. Sarjy only quotes numbers that came back in a chip.

import styles from "./ToolChip.module.css";

export type ToolChipModel = { label: string; ms?: number; failed?: boolean };

export function ToolChip({ chip }: { chip: ToolChipModel | null }) {
  return (
    <div className={styles.slot}>
      {chip && (
        <span
          className={`${styles.chip} glass text`}
          data-failed={chip.failed ? "true" : undefined}
          dir="ltr"
        >
          <span>{chip.label}</span>
          {chip.ms !== undefined && <span className={styles.time}>{Math.round(chip.ms)} ms</span>}
          {chip.ms === undefined && !chip.failed && <span className={styles.time}>…</span>}
        </span>
      )}
    </div>
  );
}
