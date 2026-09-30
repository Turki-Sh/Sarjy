import "server-only";

// search_chats, as a model tool: Sarjy looks through your other chats when you ask about one
// ("what was that game we talked about?", "what did we talk about yesterday?").

import { tool } from "ai";
import { z } from "zod";
import type { Db } from "../db/client";
import { periodOf, searchChats, searchWords, WHEN } from "../chat/search";
import { toldWhen } from "../turn/prompt";

export function chatSearchTool(ctx: {
  db: Db;
  userId: string;
  /** The chat on screen: its lines are already in view, so it is not searched. */
  conversationId: string | null;
  now: Date;
  timeZone: string;
  onStart: (label: string) => string;
  onEnd: (id: string, ok: boolean) => void;
}) {
  return tool({
    description:
      "Look through the user's other chats with you. Use it only when they ask about an earlier conversation, " +
      "or something you talked about before that is not in this chat or in memory.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "A few words that would appear in that conversation, in the language it was likely said. Empty to list chats from a period.",
        ),
      when: z.enum(WHEN).describe("When it was, if they said. Otherwise any."),
    }),
    execute: async ({ query, when }) => {
      const id = ctx.onStart(
        `chats.search(${JSON.stringify(query.slice(0, 40))}${when !== "any" ? `, ${when}` : ""})`,
      );
      const scope = {
        userId: ctx.userId,
        exclude: ctx.conversationId,
        ...periodOf(when, ctx.now, ctx.timeZone),
      };
      let found = await searchChats(ctx.db, { ...scope, words: searchWords(query) });
      // Words can't connect "that game" to "Elden Ring": with no match, the latest chats in the
      // period come back instead, and the model judges which one they mean.
      const matched = found.length > 0;
      if (!matched) found = await searchChats(ctx.db, { ...scope, words: [] });
      ctx.onEnd(id, true);
      if (!found.length) return { found: 0, note: "Nothing there. Say so plainly; don't guess." };
      return {
        found: found.length,
        note: matched
          ? undefined
          : "No chat used those words. These are the latest ones; answer only if one is clearly what they mean, otherwise say you couldn't find it.",
        chats: found.map((f) => ({
          title: f.title,
          when: toldWhen(f.at, ctx.now, ctx.timeZone),
          lines: f.lines.map((l) => `${l.role === "user" ? "User" : "You"}: ${l.text}`),
        })),
      };
    },
  });
}
