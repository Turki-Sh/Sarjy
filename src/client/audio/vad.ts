// Decides when you have finished speaking (architecture, section 11, "End of speech").
// Silero VAD, a small speech-detection model, runs in the browser through ONNX Runtime. It hears
// the difference between speech and noise (a fan, traffic, a keyboard), which a loudness
// threshold can't. Its files are served from /vad/ (scripts/vad/copy-assets.mjs).
//
// The library and its runtime are loaded on the first tap of the mic, not with the page.

import type { Mic } from "./mic";

const ASSETS = "/vad/";

/**
 * The dials. About 600 ms of quiet ends a turn: the main trade-off between "it cuts me off"
 * and "it feels slow". A sound shorter than 250 ms (a cough, a click) is not a turn.
 */
const TUNING = {
  positiveSpeechThreshold: 0.5,
  negativeSpeechThreshold: 0.35,
  redemptionMs: 600,
  preSpeechPadMs: 300,
  minSpeechMs: 250,
};

export type SpeechEvents = {
  /** You started speaking (may still turn out to be a cough). */
  onSpeechStart: () => void;
  /** You finished: your speech as 16 kHz samples, ready to become a WAV. */
  onSpeechEnd: (audio: Float32Array) => void;
};

export type Listening = {
  /** Stops listening. With `submit`, speech in progress is ended and sent, as if you had paused. */
  stop: (submit: boolean) => Promise<void>;
};

/** Starts detecting speech on an open mic. */
export async function listen(mic: Mic, events: SpeechEvents): Promise<Listening> {
  const { MicVAD } = await import("@ricky0123/vad-web");
  let submitting = true;
  const vad = await MicVAD.new({
    model: "v5",
    baseAssetPath: ASSETS,
    onnxWASMBasePath: ASSETS,
    audioContext: mic.ctx,
    // The stream belongs to the Mic; the VAD only reads it.
    getStream: async () => mic.stream,
    pauseStream: async () => {},
    resumeStream: async (stream) => stream,
    submitUserSpeechOnPause: true,
    startOnLoad: true,
    ...TUNING,
    onSpeechStart: events.onSpeechStart,
    onSpeechEnd: (audio) => {
      if (submitting) events.onSpeechEnd(audio);
    },
  });
  return {
    stop: async (submit) => {
      submitting = submit;
      await vad.pause();
      await vad.destroy();
    },
  };
}
