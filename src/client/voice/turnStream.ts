// Sends one turn to /api/turn and hands each streamed event to `onEvent` as it arrives.
// The stream is newline-delimited JSON; each line is validated against the shared protocol.

import { TurnEvent } from "@/shared/protocol";

export type TurnRequest = {
  text?: string;
  audio?: Blob;
  image?: Blob;
  conversationId: string | null;
  lang: "en" | "ar";
  /** The Majlis this is said in, if any. */
  room?: string;
  signal?: AbortSignal;
  /** Test hook: what the fake speech to text should "hear" (only honored with fake providers). */
  fakeTranscript?: string;
};

export async function sendTurn(req: TurnRequest, onEvent: (event: TurnEvent) => void): Promise<void> {
  const form = new FormData();
  if (req.text) form.append("text", req.text);
  if (req.audio) form.append("audio", req.audio, "turn.wav");
  if (req.image) form.append("image", req.image, "image.jpg");
  if (req.conversationId) form.append("conversationId", req.conversationId);
  form.append("lang", req.lang);
  if (req.room) form.append("room", req.room);
  form.append("tz", Intl.DateTimeFormat().resolvedOptions().timeZone);

  const res = await fetch("/api/turn", {
    method: "POST",
    body: form,
    signal: req.signal,
    headers: req.fakeTranscript
      ? { "x-sarjy-fake-transcript": encodeURIComponent(req.fakeTranscript) }
      : undefined,
  });
  if (!res.body) throw new Error(`Turn failed: ${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const parsed = TurnEvent.safeParse(JSON.parse(line));
      if (parsed.success) onEvent(parsed.data);
    }
  }
  // A refusal that was spoken (rate limited; in a Majlis, someone else has the mic) is not a failure.
  if (!res.ok && res.status !== 429 && res.status !== 409) throw new Error(`Turn failed: ${res.status}`);
}
