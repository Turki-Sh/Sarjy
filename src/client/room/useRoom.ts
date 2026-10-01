"use client";

// A Majlis, from this browser's side (architecture, section 13): coming in at the door, who is
// here and connected, who has the mic, and every event the room sends. Turn events are handed to
// useSarjy, which renders them with the same code as your own turns.
//
// A quiet Majlis lets go of its connection (Turki, Day 5: don't run through Ably's allowance for a
// tab left open): after 10 minutes with nothing said and nothing touched, or 2 minutes in a
// background tab, it closes, and the bar says it dozed off. The next tap or key brings it back,
// with the room's state fetched fresh.

import { useCallback, useEffect, useRef, useState } from "react";
import type { TurnEvent } from "@/shared/protocol";
import { FLOOR_MS, type Member, type RoomEvent, type RoomState } from "@/shared/room";
import { connectRoom, type LinkStatus, type RoomLink } from "./transport";

/** How long a Majlis stays connected with nothing happening, open and in a background tab. */
export const IDLE_MS = 10 * 60_000;
export const HIDDEN_MS = 2 * 60_000;

/** Where you are: at the door, inside, or turned away. */
export type RoomPhase = "door" | "joining" | "in" | "full" | "ended" | "missing";

export function useRoom(
  code: string,
  initial: RoomPhase,
  on: {
    /** Someone's turn, event by event. */
    turn: (speaker: string, event: TurnEvent) => void;
    /** The mic was let go: a turn that never said "done" (stopped midway) is over. */
    floorFreed: (previous: string | null) => void;
  },
) {
  const [phase, setPhase] = useState<RoomPhase>(initial);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [online, setOnline] = useState<string[]>([]);
  const [floor, setFloor] = useState<string | null>(null);
  const [status, setStatus] = useState<LinkStatus>("live");
  const link = useRef<RoomLink | null>(null);
  const handlers = useRef(on);
  useEffect(() => {
    handlers.current = on;
  });
  const floorRef = useRef<string | null>(null);
  const floorTimer = useRef(0);
  /** When something last happened in the room, or you last touched the screen. */
  const lastActive = useRef(0);

  /**
   * Who has the mic now. A claim runs out on the server without anyone being told (a phone that
   * locked mid-turn), so this screen lets it go by itself when it would have expired.
   */
  const holdFloor = useCallback((holder: string | null, ms = FLOOR_MS) => {
    const previous = floorRef.current;
    floorRef.current = holder;
    setFloor(holder);
    window.clearTimeout(floorTimer.current);
    if (holder) {
      floorTimer.current = window.setTimeout(() => {
        if (floorRef.current !== holder) return;
        floorRef.current = null;
        setFloor(null);
        handlers.current.floorFreed(holder);
      }, ms + 1000);
    } else if (previous) {
      handlers.current.floorFreed(previous);
    }
  }, []);
  useEffect(() => () => window.clearTimeout(floorTimer.current), []);

  const apply = useCallback(
    (event: RoomEvent) => {
      // Anything happening in the room keeps it awake (presence alone doesn't: that is just people
      // sitting there).
      if (event.type !== "presence") lastActive.current = Date.now();
      switch (event.type) {
        case "turn":
          handlers.current.turn(event.speaker, event.event);
          return;
        case "floor":
          holdFloor(event.holder);
          return;
        case "members":
          setMembers(event.members);
          return;
        case "ended":
          setPhase("ended");
          link.current?.close();
          link.current = null;
          return;
        case "presence":
          setOnline(event.online);
          return;
      }
    },
    [holdFloor],
  );

  /** Comes in (with a name, if you gave one at the door), then starts listening to the room. */
  const join = useCallback(
    async (name?: string, lang?: string) => {
      setPhase("joining");
      if (name?.trim()) {
        await fetch("/api/profile", { method: "PATCH", body: JSON.stringify({ name: name.trim(), lang }) });
      }
      const res = await fetch(`/api/rooms/${code}`, { method: "POST" });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        setPhase(error === "full" ? "full" : error === "ended" ? "ended" : "missing");
        return null;
      }
      const { room: state } = (await res.json()) as { room: RoomState };
      setRoom(state);
      setMembers(state.members);
      holdFloor(state.floor, state.floorMs ?? FLOOR_MS);
      if (state.ended) {
        setPhase("ended");
        return state;
      }
      link.current?.close();
      link.current = await connectRoom(state, {
        onEvent: apply,
        onOnline: setOnline,
        onStatus: setStatus,
      });
      lastActive.current = Date.now();
      setStatus("live");
      setPhase("in");
      return state;
    },
    [apply, code, holdFloor],
  );

  // Leaving the page leaves the room's presence.
  useEffect(() => () => link.current?.close(), []);

  // Dozing off after a quiet spell, and waking on the next tap or key.
  const asleep = status === "asleep";
  useEffect(() => {
    if (phase !== "in") return;
    const doze = () => {
      if (floorRef.current) return; // never while someone has the mic
      link.current?.close();
      link.current = null;
      setStatus("asleep");
    };
    const touch = () => {
      lastActive.current = Date.now();
      if (asleep) void join();
    };
    // Room events count as activity: wrapped so each one moves the clock on.
    let hiddenSince = 0;
    const tick = window.setInterval(() => {
      if (asleep) return;
      const now = Date.now();
      if (document.hidden) hiddenSince ||= now;
      else hiddenSince = 0;
      if (now - lastActive.current > IDLE_MS || (hiddenSince && now - hiddenSince > HIDDEN_MS)) doze();
    }, 15_000);
    const onVisible = () => {
      if (!document.hidden) touch();
    };
    window.addEventListener("pointerdown", touch, { passive: true });
    window.addEventListener("keydown", touch);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phase, asleep, join]);

  /** Asks for the mic. False when someone else has it (and says who). */
  const takeFloor = useCallback(async (): Promise<boolean> => {
    const res = await fetch(`/api/rooms/${code}/floor`, { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as { holder?: string | null };
    holdFloor(body.holder ?? null);
    return res.ok;
  }, [code, holdFloor]);

  /** Gives the mic back without having said anything. */
  const dropFloor = useCallback(() => {
    void fetch(`/api/rooms/${code}/floor`, { method: "DELETE" });
  }, [code]);

  /** Ends the Majlis for everyone (the host only). */
  const end = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`, { method: "DELETE" });
    if (res.ok) setPhase("ended");
    return res.ok;
  }, [code]);

  return { phase, room, members, online, floor, status, join, takeFloor, dropFloor, end };
}
