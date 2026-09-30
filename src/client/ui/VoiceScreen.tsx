"use client";

// The voice screen: sidebar on the reading start, the voice area beside it.
// It owns the interface choices (theme, language); everything about the conversation comes
// from useSarjy, and the pieces below only render it. In a Majlis (the `room` prop) it is the
// same screen: useRoom brings the room's events, and useSarjy renders them like your own.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { avatarUrl } from "@/shared/avatars";
import { dir, t, type Lang } from "@/shared/i18n";
import { COOKIE, refractScale, type LangChoice, type ThemeChoice } from "@/shared/preferences";
import { wallpaperUrl, type WallpaperChoice } from "@/shared/wallpapers";
import { useRoom, type RoomPhase } from "../room/useRoom";
import { chatLines, useSarjy, type FetchedChat, type RoomLinkForVoice } from "../voice/useSarjy";
import { MajlisBar } from "./majlis/MajlisBar";
import { MajlisDoor } from "./majlis/MajlisDoor";
import { MajlisSeats } from "./majlis/MajlisSeats";
import { TalkTo, type TalkTarget } from "./majlis/TalkTo";
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
  initialWallpaper: WallpaperChoice;
  /** In a Majlis: its code, whose it is, how many are in, and whether you already are. */
  room?: { code: string; hostName: string | null; people: number; member: boolean; phase: RoomPhase };
};

/** The language "Auto detect" resolves to: the browser's own. */
const browserLang = (): Lang => (navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en");

export function VoiceScreen({
  initialLang,
  initialLangChoice,
  initialThemeChoice,
  initialSidebarOpen,
  initialGlass,
  initialWallpaper,
  room,
}: Props) {
  const router = useRouter();
  const [glass, setGlass] = useState(initialGlass);
  const [wallpaper, setWallpaper] = useState(initialWallpaper);
  const [lang, setLang] = useState(initialLang);
  const [langChoice, setLangChoice] = useState(initialLangChoice);
  const [themeChoice, setThemeChoice] = useState(initialThemeChoice);
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  /** On a narrow screen the sidebar is a sheet over the page, closed until you open it. */
  const [sheet, setSheet] = useState(false);
  const narrow = () => matchMedia("(max-width: 900px)").matches;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>("general");
  /** Bumped when you switch chats, to replay the stage's fade (only on your click, never mid-answer). */
  const [switches, setSwitches] = useState(0);
  // The Majlis, when this screen is one. Its turn events go to useSarjy (through a ref: each hook
  // needs the other, and the room's events only ever arrive after both exist).
  const voice = useRef<ReturnType<typeof useSarjy> | null>(null);
  const majlis = useRoom(room?.code ?? "", room?.phase ?? "door", {
    turn: (speaker, event) => voice.current?.receive(speaker, event),
    floorFreed: (previous) => voice.current?.remoteEnded(previous),
  });
  const me = majlis.room?.me ?? null;
  const nameOf = useCallback(
    (id: string) => {
      const m = majlis.members.find((x) => x.id === id);
      if (!m) return undefined;
      const words = t(lang).majlis;
      return { name: id === me ? words.you : (m.name ?? words.guest(m.seat)), seat: m.seat, me: id === me };
    },
    [lang, majlis.members, me],
  );
  const inRoom = !!room && majlis.phase === "in" && !!me;
  /** In a Majlis, who your next turn is for: everyone by default, Sarjy when you want its input. */
  const [talkTo, setTalkTo] = useState<TalkTarget>("room");
  const talkToRef = useRef(talkTo);
  useEffect(() => {
    talkToRef.current = talkTo;
  }, [talkTo]);
  const roomLink: RoomLinkForVoice | null = inRoom
    ? { code: room.code, me: me!, who: nameOf, onRest: majlis.dropFloor, to: () => talkToRef.current }
    : null;
  const sarjy = useSarjy(lang, { onBackupVoice: () => flash(s.voiceResting, 5000), room: roomLink });
  useEffect(() => {
    voice.current = sarjy;
  });
  const composer = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (message: string, ms = 2200) => {
    setToast(message);
    window.setTimeout(() => setToast(null), ms);
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
    setSheet(false);
    if (room) return router.push("/");
    sarjy.newChat();
    setFreshLine((i) => {
      // Never the same line twice in a row.
      const n = s.freshChat.length;
      return (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
    });
    setSwitches((n) => n + 1);
  };
  const openChat = async (id: string) => {
    setSheet(false);
    // A Majlis still open is a place to go back into; anything else opens here (from a Majlis,
    // on the home screen).
    const live = sarjy.chats.find((c) => c.id === id)?.majlis;
    if (live?.live) return router.push(`/majlis/${live.code}`);
    if (room) return router.push(`/?chat=${id}`);
    await sarjy.openChat(id);
    setSwitches((n) => n + 1);
  };

  // Opened from a Majlis: the home screen shows the chat you picked there.
  const { openChat: open } = sarjy;
  useEffect(() => {
    if (room) return;
    const id = new URLSearchParams(window.location.search).get("chat");
    if (!id) return;
    window.history.replaceState(null, "", "/");
    void open(id);
  }, [room, open]);

  /** Opens a Majlis from here and goes in: the host's seat is the first. */
  const startMajlis = async () => {
    await sarjy.whenReady();
    const res = await fetch("/api/rooms", { method: "POST" });
    if (!res.ok) return flash(s.status.idle);
    const { path } = (await res.json()) as { path: string };
    router.push(path);
  };

  /** Coming in: the room, then what has been said so far, each line with who said it. */
  const { unlockAudio, enterRoom, refreshSession, whenReady } = sarjy;
  const { join } = majlis;
  const comeIn = useCallback(
    async (name = "") => {
      unlockAudio(); // this tap is what lets the room's voice play here
      await whenReady();
      const state = await join(name, lang);
      if (!state || state.ended) return;
      if (name.trim()) void refreshSession();
      const res = await fetch(`/api/chats/${state.conversationId}`);
      if (!res.ok) return enterRoom(state.conversationId, []);
      const { chat } = (await res.json()) as { chat: FetchedChat };
      enterRoom(chat.id, chatLines(chat, state.me, lang));
    },
    [enterRoom, join, lang, refreshSession, unlockAudio, whenReady],
  );
  // Already a member (you opened it, or came back): straight in, no door.
  const autoJoined = useRef(false);
  useEffect(() => {
    if (!room?.member || autoJoined.current || room.phase !== "door") return;
    autoJoined.current = true;
    void comeIn();
  }, [room, comeIn]);
  // Without a tap on this page (you came back to it), sound may still be locked: the first tap
  // anywhere unlocks it.
  useEffect(() => {
    if (!room) return;
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [room, unlockAudio]);

  const invite = async () => {
    if (!room) return;
    const url = new URL(`/majlis/${room.code}`, window.location.origin).toString();
    const text = s.majlis.inviteText(majlis.room?.hostName ?? room.hostName);
    if (navigator.share) {
      await navigator.share({ title: text, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      flash(s.majlis.linkCopied);
    }
  };
  /** Who has the mic, by name, when it isn't you. */
  const holder = majlis.floor && majlis.floor !== me ? nameOf(majlis.floor)?.name : undefined;

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

  /** The background: the light field, a rug, or your own picture. Shown at once, and remembered. */
  const chooseWallpaper = (choice: WallpaperChoice) => {
    rememberChoice(COOKIE.wallpaper, choice);
    setWallpaper(choice);
  };
  /** Your own wallpaper: uploaded, then chosen. False if it couldn't be used. */
  const uploadWallpaper = async (picture: Blob) => {
    const version = await sarjy.uploadWallpaper(picture);
    if (version === null) return false;
    chooseWallpaper(`own-${version}`);
    return true;
  };
  const wallpaperSrc = wallpaperUrl(wallpaper);

  /** A picture from the button, a paste or a drop: shrunk and held for the next turn. */
  const attach = async (file: File) => {
    if (!(await sarjy.attachPicture(file))) flash(s.picture.bad);
  };

  const openSettings = (at: SettingsSection = "general") => {
    setSheet(false);
    setSection(at);
    setSettingsOpen(true);
  };

  // The mic: tap to talk, tap again when you're done (or just stop talking). Tapping while Sarjy
  // thinks or speaks interrupts it and listens. With no mic, the text box takes over.
  const onMic = async () => {
    if (sarjy.state === "listening") return void sarjy.finishListening();
    // In a Majlis the mic is shared: ask for it first. Someone else talking means wait.
    if (room) {
      if (!inRoom) return;
      if (holder) return flash(s.majlis.busy(holder));
      if (!(await majlis.takeFloor())) {
        return flash(s.majlis.busy(nameOf(majlis.floor ?? "")?.name ?? "…"));
      }
    }
    if (await sarjy.listen()) return;
    if (room) majlis.dropFloor();
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
      : // In a Majlis at rest: who has the mic, or that the finjan is yours to tap.
        room && inRoom && sarjy.state === "idle"
        ? holder
          ? s.majlis.holding(holder)
          : talkTo === "sarjy"
            ? s.majlis.tapToAsk
            : s.majlis.tapToTalk
        : // Someone else's turn: say whose, so it's clear who Sarjy is talking to.
          room && sarjy.asker && sarjy.asker !== me && sarjy.state !== "listening"
          ? s.majlis.answering(nameOf(sarjy.asker)?.name ?? "…")
          : s.status[sarjy.state];

  return (
    <div
      className={styles.screen}
      data-state={sarjy.state}
      data-sidebar={sidebarOpen ? "open" : "closed"}
      data-sheet={sheet ? "open" : undefined}
      data-wall={wallpaperSrc ? "on" : undefined}
      data-majlis={room ? "on" : undefined}
    >
      {/* Behind the glass: your wallpaper, or the light field (invisible at Solid, a slow drifting
          field at Clear). */}
      {wallpaperSrc ? (
        <div
          className={styles.wallpaper}
          data-wallpaper={wallpaper}
          style={{ backgroundImage: `url("${wallpaperSrc}")` }}
          aria-hidden="true"
        />
      ) : (
        <div className="ambient" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      )}
      {sheet && <div className={styles.scrim} aria-hidden="true" onClick={() => setSheet(false)} />}
      {(sidebarOpen || sheet) && (
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
          onClose={() => (narrow() ? setSheet(false) : setSidebar(false))}
        />
      )}

      <main
        className={styles.main}
        // Drop a picture anywhere on the screen: it waits in the text box for the next turn.
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          const dropped = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
          if (!dropped) return;
          e.preventDefault();
          void attach(dropped);
        }}
      >
        <TopBar
          lang={lang}
          onOpenSidebar={sidebarOpen ? undefined : () => setSidebar(true)}
          onOpenSheet={() => setSheet(true)}
          onNewChat={newChat}
          onStartMajlis={room ? undefined : () => void startMajlis()}
          end={
            room && inRoom ? (
              <MajlisBar
                lang={lang}
                hostName={majlis.room?.hostName ?? room.hostName}
                members={majlis.members}
                online={majlis.online}
                me={me!}
                reconnecting={majlis.status === "reconnecting"}
                onInvite={() => void invite()}
                onLeave={() => router.push("/")}
                onEnd={() => void majlis.end()}
              />
            ) : undefined
          }
        />

        {/* Switching chats replays the stage's fade, so the change is felt. */}
        <section key={switches} className={styles.stage} aria-label={s.talk}>
          {/* The orb is the mic: tap it to talk, tap it again when you're done, or over Sarjy to interrupt. */}
          {/* In a Majlis, everyone sits around the finjan. */}
          <div className={styles.orbSeat}>
            <button
              type="button"
              className={styles.orbButton}
              data-look={sarjy.micLook}
              aria-label={sarjy.state === "listening" ? s.stop : s.talk}
              aria-pressed={sarjy.state === "listening"}
              onClick={() => void onMic()}
              disabled={!!room && !inRoom}
            >
              <Orb
                state={sarjy.state}
                inputLevel={sarjy.inputLevel}
                outputLevel={sarjy.outputLevel}
                majlis={!!room}
              />
            </button>
            {room && inRoom && (
              <MajlisSeats
                lang={lang}
                members={majlis.members}
                online={majlis.online}
                me={me!}
                floor={majlis.floor}
                asker={sarjy.asker}
                voicing={sarjy.voicing}
              />
            )}
          </div>
          <ToolChip chip={showChip ? sarjy.chip : null} />
          <SavedCard
            lang={lang}
            memory={sarjy.freshId ? (sarjy.memories.find((m) => m.id === sarjy.freshId) ?? null) : null}
            onOpen={() => openSettings("memory")}
          />
          {room && !inRoom && (
            <MajlisDoor
              lang={lang}
              phase={majlis.phase}
              hostName={room.hostName}
              people={room.people}
              askName={!!sarjy.profile && !sarjy.profile.name}
              onJoin={(name) => void comeIn(name)}
            />
          )}
          <Transcript
            lang={lang}
            all={sarjy.lines}
            earlier={sarjy.earlier}
            welcome={
              // Only on a true first visit: no name yet, and no chats at all (never in a Majlis).
              !room &&
              sarjy.profile?.onboardingStep === "name" &&
              sarjy.chats.length === 0 &&
              sarjy.state === "idle"
                ? { ...s.welcome, onSkip: () => void sarjy.skipIntro() }
                : null
            }
            caption={sarjy.caption}
            timings={sarjy.state === "idle" ? sarjy.timings : null}
          />
          {(!room || inRoom) && <p className={styles.status}>{note}</p>}
        </section>

        <div className={styles.dock} hidden={!!room && !inRoom}>
          {inRoom && <TalkTo lang={lang} value={talkTo} onChange={setTalkTo} />}
          <TextComposer
            inputRef={composer}
            placeholder={inRoom && talkTo === "room" ? s.majlis.typeEveryone : s.typePlaceholder}
            sendLabel={s.send}
            onSend={(text) => void sarjy.send({ text })}
            picture={sarjy.picture}
            labels={{ add: s.picture.add, remove: s.picture.remove }}
            onPicture={(file) => void attach(file)}
            onClearPicture={sarjy.clearPicture}
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
          wallpaper={wallpaper}
          ownWallpaper={sarjy.profile?.wallpaper ?? null}
          onWallpaper={chooseWallpaper}
          onUploadWallpaper={uploadWallpaper}
          name={sarjy.profile?.name ?? null}
          avatar={sarjy.profile?.avatar ?? null}
          avatarImage={sarjy.profile?.avatarImage ?? null}
          memories={sarjy.memories}
          voices={sarjy.profile?.voices ?? { en: "troy", ar: "abdullah" }}
          onVoice={(voiceLang, id) => void sarjy.setVoice(voiceLang, id)}
          onSection={setSection}
          onClose={() => setSettingsOpen(false)}
          onLangChoice={chooseLang}
          onThemeChoice={chooseTheme}
          onAvatar={(id) => void sarjy.setAvatar(id)}
          onUpload={(image) => void sarjy.uploadAvatar(image)}
          onName={(name) => void sarjy.setName(name)}
          onEditMemory={(id, change) => void sarjy.editMemory(id, change)}
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
