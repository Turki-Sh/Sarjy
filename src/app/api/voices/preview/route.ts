// GET /api/voices/preview?lang=en&voice=troy: one short line in that voice, as WAV, for Settings,
// Voice. Each preview is made once per server and kept, so trying voices doesn't spend the quota.

import { z } from "zod";
import { json } from "@/server/http";
import { getProviders } from "@/server/providers";
import { isVoice, PREVIEW_LINE, VOICES } from "@/shared/voices";

export const dynamic = "force-dynamic";

const Query = z.object({ lang: z.enum(["en", "ar"]), voice: z.string() });

/** Made previews, by "lang:voice". A dozen short clips at most, so memory is no concern. */
const made = new Map<string, ArrayBuffer>();

export async function GET(request: Request) {
  const q = Query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!q.success || !isVoice(q.data.lang, q.data.voice)) return json({ error: "bad_request" }, 400);
  const { lang, voice } = q.data;
  const key = `${lang}:${voice}`;

  let wav = made.get(key);
  if (!wav) {
    const others = lang === "en" ? VOICES.ar[0] : VOICES.en[0];
    const tts = getProviders({
      voices: lang === "en" ? { en: voice, ar: others } : { en: others, ar: voice },
    }).tts;
    const audio = await tts.synthesize(PREVIEW_LINE[lang], lang);
    if (!audio) return json({ error: "voice_unavailable" }, 503);
    wav = audio;
    made.set(key, wav);
  }
  return new Response(wav, {
    headers: { "content-type": "audio/wav", "cache-control": "private, max-age=86400" },
  });
}
