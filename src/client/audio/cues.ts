// The three sound cues (brand book, section 6). Synthesized, so there are no files to load:
//   open    two soft notes rising a fifth, D5 to A5, 160 ms: the mic opened
//   close   the same two notes falling: the mic closed
//   saved   one short, dry tick, 60 ms: a memory was saved or forgotten
// The numbers match the reference in docs/brand/sarjy-brand-v3.html.

export type Cue = "open" | "close" | "saved";

const D5 = 587.33;
const A5 = 880;

function tone(ctx: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // A fast attack and an exponential fade: soft, never a click.
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(env).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** Plays a cue on the given context (the player's, so cues and voice share one clock and one unlock). */
export function playCue(ctx: AudioContext, cue: Cue): void {
  const t = ctx.currentTime + 0.02;
  if (cue === "open") {
    tone(ctx, D5, t, 0.09, 0.18, "sine");
    tone(ctx, A5, t + 0.07, 0.09, 0.18, "sine");
  } else if (cue === "close") {
    tone(ctx, A5, t, 0.09, 0.18, "sine");
    tone(ctx, D5, t + 0.07, 0.09, 0.18, "sine");
  } else {
    tone(ctx, 1760, t, 0.05, 0.12, "triangle");
  }
}
