import "server-only";

// Chooses the providers for a turn: the fakes, or Groq and the real web.

import { env } from "../env";
import { fakeFetch } from "./fake/fetch";
import { createFakeModel } from "./fake/model";
import { createFakeStt, createFakeTts } from "./fake/speech";
import { createGroqProviders } from "./groq";
import type { Providers } from "./types";

export function getProviders(options: { scriptedTranscript?: string | null } = {}): Providers {
  if (env.providers === "live") {
    if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set.");
    return createGroqProviders(env.GROQ_API_KEY);
  }
  return {
    stt: createFakeStt(options.scriptedTranscript ?? null),
    tts: createFakeTts(),
    models: {
      main: createFakeModel("fake-main"),
      fallback: createFakeModel("fake-fallback"),
      mainId: "fake-main",
      fallbackId: "fake-fallback",
    },
    fetch: fakeFetch,
  };
}
