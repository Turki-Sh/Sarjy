import "server-only";

// remember and forget, as model tools (architecture, sections 6 and 9).
// The rules the brand promises are enforced here, in code, not just asked for in the prompt:
//   - secrets are refused (passwords, card and ID numbers), whatever the model decides
//   - every write streams a memory event, so the screen shows it (no quiet saves)

import { tool } from "ai";
import { z } from "zod";
import type { Memory } from "@/shared/protocol";
import type { Db } from "../db/client";
import { deleteMemoryByKey, normalizeKey, upsertMemory } from "../memory/repo";
import type { Lang } from "../providers/types";

const SECRET_WORDS =
  /pass(word|code|phrase)?|pin\b|otp|cvv|iban|card|credit|national.?id|iqama|passport|ssn|secret|token|api.?key|كلمة.?(السر|المرور)|رقم.?(البطاقة|الهوية|الإقامة|الجواز)|الرقم.?السري/i;
const LONG_NUMBER = /\d[\d\s-]{7,}\d/;

/** True when something looks like a secret Sarjy must not keep. */
export function looksSecret(parts: string[]): boolean {
  const text = parts.join(" ");
  return SECRET_WORDS.test(text) || LONG_NUMBER.test(text);
}

export function memoryTools(ctx: {
  db: Db;
  userId: string;
  lang: Lang;
  /** The user's words this turn, kept on the card as the memory's source. */
  source: string;
  onSaved: (memory: Memory) => void;
  onForgotten: (id: string, key: string) => void;
  onStart: (label: string) => string;
  onEnd: (id: string, ok: boolean) => void;
}) {
  return {
    remember: tool({
      description:
        "Save a fact or preference the user just stated about themselves, so it is remembered in future chats. " +
        "Only what they said, never a guess. Saving the same key again replaces it. Then confirm in their words.",
      inputSchema: z.object({
        key: z.string().describe("Stable English snake_case id, e.g. favorite_color, home_city, units, name"),
        label: z
          .string()
          .describe("Short human label in the user's language, e.g. 'Favorite color' or 'اللون المفضل'"),
        value: z.string().describe("The value, short, in the user's language, e.g. 'Green'"),
      }),
      execute: async ({ key, label, value }) => {
        const id = ctx.onStart(`memory.write(key: "${normalizeKey(key)}")`);
        if (looksSecret([key, label, value])) {
          ctx.onEnd(id, false);
          return { saved: false, reason: "secret_not_stored" as const };
        }
        const memory = await upsertMemory(ctx.db, ctx.userId, {
          key,
          label,
          value,
          source: ctx.source,
          lang: ctx.lang,
        });
        ctx.onEnd(id, true);
        ctx.onSaved(memory);
        return { saved: true, key: memory.key, label: memory.label, value: memory.value };
      },
    }),

    forget: tool({
      description: "Delete a saved memory when the user asks you to forget it. Then confirm out loud.",
      inputSchema: z.object({ key: z.string().describe("The key of the memory to forget, e.g. home_city") }),
      execute: async ({ key }) => {
        const id = ctx.onStart(`memory.forget(key: "${normalizeKey(key)}")`);
        const gone = await deleteMemoryByKey(ctx.db, ctx.userId, key);
        ctx.onEnd(id, Boolean(gone));
        if (gone) ctx.onForgotten(gone.id, gone.key);
        return gone ? { forgotten: true, key: gone.key } : { forgotten: false, reason: "not_found" as const };
      },
    }),
  };
}
