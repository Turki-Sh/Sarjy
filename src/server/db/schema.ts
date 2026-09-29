// The database tables (architecture, section 17). Deleting a user cascades to everything they own,
// which is how "Forget everything" really forgets.

import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  uiLang: text("ui_lang").notNull().default("en"),
  voiceEn: text("voice_en"),
  voiceAr: text("voice_ar"),
  /** The first-visit flow: name, home_city, units, done (architecture, section 14). */
  onboardingStep: text("onboarding_step").notNull().default("name"),
  createdAt,
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One remembered fact or preference. (user_id, key) is unique, so saving again updates it. */
export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    /** The user's own words when they said it, shown on the card. */
    source: text("source"),
    lang: text("lang").notNull().default("en"),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("memories_user_key").on(t.userId, t.key)],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    createdAt,
    updatedAt,
  },
  (t) => [index("conversations_user_updated").on(t.userId, t.updatedAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    /** Who spoke (matters in rooms). Null for Sarjy. */
    speakerId: uuid("speaker_id").references(() => users.id, { onDelete: "set null" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    text: text("text").notNull(),
    lang: text("lang").notNull().default("en"),
    tools: jsonb("tools").$type<{ name: string; label: string; ok: boolean; ms: number }[]>(),
    timings: jsonb("timings").$type<Record<string, number | string>>(),
    createdAt,
  },
  (t) => [index("messages_conversation_created").on(t.conversationId, t.createdAt)],
);

/** Fixed-window counters for rate limits: key is e.g. "user:<id>:minute" or "ip:<hash>:day". */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type MemoryRow = typeof memories.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
