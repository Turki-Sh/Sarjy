// The sidebar: search, new chat, the stitched memory list, recent chats, and you.
// Every memory is stitched (Dusk dashes): if it is stitched, it is remembered (visual identity, section 8).

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import { Logo } from "./brand/Logo";
import { Icon } from "./Icon";
import styles from "./Sidebar.module.css";

export type MemoryItem = { id: string; label: string; value: string; lang: Lang };
export type ChatItem = { id: string; title: string };

type Props = {
  lang: Lang;
  memories: MemoryItem[];
  recent: ChatItem[];
  userName: string | null;
  onNewChat: () => void;
};

export function Sidebar({ lang, memories, recent, userName, onNewChat }: Props) {
  const s = t(lang);
  return (
    <aside className={styles.side} aria-label={s.memory}>
      <div className={styles.brand}>
        <Logo lang={lang} className={styles.logo} />
      </div>

      <label className={styles.search}>
        <Icon name="search" />
        <input type="search" placeholder={s.search} aria-label={s.search} />
      </label>

      <button type="button" className={`${styles.item} ${styles.on}`} onClick={onNewChat}>
        <Icon name="plus" />
        {s.newChat}
      </button>

      <h2 className={styles.group}>{s.memory}</h2>
      <ul className={styles.list}>
        {memories.map((m) => (
          <li key={m.id} className={styles.memory} lang={m.lang} dir={m.lang === "ar" ? "rtl" : "ltr"}>
            <span>{m.label}</span>
            <b>{m.value}</b>
          </li>
        ))}
      </ul>

      <h2 className={styles.group}>{s.recent}</h2>
      <ul className={styles.list}>
        {recent.map((c) => (
          <li key={c.id}>
            <button type="button" className={styles.item}>
              <Icon name="chat" />
              <span className={styles.ellipsis}>{c.title}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.me}>
        <i aria-hidden="true">{(userName ?? "?").slice(0, 1).toUpperCase()}</i>
        <div>
          {userName ?? "…"}
          <span>{s.memoryOn}</span>
        </div>
      </div>
    </aside>
  );
}
