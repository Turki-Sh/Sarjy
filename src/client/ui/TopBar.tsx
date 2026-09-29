// The top of the voice area: about, the assistant's name, and quick switches for language and theme.
// (The settings sheet in milestone M5 takes over the switches; these stay as shortcuts.)

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Theme } from "@/shared/preferences";
import { Icon } from "./Icon";
import styles from "./TopBar.module.css";

type Props = {
  lang: Lang;
  theme: Theme;
  onToggleLang: () => void;
  onToggleTheme: () => void;
};

export function TopBar({ lang, theme, onToggleLang, onToggleTheme }: Props) {
  const s = t(lang);
  return (
    <header className={styles.top}>
      <b className={styles.title}>{lang === "ar" ? "سرجي" : "Sarjy"}</b>
      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={onToggleLang} aria-label={s.language}>
          <Icon name="globe" />
          <span lang={lang === "ar" ? "en" : "ar"}>{s.otherLanguage}</span>
        </button>
        <button type="button" className={styles.icon} onClick={onToggleTheme} aria-label={s.theme}>
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </div>
    </header>
  );
}
