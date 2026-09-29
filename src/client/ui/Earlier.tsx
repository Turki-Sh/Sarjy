// The last few lines of the chat, small and faded, above the caption. They make a switch between
// chats visible at a glance, and keep the question in view while Sarjy answers it.
// Your lines are in the interface face; Sarjy's in the voice face, like the caption.

import type { ChatLine } from "../voice/useSarjy";
import styles from "./Earlier.module.css";

export function Earlier({ lines }: { lines: ChatLine[] }) {
  if (!lines.length) return null;
  return (
    <ol className={styles.earlier} aria-hidden="true">
      {lines.map((line, i) => (
        <li
          // The newest line is the most visible; older ones fade.
          key={`${lines.length - i}:${line.text.slice(0, 24)}`}
          className={line.role === "assistant" ? styles.sarjy : styles.user}
          lang={line.lang}
          dir={line.lang === "ar" ? "rtl" : "ltr"}
          data-age={lines.length - 1 - i}
        >
          {line.text}
        </li>
      ))}
    </ol>
  );
}
