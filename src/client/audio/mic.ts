// Opens the microphone and measures how loud you are, for the orb (architecture, section 11).
// The browser's own echo cancellation, noise suppression and automatic gain are all on: they are
// free, run in the audio stack, and make both the VAD and Whisper more accurate.

/** Why the mic could not open: no permission, or no microphone at all. */
export type MicProblem = "blocked" | "missing";

export class MicError extends Error {
  constructor(readonly problem: MicProblem) {
    super(`Microphone ${problem}`);
  }
}

export class Mic {
  private readonly analyser: AnalyserNode;
  private readonly source: MediaStreamAudioSourceNode;
  private readonly buffer = new Float32Array(1024);

  private constructor(
    readonly stream: MediaStream,
    readonly ctx: AudioContext,
  ) {
    this.source = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    // Measured only, never played back: the analyser is not connected to the speakers.
    this.source.connect(this.analyser);
  }

  /** Must be called from a tap: that is what lets the browser ask for permission. */
  static async open(ctx: AudioContext): Promise<Mic> {
    if (!navigator.mediaDevices?.getUserMedia) throw new MicError("missing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      return new Mic(stream, ctx);
    } catch (error) {
      const name = (error as DOMException).name;
      throw new MicError(name === "NotFoundError" || name === "OverconstrainedError" ? "missing" : "blocked");
    }
  }

  /** Your loudness from 0 to 1, for the orb while listening. */
  level(): number {
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (const v of this.buffer) sum += v * v;
    return Math.min(1, Math.sqrt(sum / this.buffer.length) * 6);
  }

  /** Releases the microphone, so the browser's "recording" indicator goes away. */
  close(): void {
    this.source.disconnect();
    for (const track of this.stream.getTracks()) track.stop();
  }
}
