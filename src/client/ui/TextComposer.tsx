// Type instead of talking: for a quiet room or no mic. Solid at Glass 0 (the brand book keeps forms
// solid); a glass pill as the Glass setting rises (Turki's direction, Day 2).
// It also takes a picture: the button (on a phone it offers the camera), or paste one into the box.
// A waiting picture shows as a thumbnail and goes with the next turn, typed or spoken.

import { useRef, useState } from "react";
import { Icon } from "./Icon";
import styles from "./TextComposer.module.css";

type Props = {
  placeholder: string;
  sendLabel: string;
  onSend: (text: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** The waiting picture's URL, if any. */
  picture: string | null;
  labels: { add: string; remove: string };
  onPicture: (file: File) => void;
  onClearPicture: () => void;
};

export function TextComposer({
  placeholder,
  sendLabel,
  onSend,
  inputRef,
  picture,
  labels,
  onPicture,
  onClearPicture,
}: Props) {
  const [text, setText] = useState("");
  const local = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? local;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value && !picture) return;
    onSend(value);
    setText("");
  };

  return (
    <form className={`${styles.form} glass-panel`} onSubmit={submit}>
      <button
        type="button"
        className={styles.attach}
        aria-label={labels.add}
        title={labels.add}
        onClick={() => file.current?.click()}
      >
        <Icon name="image" />
      </button>
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onPicture(picked);
          e.target.value = "";
        }}
      />
      {picture && (
        <span className={styles.thumb}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL */}
          <img src={picture} alt="" />
          <button type="button" aria-label={labels.remove} title={labels.remove} onClick={onClearPicture}>
            <Icon name="x" />
          </button>
        </span>
      )}
      <input
        ref={ref}
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          // A pasted picture (a screenshot, a copied image) is attached instead of pasted as text.
          const pasted = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
          if (pasted) {
            e.preventDefault();
            onPicture(pasted);
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={600}
        dir="auto"
        enterKeyHint="send"
      />
      <button
        type="submit"
        className={styles.send}
        aria-label={sendLabel}
        disabled={!text.trim() && !picture}
      >
        <Icon name="send" />
      </button>
    </form>
  );
}
