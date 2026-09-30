import "server-only";

// The memory rules enforced in code, not just asked for in a prompt (architecture, section 6):
//   - secrets are refused (passwords, card and ID numbers), whatever a model decides
//   - forgetting, as a tool of the answering model

import { tool } from "ai";
import { z } from "zod";
import type { Db } from "../db/client";
import { deleteMemoryByKey, normalizeKey } from "../memory/repo";

const SECRET_WORDS =
  /pass(word|code|phrase)?|pin\b|otp|cvv|iban|card|credit|national.?id|iqama|passport|ssn|secret|token|api.?key|كلمة.?(السر|المرور)|رقم.?(البطاقة|الهوية|الإقامة|الجواز)|الرقم.?السري/i;
const LONG_NUMBER = /\d[\d\s-]{7,}\d/;

/** True when something looks like a secret Sarjy must not keep. */
export function looksSecret(parts: string[]): boolean {
  const text = parts.join(" ");
  return SECRET_WORDS.test(text) || LONG_NUMBER.test(text);
}

/**
 * forget, as a model tool. Remembering is not a tool any more (Day 2): the memory writer
 * (server/memory/writer.ts) decides what to keep after each turn. Forgetting stays with the
 * answering model, because "Forgotten." has to be said in the same breath.
 */
export function forgetTool(ctx: {
  db: Db;
  userId: string;
  onForgotten: (id: string, key: string) => void;
  onStart: (label: string) => string;
  onEnd: (id: string, ok: boolean) => void;
}) {
  return tool({
    description:
      "Delete something you remember when the user asks you to forget it, by its key from the memory block. Then confirm out loud.",
    inputSchema: z.object({ key: z.string().describe("The key of the memory to forget, e.g. home_city") }),
    execute: async ({ key }) => {
      const id = ctx.onStart(`memory.forget(key: "${normalizeKey(key)}")`);
      const gone = await deleteMemoryByKey(ctx.db, ctx.userId, key);
      ctx.onEnd(id, Boolean(gone));
      if (gone) ctx.onForgotten(gone.id, gone.key);
      return gone ? { forgotten: true, key: gone.key } : { forgotten: false, reason: "not_found" as const };
    },
  });
}
