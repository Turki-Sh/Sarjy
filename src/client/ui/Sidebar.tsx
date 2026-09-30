"use client";

// The sidebar: search, new chat, a way into memory, recent chats, and you.
// Every memory is stitched (Dusk dashes): if it is stitched, it is remembered (visual identity, section 8).
// Search filters your chats as you type. The sidebar can be closed; the top bar reopens it.

import { useState } from "react";
import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Memory } from "@/shared/protocol";
import { Logo } from "./brand/Logo";
import { Icon } from "./Icon";
import { Menu } from "./Menu";
import styles from "./Sidebar.module.css";

export type ChatItem = { id: string; title: string; pinned?: boolean };

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
  onOpenMemory: () => void;
  /** The chat on screen; null for a new one. */
  activeChatId: string | null;
  onNewChat: () => void;
  onOpenChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onPinChat: (id: string, pinned: boolean) => void;
  onShareChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
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
  onOpenMemory,
  activeChatId,
  onNewChat,
  onOpenChat,
  onRenameChat,
  onPinChat,
  onShareChat,
  onDeleteChat,
  onClose,
}: Props) {
  const s = t(lang);
  const [query, setQuery] = useState("");
  /** The chat whose title is being edited, if any. */
  const [renaming, setRenaming] = useState<string | null>(null);
  const q = query.trim();
  const shownChats = recent.filter((c) => c.title && (!q || matches(c.title, q)));

  return (
    <aside className={`${styles.side} glass-panel`} aria-label={s.memory}>
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

      {/* Memory lives in Settings; here, one row that opens it, with a count and a stitch pulse on
          each save. The sidebar stays about your chats (Turki's direction, Day 2). */}
      <button
        type="button"
        className={styles.item}
        data-fresh={freshId ? "true" : undefined}
        onClick={onOpenMemory}
      >
        <Icon name="stitch" />
        {s.memory}
        {memories.length > 0 && <span className={styles.count}>{memories.length}</span>}
      </button>

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
              {c.pinned && <Icon name="pin" className={styles.pinned} />}
              {/* Everything you can do to a chat, behind one ⋯ (like ChatGPT): no projects, no archive. */}
              <Menu
                className={styles.edit}
                label={`${s.chatMenu.more}: ${c.title}`}
                items={[
                  { id: "rename", label: s.rename, icon: "pencil", onSelect: () => setRenaming(c.id) },
                  {
                    id: "pin",
                    label: c.pinned ? s.chatMenu.unpin : s.chatMenu.pin,
                    icon: "pin",
                    onSelect: () => onPinChat(c.id, !c.pinned),
                  },
                  { id: "share", label: s.chatMenu.share, icon: "share", onSelect: () => onShareChat(c.id) },
                  {
                    id: "delete",
                    label: s.chatMenu.del,
                    icon: "trash",
                    danger: true,
                    confirm: s.chatMenu.confirmDelete,
                    onSelect: () => onDeleteChat(c.id),
                  },
                ]}
              />
            </li>
          ),
        )}
      </ul>

      {/* You, at the bottom: your picture and name. Tap to open settings. */}
      <div className={styles.rule} aria-hidden="true" />
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
