// Profile pictures: Turki's three paintings (docs/brand/art/, cropped by scripts/brand/render-avatars.mjs).
// Everyone starts with one picked at random from their id, so it is random but never changes on
// its own; they can choose another from the sidebar.

import { hash } from "./og";

export const AVATARS = [
  { id: "rider-at-rest", en: "The rider at rest", ar: "الفارس في استراحته" },
  { id: "falconer", en: "The falconer", ar: "الصقّار" },
  { id: "the-ride", en: "The ride", ar: "الخيّالة" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export const isAvatar = (value: unknown): value is AvatarId => AVATARS.some((a) => a.id === value);

export const avatarUrl = (id: AvatarId) => `/avatars/${id}.webp`;

/** The saved choice, or the one this user's id picks. */
export function avatarFor(userId: string, saved: string | null | undefined): AvatarId {
  if (isAvatar(saved)) return saved;
  return AVATARS[hash(userId) % AVATARS.length]!.id;
}
