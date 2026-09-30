// The conversation under the orb, one bubble per message (like x.ai's voice mode): your words on
// one side, Sarjy's on the other in the voice face. The earlier lines are small and fade with age;
// the line being said now is the largest, and Sarjy's words come into focus as they are spoken.

import type { ChatLine } from "../voice/useSarjy";
import { Caption, type CaptionModel } from "./Caption";
import styles from "./Transcript.module.css";

type Props = { earlier: ChatLine[]; caption: CaptionModel | null };

export function Transcript({ earlier, caption }: Props) {
  if (!earlier.length && !caption) return null;
  return (
    <div className={styles.transcript}>
      {earlier.length > 0 && (
        <ol className={styles.earlier} aria-hidden="true">
          {earlier.map((line, i) => (
            <li
              key={`${earlier.length - i}:${line.text.slice(0, 24)}`}
              className={`${styles.bubble} ${line.role === "assistant" ? `${styles.sarjy} glass text` : styles.user}`}
              lang={line.lang}
              dir={line.lang === "ar" ? "rtl" : "ltr"}
              // The newest earlier line is the clearest; older ones fade.
              data-age={earlier.length - 1 - i}
            >
              {line.text}
            </li>
          ))}
        </ol>
      )}
      {caption && (
        <div
          className={`${styles.bubble} ${styles.now} ${caption.speaker === "sarjy" ? `${styles.sarjy} glass text` : styles.user}`}
        >
          <Caption caption={caption} />
        </div>
      )}
    </div>
  );
}
