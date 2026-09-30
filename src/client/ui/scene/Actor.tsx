"use client";

// A Rafeeq on a stage (the home page, the 404): placed where its feet stand, in percent of the
// stage, and sized in percent of the stage's width, so a scene keeps its composition at every
// size. It is the same live companion as in your chats (breathing, blinking, watching you,
// answering your pointer in character); the scene can direct its mood (`act`) and its state,
// turn it around, and make it walk. Tap it and it beams.
//
// Scenes are pictures, so they are placed with physical left and top: like the logo, a picture
// doesn't mirror in Arabic.

import { useState, type CSSProperties } from "react";
import type { Mood, RafeeqId } from "@/shared/rafeeq";
import type { VoiceState } from "@/shared/states";
import { Rafeeq, type RafeeqCue } from "../rafeeq/Rafeeq";
import styles from "./Scene.module.css";

export type ActorProps = {
  id: RafeeqId;
  /** Where its feet stand, in percent of the stage. */
  x: number;
  y: number;
  /** Its width, in percent of the stage's width. */
  size: number;
  /** Which way it faces: 1 as drawn, -1 turned around. */
  facing?: 1 | -1;
  act?: Mood | null;
  state?: VoiceState;
  /** Its bond level: 4 lets it do its own trick now and then. */
  level?: number;
  /** A walking gait (the scene moves it; this makes it step). */
  walk?: boolean;
  /** In front of or behind other things on the stage. */
  z?: number;
  className?: string;
  style?: CSSProperties;
};

export function Actor({
  id,
  x,
  y,
  size,
  facing = 1,
  act = null,
  state = "idle",
  level = 4,
  walk = false,
  z = 1,
  className,
  style,
}: ActorProps) {
  const [cue, setCue] = useState<RafeeqCue | null>(null);
  const [taps, setTaps] = useState(0);
  return (
    <div
      className={`${styles.actor}${className ? ` ${className}` : ""}`}
      style={{ "--x": `${x}%`, "--y": `${y}%`, "--size": size, "--z": z, ...style } as CSSProperties}
      data-facing={facing}
      data-walk={walk || undefined}
      data-actor={id}
      onClick={() => {
        setTaps((n) => n + 1);
        setCue({ kind: "saved", at: taps + 1 });
      }}
    >
      <div className={styles.body}>
        <Rafeeq id={id} state={state} level={level} act={act} cue={cue} />
      </div>
    </div>
  );
}
