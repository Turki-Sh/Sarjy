// Type instead of talking: for a quiet room or no mic. Solid at Glass 0 (the brand book keeps forms
// solid); a glass pill as the Glass setting rises (Turki's direction, Day 2).

import { useRef, useState } from "react";
import { Icon } from "./Icon";
import styles from "./TextComposer.module.css";

export function TextComposer({
  placeholder,
  sendLabel,
  onSend,
  inputRef,
}: {
  placeholder: string;
  sendLabel: string;
  onSend: (text: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [text, setText] = useState("");
  const local = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? local;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  return (
    <form className={`${styles.form} glass-panel`} onSubmit={submit}>
      <input
        ref={ref}
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={600}
        dir="auto"
        enterKeyHint="send"
      />
      <button type="submit" className={styles.send} aria-label={sendLabel} disabled={!text.trim()}>
        <Icon name="send" />
      </button>
    </form>
  );
}
