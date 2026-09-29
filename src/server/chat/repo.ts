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
  // Only a real id is looked up; anything else (a stale or tampered value) starts a new chat.
  if (id && /^[0-9a-f-]{36}$/i.test(id)) {
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

export type ChatMessage = { role: "user" | "assistant"; text: string; lang: "en" | "ar"; createdAt: string };

/** One of the user's chats with its messages, oldest first; null if it is not theirs. */
export async function getConversation(
  db: Db,
  userId: string,
  id: string,
): Promise<{ id: string; title: string; messages: ChatMessage[] } | null> {
  const [found] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  if (!found) return null;
  const rows = await recentMessages(db, id, 40);
  return {
    id: found.id,
    title: found.title ?? "",
    messages: rows.map((m) => ({
      role: m.role as "user" | "assistant",
      text: m.text,
      lang: m.lang as "en" | "ar",
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

/** Renames one of the user's chats. Returns false if it is not theirs. */
export async function renameConversation(
  db: Db,
  userId: string,
  id: string,
  title: string,
): Promise<boolean> {
  const rows = await db
    .update(conversations)
    .set({ title })
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .returning({ id: conversations.id });
  return rows.length > 0;
}
