// POST /api/turn: one conversational turn (architecture, section 3).
// In: multipart form with `audio` (a WAV) or `text`, plus `conversationId`, `lang`, `tz`.
// Out: a stream of newline-delimited JSON events (src/shared/protocol.ts).

import { currentUser, ipHash } from "@/server/http";
import { env } from "@/server/env";
import { getProviders } from "@/server/providers";
import { allowTurn } from "@/server/rateLimit";
import { runTurn } from "@/server/turn/pipeline";
import { safeTimeZone } from "@/shared/hijri";
import { encodeEvent, type TurnEvent } from "@/shared/protocol";
import { voiceFor } from "@/shared/voices";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 1_500_000; // about 45 seconds of 16 kHz mono
const MAX_TEXT = 600;
const MAX_IMAGE_BYTES = 1_500_000; // the browser sends at most 1280 px JPEG, well under this

const LIMIT_SAY = {
  en: "I've reached my limit for now. Try again in a minute.",
  ar: "وصلت الحد حاليًا. جرّب بعد دقيقة.",
};

const ndjson = (status = 200) => ({
  status,
  headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
});

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return new Response("Expected multipart form data.", { status: 400 });

  const uiLang = form.get("lang") === "ar" ? "ar" : "en";
  const audio = form.get("audio");
  const text = String(form.get("text") ?? "").slice(0, MAX_TEXT);
  const conversationId = String(form.get("conversationId") ?? "") || null;
  const timeZone = safeTimeZone(String(form.get("tz") ?? ""));

  if (audio instanceof Blob && audio.size > MAX_AUDIO_BYTES) {
    return new Response("That recording is too long.", { status: 413 });
  }
  const image = form.get("image");
  const picture = image instanceof Blob && /^image\/(jpeg|png|webp)$/.test(image.type) ? image : null;
  if (image instanceof Blob && (!picture || image.size > MAX_IMAGE_BYTES)) {
    return new Response("That picture can't be used.", { status: 413 });
  }
  if (!(audio instanceof Blob) && !text.trim() && !picture) {
    return new Response("Send audio, text or a picture.", { status: 400 });
  }

  const { db, user } = await currentUser(uiLang);

  if (!(await allowTurn(db, user.id, await ipHash()))) {
    const event: TurnEvent = { type: "error", code: "rate_limited", say: LIMIT_SAY[uiLang] };
    return new Response(encodeEvent(event), ndjson(429));
  }

  // In fake mode a test may script what the "speech to text" hears (recorded audio can't be matched).
  const scripted = env.providers === "fake" ? request.headers.get("x-sarjy-fake-transcript") : null;
  // ...and may slow the voice down, to reproduce a slow live voice.
  const slow = env.providers === "fake" ? Number(request.headers.get("x-sarjy-fake-slow-voice") ?? 0) : 0;
  // ...or switch the voice off, as past Groq's daily limit.
  const voiceOut = env.providers === "fake" && request.headers.get("x-sarjy-fake-voice-out") === "1";
  const providers = getProviders({
    scriptedTranscript: scripted ? decodeURIComponent(scripted) : null,
    slowRestMs: Math.min(Math.max(slow, 0), 5000) || 0,
    voiceOut,
    voices: { en: voiceFor("en", user.voiceEn), ar: voiceFor("ar", user.voiceAr) },
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      // Once the browser has gone, events have nowhere to go: drop them instead of throwing.
      let open = true;
      const emit = (event: TurnEvent) => {
        if (!open || request.signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          open = false; // the stream was cancelled between two events
        }
      };
      try {
        await runTurn(
          {
            user,
            audio: audio instanceof Blob ? audio : null,
            text,
            image: picture,
            conversationId,
            uiLang,
            timeZone,
          },
          { db, providers, signal: request.signal },
          emit,
        );
      } catch (error) {
        if (request.signal.aborted) return;
        console.error("turn failed", error);
        emit({
          type: "error",
          code: "internal",
          say:
            uiLang === "ar" ? "صار خلل عندي. تجرب مرة ثانية؟" : "Something went wrong on my side. Try again?",
        });
      } finally {
        if (open && !request.signal.aborted) controller.close();
      }
    },
  });

  return new Response(stream, ndjson());
}
