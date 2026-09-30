// When Sarjy's own voice is out (Groq's daily limit, a network error), the browser reads the
// answer instead. Browsers ship voices of very different quality, and the default is often the
// most robotic one (Turki's review, Day 2). This picks the most natural voice for the language:
//   natural   Edge's "Online (Natural)" voices, Safari's "Premium" and "Enhanced", Siri
//   good      Chrome's Google voices, other online voices
// then the usual accent (US English, Saudi Arabic), then network voices over local ones.

export type VoiceInfo = { name: string; lang: string; localService: boolean };

const NATURAL = /natural|neural|premium|enhanced|siri/i;
const GOOD = /google|online/i;

/** How good a voice is for reading in this language; below 0 means it can't. */
export function voiceScore(voice: VoiceInfo, lang: "en" | "ar"): number {
  const tag = voice.lang.toLowerCase().replace("_", "-");
  if (!tag.startsWith(lang)) return -1;
  let score = 0;
  if (NATURAL.test(voice.name)) score += 20;
  else if (GOOD.test(voice.name)) score += 10;
  if (tag === (lang === "ar" ? "ar-sa" : "en-us")) score += 4;
  else if (tag === "en-gb") score += 2;
  if (!voice.localService) score += 1;
  return score;
}

/** The best voice for the language, or null to let the browser choose. */
export function bestVoice<T extends VoiceInfo>(voices: readonly T[], lang: "en" | "ar"): T | null {
  let best: T | null = null;
  let top = -1;
  for (const voice of voices) {
    const score = voiceScore(voice, lang);
    if (score > top) {
      top = score;
      best = voice;
    }
  }
  return best;
}
