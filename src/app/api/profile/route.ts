// PATCH: change something about you that is not a memory.
//   { avatar: "falconer" }        one of the paintings
//   { image: "data:image/..." }   your own picture, already shrunk in the browser
//   { name: "Turki" }             your name, which is also saved as the `name` memory
//   { voice: { lang, id } }       Sarjy's voice in one language
//   { onboarding: "done" }        skip the intro: Sarjy won't ask your name

import { eq } from "drizzle-orm";
import { z } from "zod";
import { AVATARS, isUploadedImage } from "@/shared/avatars";
import { isVoice } from "@/shared/voices";
import { users } from "@/server/db/schema";
import { currentUser, json } from "@/server/http";
import { upsertMemory } from "@/server/memory/repo";

export const dynamic = "force-dynamic";

const Patch = z.union([
  z.object({ avatar: z.enum(AVATARS.map((a) => a.id)) }),
  z.object({ image: z.string().refine(isUploadedImage) }),
  z.object({ name: z.string().trim().min(1).max(60), lang: z.enum(["en", "ar"]).default("en") }),
  z.object({ voice: z.object({ lang: z.enum(["en", "ar"]), id: z.string() }) }),
  z.object({ onboarding: z.literal("done") }),
]);

export async function PATCH(request: Request) {
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { db, user } = await currentUser();
  const body = parsed.data;

  if ("avatar" in body) {
    await db.update(users).set({ avatar: body.avatar, avatarImage: null }).where(eq(users.id, user.id));
    return json({ avatar: body.avatar });
  }
  if ("onboarding" in body) {
    await db.update(users).set({ onboardingStep: "done" }).where(eq(users.id, user.id));
    return json({ onboarding: "done" });
  }
  if ("voice" in body) {
    const { lang, id } = body.voice;
    if (!isVoice(lang, id)) return json({ error: "bad_request" }, 400);
    await db
      .update(users)
      .set(lang === "en" ? { voiceEn: id } : { voiceAr: id })
      .where(eq(users.id, user.id));
    return json({ voice: body.voice });
  }
  if ("image" in body) {
    await db.update(users).set({ avatar: "upload", avatarImage: body.image }).where(eq(users.id, user.id));
    return json({ avatar: "upload" });
  }
  // Your name lives in two places on purpose: on the profile (the sidebar) and as a memory
  // (so Sarjy knows it, and you see it stitched). Changing it here changes both.
  const memory = await upsertMemory(db, user.id, {
    key: "name",
    label: body.lang === "ar" ? "الاسم" : "Name",
    value: body.name,
    lang: body.lang,
  });
  await db
    .update(users)
    .set({ name: memory.value, ...(user.onboardingStep === "name" ? { onboardingStep: "home_city" } : {}) })
    .where(eq(users.id, user.id));
  return json({ name: memory.value, memory });
}
