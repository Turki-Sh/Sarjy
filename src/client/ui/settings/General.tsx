// Settings, General: the interface language. "Auto detect" follows the browser's language.

import { t, type Lang } from "@/shared/i18n";
import type { LangChoice } from "@/shared/preferences";
import styles from "./Settings.module.css";

type Props = { lang: Lang; choice: LangChoice; onChoice: (choice: LangChoice) => void };

export function General({ lang, choice, onChoice }: Props) {
  const s = t(lang).settings;
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div>
          <label htmlFor="settings-language" className={styles.label}>
            {s.language}
          </label>
          <p className={styles.hint}>{s.languageHint}</p>
        </div>
        <select
          id="settings-language"
          className={styles.select}
          value={choice}
          onChange={(e) => onChoice(e.target.value as LangChoice)}
        >
          <option value="auto">{s.auto}</option>
          <option value="en" lang="en">
            English
          </option>
          <option value="ar" lang="ar">
            العربية
          </option>
        </select>
      </div>
    </div>
  );
}
