"use client";

// The voice screen: sidebar on the reading start, the voice area beside it.
// It owns the interface choices (theme, language); everything about the conversation comes
// from useSarjy, and the pieces below only render it.

import { useRef, useState } from "react";
import { dir, t, type Lang } from "@/shared/i18n";
import { COOKIE, type Theme } from "@/shared/preferences";
import { useSarjy } from "../voice/useSarjy";
import { Caption } from "./Caption";
import { ControlBar } from "./ControlBar";
import { Orb } from "./Orb";
import { Sidebar } from "./Sidebar";
import { TextComposer } from "./TextComposer";
import { ToolChip } from "./ToolChip";
import { TopBar } from "./TopBar";
import styles from "./VoiceScreen.module.css";

const YEAR = 60 * 60 * 24 * 365;
const rememberChoice = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
};

export function VoiceScreen({ initialLang, initialTheme }: { initialLang: Lang; initialTheme: Theme }) {
  const [lang, setLang] = useState(initialLang);
  const [theme, setTheme] = useState(initialTheme);
  const sarjy = useSarjy(lang);
  const composer = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  // Share the last exchange: the phone's share sheet when there is one, otherwise copy the link.
  const share = async () => {
    const url = await sarjy.shareLast();
    if (!url) return;
    if (navigator.share) {
      await navigator.share({ title: s.sharedMoment, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      flash(s.linkCopied);
    }
  };
  const s = t(lang);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    rememberChoice(COOKIE.theme, next);
    setTheme(next);
  };

  const toggleLang = () => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    document.documentElement.lang = next;
    document.documentElement.dir = dir(next);
    rememberChoice(COOKIE.lang, next);
    setLang(next);
  };

  // The mic: tap to talk, tap again when you're done (or just stop talking). Tapping while Sarjy
  // thinks or speaks interrupts it and listens. With no mic, the text box takes over.
  const onMic = async () => {
    if (sarjy.state === "listening") return void sarjy.finishListening();
    if (await sarjy.listen()) return;
    composer.current?.focus();
    flash(s.micBlocked);
  };
  const showChip = sarjy.state === "tool" || sarjy.state === "speaking" || sarjy.state === "thinking";

  return (
    <div className={styles.screen} data-state={sarjy.state}>
      <Sidebar
        lang={lang}
        memories={sarjy.memories}
        freshId={sarjy.freshId}
        recent={sarjy.chats}
        userName={sarjy.profile?.name ?? null}
        onNewChat={sarjy.newChat}
      />

      <main className={styles.main}>
        <TopBar
          lang={lang}
          theme={theme}
          onToggleLang={toggleLang}
          onToggleTheme={toggleTheme}
          onShare={sarjy.canShare && sarjy.state === "idle" ? () => void share() : undefined}
        />

        <section className={styles.stage} aria-label={s.talk}>
          <Orb state={sarjy.state} inputLevel={sarjy.inputLevel} outputLevel={sarjy.outputLevel} />
          <ToolChip chip={showChip ? sarjy.chip : null} />
          <Caption caption={sarjy.caption} />
          <p className={styles.status}>{s.status[sarjy.state]}</p>
        </section>

        <div className={styles.dock}>
          <TextComposer
            inputRef={composer}
            placeholder={s.typePlaceholder}
            sendLabel={s.send}
            onSend={(text) => void sarjy.send({ text })}
          />
          <ControlBar
            mic={sarjy.micLook}
            labels={{ talk: s.talk, stop: s.stop, end: s.end, settings: s.voiceSettings }}
            onMic={() => void onMic()}
            onEnd={sarjy.stop}
            onSettings={() => {}}
          />
        </div>

        {toast && (
          <p className={`${styles.toast} glass text`} role="status">
            {toast}
          </p>
        )}

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
