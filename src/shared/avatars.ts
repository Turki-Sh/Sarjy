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

/** One of the paintings, or a picture you uploaded. */
export type AvatarChoice = AvatarId | "upload";

/** Your own picture: a small square image as a data URL. The cap keeps a profile row small. */
export const UPLOAD = { size: 192, maxChars: 80_000 } as const;
export const isUploadedImage = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= UPLOAD.maxChars &&
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);

/** The saved choice, or the painting this user's id picks. */
export function avatarFor(
  userId: string,
  saved: string | null | undefined,
  image?: string | null,
): AvatarChoice {
  if (saved === "upload" && image) return "upload";
  if (isAvatar(saved)) return saved;
  return AVATARS[hash(userId) % AVATARS.length]!.id;
}
