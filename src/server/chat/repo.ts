import "server-only";

// Conversations and their messages: recent chats in the sidebar, and the context for each turn.

import { and, desc, eq, inArray, or } from "drizzle-orm";
import type { Db } from "../db/client";
import { conversations, messages, pictures, roomMembers, rooms, type MessageRow } from "../db/schema";
import { guestConversationIds, isRoomReader, roomsOf } from "../rooms/rooms";

export type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
  /** A Majlis chat: its code, whether it is still open, and whether you opened it. */
  majlis?: { code: string; live: boolean; mine: boolean };
};

/** Recent chats, your own and the Majlis chats you joined: pinned ones first, then the newest. */
export async function listConversations(db: Db, userId: string, limit = 20): Promise<ChatSummary[]> {
  const joined = await guestConversationIds(db, userId);
  const rows = await db
    .select()
    .from(conversations)
    .where(
      joined.length
        ? or(eq(conversations.userId, userId), inArray(conversations.id, joined))
        : eq(conversations.userId, userId),
    )
    .orderBy(desc(conversations.pinned), desc(conversations.updatedAt))
    .limit(limit);
  const majlis = await roomsOf(
    db,
    rows.map((c) => c.id),
  );
  return rows.map((c) => {
    const room = majlis.get(c.id);
    return {
      id: c.id,
      title: c.title ?? "",
      updatedAt: c.updatedAt.toISOString(),
      pinned: c.userId === userId && c.pinned,
      ...(room ? { majlis: { code: room.code, live: !room.endedAt, mine: room.hostId === userId } } : {}),
    };
  });
}

/** Whether this user may read a conversation: their own, or a Majlis they joined. */
async function canRead(db: Db, userId: string, conversation: { id: string; userId: string }) {
  return conversation.userId === userId || isRoomReader(db, userId, conversation.id);
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

/**
 * A Majlis's conversation (the room already checked who may speak in it). It starts untitled;
 * the first thing said in the room names it, as in any chat.
 */
export async function roomConversation(db: Db, id: string, firstText: string) {
  const [found] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!found) throw new Error("The room's conversation is gone.");
  if (found.title) return found;
  const title = firstText.replace(/\s+/g, " ").trim().slice(0, 60);
  const [named] = await db.update(conversations).set({ title }).where(eq(conversations.id, id)).returning();
  return named!;
}

/**
 * What Sarjy said last in a chat, for the listener's context (speech to text). Only from your own
 * chat, or the Majlis you are in (`owner` null: the route has already checked membership).
 */
export async function lastReply(
  db: Db,
  conversationId: string | null,
  owner: string | null,
): Promise<string | null> {
  if (!conversationId || !/^[0-9a-f-]{36}$/i.test(conversationId)) return null;
  const [row] = await db
    .select({ text: messages.text })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.role, "assistant"),
        owner ? eq(conversations.userId, owner) : undefined,
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(1);
  return row?.text ?? null;
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

/**
 * In a Majlis: something said to everyone, not to Sarjy. Kept as a message with no answer, so the
 * chat reads right afterwards and Sarjy knows it when someone asks later.
 */
export async function saveRoomMessage(
  db: Db,
  input: {
    conversationId: string;
    speakerId: string;
    lang: "en" | "ar";
    text: string;
    picture?: { bytes: Uint8Array; mediaType: string } | null;
  },
): Promise<string> {
  const [message] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      speakerId: input.speakerId,
      role: "user",
      text: input.text,
      lang: input.lang,
    })
    .returning({ id: messages.id });
  if (input.picture) {
    await db.insert(pictures).values({
      messageId: message!.id,
      mediaType: input.picture.mediaType,
      bytes: Buffer.from(input.picture.bytes),
    });
  }
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, input.conversationId));
  return message!.id;
}

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  /** Who said it (in a Majlis, whose color it wears). Absent for Sarjy. */
  speakerId?: string;
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

/** One picture's bytes, only if it belongs to a chat this user may read. */
export async function getPicture(
  db: Db,
  userId: string,
  id: string,
): Promise<{ bytes: Buffer; mediaType: string } | null> {
  const [found] = await db
    .select({
      bytes: pictures.bytes,
      mediaType: pictures.mediaType,
      conversation: { id: conversations.id, userId: conversations.userId },
    })
    .from(pictures)
    .innerJoin(messages, eq(messages.id, pictures.messageId))
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(eq(pictures.id, id))
    .limit(1);
  if (!found || !(await canRead(db, userId, found.conversation))) return null;
  return { bytes: found.bytes, mediaType: found.mediaType };
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

/** A chat this user may read, with its messages, oldest first; null if they may not. */
export async function getConversation(
  db: Db,
  userId: string,
  id: string,
): Promise<{ id: string; title: string; messages: ChatMessage[] } | null> {
  const [found] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!found || !(await canRead(db, userId, found))) return null;
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
        ...(m.role === "user" && m.speakerId ? { speakerId: m.speakerId } : {}),
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

/**
 * Deletes one of the user's chats and its messages (shared links are copies, so they stay).
 * A Majlis you joined as a guest isn't yours to delete: it leaves your Recent instead.
 */
export async function deleteConversation(db: Db, userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .returning({ id: conversations.id });
  if (rows.length > 0) return true;
  const joined = await db.select({ roomId: rooms.id }).from(rooms).where(eq(rooms.conversationId, id));
  if (!joined.length) return false;
  const left = await db
    .delete(roomMembers)
    .where(
      and(
        eq(roomMembers.userId, userId),
        inArray(
          roomMembers.roomId,
          joined.map((r) => r.roomId),
        ),
      ),
    )
    .returning({ roomId: roomMembers.roomId });
  return left.length > 0;
}

/** The id of Sarjy's latest answer in one of the user's chats, for sharing it from the chat menu. */
export async function lastAnswerId(db: Db, userId: string, id: string): Promise<string | null> {
  const chat = await getConversation(db, userId, id);
  const answer = chat?.messages.findLast((m) => m.role === "assistant");
  return answer?.id ?? null;
}
