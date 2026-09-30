// POST: who am I? Creates the anonymous user on first visit and returns everything the screen
// needs for its first paint: the profile, the memories, recent chats.
// DELETE: Forget everything. Deletes the user and, by cascade, all their memories and chats.

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { avatarFor } from "@/shared/avatars";
import { voiceFor } from "@/shared/voices";
import { listConversations } from "@/server/chat/repo";
import { users } from "@/server/db/schema";
import { currentUser, json } from "@/server/http";
import { listMemories } from "@/server/memory/repo";
import { SESSION_COOKIE } from "@/server/session";
import { wallpaperVersion } from "@/server/wallpaper/repo";
import { COOKIE } from "@/shared/preferences";
import { isRafeeq } from "@/shared/rafeeq";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { lang?: string };
  const { db, user } = await currentUser(body.lang === "ar" ? "ar" : "en");
  const [memories, chats, wallpaper] = await Promise.all([
    listMemories(db, user.id),
    listConversations(db, user.id),
    wallpaperVersion(db, user.id),
  ]);
  return json({
    user: {
      id: user.id,
      name: user.name,
      onboardingStep: user.onboardingStep,
      avatar: avatarFor(user.id, user.avatar, user.avatarImage),
      avatarImage: user.avatar === "upload" ? user.avatarImage : null,
      voices: { en: voiceFor("en", user.voiceEn), ar: voiceFor("ar", user.voiceAr) },
      /** The version of your own wallpaper, if you uploaded one (Settings shows it as a choice). */
      wallpaper,
      /** Your Rafeeq, if you picked one, and how far your bond with it has grown. */
      rafeeq: isRafeeq(user.rafeeq) ? user.rafeeq : null,
      bond: user.rafeeqBond,
    },
    memories,
    chats,
  });
}

export async function DELETE() {
  const { db, user } = await currentUser();
  await db.delete(users).where(eq(users.id, user.id));
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  // Your own wallpaper went with you; the background falls back to the light field.
  if (jar.get(COOKIE.wallpaper)?.value.startsWith("own-")) jar.delete(COOKIE.wallpaper);
  return json({ ok: true });
}
