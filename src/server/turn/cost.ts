import "server-only";

// What one turn costs, in US dollars (architecture, section 18a). Shown in the details panel, and
// the basis of the cost model for 1,000 daily users in the write-up.
//
// Groq's on-demand prices, as of 30 September 2026 (per public pricing summaries; groq.com itself
// is not reachable from the build machine, so check them there before quoting):
//   gpt-oss-120b      $0.15 in, $0.60 out per million tokens
//   gpt-oss-20b       $0.075 in, $0.30 out per million tokens
//   qwen3.8-27b       not listed yet: Qwen3 32B's $0.29 in, $0.59 out is used as an estimate
//   whisper turbo     $0.04 per hour of audio
//   Orpheus voices    $22 (English) and $40 (Saudi Arabic) per million characters
//   web search        $5 (basic) to $8 (advanced) per 1,000 searches: $8 is used, to be safe

const PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "openai/gpt-oss-120b": { input: 0.15, output: 0.6 },
  "openai/gpt-oss-20b": { input: 0.075, output: 0.3 },
  "qwen/qwen3.8-27b": { input: 0.29, output: 0.59 },
};
const STT_PER_HOUR = 0.04;
/** One browser search on Groq, in dollars (the tokens it reads are counted separately). */
export const SEARCH_USD = 0.008;
const VOICE_PER_MILLION_CHARS = { en: 22, ar: 40 } as const;

export type TurnUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Seconds of your speech sent to Whisper (0 for a typed turn). */
  audioSeconds: number;
  /** Characters Sarjy voiced, per voice. */
  voiced: { en: number; ar: number };
};

/** The turn's cost in dollars; unknown models (the fakes) cost only what their voice and ears cost. */
export function turnCost(u: TurnUsage): number {
  const price = PER_MILLION_TOKENS[u.model];
  const model = price ? (u.inputTokens * price.input + u.outputTokens * price.output) / 1e6 : 0;
  const ears = (u.audioSeconds / 3600) * STT_PER_HOUR;
  const voice = (u.voiced.en * VOICE_PER_MILLION_CHARS.en + u.voiced.ar * VOICE_PER_MILLION_CHARS.ar) / 1e6;
  return model + ears + voice;
}

/** Seconds in a 16-bit mono WAV of the given size and rate (the browser records 16 kHz). */
export const wavSeconds = (bytes: number, rate = 16_000) => Math.max(0, bytes - 44) / (rate * 2);
