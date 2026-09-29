"use client";

// The one hook the voice screen uses (architecture, section 2). It owns:
//   - who you are, your memories and chats (loaded from /api/session on first paint)
//   - the voice state (through the pure state machine in machine.ts)
//   - the mic: listening, deciding you are done, and sending what you said
//   - one turn at a time: send it, react to each streamed event, play the audio, sync the caption
// Components only render what this hook returns.

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { AvatarChoice, AvatarId } from "@/shared/avatars";
import type { Lang } from "@/shared/i18n";
import type { Memory, Timings, TurnEvent } from "@/shared/protocol";
import type { VoiceState } from "@/shared/states";
import { encodeWav } from "@/shared/wav";
import { wordsSpoken } from "@/shared/wordTiming";
import { Mic, MicError } from "../audio/mic";
import { Player, type PlayedSegment } from "../audio/player";
import { listen as detectSpeech, type Listening } from "../audio/vad";
import type { CaptionModel } from "../ui/Caption";
import type { MicLook } from "../ui/ControlBar";
import type { ToolChipModel } from "../ui/ToolChip";
import { findKeep } from "./keep";
import { transition } from "./machine";
import { previewWords } from "./preview";
import { sendTurn } from "./turnStream";

export type ChatSummary = { id: string; title: string; updatedAt: string };
/** One line of the chat on screen, for the small transcript above the caption. */
export type ChatLine = { role: "user" | "assistant"; text: string; lang: Lang };

/** How many earlier lines show above the caption. */
const EARLIER = 3;
export type Profile = {
  id: string;
  name: string | null;
  onboardingStep: string;
  avatar: AvatarChoice;
  /** Your own picture as a data URL, when avatar is "upload". */
  avatarImage: string | null;
};

/** Everything about the turn in flight. Kept in a ref: it changes every frame, React doesn't need to know. */
type Turn = {
  segments: PlayedSegment[];
  words: string[];
  lang: Lang;
  streamDone: boolean;
  changedMemory: boolean;
  saved: Memory | null;
  shown: number;
};

const SETTLE_MS = 1200;
/** Listening gives up if you say nothing for this long, and ends a turn that runs this long. */
const SILENT_MS = 8000;
const LONGEST_MS = 30_000;
/**
 * A backstop for the speech detector: once you have spoken, this long below this loudness also
 * ends the turn. The detector normally ends it first (after 600 ms); this catches a noisy room
 * where the model keeps hearing "maybe speech".
 */
const QUIET_LEVEL = 0.08;
const QUIET_MS = 1300;
/** Hands-free: after Sarjy answers a spoken question, the mic reopens by itself after this pause. */
const RELISTEN_MS = 350;

/** The open mic, while listening. */
type Ear = { mic: Mic; vad: Listening | null; stopPreview: () => void; timers: number[]; sent: boolean };

/**
 * Warms the browser cache with the speech detector while the page is idle, so the first tap of
 * the mic starts listening in a moment instead of waiting for a download.
 */
function prefetchSpeechDetector() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  const warm = () => {
    void import("@ricky0123/vad-web").catch(() => {});
    for (const file of ["silero_vad_v5.onnx", "ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.mjs"]) {
      void fetch(`/vad/${file}`, { priority: "low" } as RequestInit).catch(() => {});
    }
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(warm, { timeout: 4000 });
  else setTimeout(warm, 2000); // Safari has no idle callback
}

type SessionData = { user: Profile; memories: Memory[]; chats: ChatSummary[] };

/** Creates or resumes the anonymous user, and fetches what the screen shows first. */
async function loadSession(lang: Lang): Promise<SessionData | null> {
  const res = await fetch("/api/session", { method: "POST", body: JSON.stringify({ lang }) });
  return res.ok ? ((await res.json()) as SessionData) : null;
}

/**
 * The lines to show small above the caption: the last few, minus the one the caption is showing.
 * The caption shows the newest line when it is the same speaker (your words, or Sarjy's answer
 * once it is saved); while Sarjy is still answering, your question stays in the small lines.
 */
function earlierLines(lines: ChatLine[], caption: CaptionModel | null): ChatLine[] {
  const last = lines.at(-1);
  const captionIsLast = !!last && !!caption && (caption.speaker === "sarjy") === (last.role === "assistant");
  return captionIsLast ? lines.slice(-EARLIER - 1, -1) : lines.slice(-EARLIER);
}

export function useSarjy(lang: Lang) {
  const [state, dispatch] = useReducer(transition, "idle" as VoiceState);
  const [caption, setCaption] = useState<CaptionModel | null>(null);
  const [chip, setChip] = useState<ToolChipModel | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [timings, setTimings] = useState<Timings | null>(null);
  /** Sarjy's last answer, so it can be shared. */
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [micLook, setMicLook] = useState<MicLook>("ready");
  /** The chat on screen (null: a new one, not yet started), and what the stage says about it. */
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatNote, setChatNote] = useState<"fresh" | "continuing" | null>(null);
  /** Every line of the chat on screen, oldest first. */
  const [lines, setLines] = useState<ChatLine[]>([]);

  const player = useRef<Player | null>(null);
  const turn = useRef<Turn | null>(null);
  const abort = useRef<AbortController | null>(null);
  const conversationId = useRef<string | null>(null);
  const ear = useRef<Ear | null>(null);
  /**
   * True while you are in a spoken conversation: each answer is followed by listening again, so
   * you never tap between turns. Ends when you stay quiet, press End, or type.
   */
  const conversing = useRef(false);
  const listenRef = useRef<() => Promise<boolean>>(async () => false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getPlayer = () => (player.current ??= new Player());

  const applySession = useCallback((data: SessionData | null) => {
    if (!data) return;
    setProfile(data.user);
    setMemories(data.memories);
    setChats(data.chats);
  }, []);

  // Who am I? Profile, memories and chats for the first paint.
  useEffect(() => {
    let current = true;
    void loadSession(lang).then((data) => current && applySession(data));
    return () => {
      current = false;
    };
  }, [lang, applySession]);

  const refreshSession = useCallback(async () => applySession(await loadSession(lang)), [lang, applySession]);

  useEffect(prefetchSpeechDetector, []);

  /** Closes the mic. With `submit`, speech in progress is ended and sent (the VAD calls back). */
  const closeEar = useCallback(async (submit: boolean) => {
    const e = ear.current;
    if (!e) return;
    ear.current = null;
    e.timers.forEach((id) => window.clearTimeout(id));
    e.stopPreview();
    await e.vad?.stop(submit);
    e.mic.close();
  }, []);

  /** Stops whatever is in flight: listening, the request, the audio. */
  const stop = useCallback(() => {
    conversing.current = false;
    if (ear.current) {
      void closeEar(false);
      player.current?.cue("close");
    }
    abort.current?.abort();
    player.current?.stop();
    turn.current = null;
    dispatch({ type: "CANCEL" });
  }, [closeEar]);

  // Leaving the page releases the mic.
  useEffect(() => () => void closeEar(false), [closeEar]);

  /** A segment is scheduled: Sarjy's caption grows by its words, and speaking begins with the first. */
  const addSegment = useCallback((seg: PlayedSegment, t: Turn) => {
    if (turn.current !== t) return; // a newer turn replaced this one
    t.segments.push(seg);
    t.words.push(...seg.words);
    if (t.segments.length === 1) dispatch({ type: "PLAYING" });
    setCaption({ speaker: "sarjy", lang: t.lang, words: [...t.words], shown: t.shown, style: "speak" });
  }, []);

  const handle = useCallback(
    (event: TurnEvent, t: Turn) => {
      switch (event.type) {
        case "transcript":
          t.lang = event.lang;
          setLines((l) => [...l, { role: "user", text: event.text, lang: event.lang }]);
          setCaption({
            speaker: "user",
            lang: event.lang,
            words: event.text.split(/\s+/),
            shown: Infinity,
            style: "dim",
          });
          return;
        case "tool_start":
          dispatch({ type: "TOOL_START" });
          setChip({ label: event.label });
          return;
        case "tool_end":
          dispatch({ type: "TOOL_END" });
          setChip((c) => (c ? { ...c, ms: event.ms, failed: !event.ok } : c));
          return;
        case "memory_saved":
          t.changedMemory = true;
          t.saved = event.memory;
          setFreshId(event.memory.id);
          setMemories((list) => [...list.filter((m) => m.key !== event.memory.key), event.memory]);
          return;
        case "memory_forgotten":
          t.changedMemory = true;
          setMemories((list) => list.filter((m) => m.id !== event.id));
          return;
        case "segment":
          void getPlayer()
            .play(event)
            .then((seg) => addSegment(seg, t));
          return;
        case "error":
          // Errors are spoken like any answer (with the browser's voice), then Sarjy rests.
          void getPlayer()
            .play({ index: t.segments.length, text: event.say, lang: t.lang, audio: null })
            .then((seg) => addSegment(seg, t));
          t.streamDone = true;
          return;
        case "done":
          conversationId.current = event.conversationId;
          setActiveChatId(event.conversationId);
          if (event.text) setLines((l) => [...l, { role: "assistant", text: event.text, lang: t.lang }]);
          setTimings(event.timings);
          setLastMessageId(event.messageId);
          t.streamDone = true;
          return;
      }
    },
    [addSegment],
  );

  /** Sends a typed (or, from M4, spoken) turn. */
  const send = useCallback(
    async (input: { text?: string; audio?: Blob; fakeTranscript?: string }) => {
      abort.current?.abort();
      getPlayer().stop();
      getPlayer().unlock();
      const t: Turn = {
        segments: [],
        words: [],
        lang,
        streamDone: false,
        changedMemory: false,
        saved: null,
        shown: 0,
      };
      turn.current = t;
      abort.current = new AbortController();
      setChip(null);
      setFreshId(null);
      setChatNote(null);
      if (input.text) conversing.current = false; // typing steps out of hands-free
      if (input.text) {
        setCaption({ speaker: "user", lang, words: input.text.split(/\s+/), shown: Infinity, style: "dim" });
      }
      dispatch({ type: "SEND" });
      try {
        await sendTurn(
          { ...input, conversationId: conversationId.current, lang, signal: abort.current.signal },
          (e) => turn.current === t && handle(e, t),
        );
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        handle(
          {
            type: "error",
            code: "internal",
            say:
              lang === "ar"
                ? "ما قدرت أوصل لسرجي. جرّب مرة ثانية."
                : "I couldn't reach the server. Try again?",
          },
          t,
        );
      }
      // New chats and changed titles show up in the sidebar.
      void refreshSession();
    },
    [handle, lang, refreshSession],
  );

  /**
   * Opens the mic and listens until you stop speaking, then sends what you said.
   * Tapping the mic while Sarjy thinks or speaks interrupts it (barge-in).
   * Returns false when there is no mic to use.
   */
  const listen = useCallback(async (): Promise<boolean> => {
    if (ear.current) return true;
    abort.current?.abort();
    getPlayer().stop();
    turn.current = null;
    const ctx = getPlayer().context();

    let mic: Mic;
    try {
      mic = await Mic.open(ctx);
    } catch (error) {
      setMicLook(error instanceof MicError ? "blocked" : "ready");
      dispatch({ type: "CANCEL" });
      return false;
    }
    setMicLook("live");
    const e: Ear = { mic, vad: null, stopPreview: () => {}, timers: [], sent: false };
    ear.current = e;
    conversing.current = true;

    // Called by the VAD when you stop speaking, or when listening is closed mid-sentence with submit.
    const finish = async (audio: Float32Array) => {
      if (e.sent) return;
      e.sent = true;
      if (ear.current === e) await closeEar(false);
      setMicLook("ready");
      getPlayer().cue("close");
      void send({ audio: new Blob([encodeWav(audio, 16_000)], { type: "audio/wav" }) });
    };

    try {
      e.vad = await detectSpeech(mic, {
        onSpeechStart: () => {
          // Heard something: the "nothing said" timer is replaced by the "too long" one,
          // and the loudness backstop starts watching for the end of your sentence.
          e.timers.forEach((id) => window.clearTimeout(id));
          let loudAt = performance.now();
          const watch = window.setInterval(() => {
            if (mic.level() > QUIET_LEVEL) loudAt = performance.now();
            else if (performance.now() - loudAt > QUIET_MS) void closeEar(true);
          }, 100);
          // (clearTimeout also clears an interval: both share one list of ids.)
          e.timers = [window.setTimeout(() => void closeEar(true), LONGEST_MS), watch];
        },
        onSpeechEnd: (audio) => void finish(audio),
      });
    } catch {
      // The speech detector failed to load: without it we can't tell when you're done.
      await closeEar(false);
      setMicLook("blocked");
      dispatch({ type: "CANCEL" });
      return false;
    }
    if (ear.current !== e) return true; // stopped while loading

    // Listening for real now: the cue says so, and your words start to appear.
    getPlayer().cue("open");
    dispatch({ type: "LISTEN" });
    setChip(null);
    setCaption(null);
    e.stopPreview = previewWords(lang, (text) =>
      setCaption({ speaker: "user", lang, words: text.split(/\s+/), shown: Infinity, style: "dim" }),
    );
    e.timers.push(
      window.setTimeout(() => {
        if (ear.current !== e) return;
        conversing.current = false; // nothing said: the conversation rests
        void closeEar(false);
        setMicLook("ready");
        getPlayer().cue("close");
        dispatch({ type: "CANCEL" });
      }, SILENT_MS),
    );
    return true;
  }, [closeEar, lang, send]);
  useEffect(() => {
    listenRef.current = listen;
  }, [listen]);

  /** Tap while listening: "I'm done". Sends what was said so far, or closes quietly if nothing was. */
  const finishListening = useCallback(async () => {
    const e = ear.current;
    if (!e) return;
    // If speech is in progress the VAD hands it to `finish` above; otherwise nothing comes back.
    await closeEar(true);
    setMicLook("ready");
    if (!e.sent) {
      conversing.current = false;
      getPlayer().cue("close");
      dispatch({ type: "CANCEL" });
    }
  }, [closeEar]);

  // Once per frame while Sarjy talks: which word is being said, and is the turn over?
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = turn.current;
      const p = player.current;
      if (t && p && t.segments.length) {
        const now = p.now();
        let shown = 0;
        for (const seg of t.segments) {
          shown += now >= seg.startAt ? wordsSpoken(seg.timings, now - seg.startAt) : 0;
        }
        if (shown !== t.shown) {
          t.shown = shown;
          setCaption((c) => (c && c.speaker === "sarjy" ? { ...c, shown } : c));
        }
        const last = t.segments[t.segments.length - 1]!;
        if (t.streamDone && now >= last.endAt + 0.05 && !p.busy() && stateRef.current === "speaking") {
          turn.current = null;
          const keep = t.saved ? findKeep(t.words, t.saved) : undefined;
          setCaption((c) => (c ? { ...c, shown: c.words.length, keep } : c));
          dispatch({ type: "PLAYED", saved: t.changedMemory });
          // The stitch: the saved fact is underlined and its card lands, with one dry tick.
          if (t.changedMemory) p.cue("saved");
          if (t.changedMemory) window.setTimeout(() => dispatch({ type: "SETTLED" }), SETTLE_MS);
          // Hands-free: your turn again. Only after Sarjy has finished, so it never hears itself.
          if (conversing.current) {
            window.setTimeout(
              () => {
                if (conversing.current && !ear.current && !turn.current) void listenRef.current();
              },
              t.changedMemory ? SETTLE_MS : RELISTEN_MS,
            );
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Memory card actions.
  const editMemory = useCallback(async (id: string, value: string) => {
    const res = await fetch(`/api/memories/${id}`, { method: "PATCH", body: JSON.stringify({ value }) });
    if (res.ok) {
      const { memory } = (await res.json()) as { memory: Memory };
      setMemories((list) => list.map((m) => (m.id === id ? memory : m)));
      if (memory.key === "name") setProfile((p) => (p ? { ...p, name: memory.value } : p));
    }
  }, []);

  const forgetMemory = useCallback(async (id: string) => {
    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setMemories((list) => {
      if (list.find((m) => m.id === id)?.key === "name") setProfile((p) => (p ? { ...p, name: null } : p));
      return list.filter((m) => m.id !== id);
    });
  }, []);

  /** A clean slate: the next turn starts a new chat, and the stage says so. */
  const newChat = useCallback(() => {
    stop();
    conversationId.current = null;
    setActiveChatId(null);
    setLastMessageId(null);
    setCaption(null);
    setChip(null);
    setLines([]);
    setChatNote("fresh");
  }, [stop]);

  /** Opens a past chat from Recent: the next turn continues it, and its last answer is on screen. */
  const openChat = useCallback(
    async (id: string) => {
      stop();
      const res = await fetch(`/api/chats/${id}`);
      if (!res.ok) return;
      const { chat } = (await res.json()) as {
        chat: { id: string; messages: ChatLine[] };
      };
      setLines(chat.messages);
      conversationId.current = chat.id;
      setActiveChatId(chat.id);
      setLastMessageId(null);
      setChip(null);
      setChatNote("continuing");
      const last = [...chat.messages].reverse().find((m) => m.role === "assistant");
      setCaption(
        last
          ? {
              speaker: "sarjy",
              lang: last.lang,
              words: last.text.split(/\s+/),
              shown: Infinity,
              style: "speak",
            }
          : null,
      );
    },
    [stop],
  );

  /** Renames a chat: shown at once, then saved. */
  const renameChat = useCallback(async (id: string, title: string) => {
    const clean = title.replace(/\s+/g, " ").trim().slice(0, 60);
    if (!clean) return;
    setChats((list) => list.map((c) => (c.id === id ? { ...c, title: clean } : c)));
    await fetch(`/api/chats/${id}`, { method: "PATCH", body: JSON.stringify({ title: clean }) });
  }, []);

  /** Your profile picture, one of the paintings: shown at once, then saved. */
  const setAvatar = useCallback(async (avatar: AvatarId) => {
    setProfile((p) => (p ? { ...p, avatar, avatarImage: null } : p));
    await fetch("/api/profile", { method: "PATCH", body: JSON.stringify({ avatar }) });
  }, []);

  /** Your own picture (already shrunk in the browser): shown at once, then saved. */
  const uploadAvatar = useCallback(async (image: string) => {
    setProfile((p) => (p ? { ...p, avatar: "upload", avatarImage: image } : p));
    await fetch("/api/profile", { method: "PATCH", body: JSON.stringify({ image }) });
  }, []);

  /** Your name, on the profile and as the `name` memory. */
  const setName = useCallback(
    async (name: string) => {
      const res = await fetch("/api/profile", { method: "PATCH", body: JSON.stringify({ name, lang }) });
      if (!res.ok) return;
      const { memory } = (await res.json()) as { memory: Memory };
      setProfile((p) => (p ? { ...p, name: memory.value } : p));
      setMemories((list) => [...list.filter((m) => m.key !== "name"), memory]);
    },
    [lang],
  );

  /** Forget everything: the user and all they own are deleted; the page starts over as a stranger. */
  const forgetEverything = useCallback(async () => {
    stop();
    await fetch("/api/session", { method: "DELETE" });
    window.location.reload();
  }, [stop]);

  const outputLevel = useCallback(() => player.current?.level() ?? null, []);
  const inputLevel = useCallback(() => ear.current?.mic.level() ?? null, []);

  /** Shares the last exchange as a link. Returns the full URL, or null if it could not be made. */
  const shareLast = useCallback(async (): Promise<string | null> => {
    if (!lastMessageId) return null;
    const res = await fetch("/api/shares", {
      method: "POST",
      body: JSON.stringify({ messageId: lastMessageId }),
    });
    if (!res.ok) return null;
    const { path } = (await res.json()) as { path: string };
    return new URL(path, window.location.origin).toString();
  }, [lastMessageId]);

  return {
    state,
    caption,
    chip,
    memories,
    freshId,
    chats,
    profile,
    timings,
    send,
    stop,
    newChat,
    openChat,
    setAvatar,
    uploadAvatar,
    setName,
    forgetEverything,
    renameChat,
    activeChatId,
    chatNote,
    editMemory,
    forgetMemory,
    outputLevel,
    inputLevel,
    micLook,
    earlier: earlierLines(lines, caption),
    listen,
    finishListening,
    canShare: lastMessageId !== null,
    shareLast,
  };
}
