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
  /** Your picture: a painting's URL or your own image's data URL. */
  avatarSrc: string | null;
  onOpenSettings: () => void;
  /** The chat on screen; null for a new one. */
  activeChatId: string | null;
  onNewChat: () => void;
  onOpenChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
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
  avatarSrc,
  onOpenSettings,
  activeChatId,
  onNewChat,
  onOpenChat,
  onRenameChat,
  onClose,
}: Props) {
  const s = t(lang);
  const [query, setQuery] = useState("");
  /** Memory folds away: it's always one tap from view, but it doesn't have to fill the sidebar. */
  const [memoryOpen, setMemoryOpen] = useState(true);
  /** The chat whose title is being edited, if any. */
  const [renaming, setRenaming] = useState<string | null>(null);
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

      <h2 className={styles.group}>
        <button
          type="button"
          className={styles.fold}
          aria-expanded={memoryOpen || !!q}
          onClick={() => setMemoryOpen((o) => !o)}
        >
          {s.memory}
          {memories.length > 0 && <span className={styles.count}>{memories.length}</span>}
          <Icon name="chev" className={styles.chev} />
        </button>
      </h2>
      {(memoryOpen || q) && memories.length === 0 && <p className={styles.empty}>{s.emptyMemory}</p>}
      {q && memories.length > 0 && shownMemories.length === 0 && (
        <p className={styles.empty}>{s.noMatches}</p>
      )}
      <ul className={styles.list} hidden={!memoryOpen && !q}>
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
        {shownChats.map((c) =>
          renaming === c.id ? (
            <li key={c.id} className={`${styles.item} ${styles.on}`}>
              <Icon name="pencil" />
              <input
                className={styles.rename}
                defaultValue={c.title}
                aria-label={s.rename}
                maxLength={60}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    // Put the old title back, so leaving the field changes nothing.
                    e.currentTarget.value = c.title;
                    e.currentTarget.blur();
                  }
                }}
                onBlur={(e) => {
                  // Leaving the field saves, unless Escape already closed it or nothing changed.
                  if (
                    renaming === c.id &&
                    e.currentTarget.value.trim() &&
                    e.currentTarget.value !== c.title
                  ) {
                    onRenameChat(c.id, e.currentTarget.value);
                  }
                  setRenaming(null);
                }}
              />
            </li>
          ) : (
            <li key={c.id} className={styles.chat}>
              <button
                type="button"
                className={`${styles.item} ${c.id === activeChatId ? styles.on : ""}`}
                aria-current={c.id === activeChatId ? "page" : undefined}
                onClick={() => onOpenChat(c.id)}
                onDoubleClick={() => setRenaming(c.id)}
              >
                <Icon name="chat" />
                <span className={styles.ellipsis}>{c.title}</span>
              </button>
              <button
                type="button"
                className={styles.edit}
                aria-label={`${s.rename}: ${c.title}`}
                title={s.rename}
                onClick={() => setRenaming(c.id)}
              >
                <Icon name="pencil" />
              </button>
            </li>
          ),
        )}
      </ul>

      {/* You, at the bottom: your picture and name. Tap to open settings. */}
      <button type="button" className={styles.me} onClick={onOpenSettings} aria-label={s.settings.open}>
        <span className={styles.avatar}>
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size image, nothing to optimize
            <img src={avatarSrc} alt="" width={32} height={32} />
          ) : (
            <i aria-hidden="true">{(userName ?? "?").slice(0, 1).toUpperCase()}</i>
          )}
        </span>
        <span className={styles.who}>
          {userName ?? "…"}
          <span>{s.memoryOn}</span>
        </span>
        <Icon name="sliders" className={styles.gear} />
      </button>
    </aside>
  );
}
