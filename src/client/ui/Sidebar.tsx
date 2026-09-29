"use client";

// The sidebar: search, new chat, the stitched memory list, recent chats, and you.
// Every memory is stitched (Dusk dashes): if it is stitched, it is remembered (visual identity, section 8).
// Search filters both lists as you type. The sidebar can be closed; the top bar reopens it.

import { useState } from "react";
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
  /** The chat on screen; null for a new one. */
  activeChatId: string | null;
  onNewChat: () => void;
  onOpenChat: (id: string) => void;
  onClose: () => void;
};

/** Case- and accent-insensitive "does this text contain the query". */
const matches = (text: string, query: string) =>
  text.toLocaleLowerCase().normalize("NFKD").includes(query.toLocaleLowerCase().normalize("NFKD"));

export function Sidebar({
  lang,
  memories,
  freshId,
  recent,
  userName,
  activeChatId,
  onNewChat,
  onOpenChat,
  onClose,
}: Props) {
  const s = t(lang);
  const [query, setQuery] = useState("");
  const q = query.trim();
  const shownMemories = q ? memories.filter((m) => matches(`${m.label} ${m.value}`, q)) : memories;
  const shownChats = recent.filter((c) => c.title && (!q || matches(c.title, q)));

  return (
    <aside className={styles.side} aria-label={s.memory}>
      <div className={styles.brand}>
        <Logo lang={lang} className={styles.logo} />
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={s.closeSidebar}
          title={s.closeSidebar}
        >
          <Icon name="sidebar" />
        </button>
      </div>

      <label className={styles.search}>
        <Icon name="search" />
        <input
          type="search"
          placeholder={s.search}
          aria-label={s.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <button
        type="button"
        className={`${styles.item} ${activeChatId === null ? styles.on : ""}`}
        aria-current={activeChatId === null ? "page" : undefined}
        onClick={onNewChat}
      >
        <Icon name="plus" />
        {s.newChat}
      </button>

      <h2 className={styles.group}>{s.memory}</h2>
      {memories.length === 0 && <p className={styles.empty}>{s.emptyMemory}</p>}
      {q && memories.length > 0 && shownMemories.length === 0 && (
        <p className={styles.empty}>{s.noMatches}</p>
      )}
      <ul className={styles.list}>
        {shownMemories.map((m) => (
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
      {q && shownChats.length === 0 && <p className={styles.empty}>{s.noMatches}</p>}
      <ul className={styles.list}>
        {shownChats.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`${styles.item} ${c.id === activeChatId ? styles.on : ""}`}
              aria-current={c.id === activeChatId ? "page" : undefined}
              onClick={() => onOpenChat(c.id)}
            >
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
