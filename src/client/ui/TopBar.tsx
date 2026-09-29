// The top of the voice area. With the sidebar closed: buttons to reopen it and start a new chat.
// On the other side: share (when there is an answer) and quick switches for language and theme.
// (The settings panel in milestone M5 takes over the switches.)

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
  /** Present when there is an answer to share. */
  onShare?: () => void;
  /** Present when the sidebar is closed. */
  onOpenSidebar?: () => void;
  onNewChat: () => void;
};

export function TopBar({
  lang,
  theme,
  onToggleLang,
  onToggleTheme,
  onShare,
  onOpenSidebar,
  onNewChat,
}: Props) {
  const s = t(lang);
  return (
    <header className={styles.top}>
      <div className={styles.actions}>
        {onOpenSidebar && (
          <>
            <button
              type="button"
              className={styles.bare}
              onClick={onOpenSidebar}
              aria-label={s.openSidebar}
              title={s.openSidebar}
            >
              <Icon name="sidebar" />
            </button>
            <button
              type="button"
              className={styles.bare}
              onClick={onNewChat}
              aria-label={s.newChat}
              title={s.newChat}
            >
              <Icon name="plus" />
            </button>
          </>
        )}
      </div>
      <div className={styles.actions}>
        {onShare && (
          <button
            type="button"
            className={styles.icon}
            onClick={onShare}
            aria-label={s.share}
            title={s.share}
          >
            <Icon name="share" />
          </button>
        )}
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
