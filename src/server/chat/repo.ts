import "server-only";

// Conversations and their messages: recent chats in the sidebar, and the context for each turn.

import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/client";
import { conversations, messages, pictures, type MessageRow } from "../db/schema";

export type ChatSummary = { id: string; title: string; updatedAt: string; pinned: boolean };

/** Recent chats: pinned ones first, then the newest. */
export async function listConversations(db: Db, userId: string, limit = 20): Promise<ChatSummary[]> {
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.pinned), desc(conversations.updatedAt))
    .limit(limit);
  return rows.map((c) => ({
    id: c.id,
    title: c.title ?? "",
    updatedAt: c.updatedAt.toISOString(),
    pinned: c.pinned,
  }));
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
    /** The picture sent with the question, kept with it. */
    picture?: { bytes: Uint8Array; mediaType: string } | null;
  },
): Promise<string> {
  const now = Date.now();
  const [question, assistant] = await db
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
  if (input.picture) {
    await db.insert(pictures).values({
      messageId: question!.id,
      mediaType: input.picture.mediaType,
      bytes: Buffer.from(input.picture.bytes),
    });
  }
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, input.conversationId));
  return assistant!.id;
}

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  lang: "en" | "ar";
  createdAt: string;
  /** Where to fetch the picture sent with this message, if there was one. */
  image?: string;
};

/** Which of these messages came with a picture: message id to picture id (no bytes loaded). */
export async function picturesOf(db: Db, messageIds: string[]): Promise<Map<string, string>> {
  if (!messageIds.length) return new Map();
  const rows = await db
    .select({ id: pictures.id, messageId: pictures.messageId })
    .from(pictures)
    .where(inArray(pictures.messageId, messageIds));
  return new Map(rows.map((r) => [r.messageId, r.id]));
}

/** One picture's bytes, only if it belongs to one of this user's chats. */
export async function getPicture(
  db: Db,
  userId: string,
  id: string,
): Promise<{ bytes: Buffer; mediaType: string } | null> {
  const [found] = await db
    .select({ bytes: pictures.bytes, mediaType: pictures.mediaType })
    .from(pictures)
    .innerJoin(messages, eq(messages.id, pictures.messageId))
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(and(eq(pictures.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return found ?? null;
}

/** A picture's bytes by id, for the model's context (the caller already owns the chat). */
export async function pictureBytes(db: Db, id: string): Promise<{ bytes: Buffer; mediaType: string } | null> {
  const [found] = await db
    .select({ bytes: pictures.bytes, mediaType: pictures.mediaType })
    .from(pictures)
    .where(eq(pictures.id, id))
    .limit(1);
  return found ?? null;
}

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
  const withPicture = await picturesOf(
    db,
    rows.filter((m) => m.role === "user").map((m) => m.id),
  );
  return {
    id: found.id,
    title: found.title ?? "",
    messages: rows.map((m) => {
      const picture = withPicture.get(m.id);
      return {
        id: m.id,
        role: m.role as "user" | "assistant",
        text: m.text,
        lang: m.lang as "en" | "ar",
        createdAt: m.createdAt.toISOString(),
        ...(picture ? { image: `/api/pictures/${picture}` } : {}),
      };
    }),
  };
}

/** Renames or pins one of the user's chats. Returns false if it is not theirs. */
export async function updateConversation(
  db: Db,
  userId: string,
  id: string,
  change: { title?: string; pinned?: boolean },
): Promise<boolean> {
  const rows = await db
    .update(conversations)
    .set(change)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .returning({ id: conversations.id });
  return rows.length > 0;
}

/** Deletes one of the user's chats and its messages (shared links are copies, so they stay). */
export async function deleteConversation(db: Db, userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .returning({ id: conversations.id });
  return rows.length > 0;
}

/** The id of Sarjy's latest answer in one of the user's chats, for sharing it from the chat menu. */
export async function lastAnswerId(db: Db, userId: string, id: string): Promise<string | null> {
  const chat = await getConversation(db, userId, id);
  const answer = chat?.messages.findLast((m) => m.role === "assistant");
  return answer?.id ?? null;
}
