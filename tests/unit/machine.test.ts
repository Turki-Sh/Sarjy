import { describe, expect, it } from "vitest";
import { transition, type VoiceEvent } from "@/client/voice/machine";
import type { VoiceState } from "@/shared/states";

const run = (events: VoiceEvent[], from: VoiceState = "idle") => events.reduce(transition, from);

describe("voice state machine (AT-40)", () => {
  it("walks a spoken turn with a tool and a save", () => {
    const path: VoiceState[] = [];
    let s: VoiceState = "idle";
    for (const e of [
      { type: "LISTEN" },
      { type: "SEND" },
      { type: "TOOL_START" },
      { type: "TOOL_END" },
      { type: "PLAYING" },
      { type: "PLAYED", saved: true },
      { type: "SETTLED" },
    ] as VoiceEvent[]) {
      s = transition(s, e);
      path.push(s);
    }
    expect(path).toEqual(["listening", "thinking", "tool", "thinking", "speaking", "saving", "idle"]);
  });

  it("goes straight back to idle when nothing was saved", () => {
    expect(run([{ type: "SEND" }, { type: "PLAYING" }, { type: "PLAYED", saved: false }])).toBe("idle");
  });

  it("can start speaking straight from the tool state", () => {
    expect(run([{ type: "SEND" }, { type: "TOOL_START" }, { type: "PLAYING" }])).toBe("speaking");
  });

  it("cancels a recording without sending (AT-03)", () => {
    expect(run([{ type: "LISTEN" }, { type: "CANCEL" }])).toBe("idle");
  });

  it("lets you talk over Sarjy (barge-in)", () => {
    expect(transition("speaking", { type: "LISTEN" })).toBe("listening");
  });

  it("ignores events that arrive too late", () => {
    expect(transition("idle", { type: "TOOL_START" })).toBe("idle");
    expect(transition("idle", { type: "PLAYED", saved: true })).toBe("idle");
    expect(transition("listening", { type: "PLAYING" })).toBe("listening");
  });

  it("rests after an error", () => {
    expect(run([{ type: "SEND" }, { type: "FAILED" }])).toBe("idle");
  });
});
