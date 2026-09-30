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

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { lang?: string };
  const { db, user } = await currentUser(body.lang === "ar" ? "ar" : "en");
  const [memories, chats] = await Promise.all([listMemories(db, user.id), listConversations(db, user.id)]);
  return json({
    user: {
      id: user.id,
      name: user.name,
      onboardingStep: user.onboardingStep,
      avatar: avatarFor(user.id, user.avatar, user.avatarImage),
      avatarImage: user.avatar === "upload" ? user.avatarImage : null,
      voices: { en: voiceFor("en", user.voiceEn), ar: voiceFor("ar", user.voiceAr) },
    },
    memories,
    chats,
  });
}

export async function DELETE() {
  const { db, user } = await currentUser();
  await db.delete(users).where(eq(users.id, user.id));
  (await cookies()).delete(SESSION_COOKIE);
  return json({ ok: true });
}
