"use client";

// Settings, as a popup over the voice screen (Turki's direction: like Claude's settings, not a page).
// Sections on the reading start, the chosen section beside them. A native <dialog>, so focus stays
// inside, Escape closes it, and screen readers announce it; a click on the dimmed backdrop closes it too.
// Below 700 px it fills the screen and the sections become a row of tabs.

import { useEffect, useRef } from "react";
import type { AvatarChoice, AvatarId } from "@/shared/avatars";
import { t, type Lang } from "@/shared/i18n";
import type { LangChoice, ThemeChoice } from "@/shared/preferences";
import type { Memory } from "@/shared/protocol";
import { Icon } from "../Icon";
import type { IconName } from "@/shared/brand/icons";
import { Appearance } from "./Appearance";
import { General } from "./General";
import { MemoryList } from "./MemoryList";
import { Profile } from "./Profile";
import styles from "./Settings.module.css";

export type SettingsSection = "general" | "appearance" | "profile" | "memory";

const SECTIONS: { id: SettingsSection; icon: IconName }[] = [
  { id: "general", icon: "globe" },
  { id: "appearance", icon: "palette" },
  { id: "profile", icon: "user" },
  { id: "memory", icon: "stitch" },
];

type Props = {
  open: boolean;
  section: SettingsSection;
  lang: Lang;
  langChoice: LangChoice;
  themeChoice: ThemeChoice;
  glass: number;
  onGlass: (glass: number) => void;
  name: string | null;
  avatar: AvatarChoice | null;
  avatarImage: string | null;
  memories: Memory[];
  onSection: (section: SettingsSection) => void;
  onClose: () => void;
  onLangChoice: (choice: LangChoice) => void;
  onThemeChoice: (choice: ThemeChoice) => void;
  onAvatar: (id: AvatarId) => void;
  onUpload: (dataUrl: string) => void;
  onName: (name: string) => void;
  onEditMemory: (id: string, value: string) => void;
  onForgetMemory: (id: string) => void;
  onForgetAll: () => void;
};

export function Settings(props: Props) {
  const { open, section, lang, onSection, onClose } = props;
  const s = t(lang).settings;
  const dialog = useRef<HTMLDialogElement>(null);

  // Open and close the native dialog with the prop, so the browser handles focus and Escape.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="settings-title"
      onClose={onClose}
      // A click that lands on the dialog itself (not the panel inside) is a click on the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${styles.panel} glass-panel`}>
        <nav className={styles.nav} aria-label={s.title}>
          <h2 id="settings-title" className={styles.navTitle}>
            {s.title}
          </h2>
          {SECTIONS.map(({ id, icon }) => (
            <button
              key={id}
              type="button"
              className={styles.navItem}
              aria-current={id === section ? "page" : undefined}
              onClick={() => onSection(id)}
            >
              <Icon name={icon} />
              {s[id]}
            </button>
          ))}
        </nav>

        <section className={styles.content} aria-labelledby="settings-section">
          <header className={styles.head}>
            <h3 id="settings-section">{s[section]}</h3>
            <button
              type="button"
              className={styles.close}
              aria-label={s.close}
              title={s.close}
              onClick={onClose}
            >
              <Icon name="x" />
            </button>
          </header>
          {open && section === "general" && (
            <General lang={lang} choice={props.langChoice} onChoice={props.onLangChoice} />
          )}
          {open && section === "appearance" && (
            <Appearance
              lang={lang}
              choice={props.themeChoice}
              onChoice={props.onThemeChoice}
              glass={props.glass}
              onGlass={props.onGlass}
            />
          )}
          {open && section === "profile" && (
            <Profile
              lang={lang}
              name={props.name}
              avatar={props.avatar}
              avatarImage={props.avatarImage}
              onAvatar={props.onAvatar}
              onUpload={props.onUpload}
              onName={props.onName}
            />
          )}
          {open && section === "memory" && (
            <MemoryList
              lang={lang}
              memories={props.memories}
              onEdit={props.onEditMemory}
              onForget={props.onForgetMemory}
              onForgetAll={props.onForgetAll}
            />
          )}
        </section>
      </div>
    </dialog>
  );
}
