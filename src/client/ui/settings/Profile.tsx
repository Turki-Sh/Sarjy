"use client";

// Settings, Profile: your picture (one of Turki's three paintings, or your own photo) and your name.

import { useRef, useState } from "react";
import { AVATARS, avatarUrl, type AvatarChoice, type AvatarId } from "@/shared/avatars";
import { t, type Lang } from "@/shared/i18n";
import { Icon } from "../Icon";
import styles from "./Settings.module.css";
import { shrinkImage } from "./shrinkImage";

type Props = {
  lang: Lang;
  name: string | null;
  avatar: AvatarChoice | null;
  avatarImage: string | null;
  onAvatar: (id: AvatarId) => void;
  onUpload: (dataUrl: string) => void;
  onName: (name: string) => void;
};

export function Profile({ lang, name, avatar, avatarImage, onAvatar, onUpload, onName }: Props) {
  const s = t(lang).settings;
  const file = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState(false);
  const [draft, setDraft] = useState(name ?? "");

  const upload = async (picked: File | undefined) => {
    if (!picked) return;
    const url = await shrinkImage(picked);
    setProblem(!url);
    if (url) onUpload(url);
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label} id="settings-picture">
            {s.picture}
          </span>
          <div className={styles.pictures} role="radiogroup" aria-labelledby="settings-picture">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={a.id === avatar}
                aria-label={a[lang]}
                title={a[lang]}
                className={styles.picture}
                onClick={() => onAvatar(a.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size image */}
                <img src={avatarUrl(a.id)} alt="" width={64} height={64} />
              </button>
            ))}
            {avatar === "upload" && avatarImage && (
              <button
                type="button"
                role="radio"
                aria-checked
                aria-label={s.upload}
                className={styles.picture}
                onClick={() => file.current?.click()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimize */}
                <img src={avatarImage} alt="" width={64} height={64} />
              </button>
            )}
            <button
              type="button"
              className={`${styles.picture} ${styles.uploadTile}`}
              aria-label={s.upload}
              title={s.upload}
              onClick={() => file.current?.click()}
            >
              <Icon name="upload" />
            </button>
            <input
              ref={file}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = ""; // choosing the same file again still triggers a change
              }}
            />
          </div>
        </div>
        <p className={`${styles.hint} ${styles.below}`} role={problem ? "alert" : undefined}>
          {problem ? s.badImage : s.uploadHint}
        </p>
      </div>

      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) onName(draft.trim());
        }}
      >
        <div className={styles.row}>
          <label htmlFor="settings-name" className={styles.label}>
            {s.name}
          </label>
          <span className={styles.inline}>
            <input
              id="settings-name"
              className={styles.input}
              value={draft}
              maxLength={60}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className={styles.button} disabled={!draft.trim() || draft.trim() === name}>
              {s.save}
            </button>
          </span>
        </div>
      </form>
    </>
  );
}
