"use client";

// The voice screen: sidebar on the reading start, the voice area beside it.
// It owns the interface choices (theme, language); everything about the conversation comes
// from useSarjy, and the pieces below only render it.

import { useEffect, useRef, useState } from "react";
import { avatarUrl } from "@/shared/avatars";
import { dir, t, type Lang } from "@/shared/i18n";
import { COOKIE, refractScale, type LangChoice, type ThemeChoice } from "@/shared/preferences";
import { useSarjy } from "../voice/useSarjy";
import { SavedCard } from "./SavedCard";
import { Settings, type SettingsSection } from "./settings/Settings";
import { Orb } from "./Orb";
import { Sidebar } from "./Sidebar";
import { TextComposer } from "./TextComposer";
import { ToolChip } from "./ToolChip";
import { TopBar } from "./TopBar";
import { Transcript } from "./Transcript";
import styles from "./VoiceScreen.module.css";

const YEAR = 60 * 60 * 24 * 365;
const rememberChoice = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
};

type Props = {
  initialLang: Lang;
  initialLangChoice: LangChoice;
  initialThemeChoice: ThemeChoice;
  initialSidebarOpen: boolean;
  initialGlass: number;
};

/** The language "Auto detect" resolves to: the browser's own. */
const browserLang = (): Lang => (navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en");

export function VoiceScreen({
  initialLang,
  initialLangChoice,
  initialThemeChoice,
  initialSidebarOpen,
  initialGlass,
}: Props) {
  const [glass, setGlass] = useState(initialGlass);
  const [lang, setLang] = useState(initialLang);
  const [langChoice, setLangChoice] = useState(initialLangChoice);
  const [themeChoice, setThemeChoice] = useState(initialThemeChoice);
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>("general");
  /** Bumped when you switch chats, to replay the stage's fade (only on your click, never mid-answer). */
  const [switches, setSwitches] = useState(0);
  const sarjy = useSarjy(lang);
  const composer = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  // Share a chat's latest answer: the phone's share sheet when there is one, otherwise copy the link.
  const shareChat = async (id: string) => {
    const url = await sarjy.shareChat(id);
    if (!url) return;
    if (navigator.share) {
      await navigator.share({ title: s.sharedMoment, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      flash(s.linkCopied);
    }
  };
  const s = t(lang);

  /** Light, dark, or follow the device (the script in layout.tsx keeps following it). */
  const chooseTheme = (choice: ThemeChoice) => {
    const html = document.documentElement;
    html.dataset.themeChoice = choice;
    html.dataset.theme =
      choice === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : choice;
    rememberChoice(COOKIE.theme, choice);
    setThemeChoice(choice);
  };

  /** Which of the new-chat lines to show; a new one, at random, each time you start a chat. */
  const [freshLine, setFreshLine] = useState(0);
  const newChat = () => {
    sarjy.newChat();
    setFreshLine((i) => {
      // Never the same line twice in a row.
      const n = s.freshChat.length;
      return (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
    });
    setSwitches((n) => n + 1);
  };
  const openChat = async (id: string) => {
    await sarjy.openChat(id);
    setSwitches((n) => n + 1);
  };

  const setSidebar = (open: boolean) => {
    rememberChoice(COOKIE.sidebar, open ? "open" : "closed");
    setSidebarOpen(open);
  };

  /** English, Arabic, or the browser's language. The whole screen mirrors for Arabic. */
  const chooseLang = (choice: LangChoice) => {
    const next = choice === "auto" ? browserLang() : choice;
    document.documentElement.lang = next;
    document.documentElement.dir = dir(next);
    rememberChoice(COOKIE.lang, choice);
    setLangChoice(choice);
    setLang(next);
  };

  /** How much liquid glass: one CSS variable for the look, one filter attribute for the refraction. */
  const chooseGlass = (level: number) => {
    document.documentElement.style.setProperty("--liquid", String(level / 100));
    document.documentElement.dataset.glass = "set"; // your choice now wins over the device setting
    document
      .querySelector("#sarjy-refract feDisplacementMap")
      ?.setAttribute("scale", String(refractScale(level)));
    rememberChoice(COOKIE.glass, String(level));
    setGlass(level);
  };

  const openSettings = (at: SettingsSection = "general") => {
    setSection(at);
    setSettingsOpen(true);
  };

  // The mic: tap to talk, tap again when you're done (or just stop talking). Tapping while Sarjy
  // thinks or speaks interrupts it and listens. With no mic, the text box takes over.
  const onMic = async () => {
    if (sarjy.state === "listening") return void sarjy.finishListening();
    if (await sarjy.listen()) return;
    composer.current?.focus();
    flash(s.micBlocked);
  };
  // Escape stops whatever Sarjy is doing (listening, thinking or speaking), and leaves hands-free.
  // The End button is gone: tapping the orb covers it, and this covers the keyboard.
  const { stop } = sarjy;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !settingsOpen) stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, stop]);

  const showChip = sarjy.state === "tool" || sarjy.state === "speaking" || sarjy.state === "thinking";
  // At rest, the line under the orb says where you are: a new chat, or one picked back up.
  const note =
    sarjy.state === "idle" && sarjy.chatNote
      ? sarjy.chatNote === "fresh"
        ? s.freshChat[freshLine % s.freshChat.length]
        : s.continuing
      : s.status[sarjy.state];

  return (
    <div className={styles.screen} data-state={sarjy.state} data-sidebar={sidebarOpen ? "open" : "closed"}>
      {/* The light behind the glass: invisible at Solid, a slow drifting field at Clear. */}
      <div className="ambient" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      {sidebarOpen && (
        <Sidebar
          lang={lang}
          memories={sarjy.memories}
          freshId={sarjy.freshId}
          recent={sarjy.chats}
          userName={sarjy.profile?.name ?? null}
          avatarSrc={
            !sarjy.profile
              ? null
              : sarjy.profile.avatar === "upload"
                ? sarjy.profile.avatarImage
                : avatarUrl(sarjy.profile.avatar)
          }
          onOpenSettings={() => openSettings("general")}
          onOpenMemory={() => openSettings("memory")}
          activeChatId={sarjy.activeChatId}
          onNewChat={newChat}
          onOpenChat={(id) => void openChat(id)}
          onRenameChat={(id, title) => void sarjy.renameChat(id, title)}
          onPinChat={(id, pinned) => void sarjy.pinChat(id, pinned)}
          onShareChat={(id) => void shareChat(id)}
          onDeleteChat={(id) => void sarjy.deleteChat(id)}
          onClose={() => setSidebar(false)}
        />
      )}

      <main className={styles.main}>
        <TopBar
          lang={lang}
          onOpenSidebar={sidebarOpen ? undefined : () => setSidebar(true)}
          onNewChat={newChat}
        />

        {/* Switching chats replays the stage's fade, so the change is felt. */}
        <section key={switches} className={styles.stage} aria-label={s.talk}>
          {/* The orb is the mic: tap it to talk, tap it again when you're done, or over Sarjy to interrupt. */}
          <button
            type="button"
            className={styles.orbButton}
            data-look={sarjy.micLook}
            aria-label={sarjy.state === "listening" ? s.stop : s.talk}
            aria-pressed={sarjy.state === "listening"}
            onClick={() => void onMic()}
          >
            <Orb state={sarjy.state} inputLevel={sarjy.inputLevel} outputLevel={sarjy.outputLevel} />
          </button>
          <ToolChip chip={showChip ? sarjy.chip : null} />
          <SavedCard
            lang={lang}
            memory={sarjy.freshId ? (sarjy.memories.find((m) => m.id === sarjy.freshId) ?? null) : null}
            onOpen={() => openSettings("memory")}
          />
          <Transcript earlier={sarjy.earlier} caption={sarjy.caption} />
          <p className={styles.status}>{note}</p>
        </section>

        <div className={styles.dock}>
          <TextComposer
            inputRef={composer}
            placeholder={s.typePlaceholder}
            sendLabel={s.send}
            onSend={(text) => void sarjy.send({ text })}
          />
        </div>

        {toast && (
          <p className={`${styles.toast} glass text`} role="status">
            {toast}
          </p>
        )}

        <Settings
          open={settingsOpen}
          section={section}
          lang={lang}
          langChoice={langChoice}
          themeChoice={themeChoice}
          glass={glass}
          onGlass={chooseGlass}
          name={sarjy.profile?.name ?? null}
          avatar={sarjy.profile?.avatar ?? null}
          avatarImage={sarjy.profile?.avatarImage ?? null}
          memories={sarjy.memories}
          onSection={setSection}
          onClose={() => setSettingsOpen(false)}
          onLangChoice={chooseLang}
          onThemeChoice={chooseTheme}
          onAvatar={(id) => void sarjy.setAvatar(id)}
          onUpload={(image) => void sarjy.uploadAvatar(image)}
          onName={(name) => void sarjy.setName(name)}
          onEditMemory={(id, value) => void sarjy.editMemory(id, value)}
          onForgetMemory={(id) => void sarjy.forgetMemory(id)}
          onForgetAll={() => void sarjy.forgetEverything()}
        />

        {/* One polite announcement per state change, for screen readers. */}
        <p className="sr-only" aria-live="polite">
          {sarjy.state === "speaking" && sarjy.caption
            ? sarjy.caption.words.join(" ")
            : s.announce[sarjy.state]}
        </p>
      </main>
    </div>
  );
}
