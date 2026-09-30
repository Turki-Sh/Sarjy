import "server-only";

// The three external capabilities, behind small interfaces (architecture, section 8).
// `fake` implementations make every test and all offline work independent of network and quota.

import type { LanguageModel } from "ai";

export type Lang = "en" | "ar";

export interface SpeechToText {
  /** Audio in, text and detected language out. `hint` is the interface language. */
  transcribe(audio: Blob, hint: Lang): Promise<{ text: string; lang: Lang }>;
}

export interface TextToSpeech {
  /** A WAV file for the text, or null when the browser's backup voice should speak it. */
  synthesize(text: string, lang: Lang): Promise<ArrayBuffer | null>;
}

/** A model the turn may use; `vision` marks the ones that can read a picture. */
export type ModelChoice = { id: string; model: LanguageModel; vision?: boolean };

/**
 * The models a turn may use, best first. The first is the main model (fast, reliable tool
 * calling); each next one takes the turn when the one before is rate limited or fails. On Groq
 * every model has its own per-minute quota, so a chain of three survives a burst that one would not.
 */
export type Models = ModelChoice[];

/** The HTTP client tools use. Swapped for recorded responses in tests. */
export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export type Providers = {
  stt: SpeechToText;
  tts: TextToSpeech;
  models: Models;
  fetch: Fetch;
};
