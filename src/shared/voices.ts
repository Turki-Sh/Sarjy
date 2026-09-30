// Sarjy's voices: Groq's Orpheus voices, six for English and six native Saudi Arabic ones
// (the lists Groq itself reports, checked on Day 2). One per language, chosen in Settings, Voice.
// Consistency matters (brand book, section 6): your voice stays yours across sessions.

import type { Lang } from "./i18n";

export const VOICES = {
  en: ["troy", "austin", "daniel", "autumn", "diana", "hannah"],
  ar: ["abdullah", "fahad", "sultan", "noura", "lulwa", "aisha"],
} as const satisfies Record<Lang, readonly string[]>;

/** Calm and mid-pitched, per the brand book. */
export const DEFAULT_VOICE: Record<Lang, string> = { en: "troy", ar: "abdullah" };

export const isVoice = (lang: Lang, id: unknown): id is string =>
  (VOICES[lang] as readonly string[]).includes(id as string);

/** The saved voice for a language, or the default. */
export const voiceFor = (lang: Lang, saved: string | null | undefined) =>
  isVoice(lang, saved) ? saved : DEFAULT_VOICE[lang];

/** How each voice's name is written in each interface language. */
export const VOICE_NAMES: Record<string, { en: string; ar: string }> = {
  troy: { en: "Troy", ar: "تروي" },
  austin: { en: "Austin", ar: "أوستن" },
  daniel: { en: "Daniel", ar: "دانيال" },
  autumn: { en: "Autumn", ar: "أوتم" },
  diana: { en: "Diana", ar: "ديانا" },
  hannah: { en: "Hannah", ar: "هانا" },
  abdullah: { en: "Abdullah", ar: "عبدالله" },
  fahad: { en: "Fahad", ar: "فهد" },
  sultan: { en: "Sultan", ar: "سلطان" },
  noura: { en: "Noura", ar: "نورة" },
  lulwa: { en: "Lulwa", ar: "لولوة" },
  aisha: { en: "Aisha", ar: "عائشة" },
};

/** What a voice says when you preview it. */
export const PREVIEW_LINE: Record<Lang, string> = {
  en: "Hey, I'm Sarjy. This is how I'd sound.",
  ar: "هلا، أنا سرجي. هذا صوتي لو اخترته.",
};
