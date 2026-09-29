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

export type Models = {
  /** The main model: fast, reliable tool calling. */
  main: LanguageModel;
  /** Used when the main model is rate limited or fails, and for turns with an image. */
  fallback: LanguageModel;
  mainId: string;
  fallbackId: string;
};

/** The HTTP client tools use. Swapped for recorded responses in tests. */
export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export type Providers = {
  stt: SpeechToText;
  tts: TextToSpeech;
  models: Models;
  fetch: Fetch;
};
