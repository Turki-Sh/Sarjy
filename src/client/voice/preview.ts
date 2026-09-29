// Your words, live, while you speak (architecture, section 11, "Live preview").
// The browser's own speech recognition, with interim results, in the interface language.
// Display only: Whisper's transcript is the one that counts, and replaces this when it arrives.
// Where the browser has no speech recognition (Firefox), nothing shows until the turn ends.

import type { Lang } from "@/shared/i18n";

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  abort(): void;
};

type RecognitionClass = new () => Recognition;

const Recognizer = (): RecognitionClass | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionClass;
    webkitSpeechRecognition?: RecognitionClass;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/** Starts showing live words. Returns a function that stops it. */
export function previewWords(lang: Lang, onWords: (text: string) => void): () => void {
  const Class = Recognizer();
  if (!Class) return () => {};
  const rec = new Class();
  rec.lang = lang === "ar" ? "ar-SA" : "en-US";
  rec.interimResults = true;
  rec.continuous = true;
  rec.onresult = (e) => {
    let text = "";
    for (let i = 0; i < e.results.length; i++) text += e.results[i]![0]!.transcript;
    onWords(text.trim());
  };
  // A preview that fails (no network, permission) simply stays quiet.
  rec.onerror = () => {};
  try {
    rec.start();
  } catch {
    return () => {};
  }
  return () => {
    try {
      rec.abort();
    } catch {
      // already stopped
    }
  };
}
