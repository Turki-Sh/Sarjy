// The voice screen's state machine (architecture, section 5). A pure function:
// (state, event) => state. Everything that shows state reads its result.
// Events that don't apply in the current state are ignored, so a late event can never
// put the screen somewhere impossible.

import type { VoiceState } from "@/shared/states";

export type VoiceEvent =
  | { type: "LISTEN" } // the mic opened
  | { type: "CANCEL" } // tapped the mic again, or End
  | { type: "SEND" } // speech ended, or text was sent
  | { type: "TOOL_START" }
  | { type: "TOOL_END" }
  | { type: "PLAYING" } // the first of Sarjy's audio started
  | { type: "PLAYED"; saved: boolean } // all audio finished; whether a memory changed this turn
  | { type: "SETTLED" } // the saving moment is over
  | { type: "FAILED" }; // the turn ended in an error (it is spoken, then we rest)

export function transition(state: VoiceState, event: VoiceEvent): VoiceState {
  switch (event.type) {
    case "LISTEN":
      // You can always start talking, including over Sarjy (barge-in).
      return "listening";
    case "CANCEL":
      return "idle";
    case "SEND":
      return state === "listening" || state === "idle" || state === "saving" ? "thinking" : state;
    case "TOOL_START":
      return state === "thinking" ? "tool" : state;
    case "TOOL_END":
      return state === "tool" ? "thinking" : state;
    case "PLAYING":
      return state === "thinking" || state === "tool" ? "speaking" : state;
    case "PLAYED":
      if (state !== "speaking") return state;
      return event.saved ? "saving" : "idle";
    case "SETTLED":
      return state === "saving" ? "idle" : state;
    case "FAILED":
      return state === "listening" ? state : "idle";
  }
}
