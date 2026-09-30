// What a memory is, as both sides see it (Day 2: sentences, grouped by topic, like Claude's list).

import type { Lang } from "./i18n";

/** Where a memory sits in the list, in this order. */
export const TOPICS = ["you", "people", "likes", "plans", "other"] as const;
export type Topic = (typeof TOPICS)[number];

export const TOPIC_NAMES: Record<Topic, Record<Lang, string>> = {
  you: { en: "About you", ar: "عنك" },
  people: { en: "People", ar: "ناسك" },
  likes: { en: "Likes and dislikes", ar: "اللي تحبه واللي ما تحبه" },
  plans: { en: "Plans and dates", ar: "خطط ومواعيد" },
  other: { en: "Other", ar: "أشياء ثانية" },
};

export const isTopic = (value: unknown): value is Topic => TOPICS.includes(value as Topic);

/**
 * The few memories the app itself reads, with a bare value: your name (the sidebar, the prompt),
 * your home city and units (the weather tool). Everything else is a note.
 */
export const SLOTS = ["name", "home_city", "units"] as const;
export type Slot = (typeof SLOTS)[number];
export const isSlot = (key: string): key is Slot => (SLOTS as readonly string[]).includes(key);

/** A memory as one sentence: its note, or "label: value" for one saved before notes existed. */
export const noteOf = (m: { note: string | null; label: string; value: string }) =>
  m.note || `${m.label}: ${m.value}`;
