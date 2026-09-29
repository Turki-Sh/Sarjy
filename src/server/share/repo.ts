import "server-only";

// Shared moments: one exchange, copied when the user presses Share, readable by anyone with the link.

import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, lt } from "drizzle-orm";
import type { CardKind } from "@/shared/og";
import type { Db } from "../db/client";
import { conversations, messages, shares, type ShareRow } from "../db/schema";

/** A short, unguessable code (about 60 bits), without look-alike characters. */
export function newCode(): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  return Array.from(randomBytes(12), (b) => alphabet[b % alphabet.length]).join("");
}

/** What a moment was about, from what happened in it. Picks the link-preview card. */
export function classifyMoment(input: {
  tools: { name: string; label: string }[];
  answer: string;
}): CardKind {
  const names = input.tools.map((t) => t.name);
  if (names.includes("weather.forecast")) {
    return input.tools.some((t) => t.label.includes('"tomorrow"')) ? "weather_tomorrow" : "weather";
  }
  if (names.includes("memory.write")) return "saved";
  if (/you told me|قلت لي/i.test(input.answer)) return "recall";
  return "chat";
}

/** Shares Sarjy's answer `messageId` with the question before it. Only the owner can share. */
export async function createShare(db: Db, userId: string, messageId: string): Promise<ShareRow | null> {
  const [answer] = await db
    .select({ message: messages, ownerId: conversations.userId })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(eq(messages.id, messageId), eq(conversations.userId, userId), eq(messages.role, "assistant")))
    .limit(1);
  if (!answer) return null;

  const [question] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, answer.message.conversationId),
        eq(messages.role, "user"),
        lt(messages.createdAt, answer.message.createdAt),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(1);
  if (!question) return null;

  const tools = answer.message.tools ?? [];
  const [row] = await db
    .insert(shares)
    .values({
      code: newCode(),
      userId,
      kind: classifyMoment({ tools, answer: answer.message.text }),
      lang: answer.message.lang,
      question: question.text,
      answer: answer.message.text,
      toolLabel: tools[0]?.label ?? null,
    })
    .returning();
  return row!;
}

export async function getShare(db: Db, code: string): Promise<ShareRow | null> {
  if (!/^[a-z0-9]{8,16}$/.test(code)) return null;
  const [row] = await db.select().from(shares).where(eq(shares.code, code)).limit(1);
  return row ?? null;
}

/** For tests and admin: a user's shares, oldest first. */
export async function listShares(db: Db, userId: string) {
  return db.select().from(shares).where(eq(shares.userId, userId)).orderBy(asc(shares.createdAt));
}
