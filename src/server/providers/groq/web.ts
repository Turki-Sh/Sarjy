import "server-only";

// Web search on Groq (Day 2, Turki's call: "an extra second is better than a no"). A small model
// with Groq's built-in browser_search looks the question up and answers in a few plain sentences;
// Sarjy's answering model then speaks from that. Called directly (not through the AI SDK) because
// the search runs on Groq's side, and only the raw reply says which sites it read.
//
// The searcher is told today's date and the user's time zone: without them it reported a match
// from February 2025 as "the most recent" in September 2026.

import { dayPart, gregorianDate, localTime } from "@/shared/hijri";
import type { WebAnswer, WebSearch } from "../types";

const API = "https://api.groq.com/openai/v1/chat/completions";
/** Small and quick first; the large one if it fails. Both have browser_search on Groq. */
const SEARCHERS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"] as const;

function instructions(now: Date, timeZone: string): string {
  return [
    "You look things up on the web for Sarjy, a voice assistant, and report back to it.",
    `Now: ${gregorianDate(now, "en", timeZone)}, ${localTime(now, timeZone)} (${timeZone}), the ${dayPart(now, timeZone)}.`,
    "Always search before answering. Prefer recent, reliable sources, and check the dates of what you find against Now: say plainly if the newest thing you found is old.",
    // Always English: most sources are, and the small searcher garbled names writing Arabic
    // ("الغرفة" for Al Gharafa). Sarjy's answering model puts it into the user's language.
    "Reply in English with just the answer: two to four plain sentences with the key facts, names, numbers and dates. No markdown, no links, no lists.",
    "If the sources disagree, or don't answer the question, say so.",
  ].join("\n");
}

type Executed = { type?: string; output?: string };
type Reply = {
  choices?: { message?: { content?: string; executed_tools?: Executed[] } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

/** The answer as Sarjy may say it: gpt-oss-120b leaves citation marks in ("【1†L2-L7】"). */
export const cleanAnswer = (text: string) =>
  text
    .replace(/【[^】]*】/g, "")
    .replace(/\s+([.,])/g, "$1")
    .trim();

/** The sites a search read, from the result text it saw: up to three domains. */
export function sourcesOf(executed: Executed[]): string[] {
  const domains = executed
    .flatMap((t) => [...(t.output ?? "").matchAll(/https?:\/\/(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/gi)])
    .map((m) => m[1]!.toLowerCase());
  return [...new Set(domains)].slice(0, 3);
}

export function groqWeb(apiKey: string): WebSearch {
  return {
    async search(question, { now, timeZone, signal }): Promise<WebAnswer | null> {
      for (const model of SEARCHERS) {
        try {
          const res = await fetch(API, {
            method: "POST",
            headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: instructions(now, timeZone) },
                { role: "user", content: question },
              ],
              tools: [{ type: "browser_search" }],
              reasoning_effort: "low",
            }),
            signal: signal
              ? AbortSignal.any([signal, AbortSignal.timeout(15_000)])
              : AbortSignal.timeout(15_000),
          });
          if (!res.ok) continue;
          const data = (await res.json()) as Reply;
          const message = data.choices?.[0]?.message;
          const answer = message?.content ? cleanAnswer(message.content) : "";
          if (!answer) continue;
          const executed = message?.executed_tools ?? [];
          return {
            answer,
            sources: sourcesOf(executed),
            model,
            inputTokens: data.usage?.prompt_tokens ?? 0,
            outputTokens: data.usage?.completion_tokens ?? 0,
            searches: executed.filter((t) => t.type === "browser_search").length,
          };
        } catch {
          if (signal?.aborted) return null;
        }
      }
      return null;
    },
  };
}
