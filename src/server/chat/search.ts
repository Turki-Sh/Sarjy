import "server-only";

// Searching your other chats (Day 2, Turki's request: cross-chat search like Claude's). Sarjy calls
// it only when you ask about an earlier conversation. Plain word matching over your own messages:
// at one person's scale it is instant, needs no extra service, and works the same in Arabic and
// English (a word is also found with the Arabic "ال" in front of it).

import { and, desc, eq, gte, inArray, lt, ne, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db/client";
import { conversations, messages } from "../db/schema";

export const WHEN = ["any", "today", "yesterday", "this_week", "last_week", "this_month"] as const;
export type When = (typeof WHEN)[number];

/** Words too common to search for, in both languages. */
const STOP = new Set(
  (
    "the and for you your that this with what was were did about have has had are how when where who why " +
    "which there their them they then than from into our out not but can could would should just like " +
    "talk talked said told tell chat chats conversation ago last week yesterday today time " +
    "في من على عن الى إلى مع هذا هذي هذه اللي ايش وش كان كنا قلت قلتلي سالفة سوالف امس أمس اليوم"
  ).split(" "),
);

/** The words worth looking for: lower case, no punctuation, no common words, no Arabic "ال". */
export function searchWords(query: string): string[] {
  const words = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map((w) => (/^ال[؀-ۿ]{3,}/.test(w) ? w.slice(2) : w));
  return [...new Set(words)].slice(0, 6);
}

/** How far a time zone is ahead of UTC at a moment, in ms (Riyadh: 3 hours). */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(at)
      .map((x) => [x.type, Number(x.value)]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
  return (
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(at.getTime() / 1000) * 1000
  );
}

/** The start and end of a period, as instants, where the user is. */
export function periodOf(when: When, now: Date, timeZone: string): { from?: Date; to?: Date } {
  if (when === "any") return {};
  const day = 86_400_000;
  // Local midnight, as an instant: the local date at UTC midnight, moved back by the offset.
  const local = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now); // 2026-09-30
  const midnight = (date: string) => {
    const utc = new Date(`${date}T00:00:00Z`);
    return new Date(utc.getTime() - zoneOffsetMs(utc, timeZone));
  };
  const today = midnight(local);
  // Weeks start on Sunday, as in Saudi Arabia.
  const weekday = new Date(`${local}T12:00:00Z`).getUTCDay();
  const thisWeek = new Date(today.getTime() - weekday * day);
  switch (when) {
    case "today":
      return { from: today };
    case "yesterday":
      return { from: new Date(today.getTime() - day), to: today };
    case "this_week":
      return { from: thisWeek };
    case "last_week":
      return { from: new Date(thisWeek.getTime() - 7 * day), to: thisWeek };
    case "this_month":
      return { from: midnight(`${local.slice(0, 8)}01`) };
  }
}

export type Found = {
  conversationId: string;
  title: string;
  at: Date;
  lines: { role: "user" | "assistant"; text: string }[];
};

const clip = (text: string) => (text.length > 160 ? `${text.slice(0, 157)}...` : text);

/**
 * Up to five exchanges from your other chats that match the words (each with Sarjy's reply), or,
 * with no words, the latest chats in the period (their first question and last answer).
 */
export async function searchChats(
  db: Db,
  input: { userId: string; exclude: string | null; words: string[]; from?: Date; to?: Date },
): Promise<Found[]> {
  const scope: SQL[] = [eq(conversations.userId, input.userId)];
  if (input.exclude) scope.push(ne(conversations.id, input.exclude));
  const inPeriod: SQL[] = [];
  if (input.from) inPeriod.push(gte(messages.createdAt, input.from));
  if (input.to) inPeriod.push(lt(messages.createdAt, input.to));

  if (input.words.length) {
    // How many of the words a message holds: more is better, then newer.
    const hits = sql<number>`(${sql.join(
      input.words.map((w) => sql`(case when ${messages.text} ilike ${`%${w}%`} then 1 else 0 end)`),
      sql` + `,
    )})`;
    const rows = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        role: messages.role,
        text: messages.text,
        at: messages.createdAt,
        title: conversations.title,
        hits,
      })
      .from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(
        and(...scope, ...inPeriod, or(...input.words.map((w) => sql`${messages.text} ilike ${`%${w}%`}`))),
      )
      .orderBy(desc(hits), desc(messages.createdAt))
      .limit(5);
    const found: Found[] = [];
    for (const row of rows) {
      // Pair each match with the other side of its exchange (the reply, or the question before it).
      const [pair] = await db
        .select({ role: messages.role, text: messages.text })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, row.conversationId),
            row.role === "user" ? gte(messages.createdAt, row.at) : lt(messages.createdAt, row.at),
            ne(messages.id, row.id),
          ),
        )
        .orderBy(row.role === "user" ? messages.createdAt : desc(messages.createdAt))
        .limit(1);
      const self = { role: row.role as "user" | "assistant", text: clip(row.text) };
      const other = pair ? { role: pair.role as "user" | "assistant", text: clip(pair.text) } : null;
      found.push({
        conversationId: row.conversationId,
        title: row.title ?? "",
        at: row.at,
        lines: other ? (row.role === "user" ? [self, other] : [other, self]) : [self],
      });
    }
    return found;
  }

  // No words: the latest chats in the period.
  const chats = await db
    .select({ id: conversations.id, title: conversations.title, at: conversations.updatedAt })
    .from(conversations)
    .where(
      and(
        ...scope,
        ...(input.from ? [gte(conversations.updatedAt, input.from)] : []),
        ...(input.to ? [lt(conversations.updatedAt, input.to)] : []),
      ),
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(5);
  if (!chats.length) return [];
  const all = await db
    .select({
      conversationId: messages.conversationId,
      role: messages.role,
      text: messages.text,
      at: messages.createdAt,
    })
    .from(messages)
    .where(
      inArray(
        messages.conversationId,
        chats.map((c) => c.id),
      ),
    )
    .orderBy(messages.createdAt);
  return chats.map((c) => {
    const lines = all.filter((m) => m.conversationId === c.id);
    const first = lines.find((m) => m.role === "user");
    const last = lines.findLast((m) => m.role === "assistant");
    return {
      conversationId: c.id,
      title: c.title ?? "",
      at: c.at,
      lines: [first, last]
        .filter((m): m is NonNullable<typeof m> => !!m)
        .map((m) => ({ role: m.role as "user" | "assistant", text: clip(m.text) })),
    };
  });
}
