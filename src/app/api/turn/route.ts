// POST /api/turn: one conversational turn (architecture, section 3).
// In: multipart form with `audio` (a WAV) or `text`, plus `conversationId`, `lang`, `tz`, and
// `room` (a Majlis code) and `to` ("room" or "sarjy") when it is said in a Majlis.
// Out: a stream of newline-delimited JSON events (src/shared/protocol.ts). In a Majlis the same
// events also go to everyone else in the room (server/rooms/outlet.ts).

import { currentUser, ipHash } from "@/server/http";
import { env } from "@/server/env";
import { getProviders } from "@/server/providers";
import { allowTurn } from "@/server/rateLimit";
import { getRealtime } from "@/server/realtime";
import { memberRoom, spokenName } from "@/server/rooms/access";
import { claimFloor, releaseFloor } from "@/server/rooms/floor";
import { keepMedia, mediaUrl } from "@/server/rooms/media";
import { roomOutlet, type RoomOutlet } from "@/server/rooms/outlet";
import { listMembers } from "@/server/rooms/rooms";
import { runTurn, type TurnInput } from "@/server/turn/pipeline";
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

const MAJLIS_SAY = {
  floor_busy: { en: "Someone else has the mic. Give them a sec.", ar: "في أحد ماسك المايك. لحظة وخلص." },
  picture_refused: {
    en: "I didn't share that picture with the Majlis.",
    ar: "ما شاركت هالصورة في المجلس.",
  },
  picture_unchecked: {
    en: "I couldn't check that picture just now, so I didn't share it. Try again in a minute.",
    ar: "ما قدرت أتأكد من الصورة الحين، فما شاركتها. جرب بعد دقيقة.",
  },
  ended: { en: "This Majlis has ended.", ar: "هالمجلس خلص." },
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
  // In a Majlis: only its members may speak, one at a time. The floor is claimed here too (the
  // browser claims it when you start talking), so a typed turn can't talk over someone.
  const code = String(form.get("room") ?? "");
  const room = code ? await memberRoom(db, code, user.id) : null;
  if (code && !room) return new Response("Not in that Majlis.", { status: 404 });
  const spoken = (event: TurnEvent, status: number) => new Response(encodeEvent(event), ndjson(status));
  if (room?.endedAt)
    return spoken({ type: "error", code: "bad_request", say: MAJLIS_SAY.ended[uiLang] }, 409);
  if (room && !(await claimFloor(db, room.id, user.id))) {
    return spoken({ type: "error", code: "floor_busy", say: MAJLIS_SAY.floor_busy[uiLang] }, 409);
  }

  const providers = getProviders({
    scriptedTranscript: scripted ? decodeURIComponent(scripted) : null,
    slowRestMs: Math.min(Math.max(slow, 0), 5000) || 0,
    voiceOut,
    voices: { en: voiceFor("en", user.voiceEn), ar: voiceFor("ar", user.voiceAr) },
    unsafePicture: env.providers === "fake" && request.headers.get("x-sarjy-fake-unsafe-picture") === "1",
  });

  let majlis: { input: NonNullable<TurnInput["room"]>; outlet: RoomOutlet } | null = null;
  if (room) {
    const realtime = getRealtime();
    // Everyone hears the mic is taken (the browser usually said so already; this covers typing).
    await realtime.publish(room.code, { type: "floor", holder: user.id }).catch(() => {});
    // A picture is shown to the whole room, so it is checked first; one that doesn't pass is
    // never shown to anyone, and the turn stops there.
    let pictureUrl: string | null = null;
    if (picture) {
      const bytes = new Uint8Array(await picture.arrayBuffer());
      const verdict = await providers.guard.check({ bytes, mediaType: picture.type }, request.signal);
      if (!verdict.safe) {
        await releaseFloor(db, room.id, user.id);
        await realtime.publish(room.code, { type: "floor", holder: null }).catch(() => {});
        // Refused, or couldn't be checked (a rate limit): not shared either way, said honestly.
        const say = verdict.checked ? MAJLIS_SAY.picture_refused : MAJLIS_SAY.picture_unchecked;
        return spoken({ type: "error", code: "picture_refused", say: say[uiLang] }, 200);
      }
      pictureUrl = mediaUrl(room.code, await keepMedia(db, room.id, bytes, picture.type));
    }
    // Who has joined, and who has the room open right now (the "2 here" in the bar).
    const [members, present] = await Promise.all([
      listMembers(db, room),
      realtime.present(room.code).catch(() => null),
    ]);
    majlis = {
      input: {
        conversationId: room.conversationId,
        people: members.map((m) => ({
          id: m.id,
          name: spokenName(m),
          host: m.host,
          // Unknown presence counts everyone as here; the speaker always is.
          here: !present || present.includes(m.id) || m.id === user.id,
        })),
        // Everyone, unless the switch says Sarjy (its name at the start asks it either way).
        to: form.get("to") === "sarjy" ? "sarjy" : "room",
      },
      outlet: roomOutlet({
        db,
        realtime,
        room,
        speakerId: user.id,
        pictureUrl,
        // Everyone else hears what you said, in your own voice (Turki, Day 3). Kept while speech
        // to text runs, so it costs the turn nothing.
        voiceUrl:
          audio instanceof Blob
            ? audio
                .arrayBuffer()
                .then(async (wav) =>
                  mediaUrl(room.code, await keepMedia(db, room.id, new Uint8Array(wav), "audio/wav")),
                )
            : null,
      }),
    };
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      // Once the browser has gone, events have nowhere to go: drop them instead of throwing.
      let open = true;
      const emit = (event: TurnEvent) => {
        // One structured line per turn in the server log (Vercel's logs): how long each stage
        // took, which model answered, what it cost. Never what was said.
        if (event.type === "done") {
          console.log(
            JSON.stringify({
              turn: event.timings,
              lang: uiLang,
              majlis: !!room,
              audio: audio instanceof Blob,
            }),
          );
        }
        // The room hears the turn even if the speaker's own tab has gone.
        majlis?.outlet.send(event);
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
            room: majlis?.input,
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
        // In a Majlis: once everything has reached the room, the mic is free again. This happens
        // before the response ends, not after: on Vercel a function can be frozen the moment its
        // response is complete, and then the mic stayed taken (Day 5: the speaker had to tap the
        // finjan twice to let it go).
        if (room && majlis) {
          await majlis.outlet.flushed().catch(() => {});
          if (await releaseFloor(db, room.id, user.id).catch(() => false)) {
            await getRealtime()
              .publish(room.code, { type: "floor", holder: null })
              .catch(() => {});
          }
        }
        if (open && !request.signal.aborted) controller.close();
      }
    },
  });

  return new Response(stream, ndjson());
}
