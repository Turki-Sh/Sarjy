import "server-only";

// Conversations and their messages: recent chats in the sidebar, and the context for each turn.

import { and, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { conversations, messages, type MessageRow } from "../db/schema";

export type ChatSummary = { id: string; title: string; updatedAt: string };

export async function listConversations(db: Db, userId: string, limit = 12): Promise<ChatSummary[]> {
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
  return rows.map((c) => ({ id: c.id, title: c.title ?? "", updatedAt: c.updatedAt.toISOString() }));
}

/** The conversation to continue: the given one if it is this user's, otherwise a new one. */
export async function openConversation(db: Db, userId: string, id: string | null, firstText: string) {
  if (id) {
    const [found] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .limit(1);
    if (found) return found;
  }
  const title = firstText.replace(/\s+/g, " ").trim().slice(0, 60);
  const [created] = await db.insert(conversations).values({ userId, title }).returning();
  return created!;
}

/** The last few messages, oldest first, for the model's context. */
export async function recentMessages(db: Db, conversationId: string, limit = 12): Promise<MessageRow[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

export async function saveTurn(
  db: Db,
  input: {
    conversationId: string;
    speakerId: string;
    lang: "en" | "ar";
    userText: string;
    assistantText: string;
    tools: { name: string; label: string; ok: boolean; ms: number }[];
    timings: Record<string, number | string>;
  },
): Promise<string> {
  const now = Date.now();
  const [, assistant] = await db
    .insert(messages)
    .values([
      {
        conversationId: input.conversationId,
        speakerId: input.speakerId,
        role: "user",
        text: input.userText,
        lang: input.lang,
        createdAt: new Date(now),
      },
      {
        conversationId: input.conversationId,
        role: "assistant",
        text: input.assistantText,
        lang: input.lang,
        tools: input.tools,
        timings: input.timings,
        createdAt: new Date(now + 1),
      },
    ])
    .returning({ id: messages.id });
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, input.conversationId));
  return assistant!.id;
}
