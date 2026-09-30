"use client";

// The one hook the voice screen uses (architecture, section 2). It owns:
//   - who you are, your memories and chats (loaded from /api/session on first paint)
//   - the voice state (through the pure state machine in machine.ts)
//   - the mic: listening, deciding you are done, and sending what you said
//   - one turn at a time: send it, react to each streamed event, play the audio, sync the caption
//   - in a Majlis, other people's turns too: the room's events arrive through `receive` and are
//     rendered by the same code as your own (architecture, section 13)
// Components only render what this hook returns.

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { AvatarChoice, AvatarId } from "@/shared/avatars";
import { t, type Lang } from "@/shared/i18n";
import type { Memory, Timings, TurnEvent } from "@/shared/protocol";
import type { VoiceState } from "@/shared/states";
import { encodeWav } from "@/shared/wav";
import { wordsSpoken } from "@/shared/wordTiming";
import { Mic, MicError } from "../audio/mic";
import { Player, type PlayedSegment } from "../audio/player";
import { listen as detectSpeech, type Listening } from "../audio/vad";
import type { CaptionModel } from "../ui/Caption";
import type { ToolChipModel } from "../ui/ToolChip";
import { findKeep } from "./keep";
import { transition } from "./machine";
import { answerFinished } from "./turnEnd";
import { previewWords } from "./preview";
import { shrinkPhoto } from "../ui/photo";
import { sendTurn } from "./turnStream";

/** How the mic looks, drawn on the orb: ready, live, or dashed when there is no mic access. */
export type MicLook = "ready" | "live" | "blocked";

export type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
  /** A Majlis chat: its code, whether it is still open, and whether you opened it. */
  majlis?: { code: string; live: boolean; mine: boolean };
};
/** Who said a line in a Majlis: their name, their seat (its color), and whether it was you. */
export type Speaker = { name: string; seat: number; me: boolean };
/** One line of the chat on screen, for the small transcript above the caption. */
export type ChatLine = {
  role: "user" | "assistant";
  text: string;
  lang: Lang;
  /** A picture sent with this line: a local object URL just after sending, the saved copy after. */
  image?: string;
  /** In a Majlis: who said it. */
  speaker?: Speaker;
};

/** What the hook needs to know about the Majlis it is in. */
export type RoomLinkForVoice = {
  code: string;
  /** Your user id: the room's copy of your own turns is skipped (your stream already has them). */
  me: string;
  /** Who a user id is, for labels and colors. */
  who: (id: string) => Speaker | undefined;
  /** You stopped listening without saying anything: give the mic back. */
  onRest: () => void;
};

/** How many earlier lines show above the caption. */
const EARLIER = 3;
export type Profile = {
  id: string;
  name: string | null;
  onboardingStep: string;
  avatar: AvatarChoice;
  /** Your own picture as a data URL, when avatar is "upload". */
  avatarImage: string | null;
  /** Sarjy's voice in each language. */
  voices: Record<Lang, string>;
  /** The version of your own wallpaper, if you uploaded one. */
  wallpaper: number | null;
};

/** Everything about the turn in flight. Kept in a ref: it changes every frame, React doesn't need to know. */
type Turn = {
  /** The picture sent with this turn, shown in your bubble. */
  image?: string;
  /** In a Majlis: who asked, and, for someone else's turn, their user id. */
  speaker?: Speaker;
  remote?: string;
  segments: PlayedSegment[];
  /** Pieces of audio received from the server (segments, and a spoken error). */
  received: number;
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
/** How long the screen may say "Listening" with the mic closed before it resets itself. */
const STRANDED_MS = 1500;
/** Hands-free: after Sarjy answers a spoken question, the mic reopens by itself after this pause. */
const RELISTEN_MS = 350;

/** The open mic, while listening. */
type Ear = {
  mic: Mic;
  vad: Listening | null;
  stopPreview: () => void;
  timers: number[];
  sent: boolean;
  /** Ends listening; sends speech in progress with `submit`, else rests. */
  end: (submit: boolean) => Promise<void>;
};

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

const newTurn = (lang: Lang, extra: Partial<Turn> = {}): Turn => ({
  segments: [],
  received: 0,
  words: [],
  lang,
  streamDone: false,
  changedMemory: false,
  saved: null,
  shown: 0,
  ...extra,
});

export function useSarjy(
  lang: Lang,
  events: { onBackupVoice?: () => void; room?: RoomLinkForVoice | null } = {},
) {
  const [state, dispatch] = useReducer(transition, "idle" as VoiceState);
  const [caption, setCaption] = useState<CaptionModel | null>(null);
  const [chip, setChip] = useState<ToolChipModel | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  const [timings, setTimings] = useState<Timings | null>(null);
  const [micLook, setMicLook] = useState<MicLook>("ready");
  /** A picture waiting to be sent with the next turn (dropped, pasted, or taken). */
  const [picture, setPicture] = useState<{ blob: Blob; url: string } | null>(null);
  const pictureRef = useRef<{ blob: Blob; url: string } | null>(null);
  /** The chat on screen (null: a new one, not yet started), and what the stage says about it. */
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatNote, setChatNote] = useState<"fresh" | "continuing" | null>(null);
  /** Every line of the chat on screen, oldest first. */
  const [lines, setLines] = useState<ChatLine[]>([]);
  /** In a Majlis: whose turn is on screen (they asked; Sarjy is answering them), by user id. */
  const [asker, setAsker] = useState<string | null>(null);

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
  /** Whether the screen has said, this visit, that the browser's voice is standing in. */
  const backupNoted = useRef(false);
  const onBackupVoice = useRef(events.onBackupVoice);
  const roomRef = useRef(events.room ?? null);
  useEffect(() => {
    onBackupVoice.current = events.onBackupVoice;
    roomRef.current = events.room ?? null;
  });

  const getPlayer = () => (player.current ??= new Player());

  const applySession = useCallback((data: SessionData | null) => {
    if (!data) return;
    setProfile(data.user);
    setMemories(data.memories);
    setChats(data.chats);
  }, []);

  // Who am I? Profile, memories and chats for the first paint. A first visit creates you here,
  // so anything else that would (a turn, joining a Majlis) waits for it: two requests without the
  // cookie would make two different people.
  const sessionReady = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let current = true;
    sessionReady.current = loadSession(lang).then((data) => current && applySession(data));
    return () => {
      current = false;
    };
  }, [lang, applySession]);
  const whenReady = useCallback(() => sessionReady.current.catch(() => {}), []);

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
      const sent = ear.current.sent;
      void closeEar(false);
      player.current?.cue("close");
      if (!sent) roomRef.current?.onRest();
    }
    abort.current?.abort();
    player.current?.stop();
    turn.current = null;
    setAsker(null);
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
          setLines((l) => [
            ...l,
            { role: "user", text: event.text, lang: event.lang, image: t.image, speaker: t.speaker },
          ]);
          setCaption({
            speaker: "user",
            lang: event.lang,
            words: event.text.split(/\s+/),
            shown: Infinity,
            style: "dim",
            who: t.speaker,
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
          t.received++;
          // No audio: Sarjy's voice is out (usually Groq's daily limit), and the browser reads
          // instead. Said once, so the change of voice doesn't sound like something broke.
          if (!event.audio && !event.url && !backupNoted.current) {
            backupNoted.current = true;
            onBackupVoice.current?.();
          }
          void getPlayer()
            .play(event)
            .then((seg) => addSegment(seg, t));
          return;
        case "error":
          // Errors are spoken like any answer (with the browser's voice), then Sarjy rests.
          t.received++;
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
          t.streamDone = true;
          return;
      }
    },
    [addSegment],
  );

  /** Sends a typed (or, from M4, spoken) turn. */
  const send = useCallback(
    async (input: { text?: string; audio?: Blob; fakeTranscript?: string }) => {
      // A picture waiting in the text box goes with this turn, typed or spoken.
      const attached = pictureRef.current;
      pictureRef.current = null;
      setPicture(null);
      abort.current?.abort();
      getPlayer().stop();
      getPlayer().unlock();
      const room = roomRef.current;
      const t = newTurn(lang, { image: attached?.url, speaker: room?.who(room.me) });
      setAsker(room?.me ?? null);
      turn.current = t;
      abort.current = new AbortController();
      setChip(null);
      setTimings(null);
      setFreshId(null);
      setChatNote(null);
      if (input.text) conversing.current = false; // typing steps out of hands-free
      if (input.text) {
        setCaption({
          speaker: "user",
          lang,
          words: input.text.split(/\s+/),
          shown: Infinity,
          style: "dim",
          who: t.speaker,
        });
      }
      dispatch({ type: "SEND" });
      try {
        await whenReady();
        if (turn.current !== t) return; // replaced while waiting
        await sendTurn(
          {
            ...input,
            image: attached?.blob,
            conversationId: conversationId.current,
            lang,
            room: room?.code,
            signal: abort.current.signal,
          },
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
    [handle, lang, refreshSession, whenReady],
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
    const e: Ear = { mic, vad: null, stopPreview: () => {}, timers: [], sent: false, end: async () => {} };
    ear.current = e;
    // Hands-free is for talking with Sarjy alone. In a Majlis the mic is shared, so you tap each time.
    conversing.current = !roomRef.current;

    // Called by the VAD when you stop speaking, or when listening is closed mid-sentence with submit.
    const finish = async (audio: Float32Array) => {
      if (e.sent) return;
      e.sent = true;
      if (ear.current === e) await closeEar(false);
      setMicLook("ready");
      getPlayer().cue("close");
      void send({ audio: new Blob([encodeWav(audio, 16_000)], { type: "audio/wav" }) });
    };

    // Every way listening ends goes through here. With `submit`, speech in progress is sent; when
    // nothing was (you never spoke, or it was only a cough), the screen rests instead of staying on
    // "Listening" with the mic already closed.
    const end = async (submit: boolean) => {
      if (ear.current !== e) return;
      await closeEar(submit);
      if (e.sent) return;
      conversing.current = false;
      setMicLook("ready");
      getPlayer().cue("close");
      dispatch({ type: "CANCEL" });
      roomRef.current?.onRest();
    };
    e.end = end;

    // Waiting for you to start: if you say nothing for a while, the conversation rests.
    const waitForSpeech = () => {
      e.timers.forEach((id) => window.clearTimeout(id));
      e.timers = [window.setTimeout(() => void end(false), SILENT_MS)];
    };

    try {
      e.vad = await detectSpeech(mic, {
        onSpeechStart: () => {
          if (ear.current !== e) return;
          // Heard something: the "nothing said" timer is replaced by the "too long" one,
          // and the loudness backstop starts watching for the end of your sentence.
          e.timers.forEach((id) => window.clearTimeout(id));
          let loudAt = performance.now();
          const watch = window.setInterval(() => {
            if (mic.level() > QUIET_LEVEL) loudAt = performance.now();
            else if (performance.now() - loudAt > QUIET_MS) void end(true);
          }, 100);
          // (clearTimeout also clears an interval: both share one list of ids.)
          e.timers = [window.setTimeout(() => void end(true), LONGEST_MS), watch];
        },
        onSpeechEnd: (audio) => void finish(audio),
        // Too short to be a turn: back to waiting, with the "nothing said" timer running again.
        onMisfire: () => {
          if (ear.current === e) waitForSpeech();
        },
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
    // Speech may have started while the detector was loading: its timers are already set.
    if (!e.timers.length) waitForSpeech();
    return true;
  }, [closeEar, lang, send]);
  useEffect(() => {
    listenRef.current = listen;
  }, [listen]);

  /** Tap while listening: "I'm done". Sends what was said so far, or closes quietly if nothing was. */
  const finishListening = useCallback(async () => {
    await ear.current?.end(true);
  }, []);

  // Once per frame while Sarjy talks: which word is being said, and is the turn over?
  useEffect(() => {
    let raf = 0;
    let strandedAt = 0;
    const tick = () => {
      // A last guard: "Listening" with no open mic is never right. Every exit above resets the
      // screen, but if one is ever missed the screen recovers by itself instead of waiting for you.
      if (stateRef.current === "listening" && !ear.current) {
        strandedAt ||= performance.now();
        if (performance.now() - strandedAt > STRANDED_MS) {
          strandedAt = 0;
          conversing.current = false;
          setMicLook("ready");
          dispatch({ type: "CANCEL" });
        }
      } else strandedAt = 0;
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
        const finished = answerFinished({
          streamDone: t.streamDone,
          received: t.received,
          scheduled: t.segments.length,
          lastEndAt: last.endAt,
          now,
          playerBusy: p.busy(),
        });
        if (finished && stateRef.current === "speaking") {
          turn.current = null;
          setAsker(null);
          const keep = t.saved ? findKeep(t.words, t.saved) : undefined;
          setCaption((c) => (c ? { ...c, shown: c.words.length, keep } : c));
          dispatch({ type: "PLAYED", saved: t.changedMemory });
          // The stitch: the saved fact is underlined and its card lands, with one dry tick.
          if (t.changedMemory) p.cue("saved");
          if (t.changedMemory) window.setTimeout(() => dispatch({ type: "SETTLED" }), SETTLE_MS);
          // Hands-free: your turn again. Only after Sarjy has finished, so it never hears itself,
          // and never while anything is still playing (it waits, rather than cut a sound short).
          if (conversing.current) {
            const relisten = () => {
              if (!conversing.current || ear.current || turn.current) return;
              if (p.busy()) return void window.setTimeout(relisten, 150);
              void listenRef.current();
            };
            window.setTimeout(relisten, t.changedMemory ? SETTLE_MS : RELISTEN_MS);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /**
   * In a Majlis: one event of someone else's turn. Their transcript starts a new turn on this
   * screen (whatever was playing stops: the room has moved on); the rest feed the same handler as
   * your own turns, so the orb, caption, chip and voice behave exactly the same.
   */
  const receive = useCallback(
    (speakerId: string, event: TurnEvent) => {
      const room = roomRef.current;
      if (!room || speakerId === room.me) return;
      let t = turn.current;
      if (event.type === "transcript" || !t || t.remote !== speakerId) {
        if (ear.current) void closeEar(false);
        abort.current?.abort();
        getPlayer().stop();
        t = newTurn(lang, {
          remote: speakerId,
          speaker: room.who(speakerId),
          image: event.type === "transcript" ? event.image : undefined,
        });
        turn.current = t;
        setAsker(speakerId);
        setChip(null);
        setTimings(null);
        setFreshId(null);
        setChatNote(null);
        dispatch({ type: "CANCEL" });
        dispatch({ type: "SEND" });
      }
      handle(event, t);
    },
    [closeEar, handle, lang],
  );

  /** In a Majlis: the mic was let go. Someone's turn that stopped midway is over on this screen too. */
  const remoteEnded = useCallback((speakerId: string | null) => {
    const t = turn.current;
    if (!t || !t.remote || (speakerId && t.remote !== speakerId)) return;
    t.streamDone = true;
    // Nothing was ever said: rest now, rather than wait for audio that will never come.
    if (!t.received) {
      turn.current = null;
      setAsker(null);
      dispatch({ type: "CANCEL" });
    }
  }, []);

  /** Audio needs a tap before it may play: coming into a Majlis is that tap. */
  const unlockAudio = useCallback(() => getPlayer().unlock(), []);

  /** In a Majlis: its conversation is the one on screen. */
  const enterRoom = useCallback((chatId: string, past: ChatLine[]) => {
    conversationId.current = chatId;
    setActiveChatId(chatId);
    setLines(past);
    setChatNote(null);
    const last = past.findLast((m) => m.role === "assistant");
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
  }, []);

  // Memory card actions.
  /** Edits a memory: its sentence, or the bare value of one the app reads (name, city, units). */
  const editMemory = useCallback(async (id: string, change: { note?: string; value?: string }) => {
    const res = await fetch(`/api/memories/${id}`, { method: "PATCH", body: JSON.stringify(change) });
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
    setCaption(null);
    setChip(null);
    setTimings(null);
    setLines([]);
    setChatNote("fresh");
  }, [stop]);

  /** Opens a past chat from Recent: the next turn continues it, and its last answer is on screen. */
  const openChat = useCallback(
    async (id: string) => {
      stop();
      const res = await fetch(`/api/chats/${id}`);
      if (!res.ok) return;
      const { chat } = (await res.json()) as { chat: FetchedChat };
      setLines(chatLines(chat, profileRef.current?.id ?? null, lang));
      conversationId.current = chat.id;
      setActiveChatId(chat.id);
      setChip(null);
      setTimings(null);
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
    [lang, stop],
  );

  /** Renames a chat: shown at once, then saved. */
  const renameChat = useCallback(async (id: string, title: string) => {
    const clean = title.replace(/\s+/g, " ").trim().slice(0, 60);
    if (!clean) return;
    setChats((list) => list.map((c) => (c.id === id ? { ...c, title: clean } : c)));
    await fetch(`/api/chats/${id}`, { method: "PATCH", body: JSON.stringify({ title: clean }) });
  }, []);

  /** Pins or unpins a chat: pinned chats stay at the top of Recent. */
  const pinChat = useCallback(async (id: string, pinned: boolean) => {
    setChats((list) => {
      const next = list.map((c) => (c.id === id ? { ...c, pinned } : c));
      // Pinned first, then newest, like the server orders them.
      return next.sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt),
      );
    });
    await fetch(`/api/chats/${id}`, { method: "PATCH", body: JSON.stringify({ pinned }) });
  }, []);

  /** Deletes a chat. If it is the one on screen, the screen starts a new chat. */
  const deleteChat = useCallback(
    async (id: string) => {
      setChats((list) => list.filter((c) => c.id !== id));
      if (conversationId.current === id) {
        stop();
        conversationId.current = null;
        setActiveChatId(null);
        setCaption(null);
        setLines([]);
      }
      await fetch(`/api/chats/${id}`, { method: "DELETE" });
    },
    [stop],
  );

  /** Makes a share link for a chat's latest answer. Returns the full URL, or null. */
  const shareChat = useCallback(async (id: string): Promise<string | null> => {
    const res = await fetch("/api/shares", { method: "POST", body: JSON.stringify({ conversationId: id }) });
    if (!res.ok) return null;
    const { path } = (await res.json()) as { path: string };
    return new URL(path, window.location.origin).toString();
  }, []);

  /** Your profile picture, one of the paintings: shown at once, then saved. */
  const setAvatar = useCallback(async (avatar: AvatarId) => {
    setProfile((p) => (p ? { ...p, avatar, avatarImage: null } : p));
    await fetch("/api/profile", { method: "PATCH", body: JSON.stringify({ avatar }) });
  }, []);

  /** Shrinks a picture and holds it for the next turn. Returns false if it can't be used. */
  const attachPicture = useCallback(async (file: File): Promise<boolean> => {
    const blob = await shrinkPhoto(file);
    if (!blob) return false;
    const next = { blob, url: URL.createObjectURL(blob) };
    pictureRef.current = next;
    setPicture(next);
    return true;
  }, []);
  const clearPicture = useCallback(() => {
    if (pictureRef.current) URL.revokeObjectURL(pictureRef.current.url);
    pictureRef.current = null;
    setPicture(null);
  }, []);

  /** Skip the intro: Sarjy won't ask your name. */
  const skipIntro = useCallback(async () => {
    setProfile((p) => (p ? { ...p, onboardingStep: "done" } : p));
    await fetch("/api/profile", { method: "PATCH", body: JSON.stringify({ onboarding: "done" }) });
  }, []);

  /** Sarjy's voice in one language: used from the next answer on. */
  const setVoice = useCallback(async (voiceLang: Lang, id: string) => {
    setProfile((p) => (p ? { ...p, voices: { ...p.voices, [voiceLang]: id } } : p));
    await fetch("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ voice: { lang: voiceLang, id } }),
    });
  }, []);

  /** Your own picture (already shrunk in the browser): shown at once, then saved. */
  const uploadAvatar = useCallback(async (image: string) => {
    setProfile((p) => (p ? { ...p, avatar: "upload", avatarImage: image } : p));
    await fetch("/api/profile", { method: "PATCH", body: JSON.stringify({ image }) });
  }, []);

  /** Your own wallpaper (already shrunk in the browser). Returns its version, or null if refused. */
  const uploadWallpaper = useCallback(async (picture: Blob): Promise<number | null> => {
    const res = await fetch("/api/wallpaper", { method: "PUT", body: picture });
    if (!res.ok) return null;
    const { version } = (await res.json()) as { version: number };
    setProfile((p) => (p ? { ...p, wallpaper: version } : p));
    return version;
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
    uploadWallpaper,
    setVoice,
    skipIntro,
    lines,
    picture: picture?.url ?? null,
    attachPicture,
    clearPicture,
    setName,
    forgetEverything,
    renameChat,
    pinChat,
    deleteChat,
    shareChat,
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
    receive,
    remoteEnded,
    unlockAudio,
    enterRoom,
    refreshSession,
    whenReady,
    asker,
  };
}

/** A chat as /api/chats/[id] returns it; a Majlis chat comes with its people. */
export type FetchedChat = {
  id: string;
  messages: (ChatLine & { speakerId?: string })[];
  majlis?: { code: string; live: boolean; members: { id: string; name: string | null; seat: number }[] };
};

/** A fetched chat's lines, each Majlis line labeled with who said it. */
export function chatLines(chat: FetchedChat, me: string | null, lang: Lang): ChatLine[] {
  const people = chat.majlis?.members;
  return chat.messages.map(({ speakerId, ...line }) => {
    const member = people?.find((m) => m.id === speakerId);
    if (!member) return line;
    const s = t(lang).majlis;
    const name = member.id === me ? s.you : (member.name ?? s.guest(member.seat));
    return { ...line, speaker: { name, seat: member.seat, me: member.id === me } };
  });
}
