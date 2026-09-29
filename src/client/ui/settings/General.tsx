// Settings, General: the interface language. "Auto detect" follows the browser's language.

import { t, type Lang } from "@/shared/i18n";
import type { LangChoice } from "@/shared/preferences";
import { Picker } from "./Picker";
import styles from "./Settings.module.css";

type Props = { lang: Lang; choice: LangChoice; onChoice: (choice: LangChoice) => void };

export function General({ lang, choice, onChoice }: Props) {
  const s = t(lang).settings;
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div>
          <span className={styles.label}>{s.language}</span>
          <p className={styles.hint}>{s.languageHint}</p>
        </div>
        <Picker
          label={s.language}
          value={choice}
          onChange={onChoice}
          options={[
            { value: "auto", label: s.auto },
            { value: "en", label: "English", lang: "en" },
            { value: "ar", label: "العربية", lang: "ar" },
          ]}
        />
      </div>
    </div>
  );
}
