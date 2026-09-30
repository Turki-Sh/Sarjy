import "server-only";

// Chooses the providers for a turn: the fakes, or Groq and the real web.

import { env } from "../env";
import { fakeFetch } from "./fake/fetch";
import { createFakeModel } from "./fake/model";
import { createFakeStt, createFakeTts } from "./fake/speech";
import { createGroqProviders } from "./groq";
import type { Providers } from "./types";

export function getProviders(
  options: {
    scriptedTranscript?: string | null;
    slowRestMs?: number;
    /** Fake mode: the voice returns nothing, as past Groq's daily limit. */
    voiceOut?: boolean;
    /** The voices this person chose (Settings, Voice). */
    voices?: Record<"en" | "ar", string>;
  } = {},
): Providers {
  if (env.providers === "live") {
    if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set.");
    return createGroqProviders(env.GROQ_API_KEY, options.voices);
  }
  return {
    stt: createFakeStt(options.scriptedTranscript ?? null),
    tts: createFakeTts(options.slowRestMs, options.voiceOut),
    models: [
      { id: "fake-main", model: createFakeModel("fake-main") },
      { id: "fake-fallback", model: createFakeModel("fake-fallback"), vision: true },
    ],
    fetch: fakeFetch,
  };
}
