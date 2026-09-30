import "server-only";

// The live providers, all on Groq with one key (architecture, section 8):
//   speech to text  whisper-large-v3-turbo
//   the model       openai/gpt-oss-120b, falling back to qwen/qwen3.8-27b, then openai/gpt-oss-20b
//   the voice       Orpheus: English, and a native Saudi Arabic voice
// Whisper and Orpheus are two plain HTTP calls; the model goes through the AI SDK.

import { createGroq } from "@ai-sdk/groq";
import { DEFAULT_VOICE } from "@/shared/voices";
import { fixWavHeader } from "@/shared/wav";
import type { Lang, Providers, SpeechToText, TextToSpeech } from "../types";

const API = "https://api.groq.com/openai/v1";

export const GROQ_MODELS = {
  stt: "whisper-large-v3-turbo",
  main: "openai/gpt-oss-120b",
  fallback: "qwen/qwen3.8-27b",
  reserve: "openai/gpt-oss-20b",
  voice: { en: "canopylabs/orpheus-v1-english", ar: "canopylabs/orpheus-arabic-saudi" },
} as const;

/** Default voices: calm and mid-pitched, per the brand book. Each person can choose in Settings, Voice. */
export const DEFAULT_VOICES: Record<Lang, string> = DEFAULT_VOICE;

// A short sample of what people say to Sarjy, in both languages. Whisper reads it as "the
// conversation so far" and leans towards its words and spelling. Without it, short Saudi phrases
// come back garbled ("وشلوني المفبر" for "وش لوني المفضل؟"); with it, they come back right, and
// English is still detected as English.
const STT_PROMPT = "Sarjy, سرجي. هلا، وش لوني المفضل؟ كيف الجو بكرة بالرياض؟ What's the weather tomorrow?";

/**
 * The language you spoke, from the letters Whisper wrote down. Whisper also names a language, but
 * that label can say "arabic" for English spoken with a Saudi accent, and then Sarjy would answer
 * English in Arabic. The transcript's own script is the better witness; the label only breaks a tie.
 */
export function spokenLang(text: string, label: string | undefined, hint: Lang): Lang {
  const arabic = text.match(/[\u0600-\u06ff]/g)?.length ?? 0;
  const latin = text.match(/[a-z]/gi)?.length ?? 0;
  if (arabic > latin) return "ar";
  if (latin > arabic) return "en";
  if (label) return label.toLowerCase().startsWith("ar") ? "ar" : "en";
  return hint;
}

function groqStt(apiKey: string): SpeechToText {
  return {
    async transcribe(audio, hint) {
      const form = new FormData();
      form.append("file", audio, "turn.wav");
      form.append("model", GROQ_MODELS.stt);
      form.append("response_format", "verbose_json");
      form.append("temperature", "0");
      form.append("prompt", STT_PROMPT);
      const res = await fetch(`${API}/audio/transcriptions`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Groq speech to text failed: ${res.status}`);
      const data = (await res.json()) as { text: string; language?: string };
      const text = data.text.trim();
      return { text, lang: spokenLang(text, data.language, hint) };
    },
  };
}

function groqTts(apiKey: string, voices: Record<Lang, string>): TextToSpeech {
  return {
    async synthesize(text, lang) {
      try {
        const res = await fetch(`${API}/audio/speech`, {
          method: "POST",
          headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
          body: JSON.stringify({
            model: GROQ_MODELS.voice[lang],
            voice: voices[lang],
            input: text,
            response_format: "wav",
          }),
          signal: AbortSignal.timeout(12_000),
        });
        // Out of voice quota (429) or any failure: the browser's backup voice speaks instead.
        if (!res.ok) return null;
        return fixWavHeader(await res.arrayBuffer());
      } catch {
        return null;
      }
    },
  };
}

export function createGroqProviders(
  apiKey: string,
  voices: Record<Lang, string> = DEFAULT_VOICES,
): Providers {
  const groq = createGroq({ apiKey });
  return {
    stt: groqStt(apiKey),
    tts: groqTts(apiKey, voices),
    models: [GROQ_MODELS.main, GROQ_MODELS.fallback, GROQ_MODELS.reserve].map((id) => ({
      id,
      model: groq(id),
      // Of the three, only Qwen reads pictures (checked on Day 2).
      vision: id === GROQ_MODELS.fallback,
    })),
    fetch: (url, init) => fetch(url, init),
  };
}
