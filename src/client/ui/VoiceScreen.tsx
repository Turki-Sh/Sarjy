"use client";

// The voice screen: sidebar on the reading start, the voice area beside it.
// It owns the interface choices (theme, language) and hands the voice state to the pieces that show it.

import { useCallback, useState } from "react";
import { dir, t, type Lang } from "@/shared/i18n";
import { COOKIE, type Theme } from "@/shared/preferences";
import { useDemo } from "../voice/useDemo";
import { Caption } from "./Caption";
import { ControlBar } from "./ControlBar";
import { Orb } from "./Orb";
import { Sidebar, type ChatItem, type MemoryItem } from "./Sidebar";
import { ToolChip } from "./ToolChip";
import { TopBar } from "./TopBar";
import styles from "./VoiceScreen.module.css";

// Demo content until memory and chats come from the server (milestone M2).
const DEMO_MEMORIES: Record<Lang, MemoryItem[]> = {
  en: [
    { id: "m1", label: "Favorite color", value: "Green", lang: "en" },
    { id: "m2", label: "Home city", value: "Riyadh", lang: "en" },
    { id: "m3", label: "Units", value: "Celsius", lang: "en" },
  ],
  ar: [
    { id: "m1", label: "اللون المفضل", value: "أخضر", lang: "ar" },
    { id: "m2", label: "المدينة", value: "الرياض", lang: "ar" },
    { id: "m3", label: "الوحدات", value: "مئوية", lang: "ar" },
  ],
};
const DEMO_RECENT: Record<Lang, ChatItem[]> = {
  en: [
    { id: "c1", title: "Weather in Riyadh" },
    { id: "c2", title: "Plan for Thursday" },
    { id: "c3", title: "My favorite color" },
  ],
  ar: [
    { id: "c1", title: "الطقس في الرياض" },
    { id: "c2", title: "خطة الخميس" },
    { id: "c3", title: "لوني المفضل" },
  ],
};

const YEAR = 60 * 60 * 24 * 365;
const remember = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
};

export function VoiceScreen({ initialLang, initialTheme }: { initialLang: Lang; initialTheme: Theme }) {
  const [lang, setLang] = useState(initialLang);
  const [theme, setTheme] = useState(initialTheme);
  const [saved, setSaved] = useState<MemoryItem[]>([]);
  const s = t(lang);

  const onSaved = useCallback((m: Omit<MemoryItem, "id">) => {
    setSaved((list) => [{ ...m, id: `s${Date.now()}` }, ...list.filter((x) => x.label !== m.label)]);
  }, []);
  const { view, run, stop } = useDemo(lang, onSaved);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    remember(COOKIE.theme, next);
    setTheme(next);
  };

  const toggleLang = () => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    document.documentElement.lang = next;
    document.documentElement.dir = dir(next);
    remember(COOKIE.lang, next);
    stop();
    setSaved([]);
    setLang(next);
  };

  const onMic = () => (view.state === "idle" || view.state === "saving" ? run() : stop());
  const live = view.state === "listening" || view.state === "speaking";
  const memories = [...saved.filter((m) => m.lang === lang), ...DEMO_MEMORIES[lang]];

  return (
    <div className={styles.screen} data-state={view.state}>
      <Sidebar lang={lang} memories={memories} recent={DEMO_RECENT[lang]} userName="Turki" onNewChat={stop} />

      <main className={styles.main}>
        <TopBar lang={lang} theme={theme} onToggleLang={toggleLang} onToggleTheme={toggleTheme} />

        <section className={styles.stage} aria-label={s.talk}>
          <Orb state={view.state} />
          <ToolChip chip={view.state === "tool" || view.state === "speaking" ? view.chip : null} />
          <Caption caption={view.caption} />
          <p className={styles.status}>{s.status[view.state]}</p>
        </section>

        <ControlBar
          mic={live ? "live" : "ready"}
          labels={{ talk: s.talk, stop: s.stop, end: s.end, settings: s.voiceSettings }}
          onMic={onMic}
          onEnd={stop}
          onSettings={() => {}}
        />

        {/* One polite announcement per state change, for screen readers. */}
        <p className="sr-only" aria-live="polite">
          {view.state === "speaking" && view.caption ? view.caption.words.join(" ") : s.announce[view.state]}
        </p>
      </main>
    </div>
  );
}
