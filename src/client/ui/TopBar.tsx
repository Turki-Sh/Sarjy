// The top of the voice area. With the sidebar closed: buttons to reopen it and start a new chat.
// Sharing lives in each chat's ⋯ menu; theme and language live in Settings.

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { Icon } from "./Icon";
import styles from "./TopBar.module.css";

type Props = {
  lang: Lang;
  /** Present when the sidebar is closed. */
  onOpenSidebar?: () => void;
  /** Opens the sidebar as a sheet on a narrow screen (its button only shows there). */
  onOpenSheet: () => void;
  onNewChat: () => void;
};

export function TopBar({ lang, onOpenSidebar, onOpenSheet, onNewChat }: Props) {
  const s = t(lang);
  return (
    <header className={styles.top}>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.bare} ${styles.narrowOnly}`}
          onClick={onOpenSheet}
          aria-label={s.openSidebar}
          title={s.openSidebar}
        >
          <Icon name="menu" />
        </button>
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
    </header>
  );
}
