import "server-only";

// The live providers, all on Groq with one key (architecture, section 8):
//   speech to text  whisper-large-v3, falling back to whisper-large-v3-turbo
//   the model       openai/gpt-oss-120b, falling back to openai/gpt-oss-20b, then qwen/qwen3.8-27b
//   the voice       Orpheus: English, and a native Saudi Arabic voice
//   picture guard   qwen/qwen3.8-27b, the one model here that sees, with a strict policy
// Whisper and Orpheus are two plain HTTP calls; the model goes through the AI SDK.

import { createGroq } from "@ai-sdk/groq";
import { DEFAULT_VOICE } from "@/shared/voices";
import { fixWavHeader } from "@/shared/wav";
import type { Lang, Providers, SpeechToText, TextToSpeech } from "../types";
import { groqGuard } from "./guard";
import { groqWeb } from "./web";

const API = "https://api.groq.com/openai/v1";

export const GROQ_MODELS = {
  // The full model first: far fewer mistakes in Saudi Arabic than turbo (Turki, Day 5: "STT makes
  // a lot of mistakes"), for a fraction of a cent more per turn. Turbo takes over if it fails;
  // each has its own quota on Groq.
  stt: ["whisper-large-v3", "whisper-large-v3-turbo"],
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
 * Whisper's prompt for one turn: the sample above, then what this turn is about (your name, your
 * city, what Sarjy just said). Whisper reads it as the conversation so far, so an answer to Sarjy's
 * question ("اسمي تركي" after "وش اسمك؟") and the names you use come back right. Whisper reads only
 * the last 224 tokens of a prompt, so the context is kept short and goes last.
 */
export function sttPrompt(context?: string): string {
  const tail = context?.replace(/\s+/g, " ").trim().slice(-240);
  return tail ? `${STT_PROMPT} ${tail}` : STT_PROMPT;
}

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

/**
 * Whisper's full model sometimes writes a sentence twice ("What is my favorite food? What is my
 * favorite food?", heard live on Day 5). A sentence repeated straight after itself is kept once.
 */
export function withoutRepeats(text: string): string {
  const sentences = text.match(/[^.!?؟…]+[.!?؟…]*\s*/g) ?? [text];
  const kept: string[] = [];
  for (const s of sentences) {
    const same = (a: string | undefined) => a?.trim().toLowerCase() === s.trim().toLowerCase();
    if (!same(kept.at(-1))) kept.push(s);
  }
  return kept.join("").trim();
}

type Segment = { avg_logprob?: number; no_speech_prob?: number };

/**
 * Whisper's own doubt about what it heard. On near silence it can write a short phrase nobody
 * said ("It's on."); its segments then carry a high "no speech" probability or a low average
 * log probability. The words are still answered, but nothing is remembered from them.
 */
export function unsureOf(segments: Segment[] | undefined): boolean {
  if (!segments?.length) return false;
  const mean = (pick: (s: Segment) => number | undefined) =>
    segments.reduce((sum, s) => sum + (pick(s) ?? 0), 0) / segments.length;
  return mean((s) => s.no_speech_prob) > 0.5 || mean((s) => s.avg_logprob) < -1;
}

function groqStt(apiKey: string): SpeechToText {
  const once = async (model: string, audio: Blob, prompt: string) => {
    const form = new FormData();
    form.append("file", audio, "turn.wav");
    form.append("model", model);
    form.append("response_format", "verbose_json");
    form.append("temperature", "0");
    form.append("prompt", prompt);
    const res = await fetch(`${API}/audio/transcriptions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Groq speech to text (${model}) failed: ${res.status}`);
    return (await res.json()) as { text: string; language?: string; segments?: Segment[] };
  };
  return {
    async transcribe(audio, hint, context) {
      const prompt = sttPrompt(context);
      const [best, backup] = GROQ_MODELS.stt;
      const data = await once(best, audio, prompt).catch(() => once(backup, audio, prompt));
      const text = withoutRepeats(data.text.trim());
      return { text, lang: spokenLang(text, data.language, hint), unsure: unsureOf(data.segments) };
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
    // The smaller gpt-oss before Qwen: measured on Day 5, its Saudi Arabic stays clean where Qwen's
    // drifts into English fillers and garbled words. Qwen stays in the chain for pictures.
    models: [GROQ_MODELS.main, GROQ_MODELS.reserve, GROQ_MODELS.fallback].map((id) => ({
      id,
      model: groq(id),
      // Of the three, only Qwen reads pictures (checked on Day 2).
      vision: id === GROQ_MODELS.fallback,
    })),
    // The small model first: deciding what to remember is a short, structured job, and it has its
    // own per-minute quota, so it never takes tokens from the answer.
    writer: [GROQ_MODELS.reserve, GROQ_MODELS.main].map((id) => ({ id, model: groq(id) })),
    web: groqWeb(apiKey),
    guard: groqGuard(groq(GROQ_MODELS.fallback), GROQ_MODELS.fallback),
    fetch: (url, init) => fetch(url, init),
  };
}
