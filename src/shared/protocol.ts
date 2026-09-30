// The contract between the server and the browser for one turn (architecture, section 4).
// The server streams these events as newline-delimited JSON; the browser renders them.
// Every event is a zod schema, so both sides validate the same shape and a change here breaks
// the build (and the tests), not the demo.

import { z } from "zod";

export const Lang = z.enum(["en", "ar"]);

/** One remembered fact, as the browser sees it. */
export const Memory = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  value: z.string(),
  lang: Lang,
  source: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Memory = z.infer<typeof Memory>;

/** Milliseconds from the moment the server received the turn. */
export const Timings = z.object({
  sttMs: z.number().optional(),
  firstTokenMs: z.number().optional(),
  firstSentenceMs: z.number().optional(),
  firstAudioMs: z.number().optional(),
  toolMs: z.number().optional(),
  totalMs: z.number(),
  model: z.string().optional(),
  /** Tokens the model read and wrote, and what the whole turn cost in dollars (details panel). */
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  costUsd: z.number().optional(),
});
export type Timings = z.infer<typeof Timings>;

export const ErrorCode = z.enum([
  "not_understood",
  "rate_limited",
  "model_unavailable",
  "memory_unavailable",
  "bad_request",
  "internal",
]);

export const TurnEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("transcript"), text: z.string(), lang: Lang, ms: z.number() }),
  z.object({ type: z.literal("tool_start"), id: z.string(), name: z.string(), label: z.string() }),
  z.object({ type: z.literal("tool_end"), id: z.string(), ok: z.boolean(), ms: z.number() }),
  z.object({ type: z.literal("memory_saved"), memory: Memory }),
  z.object({ type: z.literal("memory_forgotten"), id: z.string(), key: z.string() }),
  z.object({
    type: z.literal("segment"),
    index: z.number(),
    text: z.string(),
    lang: Lang,
    /** Base64 WAV, or null when the browser's backup voice should speak it. */
    audio: z.string().nullable(),
  }),
  z.object({ type: z.literal("error"), code: ErrorCode, say: z.string() }),
  z.object({
    type: z.literal("done"),
    messageId: z.string(),
    conversationId: z.string(),
    text: z.string(),
    timings: Timings,
  }),
]);
export type TurnEvent = z.infer<typeof TurnEvent>;

/** Encodes one event as a line of the stream. */
export const encodeEvent = (event: TurnEvent) => `${JSON.stringify(event)}\n`;
