// The sidebar: search, new chat, the stitched memory list, recent chats, and you.
// Every memory is stitched (Dusk dashes): if it is stitched, it is remembered (visual identity, section 8).

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Memory } from "@/shared/protocol";
import { Logo } from "./brand/Logo";
import { Icon } from "./Icon";
import styles from "./Sidebar.module.css";

export type ChatItem = { id: string; title: string };

type Props = {
  lang: Lang;
  memories: Memory[];
  /** The memory saved in this turn: it stitches itself in. */
  freshId: string | null;
  recent: ChatItem[];
  userName: string | null;
  onNewChat: () => void;
};

export function Sidebar({ lang, memories, freshId, recent, userName, onNewChat }: Props) {
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
      {memories.length === 0 && <p className={styles.empty}>{s.emptyMemory}</p>}
      <ul className={styles.list}>
        {memories.map((m) => (
          <li
            key={m.id}
            className={styles.memory}
            data-fresh={m.id === freshId ? "true" : undefined}
            lang={m.lang}
            dir={m.lang === "ar" ? "rtl" : "ltr"}
            title={m.source ?? undefined}
          >
            <span>{m.label}</span>
            <b>{m.value}</b>
          </li>
        ))}
      </ul>

      <h2 className={styles.group}>{s.recent}</h2>
      <ul className={styles.list}>
        {recent
          .filter((c) => c.title)
          .map((c) => (
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
