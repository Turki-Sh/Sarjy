"use client";

// A Majlis, from this browser's side (architecture, section 13): coming in at the door, who is
// here and connected, who has the mic, and every event the room sends. Turn events are handed to
// useSarjy, which renders them with the same code as your own turns.

import { useCallback, useEffect, useRef, useState } from "react";
import type { TurnEvent } from "@/shared/protocol";
import type { Member, RoomEvent, RoomState } from "@/shared/room";
import { connectRoom, type LinkStatus, type RoomLink } from "./transport";

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

  const apply = useCallback((event: RoomEvent) => {
    switch (event.type) {
      case "turn":
        handlers.current.turn(event.speaker, event.event);
        return;
      case "floor": {
        const previous = floorRef.current;
        floorRef.current = event.holder;
        setFloor(event.holder);
        if (event.holder === null) handlers.current.floorFreed(previous);
        return;
      }
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
  }, []);

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
      floorRef.current = state.floor;
      setFloor(state.floor);
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
      setPhase("in");
      return state;
    },
    [apply, code],
  );

  // Leaving the page leaves the room's presence.
  useEffect(() => () => link.current?.close(), []);

  /** Asks for the mic. False when someone else has it (and says who). */
  const takeFloor = useCallback(async (): Promise<boolean> => {
    const res = await fetch(`/api/rooms/${code}/floor`, { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as { holder?: string | null };
    floorRef.current = body.holder ?? null;
    setFloor(body.holder ?? null);
    return res.ok;
  }, [code]);

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
