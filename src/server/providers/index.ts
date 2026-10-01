import "server-only";

// Chooses the providers for a turn: the fakes, or Groq and the real web.

import { env } from "../env";
import { fakeFetch } from "./fake/fetch";
import { createFakeModel } from "./fake/model";
import { createFakeStt, createFakeTts } from "./fake/speech";
import { createFakeGuard } from "./fake/guard";
import { createFakePolicy } from "./fake/policy";
import { createFakeWeb } from "./fake/web";
import { createGroqProviders } from "./groq";
import type { Providers } from "./types";

export function getProviders(
  options: {
    scriptedTranscript?: string | null;
    slowRestMs?: number;
    /** Fake mode: the voice returns nothing, as past Groq's daily limit. */
    voiceOut?: boolean;
    /** Fake mode: the picture guard turns the next picture away. */
    unsafePicture?: boolean;
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
    writer: [{ id: "fake-writer", model: createFakeModel("fake-writer") }],
    web: createFakeWeb(),
    guard: createFakeGuard(options.unsafePicture ?? false),
    policy: createFakePolicy(),
    fetch: fakeFetch,
  };
}
