// The six states of the voice screen, from the visual identity (section 6).
// Everything that shows state (the orb, the mic, the status line, the screen reader) reads one of these.

export const VOICE_STATES = ["idle", "listening", "thinking", "tool", "speaking", "saving"] as const;

export type VoiceState = (typeof VOICE_STATES)[number];
