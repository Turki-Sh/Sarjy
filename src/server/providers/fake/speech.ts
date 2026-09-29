import "server-only";

// Stand-ins for speech to text and the voice.

import { encodeWav } from "@/shared/wav";
import type { Lang, SpeechToText, TextToSpeech } from "../types";

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
 * A voice made of soft tone bursts, one per word, with pauses between words and longer ones at
 * commas and full stops. Real audio with a real envelope, so the caption timing and the orb have
 * something true to follow in tests.
 */
export function createFakeTts(): TextToSpeech {
  return {
    async synthesize(text: string, _lang: Lang) {
      const rate = 16000;
      const chunks: number[] = [];
      const silence = (seconds: number) => {
        for (let i = 0; i < seconds * rate; i++) chunks.push(0);
      };
      silence(0.08);
      for (const word of text.split(/\s+/).filter(Boolean)) {
        const seconds = 0.12 + 0.045 * word.length;
        const n = Math.round(seconds * rate);
        for (let i = 0; i < n; i++) {
          const envelope = Math.sin((Math.PI * i) / n);
          chunks.push(0.25 * envelope * Math.sin((2 * Math.PI * 180 * i) / rate));
        }
        silence(/[.!?؟]$/.test(word) ? 0.28 : /[,،]$/.test(word) ? 0.16 : 0.06);
      }
      return encodeWav(Float32Array.from(chunks), rate);
    },
  };
}
