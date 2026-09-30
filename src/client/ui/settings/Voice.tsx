"use client";

// Settings, Voice: Sarjy's voice in each language. Picking a voice saves it and plays a short line
// in it; the play button on each lets you listen without choosing.

import { useRef } from "react";
import { t, type Lang } from "@/shared/i18n";
import { VOICE_NAMES, VOICES } from "@/shared/voices";
import { Icon } from "../Icon";
import styles from "./Settings.module.css";

type Props = { lang: Lang; voices: Record<Lang, string>; onVoice: (lang: Lang, id: string) => void };

export function Voice({ lang, voices, onVoice }: Props) {
  const s = t(lang).settings;
  const playing = useRef<HTMLAudioElement | null>(null);
  const listen = (voiceLang: Lang, id: string) => {
    playing.current?.pause();
    playing.current = new Audio(`/api/voices/preview?lang=${voiceLang}&voice=${id}`);
    void playing.current.play().catch(() => {});
  };

  return (
    <>
      <p className={styles.intro}>{s.voiceHint}</p>
      <div className={styles.card}>
        {(["en", "ar"] as const).map((voiceLang) => (
          <div key={voiceLang} className={`${styles.row} ${styles.stack}`}>
            <span className={styles.label} id={`voice-${voiceLang}`}>
              {voiceLang === "en" ? s.voiceEn : s.voiceAr}
            </span>
            <div className={styles.voices} role="radiogroup" aria-labelledby={`voice-${voiceLang}`}>
              {VOICES[voiceLang].map((id) => (
                <span key={id} className={styles.voice} data-on={voices[voiceLang] === id || undefined}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={voices[voiceLang] === id}
                    className={styles.voiceName}
                    onClick={() => {
                      onVoice(voiceLang, id);
                      listen(voiceLang, id);
                    }}
                  >
                    {VOICE_NAMES[id]?.[lang] ?? id}
                  </button>
                  <button
                    type="button"
                    className={styles.voicePlay}
                    aria-label={`${s.listen}: ${VOICE_NAMES[id]?.[lang] ?? id}`}
                    title={s.listen}
                    onClick={() => listen(voiceLang, id)}
                  >
                    <Icon name="play" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
