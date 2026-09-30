import "server-only";

// search_web, as a model tool (Day 2, Turki's call): Sarjy looks things up instead of saying it
// can't. The search itself runs behind the WebSearch interface (Groq's browser search live, a
// stand-in in tests); this tool gives it a chip with live timing, like the weather.

import { tool } from "ai";
import { z } from "zod";
import type { Lang, WebAnswer, WebSearch } from "../providers/types";

export function webSearchTool(ctx: {
  web: WebSearch;
  now: Date;
  timeZone: string;
  lang: Lang;
  signal?: AbortSignal;
  /** Each search's usage, for the turn's cost. */
  onUsage: (answer: WebAnswer) => void;
  /** A search is starting: it takes a few seconds, so Sarjy says it's checking. */
  onSearching: () => void;
  onStart: (label: string) => string;
  onEnd: (id: string, ok: boolean) => void;
}) {
  return tool({
    description:
      "Look something up on the web: news, sports results, prices, opening hours, people, places, events, " +
      "or any fact that may have changed or that you are not sure of. Not for the weather (use get_weather).",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The full question to look up, with any place, date or name it needs, e.g. 'Al Hilal latest match result'",
        ),
    }),
    execute: async ({ query }) => {
      const id = ctx.onStart(`web.search(${JSON.stringify(query.slice(0, 60))})`);
      ctx.onSearching();
      const found = await ctx.web.search(query, {
        now: ctx.now,
        timeZone: ctx.timeZone,
        lang: ctx.lang,
        signal: ctx.signal,
      });
      ctx.onEnd(id, Boolean(found));
      if (!found) return { error: "search_unavailable" as const };
      ctx.onUsage(found);
      return { answer: found.answer, sources: found.sources };
    },
  });
}
