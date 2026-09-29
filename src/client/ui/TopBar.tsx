// The top of the voice area. With the sidebar closed: buttons to reopen it and start a new chat.
// On the other side: share, when there is an answer to share. Theme and language live in Settings.

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { Icon } from "./Icon";
import styles from "./TopBar.module.css";

type Props = {
  lang: Lang;
  /** Present when there is an answer to share. */
  onShare?: () => void;
  /** Present when the sidebar is closed. */
  onOpenSidebar?: () => void;
  onNewChat: () => void;
};

export function TopBar({ lang, onShare, onOpenSidebar, onNewChat }: Props) {
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
            className={`${styles.icon} glass`}
            onClick={onShare}
            aria-label={s.share}
            title={s.share}
          >
            <Icon name="share" />
          </button>
        )}
      </div>
    </header>
  );
}
