import "server-only";

// Stand-ins for speech to text and the voice.

import { encodeWav } from "@/shared/wav";
import type { Lang, SpeechToText, TextToSpeech } from "../types";
import { toneSpeech } from "./tones";

/** Returns the transcript the test scripted for this turn (recorded audio can't be matched byte for byte). */
export function createFakeStt(scripted: string | null): SpeechToText {
  return {
    async transcribe(_audio, hint) {
      const text = scripted ?? (hint === "ar" ? "مرحبا" : "Hello");
      return { text, lang: /[؀-ۿ]/.test(text) ? "ar" : "en" };
    },
  };
}

/**
 * A voice made of soft tone bursts, one per word (see tones.ts): real audio with a real envelope.
 * `slowRestMs` makes every piece after the first arrive late, the way a slow live voice can, so a
 * test can prove the whole answer still plays (the "Sure thing." then silence bug, Day 2).
 */
export function createFakeTts(slowRestMs = 0): TextToSpeech {
  let calls = 0;
  return {
    async synthesize(text: string, _lang: Lang) {
      if (calls++ > 0 && slowRestMs > 0) await new Promise((r) => setTimeout(r, slowRestMs));
      const { samples, rate } = toneSpeech(text);
      return encodeWav(samples, rate);
    },
  };
}
