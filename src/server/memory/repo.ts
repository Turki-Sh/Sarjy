import "server-only";

// Reading and writing memories. Every write goes through here, so the rules that keep memory safe
// live in one place: keys are normalized, values are clamped to one short line (a memory can
// never smuggle a paragraph of instructions into the prompt), and everything is scoped to one user.

import { and, asc, eq } from "drizzle-orm";
import type { Memory } from "@/shared/protocol";
import type { Db } from "../db/client";
import { memories, type MemoryRow } from "../db/schema";

export const LIMITS = { key: 40, label: 40, value: 120, source: 300 } as const;

/** "Favorite Color!" and "favorite_color" are the same memory. Keys are English snake_case. */
export function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, LIMITS.key);
}

/** One line, trimmed, capped. */
export function clampLine(text: string, max: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

export function toMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    value: row.value,
    lang: row.lang === "ar" ? "ar" : "en",
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMemories(db: Db, userId: string): Promise<Memory[]> {
  const rows = await db
    .select()
    .from(memories)
    .where(eq(memories.userId, userId))
    .orderBy(asc(memories.createdAt));
  return rows.map(toMemory);
}

export type NewMemory = {
  key: string;
  label: string;
  value: string;
  source?: string | null;
  lang: "en" | "ar";
};

/** Saves a memory; saving the same key again updates it (and keeps when it was first told). */
export async function upsertMemory(db: Db, userId: string, input: NewMemory): Promise<Memory> {
  const key = normalizeKey(input.key);
  if (!key) throw new Error("A memory needs a key.");
  const values = {
    userId,
    key,
    label: clampLine(input.label, LIMITS.label) || key.replace(/_/g, " "),
    value: clampLine(input.value, LIMITS.value),
    source: input.source ? clampLine(input.source, LIMITS.source) : null,
    lang: input.lang,
  };
  if (!values.value) throw new Error("A memory needs a value.");
  const [row] = await db
    .insert(memories)
    .values(values)
    .onConflictDoUpdate({
      target: [memories.userId, memories.key],
      set: {
        label: values.label,
        value: values.value,
        source: values.source,
        lang: values.lang,
        updatedAt: new Date(),
      },
    })
    .returning();
  return toMemory(row!);
}

/** Edits from the memory card. Returns null when the memory is not this user's. */
export async function updateMemory(
  db: Db,
  userId: string,
  id: string,
  patch: { label?: string; value?: string },
): Promise<Memory | null> {
  const set: Partial<typeof memories.$inferInsert> = { updatedAt: new Date() };
  if (patch.label !== undefined) set.label = clampLine(patch.label, LIMITS.label);
  if (patch.value !== undefined) set.value = clampLine(patch.value, LIMITS.value);
  if (set.value === "") return null;
  const [row] = await db
    .update(memories)
    .set(set)
    .where(and(eq(memories.id, id), eq(memories.userId, userId)))
    .returning();
  return row ? toMemory(row) : null;
}

export async function deleteMemory(db: Db, userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(memories)
    .where(and(eq(memories.id, id), eq(memories.userId, userId)))
    .returning({ id: memories.id });
  return rows.length > 0;
}

export async function deleteMemoryByKey(
  db: Db,
  userId: string,
  key: string,
): Promise<{ id: string; key: string } | null> {
  const [row] = await db
    .delete(memories)
    .where(and(eq(memories.userId, userId), eq(memories.key, normalizeKey(key))))
    .returning({ id: memories.id, key: memories.key });
  return row ?? null;
}
