"use client";

// The one hook the voice screen uses (architecture, section 2). It owns:
//   - who you are, your memories and chats (loaded from /api/session on first paint)
//   - the voice state (through the pure state machine in machine.ts)
//   - one turn at a time: send it, react to each streamed event, play the audio, sync the caption
// Components only render what this hook returns.

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Lang } from "@/shared/i18n";
import type { Memory, Timings, TurnEvent } from "@/shared/protocol";
import type { VoiceState } from "@/shared/states";
import { wordsSpoken } from "@/shared/wordTiming";
import { Player, type PlayedSegment } from "../audio/player";
import type { CaptionModel } from "../ui/Caption";
import type { ToolChipModel } from "../ui/ToolChip";
import { findKeep } from "./keep";
import { transition } from "./machine";
import { sendTurn } from "./turnStream";

export type ChatSummary = { id: string; title: string; updatedAt: string };
export type Profile = { id: string; name: string | null; onboardingStep: string };

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

type SessionData = { user: Profile; memories: Memory[]; chats: ChatSummary[] };

/** Creates or resumes the anonymous user, and fetches what the screen shows first. */
async function loadSession(lang: Lang): Promise<SessionData | null> {
  const res = await fetch("/api/session", { method: "POST", body: JSON.stringify({ lang }) });
  return res.ok ? ((await res.json()) as SessionData) : null;
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

  const player = useRef<Player | null>(null);
  const turn = useRef<Turn | null>(null);
  const abort = useRef<AbortController | null>(null);
  const conversationId = useRef<string | null>(null);
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

  /** Stops whatever is in flight: the request, the audio. */
  const stop = useCallback(() => {
    abort.current?.abort();
    player.current?.stop();
    turn.current = null;
    dispatch({ type: "CANCEL" });
  }, []);

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
          if (t.changedMemory) window.setTimeout(() => dispatch({ type: "SETTLED" }), SETTLE_MS);
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
    }
  }, []);

  const forgetMemory = useCallback(async (id: string) => {
    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (res.ok) setMemories((list) => list.filter((m) => m.id !== id));
  }, []);

  const newChat = useCallback(() => {
    stop();
    conversationId.current = null;
    setCaption(null);
    setChip(null);
  }, [stop]);

  const outputLevel = useCallback(() => player.current?.level() ?? null, []);

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
    editMemory,
    forgetMemory,
    outputLevel,
  };
}
