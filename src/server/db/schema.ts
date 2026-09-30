// The database tables (architecture, section 17). Deleting a user cascades to everything they own,
// which is how "Forget everything" really forgets.

import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  uiLang: text("ui_lang").notNull().default("en"),
  voiceEn: text("voice_en"),
  voiceAr: text("voice_ar"),
  /** The first-visit flow: name, home_city, done (architecture, section 14). */
  onboardingStep: text("onboarding_step").notNull().default("name"),
  /** The chosen profile picture (shared/avatars.ts), or "upload"; empty means the one picked from the id. */
  avatar: text("avatar"),
  /** Your own picture, when avatar is "upload": a 192 px square, shrunk in the browser, as a data URL. */
  avatarImage: text("avatar_image"),
  /** Your Rafeeq (shared/rafeeq.ts), if you picked one; empty means the orb. */
  rafeeq: text("rafeeq"),
  createdAt,
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One thing Sarjy remembers about you (Day 2: sentences, not two-word variables). (user_id, key) is
 * unique, so writing the same key again updates it.
 *   key    a stable English snake_case id; name, home_city and units are the ones the app itself reads
 *   topic  where it sits in the list: you, people, likes, plans or other
 *   label  a short headline, in your language ("Sister's wedding")
 *   value  the bare value the app uses ("Jeddah"), or a short summary
 *   note   the memory itself, one sentence with its details ("Your sister Noura is getting married
 *          in December 2026."); older memories have none, and read as "label: value"
 */
export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    topic: text("topic").notNull().default("you"),
    label: text("label").notNull(),
    value: text("value").notNull(),
    note: text("note"),
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
    /** Pinned chats stay at the top of Recent. */
    pinned: boolean("pinned").notNull().default(false),
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

/** Raw bytes (Postgres bytea), for pictures. */
const bytes = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (value) => Buffer.from(value),
});

/**
 * A picture sent with a message (Day 2: pictures stay with the chat). Kept apart from messages so
 * listing a chat never loads the bytes; each is at most 1.5 MB, usually 150 to 300 KB (a 1280 px
 * JPEG). Deleting the chat, or the user, deletes its pictures.
 */
export const pictures = pgTable(
  "pictures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    bytes: bytes("bytes").notNull(),
    createdAt,
  },
  (t) => [index("pictures_message").on(t.messageId)],
);

/**
 * Your own wallpaper (Settings, Appearance). One per user, kept apart from `users` so loading a
 * user never loads the picture (300 to 600 KB). Deleting the user deletes it.
 */
export const wallpapers = pgTable("wallpapers", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  mediaType: text("media_type").notNull(),
  bytes: bytes("bytes").notNull(),
  updatedAt,
});

/**
 * A shared moment: one exchange the user chose to share, copied at the time of sharing.
 * Link-only (random code, noindex). Deleting the user deletes their shares.
 */
export const shares = pgTable("shares", {
  code: text("code").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** What the moment was about; picks its link-preview card. */
  kind: text("kind").notNull(),
  lang: text("lang").notNull().default("en"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  toolLabel: text("tool_label"),
  createdAt,
});

/**
 * A Majlis (architecture, section 13): several people talking to one Sarjy from their own devices.
 * The room's conversation is an ordinary one, owned by the host; everyone's turns are saved in it,
 * each with its speaker. The code is the invite link (/majlis/K7Q2M). One person holds the floor
 * (the mic) at a time; the claim expires on its own so a dropped phone can't hold the room.
 */
export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  hostId: uuid("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  floorId: uuid("floor_id").references(() => users.id, { onDelete: "set null" }),
  floorExpiresAt: timestamp("floor_expires_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt,
});

/**
 * Everyone who has joined a Majlis, with their seat: 0 to 7, given in order at the door, never
 * shared. The seat picks the color their turns wear (tokens.css, --seat-1 to --seat-8), and the
 * number of seats is the cap on people.
 */
export const roomMembers = pgTable(
  "room_members",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seat: integer("seat").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.roomId, t.userId] }),
    uniqueIndex("room_members_seat").on(t.roomId, t.seat),
    index("room_members_user").on(t.userId),
  ],
);

/**
 * Sarjy's voice and shared pictures, kept briefly so everyone else in the room can fetch them by
 * URL (a realtime message is capped at 64 KB; a spoken sentence is 100 to 300 KB). Deleted after
 * an hour; the chat keeps its own copy of pictures.
 */
export const roomMedia = pgTable(
  "room_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    bytes: bytes("bytes").notNull(),
    createdAt,
  },
  (t) => [index("room_media_created").on(t.createdAt)],
);

/**
 * Your bond with each Rafeeq, separately (Turki, Day 3: level up with each one on its own).
 * A row appears the first time a companion's bond grows.
 */
export const rafeeqBonds = pgTable(
  "rafeeq_bonds",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rafeeq: text("rafeeq").notNull(),
    points: integer("points").notNull().default(0),
    updatedAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.rafeeq] })],
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
export type PictureRow = typeof pictures.$inferSelect;
export type ShareRow = typeof shares.$inferSelect;
export type RoomRow = typeof rooms.$inferSelect;
